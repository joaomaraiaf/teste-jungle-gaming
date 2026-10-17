import type { RealtimeSocket } from '@/core/realtime/socket-client';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { RealtimeProvider } from './realtime-provider';

const { createSocketClient } = vi.hoisted(() => ({ createSocketClient: vi.fn() }));
vi.mock('@/core/realtime/socket-client', () => ({ createSocketClient }));
beforeEach(() => createSocketClient.mockReset());
const socket = () => ({ connect: vi.fn(), disconnect: vi.fn() });
it('descarta um transporte carregado depois do unmount sem conectar', async () => {
  let finish!: (value: RealtimeSocket) => void;
  createSocketClient.mockReturnValue(
    new Promise<RealtimeSocket>((resolve) => {
      finish = resolve;
    })
  );
  const instance = socket();
  const view = render(
    <RealtimeProvider url='http://localhost'>
      <p>Conteúdo disponível antes do transporte</p>
    </RealtimeProvider>
  );
  expect(screen.getByText('Conteúdo disponível antes do transporte')).toBeVisible();
  view.unmount();
  await act(async () => finish(instance as unknown as RealtimeSocket));
  expect(instance.connect).not.toHaveBeenCalled();
  expect(instance.disconnect).toHaveBeenCalledOnce();
});
it('permite recuperar falha de importação e desconecta ao encerrar', async () => {
  const instance = socket();
  createSocketClient
    .mockRejectedValueOnce(new Error('Chunk indisponível'))
    .mockResolvedValueOnce(instance);
  const view = render(
    <RealtimeProvider url='http://localhost'>
      <p>Marketplace</p>
    </RealtimeProvider>
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível iniciar')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Tentar conectar novamente' }));
  await waitFor(() => expect(instance.connect).toHaveBeenCalledOnce());
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  view.unmount();
  expect(instance.disconnect).toHaveBeenCalled();
});
