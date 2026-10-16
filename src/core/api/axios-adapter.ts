import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ApiError } from './api-error';
import type { IHttpClient, IRequestOptions, QueryParams } from './http-client';

export class AxiosAdapter implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL, timeout: 15_000 });
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      if (axios.isAxiosError<unknown>(error)) {
        const body = error.response?.data;
        const message =
          body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
            ? body.message
            : error.message;
        throw new ApiError(message, error.response?.status, body);
      }
      throw error;
    }
  }

  get<T>(url: string, params?: QueryParams, options?: IRequestOptions): Promise<T> {
    return this.request<T>({ method: 'GET', url, params, ...options });
  }

  post<T, U>(url: string, data: U, options?: IRequestOptions): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, ...options });
  }

  put<T, U>(url: string, data: U, options?: IRequestOptions): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data, ...options });
  }

  patch<T, U>(url: string, data: U, options?: IRequestOptions): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data, ...options });
  }

  delete<T>(url: string, options?: IRequestOptions): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...options });
  }
}
