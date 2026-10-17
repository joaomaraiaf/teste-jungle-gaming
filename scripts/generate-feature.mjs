import { access, mkdir, writeFile } from 'node:fs/promises';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const featureNamePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const featureLayers = [
  'domain/entities',
  'domain/repositories',
  'domain/usecases',
  'data/dtos',
  'data/schemas',
  'data/repositories',
  'hooks',
  'components',
];

async function getFeatureName() {
  const providedName = process.argv[2];
  if (providedName) return providedName;

  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    return (await terminal.question('Nome da feature (kebab-case): ')).trim();
  } finally {
    terminal.close();
  }
}

const featureName = await getFeatureName();
if (!featureNamePattern.test(featureName)) {
  console.error('Use um nome em kebab-case, começando com uma letra minúscula.');
  process.exitCode = 1;
} else {
  const featurePath = `src/features/${featureName}`;
  try {
    await access(featurePath);
    console.error(`A feature "${featureName}" já existe; nenhum arquivo foi alterado.`);
    process.exitCode = 1;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;

    for (const layer of featureLayers) {
      const directory = `${featurePath}/${layer}`;
      await mkdir(directory, { recursive: true });
      await writeFile(`${directory}/.gitkeep`, '');
    }
    console.log(`Estrutura vazia da feature "${featureName}" criada em ${featurePath}.`);
  }
}
