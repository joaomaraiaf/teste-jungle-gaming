import { SocketContext } from '@/core/realtime/socket-context';
import { useContext } from 'react';

export const useRealtimeSocket = () => useContext(SocketContext);
