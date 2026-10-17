import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  createContext,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuthSession } from '../hooks/use-auth-session.hook';
import { isPrivateDestination } from '../private-destinations';

const LoginDialog = lazy(() =>
  import('./login-dialog').then((module) => ({ default: module.LoginDialog }))
);

interface LoginDialogContextValue {
  openLogin: (trigger?: HTMLElement) => void;
  closeLogin: () => Promise<void>;
}

export const LoginDialogContext = createContext<LoginDialogContextValue | null>(null);

export function LoginDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isLoading } = useAuthSession();
  const destination = new URLSearchParams(location.searchStr).get('redirect');
  const returnTo =
    location.pathname === '/' && isPrivateDestination(destination) ? destination : null;
  const needsSession =
    !isLoading && !session && (Boolean(returnTo) || isPrivateDestination(location.pathname));
  useEffect(() => {
    if (needsSession) setOpen(true);
  }, [needsSession]);
  const openLogin = useCallback((trigger?: HTMLElement) => {
    triggerRef.current =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setOpen(true);
  }, []);
  const closeLogin = useCallback(async () => {
    setOpen(false);
    if (returnTo) await navigate({ to: returnTo });
  }, [navigate, returnTo]);
  const value = useMemo(() => ({ openLogin, closeLogin }), [openLogin, closeLogin]);

  return (
    <LoginDialogContext.Provider value={value}>
      {children}
      <Suspense
        fallback={
          open ? (
            <p
              role='status'
              className='fixed inset-x-0 top-4 z-50 text-center text-sm text-[#CFB28C]'
            >
              Abrindo acesso à conta…
            </p>
          ) : null
        }
      >
        {open && (
          <LoginDialog
            open={open}
            onOpenChange={setOpen}
            onRestoreFocus={() => triggerRef.current?.focus()}
          />
        )}
      </Suspense>
    </LoginDialogContext.Provider>
  );
}
