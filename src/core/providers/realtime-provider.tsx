import { type RealtimeSocket, createSocketClient } from '@/core/realtime/socket-client';
import { SocketContext } from '@/core/realtime/socket-context';
import { type ReactNode, useEffect, useState } from 'react';

interface RealtimeProviderProps {
  socket?: RealtimeSocket | null;
  url?: string;
  children: ReactNode;
}

export function RealtimeProvider({ socket: suppliedSocket, url, children }: RealtimeProviderProps) {
  const [createdSocket, setCreatedSocket] = useState<RealtimeSocket | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setCreatedSocket(null);
    if (suppliedSocket !== undefined || !url) return;
    let live = true;
    let instance: RealtimeSocket | null = null;
    setFailed(false);
    // The transport boundary waits for MSW; loading never blocks the first paint.
    void createSocketClient(url)
      .then((socket) => {
        instance = socket;
        if (live) setCreatedSocket(socket);
        else socket.disconnect();
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
      instance?.disconnect();
    };
  }, [suppliedSocket, url, attempt]);
  const socket = suppliedSocket !== undefined ? suppliedSocket : createdSocket;
  useEffect(() => {
    socket?.connect();
    return () => {
      socket?.disconnect();
    };
  }, [socket]);
  return (
    <SocketContext.Provider value={socket}>
      {failed && (
        <div role='alert' className='bg-[#241612] p-3 text-sm text-[#CFB28C]'>
          Não foi possível iniciar as atualizações em tempo real.{' '}
          <button
            type='button'
            className='underline'
            onClick={() => setAttempt((value) => value + 1)}
          >
            Tentar conectar novamente
          </button>
        </div>
      )}
      {children}
    </SocketContext.Provider>
  );
}
