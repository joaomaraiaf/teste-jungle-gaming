# Erros

O adapter Axios lança um único `ApiError`, definido em `core/api/api-error.ts`, com mensagem, status e corpo da resposta. Cancelamentos não são transformados em falhas HTTP.

Usecases e repositories propagam exceções. Não use `catch {}` para esconder falhas. Queries expõem estados de erro para a View; mutations usam o toast do `useAppMutation`, sem duplicá-lo nos componentes.

Erros de formulário devem ser associados aos campos, usando Zod/RHF e o corpo tipado/validado da resposta da API. Nunca exponha stack traces ao usuário.

Não há logger remoto ou telemetria nesta base. Não registre objetos de erro Axios, requests, responses, tokens, senhas ou dados pessoais no console. Se logs forem necessários, use apenas metadados explicitamente seguros.
