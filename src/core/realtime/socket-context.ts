import { createContext } from 'react';
import type { RealtimeSocket } from './socket-client';

export const SocketContext = createContext<RealtimeSocket | null>(null);
