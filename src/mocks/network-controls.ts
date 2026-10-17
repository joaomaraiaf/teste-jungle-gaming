import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';

const ruleSchema = z.object({
  path: z
    .string()
    .regex(/^\/(nfts(?:\/[\w-]+)?|catalog\/facets|cart|favorites|orders(?:\/[\w-]+)?|quotes)$/),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  search: z.string().optional(),
  gate: z
    .string()
    .regex(/^[a-z0-9-]{1,40}$/)
    .optional(),
  delayMs: z.number().int().min(0).max(15000).default(0),
  status: z
    .union([
      z.literal(0),
      z.literal(200),
      z.literal(401),
      z.literal(403),
      z.literal(404),
      z.literal(409),
      z.literal(422),
      z.literal(503),
    ])
    .default(200),
  times: z.number().int().min(1).max(10).default(1),
});

/** Test controls stay at the network boundary; a successful rule falls through to the real handler. */
export function createNetworkControls(
  apiBase: string,
  storage?: Pick<Storage, 'getItem' | 'setItem'>
) {
  const key = 'kurio:mock-network:v1';
  let rules: z.infer<typeof ruleSchema>[] = [];
  try {
    rules = z.array(ruleSchema).parse(JSON.parse(storage?.getItem(key) ?? '[]'));
  } catch {
    /* Invalid controls start empty. */
  }
  const waiting = new Map<string, (() => void)[]>();
  const released = new Set<string>();
  const release = (gate: string) => {
    released.add(gate);
    for (const done of waiting.get(gate) ?? []) done();
    waiting.delete(gate);
  };
  const clear = () => {
    for (const gate of waiting.keys()) release(gate);
    released.clear();
  };
  const save = () => storage?.setItem(key, JSON.stringify(rules.filter((rule) => rule.times > 0)));
  return {
    reset: () => {
      rules = [];
      clear();
      save();
    },
    handlers: [
      http.post(`${apiBase}/__mock/network/release`, async ({ request }) => {
        const input = z
          .object({ gate: z.string() })
          .safeParse(await request.json().catch(() => null));
        if (!input.success)
          return HttpResponse.json(
            { code: 'VALIDATION_ERROR', message: 'Informe o bloqueio de teste.' },
            { status: 422 }
          );
        release(input.data.gate);
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(`${apiBase}/__mock/network`, async ({ request }) => {
        const input = z
          .object({ rules: z.array(ruleSchema).max(30) })
          .safeParse(await request.json().catch(() => null));
        if (!input.success)
          return HttpResponse.json(
            { code: 'VALIDATION_ERROR', message: 'Regras de rede inválidas.' },
            { status: 422 }
          );
        clear();
        rules = input.data.rules;
        save();
        return new HttpResponse(null, { status: 204 });
      }),
      http.all(`${apiBase}/*`, async ({ request }) => {
        const url = new URL(request.url);
        const path = url.pathname.slice(new URL(apiBase).pathname.length);
        const rule = rules.find(
          (rule) =>
            rule.times > 0 &&
            rule.path === path &&
            rule.method === request.method &&
            (rule.search === undefined || rule.search === url.searchParams.get('search'))
        );
        if (!rule) return;
        rule.times -= 1;
        save();
        await delay(rule.delayMs);
        if (rule.gate && !released.has(rule.gate))
          await new Promise<void>((resolve) => {
            waiting.set(rule.gate!, [...(waiting.get(rule.gate!) ?? []), resolve]);
          });
        if (rule.status === 0) return HttpResponse.error();
        if (rule.status !== 200)
          return HttpResponse.json(
            { code: 'SIMULATED_FAILURE', message: 'Falha simulada. Tente novamente.' },
            { status: rule.status }
          );
      }),
    ],
  };
}
