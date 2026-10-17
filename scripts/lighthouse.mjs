import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { cpus, platform, release, tmpdir, totalmem } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { pages, profiles, targets } from '../lighthouse.config.mjs';

const option = (name, fallback) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=') ?? fallback;
const runs = Number(option('runs', '3'));
if (!Number.isInteger(runs) || runs < 1 || runs > 5) throw new Error('Use --runs=1..5');
const selectedProfiles = option('profile', '') ? [option('profile')] : Object.keys(profiles);
const selectedPages = option('page', '') ? [option('page')] : Object.keys(pages);
if (selectedProfiles.some((name) => !profiles[name]) || selectedPages.some((name) => !pages[name]))
  throw new Error('Perfil/página inválido');
const output = option('output', 'docs/audits/lighthouse');
const throttlingMethod = option('throttling', 'simulate');
if (!['simulate', 'devtools'].includes(throttlingMethod))
  throw new Error('Método de throttling inválido');
const port = Number(option('port', '4173'));
const base = `http://127.0.0.1:${port}`;
await mkdir(output, { recursive: true });
console.log('Compilando build de demonstração completo…');
execFileSync('pnpm', ['build:mock'], { stdio: 'inherit' });
const server = spawn('pnpm', ['preview:mock', '--port', String(port)], {
  stdio: 'ignore',
  detached: true,
});
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const measurements = [];
const pkg = JSON.parse(await readFile('node_modules/lighthouse/package.json', 'utf8'));
const summary = {
  generatedAt: new Date().toISOString(),
  buildSha256: createHash('sha256')
    .update(await readFile('dist/index.html'))
    .digest('hex'),
  environment: {
    os: `${platform()} ${release()}`,
    cpu: cpus()[0]?.model,
    cores: cpus().length,
    memoryBytes: totalmem(),
    node: process.version,
    pnpm: execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim(),
    lighthouse: pkg.version,
    playwright: JSON.parse(await readFile('node_modules/@playwright/test/package.json', 'utf8'))
      .version,
  },
  conditions: {
    base,
    runs,
    mockScenario: 'default',
    assets: 'Locais, imagens e fontes completas; nenhum recurso bloqueado',
    cache:
      'Perfil Chromium novo por medição; sem extensões; Lighthouse com reset padrão de armazenamento',
    throttling: `Presets oficiais Lighthouse mobile/desktop, método ${throttlingMethod}`,
    execution: 'Sequencial; nenhuma suíte de testes concorrente',
  },
  targets,
  measurements,
  medians: [],
};
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (
      await fetch(base)
        .then((response) => response.ok)
        .catch(() => false)
    ) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Preview indisponível');
  for (const profile of selectedProfiles)
    for (const page of selectedPages) {
      for (let run = 1; run <= runs; run++) {
        const directory = await mkdtemp(join(tmpdir(), 'kurio-lighthouse-'));
        const debugPort = port + 100 + run;
        const context = await chromium.launchPersistentContext(directory, {
          headless: true,
          args: [`--remote-debugging-port=${debugPort}`],
        });
        try {
          const result = await lighthouse(
            `${base}${pages[page]}`,
            { port: debugPort, output: ['html', 'json'], logLevel: 'error' },
            { ...profiles[profile], settings: { ...profiles[profile].settings, throttlingMethod } }
          );
          if (!result || result.lhr.runtimeError)
            throw new Error(JSON.stringify(result?.lhr.runtimeError));
          summary.environment.chromium = result.lhr.environment.hostUserAgent;
          const prefix = `${page}-${profile}-${run}`;
          await writeFile(join(output, `${prefix}.html`), result.report[0]);
          await writeFile(join(output, `${prefix}.json`), result.report[1]);
          const measurement = {
            page,
            profile,
            run,
            scores: Object.fromEntries(
              Object.entries(result.lhr.categories).map(([key, value]) => [
                key,
                Math.round(value.score * 100),
              ])
            ),
            fcpMs: result.lhr.audits['first-contentful-paint'].numericValue,
            speedIndexMs: result.lhr.audits['speed-index'].numericValue,
            lcpMs: result.lhr.audits['largest-contentful-paint'].numericValue,
            cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
            tbtMs: result.lhr.audits['total-blocking-time'].numericValue,
          };
          measurements.push(measurement);
          console.log(prefix, JSON.stringify(measurement));
        } finally {
          await context.close();
          await rm(directory, { recursive: true, force: true });
        }
      }
      const group = measurements.filter((item) => item.profile === profile && item.page === page);
      summary.medians.push({
        page,
        profile,
        scores: Object.fromEntries(
          Object.keys(targets).map((key) => [key, median(group.map((item) => item.scores[key]))])
        ),
        fcpMs: median(group.map((item) => item.fcpMs)),
        speedIndexMs: median(group.map((item) => item.speedIndexMs)),
        lcpMs: median(group.map((item) => item.lcpMs)),
        cls: median(group.map((item) => item.cls)),
        tbtMs: median(group.map((item) => item.tbtMs)),
      });
    }
  summary.passed = summary.medians.every((item) =>
    Object.entries(targets).every(([key, value]) => item.scores[key] >= value)
  );
  console.log('Medianas:', JSON.stringify(summary.medians, null, 2));
  if (!summary.passed) {
    for (const item of summary.medians) {
      for (const [category, target] of Object.entries(targets)) {
        if (item.scores[category] < target)
          console.error(
            `Meta não atingida: ${item.page}/${item.profile} ${category}=${item.scores[category]}, mínimo=${target}. Consulte ${output}/${item.page}-${item.profile}-1.html`
          );
      }
    }
    process.exitCode = 1;
  }
} finally {
  await writeFile(join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  const rows = summary.medians.map(
    (item) =>
      `| ${item.page} | ${item.profile} | ${item.scores.performance} | ${item.scores.accessibility} | ${item.scores['best-practices']} | ${item.scores.seo} | ${Math.round(item.lcpMs)} | ${item.cls.toFixed(4)} | ${Math.round(item.tbtMs)} |`
  );
  await writeFile(
    join(output, 'summary.md'),
    `# Lighthouse — medianas\n\n${summary.generatedAt}; ${summary.environment.lighthouse}; Chromium: ${summary.environment.chromium}.\n\n${summary.conditions.throttling}. Três execuções por grupo na entrega completa.\n\n| Página | Perfil | Performance | A11y | Boas práticas | SEO | LCP ms | CLS | TBT ms |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows.join('\n')}\n\nMetas: 90/95/95/90. Resultado: ${summary.passed ? 'metas atingidas' : 'há metas pendentes; consultar relatórios e análise em ../README.md'}.\n`
  );
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    /* Preview already stopped. */
  }
}
