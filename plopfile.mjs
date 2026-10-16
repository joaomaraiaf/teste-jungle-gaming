export default function (plop) {
  plop.setGenerator('feature', {
    description: 'Cria uma feature vazia com as camadas do projeto',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Nome da feature (kebab-case):',
        validate: (value) =>
          /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value) || 'Use um nome em kebab-case.',
      },
    ],
    actions: [
      'domain/entities',
      'domain/repositories',
      'domain/usecases',
      'data/dtos',
      'data/schemas',
      'data/repositories',
      'hooks',
      'components',
    ].map((layer) => ({
      type: 'add',
      path: `src/features/{{name}}/${layer}/.gitkeep`,
      template: '',
    })),
  });
}
