/**
 * @module components/CreationCorridor/CreationCorridorProvider
 * @description Global provider for the Creation Corridor conversion funnel.
 * @since 2025-12-12
 */

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiGet, apiPost } from '@utils/api';
import { trackEvent } from '@utils/analytics';
import { QUICKSTART_PROMPT_KEY } from '@utils/quickstart';
import type { Design } from '../../types/design';
import type {
  CreationCorridorStage,
  CreationCorridorStartArgs,
  CreationCorridorState,
  PersistedCreationCorridor,
} from '../../types/creationCorridor';
import type { CreationCorridorContextValue } from './CreationCorridorContext.types';
import type { CreationCorridorProviderProps } from './CreationCorridorProvider.types';

const STORAGE_KEY = 'gptees_creation_corridor';
const STORAGE_VERSION = 1;
const STORAGE_TTL_MS = 30 * 60 * 1000;

const DEFAULT_STYLE = 'trendy';

const DEFAULT_STATE: CreationCorridorState = {
  active: false,
  phase: 'IDLE',
  stageIndex: 0,
  prompt: '',
  style: DEFAULT_STYLE,
  productId: null,
  color: null,
  size: null,
  tier: null,
  quantity: null,
  orderId: null,
  guestToken: null,
  wasGuest: false,
  designRequested: false,
  claimRequested: false,
  startedAtMs: null,
  errorMessage: null,
};

const STAGES: CreationCorridorStage[] = [
  {
    key: 'corridor.prepare',
    title: 'Setting up your draft…',
    subtitle: 'We’re getting the canvas ready.',
    minDurationMs: 4900,
    isAuthPause: false,
  },
  {
    key: 'corridor.interpret',
    title: 'Interpreting your direction…',
    subtitle: 'Finding the strongest visual read.',
    minDurationMs: 7200,
    isAuthPause: false,
  },
  {
    key: 'corridor.explore',
    title: 'Exploring visual directions…',
    subtitle: 'Balancing mood, shape, and contrast.',
    minDurationMs: 5400,
    isAuthPause: false,
  },
  {
    key: 'corridor.auth',
    title: 'One quick step…',
    subtitle: 'Sign in to keep this draft attached to you.',
    minDurationMs: 0,
    isAuthPause: true,
  },
  {
    key: 'corridor.finish',
    title: 'Finalizing your studio…',
    subtitle: 'Opening your draft in the design workspace.',
    minDurationMs: 1200,
    isAuthPause: false,
  },
];

const isAuthPath = (pathname: string): boolean => {
  return pathname.startsWith('/auth') || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
};

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something interrupted the draft creation flow.';
};

const safeParse = (raw: string): PersistedCreationCorridor | null => {
  try {
    return JSON.parse(raw) as PersistedCreationCorridor;
  } catch {
    return null;
  }
};

const loadPersisted = (): CreationCorridorState | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeParse(raw);
  if (!parsed) return null;
  if (parsed.v !== STORAGE_VERSION) return null;
  if (!parsed.expiresAtMs || parsed.expiresAtMs <= Date.now()) return null;
  return parsed.state;
};

const persistState = (state: CreationCorridorState): void => {
  if (typeof window === 'undefined') return;
  const payload: PersistedCreationCorridor = {
    v: STORAGE_VERSION,
    expiresAtMs: Date.now() + STORAGE_TTL_MS,
    state,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const clearPersisted = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * @context CreationCorridorContext
 * @description React context that exposes the Creation Corridor controller.
 */
export const CreationCorridorContext = createContext<CreationCorridorContextValue | null>(null);

/**
 * @component
 * @description Wraps the app with the Creation Corridor controller.
 *
 * @param {CreationCorridorProviderProps} props - Provider props.
 * @param {ReactNode} props.children - Children to render inside the provider.
 * @returns {JSX.Element} The provider wrapping children.
 */
export default function CreationCorridorProvider({ children }: CreationCorridorProviderProps): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
  const isAuthLoaded = skipAuth ? true : isLoaded;
  const isAuthed = skipAuth ? true : isSignedIn;
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (skipAuth) {
      return 'dev';
    }
    return getToken();
  }, [getToken, skipAuth]);

  const [state, setState] = useState<CreationCorridorState>(() => {
    const persisted = loadPersisted();
    if (!persisted) return DEFAULT_STATE;
    return persisted.active ? persisted : DEFAULT_STATE;
  });

  const runIdRef = useRef(0);
  const stageEnteredAtMsRef = useRef<number>(Date.now());
  const lastOverflowRef = useRef<string>('');
  const resumeInFlightRef = useRef(false);
  const startInFlightRef = useRef(false);

  const overlayVisible = state.active && !isAuthPath(location.pathname);

  const updateState = useCallback((patch: Partial<CreationCorridorState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const exit = useCallback(() => {
    clearPersisted();
    localStorage.removeItem('gptees_preview_guest');
    updateState({ ...DEFAULT_STATE });
  }, [updateState]);

  const goToAuth = useCallback(() => {
    if (!state.active) return;
    trackEvent('creation_corridor.auth.cta', {
      order_id: state.orderId,
      prompt_length: state.prompt.length,
    });
    navigate('/auth?redirect=/');
  }, [navigate, state.active, state.orderId, state.prompt.length]);

  const setStageIndex = useCallback(
    (nextIndex: number) => {
      stageEnteredAtMsRef.current = Date.now();
      updateState({ stageIndex: nextIndex });
    },
    [updateState]
  );

  const markError = useCallback(
    (message: string) => {
      updateState({ phase: 'ERROR', errorMessage: message });
    },
    [updateState]
  );

  const waitForCurrentStageMin = useCallback(
    async (minDurationMs: number, runId: number) => {
      const enteredAt = stageEnteredAtMsRef.current;
      const elapsed = Date.now() - enteredAt;
      const remaining = Math.max(0, minDurationMs - elapsed);
      if (remaining > 0) {
        await sleep(remaining);
      }
      if (runIdRef.current !== runId) return;
    },
    []
  );

  const advanceStageAfterMin = useCallback(
    async (targetIndex: number, minDurationMs: number, runId: number) => {
      const enteredAt = stageEnteredAtMsRef.current;
      const elapsed = Date.now() - enteredAt;
      const remaining = Math.max(0, minDurationMs - elapsed);
      if (remaining > 0) {
        await sleep(remaining);
      }
      if (runIdRef.current !== runId) return;
      setStageIndex(targetIndex);
    },
    [setStageIndex]
  );

  const completeToDesign = useCallback(
    async (orderId: string, promptLength: number, runId: number) => {
      if (runIdRef.current !== runId) return;

      updateState({ phase: 'COMPLETING' });
      trackEvent('creation_corridor.complete', {
        order_id: orderId,
        prompt_length: promptLength,
      });

      clearPersisted();
      localStorage.removeItem('gptees_preview_guest');
      updateState({ ...DEFAULT_STATE });
      navigate(`/design?orderId=${orderId}`);
    },
    [navigate, updateState]
  );

  const runSignedInFlow = useCallback(
    async (args: CreationCorridorStartArgs, runId: number) => {
      try {
        const token = await getAuthToken();
        if (!token) {
          markError('Sign-in was required to continue. Please try again.');
          return;
        }

        await advanceStageAfterMin(1, STAGES[0].minDurationMs, runId);

        const orderResp = await apiPost(
          '/api/orders/preview',
          {
            productId: args.productId,
            color: args.color,
            size: args.size,
            tier: args.tier,
            quantity: args.quantity,
          },
          token
        );

        const orderId = orderResp?.data?.id as string | undefined;
        if (!orderId) {
          markError('We couldn’t create your draft right now. Please try again.');
          return;
        }

        updateState({ orderId });

        await advanceStageAfterMin(2, STAGES[1].minDurationMs, runId);

        await apiPost(
          '/api/designs/generate',
          {
            orderId,
            prompt: args.prompt,
            style: args.style,
          },
          token
        );

        updateState({ designRequested: true });

        await advanceStageAfterMin(4, STAGES[2].minDurationMs, runId);
        await waitForCurrentStageMin(STAGES[4].minDurationMs, runId);

        await completeToDesign(orderId, args.prompt.length, runId);
      } catch (error: unknown) {
        console.error('Creation corridor signed-in flow failed', error);
        markError(getErrorMessage(error));
      }
    },
    [advanceStageAfterMin, completeToDesign, getToken, markError, updateState, waitForCurrentStageMin]
  );

  const runGuestFlow = useCallback(
    async (args: CreationCorridorStartArgs, runId: number) => {
      try {
        await advanceStageAfterMin(1, STAGES[0].minDurationMs, runId);

        const response = await apiPost('/api/orders/preview/guest', {
          productId: args.productId,
          color: args.color,
          size: args.size,
          tier: args.tier,
          quantity: args.quantity,
        });

        const orderId = response?.data?.orderId as string | undefined;
        const guestToken = response?.data?.guestToken as string | undefined;
        if (!orderId || !guestToken) {
          markError('We couldn’t start your draft. Please try again.');
          return;
        }

        updateState({ orderId, guestToken, wasGuest: true });

        await advanceStageAfterMin(2, STAGES[1].minDurationMs, runId);

        try {
          await apiPost('/api/designs/generate/guest', {
            orderId,
            guestToken,
            prompt: args.prompt,
            style: args.style,
          });
          updateState({ designRequested: true });
        } catch (err: unknown) {
          console.warn('Guest design generation failed pre-auth', err);
        }

        await waitForCurrentStageMin(STAGES[2].minDurationMs, runId);
        setStageIndex(3);
        updateState({ phase: 'AUTH_PAUSED' });
      } catch (error: unknown) {
        console.error('Creation corridor guest flow failed', error);
        markError(getErrorMessage(error));
      }
    },
    [advanceStageAfterMin, markError, setStageIndex, updateState, waitForCurrentStageMin]
  );

  const resumeAfterAuth = useCallback(
    async (runId: number) => {
      if (!state.orderId || !state.guestToken) {
        markError('We couldn’t find your saved draft. Please start again.');
        return;
      }

      try {
        updateState({ phase: 'RESUMING' });

        const token = await getAuthToken();
        if (!token) {
          markError('Authentication required. Please sign in again.');
          return;
        }

        if (!state.claimRequested) {
          await apiPost(
            '/api/orders/preview/claim',
            {
              orderId: state.orderId,
              guestToken: state.guestToken,
            },
            token
          );
          updateState({ claimRequested: true });
        }

        let designs: Design[] = [];
        try {
          const designsResp = await apiGet(`/api/designs?orderId=${state.orderId}`, token);
          designs = (designsResp?.data as Design[]) || [];
        } catch (err) {
          console.warn('Unable to fetch designs after claim', err);
        }

        if (!designs.length && state.prompt) {
          await apiPost(
            '/api/designs/generate',
            {
              orderId: state.orderId,
              prompt: state.prompt,
              style: state.style,
            },
            token
          );
          updateState({ designRequested: true });
        }

        setStageIndex(4);
        updateState({ phase: 'RUNNING' });
        await waitForCurrentStageMin(STAGES[4].minDurationMs, runId);

        await completeToDesign(state.orderId, state.prompt.length, runId);
      } catch (error: unknown) {
        console.error('Creation corridor resume failed', error);
        markError(getErrorMessage(error));
      }
    },
    [
      advanceStageAfterMin,
      completeToDesign,
      getToken,
      markError,
      setStageIndex,
      state.claimRequested,
      state.guestToken,
      state.orderId,
      state.prompt,
      state.style,
      updateState,
      waitForCurrentStageMin,
    ]
  );

  const start = useCallback(
    async (args: CreationCorridorStartArgs) => {
      if (!isAuthLoaded) {
        return;
      }

      if (state.active) {
        return;
      }

      const promptText = args.prompt.trim();
      if (!promptText) {
        return;
      }

      runIdRef.current += 1;
      const runId = runIdRef.current;
      stageEnteredAtMsRef.current = Date.now();

      if (startInFlightRef.current) return;
      startInFlightRef.current = true;

      trackEvent('creation_corridor.start', {
        prompt_length: promptText.length,
      });

      localStorage.setItem(QUICKSTART_PROMPT_KEY, promptText);

      updateState({
        active: true,
        phase: 'RUNNING',
        stageIndex: 0,
        prompt: promptText,
        style: args.style,
        productId: args.productId,
        color: args.color,
        size: args.size,
        tier: args.tier,
        quantity: args.quantity,
        orderId: null,
        guestToken: null,
        wasGuest: !isAuthed,
        designRequested: false,
        claimRequested: false,
        startedAtMs: Date.now(),
        errorMessage: null,
      });

      try {
        if (isAuthed) {
          await runSignedInFlow(args, runId);
        } else {
          await runGuestFlow(args, runId);
        }
      } finally {
        startInFlightRef.current = false;
      }
    },
    [isAuthLoaded, isAuthed, runGuestFlow, runSignedInFlow, state.active, updateState]
  );

  useEffect(() => {
    if (!state.active) {
      clearPersisted();
      return;
    }
    persistState(state);
  }, [state]);

  useEffect(() => {
    if (!overlayVisible) {
      document.body.style.overflow = lastOverflowRef.current || '';
      return;
    }

    lastOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = lastOverflowRef.current || '';
    };
  }, [overlayVisible]);

  useEffect(() => {
    stageEnteredAtMsRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!state.active) return;
    const stage = STAGES[state.stageIndex];
    if (!stage) return;

    trackEvent('creation_corridor.stage.view', {
      stage_key: stage.key,
      stage_index: state.stageIndex,
      prompt_length: state.prompt.length,
      order_id: state.orderId,
    });
  }, [state.active, state.orderId, state.prompt.length, state.stageIndex]);

  useEffect(() => {
    if (!state.active) return;

    if (state.phase === 'COMPLETING' && state.orderId) {
      clearPersisted();
      localStorage.removeItem('gptees_preview_guest');
      updateState({ ...DEFAULT_STATE });
      navigate(`/design?orderId=${state.orderId}`);
      return;
    }

    if (!isAuthLoaded) return;

    if (
      state.wasGuest &&
      isAuthed &&
      !isAuthPath(location.pathname) &&
      (state.phase === 'AUTH_PAUSED' || state.phase === 'RESUMING')
    ) {
      if (resumeInFlightRef.current) return;
      resumeInFlightRef.current = true;
      const runId = runIdRef.current;
      resumeAfterAuth(runId).finally(() => {
        resumeInFlightRef.current = false;
      });
    }
  }, [
    isAuthLoaded,
    isAuthed,
    location.pathname,
    navigate,
    resumeAfterAuth,
    state.active,
    state.orderId,
    state.phase,
    state.wasGuest,
    updateState,
  ]);

  useEffect(() => {
    if (!state.active) return;
    if (!isAuthLoaded) return;
    if (startInFlightRef.current) return;
    if (resumeInFlightRef.current) return;
    if (state.phase !== 'RUNNING') return;

    const runId = runIdRef.current;

    const recover = async () => {
      try {
        let resolvedOrderId: string | null = state.orderId;

        if (state.wasGuest && !isSignedIn) {
          if (!state.orderId || !state.guestToken) {
            markError('We couldn’t find your saved draft. Please start again.');
            return;
          }

          if (!state.designRequested) {
            try {
              await apiPost('/api/designs/generate/guest', {
                orderId: state.orderId,
                guestToken: state.guestToken,
                prompt: state.prompt,
                style: state.style,
              });
              updateState({ designRequested: true });
            } catch (err) {
              console.warn('Guest design generation failed during recovery', err);
            }
          }

          setStageIndex(3);
          updateState({ phase: 'AUTH_PAUSED' });
          return;
        }

        if (!isAuthed) {
          setStageIndex(3);
          updateState({ phase: 'AUTH_PAUSED' });
          return;
        }

        const token = await getAuthToken();
        if (!token) {
          setStageIndex(3);
          updateState({ phase: 'AUTH_PAUSED' });
          return;
        }

        if (!state.orderId) {
          if (!state.productId || !state.color || !state.size || !state.tier || !state.quantity) {
            markError('We couldn’t restore your draft settings. Please start again.');
            return;
          }

          const orderResp = await apiPost(
            '/api/orders/preview',
            {
              productId: state.productId,
              color: state.color,
              size: state.size,
              tier: state.tier,
              quantity: state.quantity,
            },
            token
          );

          const orderId = orderResp?.data?.id as string | undefined;
          if (!orderId) {
            markError('We couldn’t recreate your preview order. Please try again.');
            return;
          }
          resolvedOrderId = orderId;
          updateState({ orderId });
        }

        if (resolvedOrderId && !state.designRequested && state.prompt) {
          await apiPost(
            '/api/designs/generate',
            {
              orderId: resolvedOrderId,
              prompt: state.prompt,
              style: state.style,
            },
            token
          );
          updateState({ designRequested: true });
        }

        if (resolvedOrderId) {
          setStageIndex(4);
          await waitForCurrentStageMin(STAGES[4].minDurationMs, runId);
          await completeToDesign(resolvedOrderId, state.prompt.length, runId);
        }
      } catch (error: unknown) {
        console.error('Creation corridor recovery failed', error);
        markError(getErrorMessage(error));
      }
    };

    recover();
  }, [
    completeToDesign,
    getToken,
    isLoaded,
    isSignedIn,
    markError,
    setStageIndex,
    state.active,
    state.color,
    state.designRequested,
    state.guestToken,
    state.orderId,
    state.phase,
    state.productId,
    state.prompt,
    state.quantity,
    state.size,
    state.style,
    state.tier,
    state.wasGuest,
    updateState,
    waitForCurrentStageMin,
  ]);

  const contextValue = useMemo<CreationCorridorContextValue>(
    () => ({
      state,
      stages: STAGES,
      overlayVisible,
      start,
      goToAuth,
      exit,
    }),
    [exit, goToAuth, overlayVisible, start, state]
  );

  return <CreationCorridorContext.Provider value={contextValue}>{children}</CreationCorridorContext.Provider>;
}
