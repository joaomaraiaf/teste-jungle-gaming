# HTTP

Todas as chamadas REST passam pelo `apiClient`, um `AxiosAdapter` que implementa `IHttpClient`. A URL base vem de `import.meta.env.VITE_API_URL`, com fallback `/api`.

Repositories recebem `IHttpClient` por injeção. Features não instanciam Axios nem usam Fetch diretamente. Use generics para resposta e corpo.

```ts
http.get<ResponseDto>('/nfts', params, { signal });
http.post<ResponseDto, RequestDto>('/orders', input, {
  headers: { 'Idempotency-Key': attemptId },
  signal,
});
```

`IRequestOptions` suporta `headers` e `AbortSignal`. Timeout padrão: 15 segundos. O adapter não tenta refresh, não faz retries nem redireciona. Sessão, identidade, retries e recuperação de pedidos são coordenados nos ViewModels/usecases conforme os contratos e ARCHITECTURE.md.

Falhas HTTP/rede do Axios viram `ApiError` (`message`, `status`, `response`). Cancelamentos mantêm o erro de cancelamento original. Não registre bodies, tokens ou respostas brutas.

Os mocks em `src/mocks/` interceptam a rede com MSW. Leia [os contratos](../docs/API_CONTRACTS.md); use `pnpm dev:mock` para ativá-los. Não introduza respostas fictícias em componentes, hooks ou no adapter.
