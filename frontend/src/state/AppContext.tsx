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
import { initialState, reducer, type Action } from "./model";
import { useHashRoute } from "../hooks/useHashRoute";
import type { AppState, ModalKind, Route } from "../types";
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
}
const AppContext = createContext<ContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { route, navigate } = useHashRoute();
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [toast, setToast] = useState("");
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
