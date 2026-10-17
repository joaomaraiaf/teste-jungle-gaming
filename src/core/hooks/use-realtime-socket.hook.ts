import { useContext } from 'react';
import { SocketContext } from '@/core/realtime/socket-context';

export const useRealtimeSocket = () => useContext(SocketContext);
