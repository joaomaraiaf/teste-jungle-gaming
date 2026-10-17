interface BackgroundRequestStatusProps {
  refreshing: boolean;
  failed?: boolean;
  resource: string;
  retry?: () => void;
}
export function BackgroundRequestStatus({
  refreshing,
  failed,
  resource,
  retry,
}: BackgroundRequestStatusProps) {
  if (failed)
    return (
      <div role='alert' className='flex flex-wrap items-center gap-3 text-sm text-[#CFB28C]'>
        <p>Não foi possível atualizar {resource}. Exibindo os últimos dados carregados.</p>
        <button
          type='button'
          className='text-[#E89B55] underline underline-offset-4'
          onClick={retry}
        >
          Tentar atualizar novamente
        </button>
      </div>
    );
  if (refreshing)
    return (
      <p
        role='status'
        className='pointer-events-none fixed right-4 top-4 z-40 rounded-md bg-[#241612] px-3 py-2 text-xs text-[#CFB28C]'
      >
        Atualizando {resource}…
      </p>
    );
  return null;
}
