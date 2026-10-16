export interface IRequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export type QueryParamValue =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[]
  | null;
export type QueryParams = Record<string, QueryParamValue>;

export interface IHttpClient {
  get<T>(path: string, params?: QueryParams, options?: IRequestOptions): Promise<T>;
  post<T, U>(path: string, body: U, options?: IRequestOptions): Promise<T>;
  put<T, U>(path: string, body: U, options?: IRequestOptions): Promise<T>;
  patch<T, U>(path: string, body: U, options?: IRequestOptions): Promise<T>;
  delete<T>(path: string, options?: IRequestOptions): Promise<T>;
}
