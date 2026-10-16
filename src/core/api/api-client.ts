import { environment } from '@/core/config/environment';
import { AxiosAdapter } from './axios-adapter';

export const apiClient = new AxiosAdapter(environment.apiUrl);
