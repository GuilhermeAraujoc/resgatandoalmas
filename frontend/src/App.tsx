import { AppProvider, useApp } from "./state/AppContext";
import { Layout } from "./components/Layout";
import { ModalHost } from "./components/ModalHost";
import { Home } from "./pages/Home";
import { Auth, Welcome } from "./pages/Auth";
import { Assessment, Analysis, Result } from "./pages/Assessment";
import { Protocol } from "./pages/Protocol";
import { Exercises } from "./pages/Exercises";
import { Exercise } from "./pages/Exercise";
import { Feedback, FeedbackResult } from "./pages/Feedback";
import { Progress } from "./pages/Progress";
import { Profile } from "./pages/Profile";
import { Contact } from "./pages/Contact";
import { DesignSystem } from "./pages/DesignSystem";
function Screen() {
  const { route, state } = useApp();
  switch (route) {
    case "home":
      return <Home />;
    case "login":
      return <Auth key="login" />;
    case "signup":
      return <Auth key="signup" signup />;
    case "welcome":
      return <Welcome />;
    case "assessment":
      return <Assessment />;
    case "analysis":
      return <Analysis />;
    case "result":
      return <Result />;
    case "protocol":
      return <Protocol />;
    case "exercises":
      return <Exercises />;
    case "exercise":
      return <Exercise key={state.currentExerciseId} />;
    case "feedback":
      return <Feedback />;
    case "feedback-result":
      return <FeedbackResult />;
    case "progress":
      return <Progress />;
    case "profile":
      return <Profile />;
    case "contact":
      return <Contact />;
    case "design":
      return <DesignSystem />;
  }
}
function AppContent() {
  const { route, toast } = useApp();
  const auth = route === "login" || route === "signup";
  return (
    <>
      <div className="ambient" aria-hidden="true" />
      {auth ? (
        <Screen />
      ) : (
        <Layout>
          <Screen />
        </Layout>
      )}
      <ModalHost />
      <div
        id="toast"
        className={toast ? "show" : ""}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
