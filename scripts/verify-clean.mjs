import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const source = resolve('.');
const directory = await mkdtemp(join(tmpdir(), 'kurio-clean-'));
const excluded = new Set([
  'node_modules',
  '.git',
  '.pnpm-store',
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
  'playwright-visual-report',
  'playwright-public-report',
  '.vercel',
  '.DS_Store',
  '.env.local',
]);
const steps = [];
let log = '';
let preview;
const report = {
  generatedAt: new Date().toISOString(),
  source,
  cleanDirectory: directory,
  note: 'Cópia limpa dos arquivos da revisão local, sem .git/node_modules/dist. Cache pnpm reutilizado, sem node_modules/dist copiados. Smoke de deploy executado localmente, não comprova URL pública.',
  steps,
};
function run(command, args, env = {}, allowedCodes = [0]) {
  console.log(`${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: directory, env: { ...process.env, ...env } });
    child.stdout.on('data', (chunk) => {
      log += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
      log += chunk;
      process.stderr.write(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      steps.push({ command: `${command} ${args.join(' ')}`, exitCode: code });
      allowedCodes.includes(code)
        ? resolve()
        : reject(new Error(`Falhou: ${command} ${args.join(' ')}`));
    });
  });
}
try {
  await cp(source, directory, {
    recursive: true,
    filter: (path) =>
      !excluded.has(basename(path)) &&
      (!basename(path).startsWith('.env') ||
        ['.env.example', '.env.mock'].includes(basename(path))),
  });
  await run('pnpm', [
    'install',
    '--frozen-lockfile',
    ...(process.env.PNPM_STORE_DIR ? ['--store-dir', process.env.PNPM_STORE_DIR] : []),
  ]);
  for (const command of ['lint', 'typecheck', 'test', 'build:mock'])
    await run('pnpm', [command], { VITEST_MAX_THREADS: '2' });
  report.buildSha256 = createHash('sha256')
    .update(await readFile(join(directory, 'dist/index.html')))
    .digest('hex');
  const port = 4102;
  preview = spawn('pnpm', ['preview:mock', '--port', String(port)], {
    cwd: directory,
    detached: true,
    stdio: 'ignore',
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (
      await fetch(base)
        .then((r) => r.ok)
        .catch(() => false)
    ) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Preview da cópia limpa indisponível');
  await run('pnpm', ['test:public', '--workers=1'], { PUBLIC_BASE_URL: base });
  await run(
    'pnpm',
    [
      'audit:lighthouse',
      '--runs=1',
      '--profile=mobile',
      '--page=inicio',
      '--output=docs/audits/clean-smoke',
      '--port=4183',
    ],
    {},
    [0, 1]
  );
  const audit = JSON.parse(
    await readFile(join(directory, 'docs/audits/clean-smoke/summary.json'), 'utf8')
  );
  if (audit.measurements.length !== 1 || audit.medians.length !== 1)
    throw new Error('Auditoria da cópia limpa incompleta');
  report.auditTargetsPassed = audit.passed;
  report.auditMedians = audit.medians;
  report.note +=
    ' O código 1 do Lighthouse significa meta de qualidade não atingida e permanece registrado separadamente; passed verifica reprodução/execução, não aprovação das metas.';
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.error = error.message;
  process.exitCode = 1;
} finally {
  if (preview) {
    try {
      process.kill(-preview.pid, 'SIGTERM');
    } catch {}
  }
  await mkdir(join(source, 'docs/audits'), { recursive: true });
  await writeFile(
    join(source, 'docs/audits/clean-checkout.json'),
    `${JSON.stringify(report, null, 2)}\n`
  );
  await writeFile(join(source, 'docs/audits/clean-checkout.log'), log);
  console.log(
    `Resultado: ${report.passed ? 'aprovado' : 'falhou'}. Evidências em docs/audits/clean-checkout.json.`
  );
  await rm(directory, { recursive: true, force: true });
}
