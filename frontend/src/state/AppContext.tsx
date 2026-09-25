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
import { usePathRoute } from "../hooks/usePathRoute";
import { request } from "../services/api";
import { ApiError } from "../services/api";
import * as authApi from "../services/auth";
import * as meApi from "../services/me";
import { createAssessment } from "../services/assessments";
import { createFeedback } from "../services/feedbacks";
import type { UserDto } from "../services/dto";
import type { AppState, ModalKind, Route, Catalog } from "../types";

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
  login: (input: authApi.LoginInput) => Promise<UserDto>;
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
  const { route, navigate } = usePathRoute();
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [toast, setToast] = useState("");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const sessionVersion = useRef(0);
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
    sessionVersion.current++;
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
      const version = ++sessionVersion.current;
      const [catalog, progress] = await Promise.all([
        authed(() => request<Catalog>("GET", "/catalog")),
        authed(meApi.getProgress),
      ]).catch(error => {
        if (version === sessionVersion.current) endSession();
        throw error;
      });
      if (version !== sessionVersion.current) return;
      dispatch({ type: "reset" });
      dispatch({ type: "profile", profile: profileFromUser(user), role: user.role });
      dispatch({ type: "catalog", catalog });
      dispatch({ type: "progress", progress });
      setAuthStatus("authenticated");
    },
    [authed, endSession],
  );

  // Restore the session from the cookie on first load.
  useEffect(() => {
    let active = true;
    const version = sessionVersion.current;
    meApi
      .getMe()
      .then(({ user }) => (active && version === sessionVersion.current ? startSession(user) : undefined))
      .catch(() => {
        if (active && version === sessionVersion.current) setAuthStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, [startSession]);
  useEffect(() => {
    if (authStatus === "anonymous" && !publicRoutes.includes(route))
      navigate("login");
  }, [authStatus, route, navigate]);

  useEffect(() => {
    if (authStatus !== "authenticated" || route !== "assessment") return;
    let active = true;
    request<Catalog>("GET", "/catalog")
      .then(catalog => { if (active) dispatch({ type: "catalog", catalog }); })
      .catch(error => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) endSession();
        else notify("Não foi possível atualizar o questionário. A versão carregada continua disponível.");
      });
    return () => { active = false; };
  }, [authStatus, route, endSession, notify]);

  const login = useCallback(
    async (input: authApi.LoginInput) => {
      sessionVersion.current++;
      const { user } = await authApi.login(input);
      await startSession(user);
      return user;
    },
    [startSession],
  );
  const register = useCallback(
    async (input: authApi.RegisterInput) => {
      sessionVersion.current++;
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
    if (!state.catalog) throw new ApiError(409, "Recarregue o catálogo antes de responder.");
    const assessment = await authed(() =>
      createAssessment(state.answers as number[], state.catalog!),
    );
    dispatch({
      type: "assessed",
      energy: assessment.energyScore,
      scenario: assessment.scenario === "CALM" ? "calm" : "vitality",
    });
    await refreshProgress();
  }, [authed, state.answers, state.catalog, refreshProgress]);
  const submitFeedback = useCallback(async () => {
    const catalog = state.protocolCatalog ?? state.catalog;
    if (!catalog) throw new ApiError(409, "Recarregue o catálogo antes de continuar.");
    const saved = await authed(() =>
      createFeedback(state.currentExerciseId, state.feedback, catalog.id),
    );
    dispatch({ type: "feedback-saved", before: saved.before, after: saved.after });
    syncProgress();
  }, [authed, state.currentExerciseId, state.feedback, state.protocolCatalog, state.catalog, syncProgress]);

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
