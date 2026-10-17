import axios, { AxiosError, AxiosHeaders, type AxiosAdapter as NetworkAdapter } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { AxiosAdapter } from './axios-adapter';
import { setTransportReady } from './transport-ready';

afterEach(() => setTransportReady(Promise.resolve()));

function createTransport(network: NetworkAdapter) {
  const client = axios.create({ adapter: network });
  vi.spyOn(axios, 'create').mockReturnValue(client);
  return new AxiosAdapter('/api');
}

describe('AxiosAdapter', () => {
  it('aguarda a interceptação e descarta uma consulta cancelada durante o bootstrap', async () => {
    let ready!: () => void;
    setTransportReady(
      new Promise<void>((resolve) => {
        ready = resolve;
      })
    );
    const network = vi.fn<NetworkAdapter>(async (config) => ({
      data: 'ok',
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    const http = createTransport(network);
    const controller = new AbortController();
    const canceled = http.get('/obsolete', undefined, { signal: controller.signal });
    const active = http.get('/nfts');
    await Promise.resolve();
    expect(network).not.toHaveBeenCalled();
    controller.abort();
    ready();
    await expect(canceled).rejects.toSatisfy(axios.isCancel);
    await expect(active).resolves.toBe('ok');
    expect(network).toHaveBeenCalledOnce();
    expect(network.mock.calls[0][0].url).toBe('/nfts');
  });

  it('preserva parâmetros, signal, headers de idempotência e corpo da resposta', async () => {
    const network = vi.fn<NetworkAdapter>(async (config) => ({
      data: { id: 'order-1' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    const http = createTransport(network);
    const controller = new AbortController();

    await expect(
      http.get('/nfts', { page: 2, search: 'jungle' }, { signal: controller.signal })
    ).resolves.toEqual({ id: 'order-1' });
    expect(network.mock.calls[0]?.[0]).toMatchObject({
      url: '/nfts',
      params: { page: 2, search: 'jungle' },
      signal: controller.signal,
    });

    await http.post('/orders', { quantity: 2 }, { headers: { 'Idempotency-Key': 'attempt-1' } });
    const config = network.mock.calls[1]?.[0];
    expect(config?.headers.get('Idempotency-Key')).toBe('attempt-1');
    expect(JSON.parse(config?.data)).toEqual({ quantity: 2 });
  });

  it('mantém status e erros de validação da API', async () => {
    const body = { message: 'Dados inválidos', errors: { email: 'E-mail em uso' } };
    const http = createTransport(async (config) => {
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, {
        data: body,
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config,
      });
    });

    await expect(http.post('/signup', {})).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Dados inválidos',
      status: 422,
      response: body,
    });
  });

  it('converte falhas de rede sem status HTTP fictício', async () => {
    const http = createTransport(async () => {
      throw new AxiosError('Network Error', 'ERR_NETWORK');
    });
    const error = await http.get('/nfts').catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'Network Error', status: undefined });
  });

  it('preserva cancelamentos sem convertê-los para ApiError nem repetir a requisição', async () => {
    const controller = new AbortController();
    const network = vi.fn<NetworkAdapter>(async (config) => {
      controller.abort();
      return { data: {}, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config };
    });
    const http = createTransport(network);
    const error = await http
      .get('/nfts', undefined, { signal: controller.signal })
      .catch((failure: unknown) => failure);
    expect(axios.isCancel(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(network).toHaveBeenCalledTimes(1);
  });
});
