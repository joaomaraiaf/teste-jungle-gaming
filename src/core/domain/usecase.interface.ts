/**
 * Generic interface for Use Cases (Command Pattern).
 * @template IRequest - The input type for the use case.
 * @template IResponse - The output type for the use case.
 */
export interface IUseCase<IRequest = void, IResponse = void> {
  /**
   * Executes the use case logic.
   * @param request - The input data.
   * @returns The result of the operation.
   */
  execute(request: IRequest): Promise<IResponse> | IResponse;
}
