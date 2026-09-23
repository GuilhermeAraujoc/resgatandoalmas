import {
  createContext,
  useContext,
  useReducer,
  useState,
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { initialState, profileFromUser, reducer, type Action } from "./model";
import { useHashRoute } from "../hooks/useHashRoute";
import { ApiError } from "../services/api";
import * as authApi from "../services/auth";
import * as meApi from "../services/me";
import { createAssessment } from "../services/assessments";
import { createFeedback } from "../services/feedbacks";
import type { UserDto } from "../services/dto";
import type { AppState, ModalKind, Route } from "../types";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

/** Routes reachable without a session; every other route redirects to login. */
const publicRoutes: Route[] = ["login", "signup"];

interface ContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  route: Route;
  navigate: (route: Route) => void;
  modal: ModalKind | null;
  openModal: (kind: ModalKind) => void;
  closeModal: () => void;
  toast: string;
  notify: (text: string) => void;
  startExercise: (id: string) => void;
  authStatus: AuthStatus;
  login: (input: authApi.LoginInput) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  saveProfile: (input: meApi.ProfileUpdate) => Promise<void>;
  submitAssessment: () => Promise<void>;
  submitFeedback: () => Promise<void>;
}
const AppContext = createContext<ContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { route, navigate } = useHashRoute();
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [toast, setToast] = useState("");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((text: string) => {
    clearTimeout(timeout.current);
    setToast(text);
    timeout.current = setTimeout(() => setToast(""), 3500);
  }, []);
  useEffect(() => () => clearTimeout(timeout.current), []);
  const closeModal = useCallback(() => setModal(null), []);
  const startExercise = useCallback(
    (id: string) => {
      dispatch({ type: "start", id });
      navigate("exercise");
    },
    [navigate],
  );

  const endSession = useCallback(() => {
    dispatch({ type: "reset" });
    setAuthStatus("anonymous");
  }, []);
  /** Runs an API call; a 401 means the session is gone, so fall back to login. */
  const authed = useCallback(
    async <T,>(call: () => Promise<T>): Promise<T> => {
      try {
        return await call();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) endSession();
        throw error;
      }
    },
    [endSession],
  );
  const refreshProgress = useCallback(async () => {
    dispatch({ type: "progress", progress: await authed(meApi.getProgress) });
  }, [authed]);
  /** Refreshes in the background after a change the user already sees locally. */
  const syncProgress = useCallback(() => {
    refreshProgress().catch(() => undefined);
  }, [refreshProgress]);
  const startSession = useCallback(
    async (user: UserDto) => {
      dispatch({ type: "reset" });
      dispatch({ type: "profile", profile: profileFromUser(user) });
      await refreshProgress();
      setAuthStatus("authenticated");
    },
    [refreshProgress],
  );

  // Restore the session from the cookie on first load.
  useEffect(() => {
    let active = true;
    meApi
      .getMe()
      .then(({ user }) => (active ? startSession(user) : undefined))
      .catch(() => {
        if (active) setAuthStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, [startSession]);
  useEffect(() => {
    if (authStatus === "anonymous" && !publicRoutes.includes(route))
      navigate("login");
  }, [authStatus, route, navigate]);

  const login = useCallback(
    async (input: authApi.LoginInput) => {
      const { user } = await authApi.login(input);
      await startSession(user);
    },
    [startSession],
  );
  const register = useCallback(
    async (input: authApi.RegisterInput) => {
      const { user } = await authApi.register(input);
      await startSession(user);
    },
    [startSession],
  );
  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    endSession();
    navigate("login");
  }, [endSession, navigate]);
  const deleteAccount = useCallback(async () => {
    await authed(meApi.deleteMe);
    endSession();
    navigate("login");
  }, [authed, endSession, navigate]);
  const saveProfile = useCallback(
    async (input: meApi.ProfileUpdate) => {
      const { user } = await authed(() => meApi.updateMe(input));
      dispatch({ type: "profile", profile: profileFromUser(user) });
    },
    [authed],
  );
  const submitAssessment = useCallback(async () => {
    const assessment = await authed(() =>
      createAssessment(state.answers as number[]),
    );
    dispatch({
      type: "assessed",
      energy: assessment.energyScore,
      scenario: assessment.scenario === "CALM" ? "calm" : "vitality",
    });
    syncProgress();
  }, [authed, state.answers, syncProgress]);
  const submitFeedback = useCallback(async () => {
    const saved = await authed(() =>
      createFeedback(state.currentExerciseId, state.feedback),
    );
    dispatch({ type: "feedback-saved", before: saved.before, after: saved.after });
    syncProgress();
  }, [authed, state.currentExerciseId, state.feedback, syncProgress]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        route,
        navigate,
        modal,
        openModal: setModal,
        closeModal,
        toast,
        notify,
        startExercise,
        authStatus,
        login,
        register,
        logout,
        deleteAccount,
        saveProfile,
        submitAssessment,
        submitFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
