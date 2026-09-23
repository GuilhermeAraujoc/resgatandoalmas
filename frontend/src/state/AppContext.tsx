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
import { initialState, reducer, isFeedbackComplete, type Action } from "./model";
import { useHashRoute } from "../hooks/useHashRoute";
import { ApiError, request, readState, readProfile } from "../services/api";
import type { Profile } from "../types";
import type { AppState, ModalKind, Route } from "../types";
interface ContextValue {
  state: AppState;
  session: "loading" | "authenticated" | "anonymous" | "error";
  error: string;
  busy: boolean;
  reload: () => Promise<void>;
  authenticate: (signup: boolean, data: Record<string, string>) => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  submitAssessment: () => Promise<void>;
  submitFeedback: () => Promise<void>;
  logout: () => Promise<void>;

  dispatch: Dispatch<Action>;
  route: Route;
  navigate: (route: Route) => void;
  modal: ModalKind | null;
  openModal: (kind: ModalKind) => void;
  closeModal: () => void;
  toast: string;
  notify: (text: string) => void;
  startExercise: (id: string) => void;
}
const AppContext = createContext<ContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { route, navigate } = useHashRoute();
  const [session, setSession] = useState<ContextValue["session"]>("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const applySnapshot = useCallback((value: unknown) => {
    const remote = readState(value);
    const empty = initialState();
    dispatch({ type: "hydrate", state: {
      ...empty,
      profile: remote.profile, energy: remote.energy, before: remote.before,
      scenario: remote.scenario, completed: remote.completed,
      currentExerciseId: remote.currentExerciseId,
      history: remote.history, feedbackHistory: remote.feedbackHistory,
    } });
    setSession("authenticated");
  }, []);
  const handleLoadError = useCallback((cause: unknown) => {
    dispatch({ type: "reset" });
    if (cause instanceof ApiError && cause.status === 401) setSession("anonymous");
    else {
      setSession("error");
      setError(cause instanceof Error ? cause.message : "Erro ao carregar seus dados.");
    }
  }, []);
  const reload = useCallback(async () => {
    setSession("loading");
    setError("");
    try { applySnapshot(await request("/me/state")); }
    catch (cause) { handleLoadError(cause); }
  }, [applySnapshot, handleLoadError]);
  useEffect(() => {
    let active = true;
    request("/me/state").then(
      value => { if (active) applySnapshot(value); },
    ).catch(cause => { if (active) handleLoadError(cause); });
    return () => { active = false; };
  }, [applySnapshot, handleLoadError]);
  const run = async (operation: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try { await operation(); }
    catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        dispatch({ type: "reset" });
        setSession("anonymous");
      }
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
    } finally { busyRef.current = false; setBusy(false); }
  };
  const authenticate = (signup: boolean, data: Record<string, string>) => run(async () => {
    await request(signup ? "/auth/register" : "/auth/login", "POST", data);
    dispatch({ type: "reset" });
    setSession("anonymous");
    applySnapshot(await request("/me/state"));
    navigate("home");
  });
  const saveProfile = (profile: Profile) => run(async () => {
    const saved = readProfile(await request("/me", "PATCH", profile));
    dispatch({ type: "profile", profile: saved });
    notify("Alterações salvas.");
  });
  const submitAssessment = () => run(async () => {
    if (state.answers.some(answer => answer === null)) return;
    applySnapshot(await request("/assessments", "POST", { answers: state.answers }));
    navigate("result");
  });
  const submitFeedback = () => run(async () => {
    if (!state.currentExerciseId || !isFeedbackComplete(state.feedback)) return;
    applySnapshot(await request("/feedbacks", "POST", {
      exerciseId: state.currentExerciseId, ...state.feedback,
    }));
    navigate("feedback-result");
  });
  const logout = () => run(async () => {
    await request("/auth/logout", "POST");
    dispatch({ type: "reset" });
    setSession("anonymous");
    navigate("login");
  });
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [toast, setToast] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((text: string) => {
    clearTimeout(timeout.current);
    setToast(text);
    timeout.current = setTimeout(() => setToast(""), 3500);
  }, []);
  useEffect(() => () => clearTimeout(timeout.current), []);
  const closeModal = () => setModal(null);
  const startExercise = useCallback(
    (id: string) => {
      dispatch({ type: "start", id });
      navigate("exercise");
    },
    [navigate],
  );
  return (
    <AppContext.Provider
      value={{
        state, session, error, busy, reload, authenticate, saveProfile, submitAssessment, submitFeedback, logout,
        dispatch,
        route,
        navigate,
        modal,
        openModal: setModal,
        closeModal,
        toast,
        notify,
        startExercise,
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
