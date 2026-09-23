import type { ReactNode } from "react";
import { useApp } from "../state/AppContext";
import type { Route } from "../types";
import { Icon, Logo } from "./ui";
const navigation: {
  route: Route;
  label: string;
  icon: string;
  mobile?: string;
}[] = [
  { route: "home", label: "Início", icon: "home", mobile: "Início" },
  { route: "assessment", label: "Minha Avaliação", icon: "clipboard" },
  {
    route: "protocol",
    label: "Meu Protocolo",
    icon: "spark",
    mobile: "Protocolo",
  },
  {
    route: "exercises",
    label: "Exercícios",
    icon: "activity",
    mobile: "Exercícios",
  },
  {
    route: "progress",
    label: "Meu Progresso",
    icon: "chart",
    mobile: "Progresso",
  },
  { route: "contact", label: "Atendimento", icon: "chat" },
  { route: "profile", label: "Perfil", icon: "user", mobile: "Perfil" },
];
export function Layout({ children }: { children: ReactNode }) {
  const { state, route, openModal, notify } = useApp();
  const initials = state.profile.name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  return (
    <>
      <aside className="sidebar">
        <Logo />
        <div className="nav-label">SEU ACOMPANHAMENTO</div>
        <nav className="nav" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a
              key={item.route}
              href={`#${item.route}`}
              className={route === item.route ? "active" : ""}
              aria-current={route === item.route ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="side-note">
            <Icon name="leaf" />
            <strong>Um passo de cada vez.</strong>Seu equilíbrio começa nos
            pequenos cuidados de hoje.
          </div>
          <nav className="nav">
            <a href="#login">
              <Icon name="logout" />
              Sair
            </a>
          </nav>
          <a href="#profile" className="side-profile">
            <span className="avatar">{initials}</span>
            <span>
              <strong className="small">{state.profile.name}</strong>
              <br />
              <small className="muted">Minha conta</small>
            </span>
          </a>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="crumb">
            Meu espaço{" "}
            <span style={{ margin: "0 12px", color: "#c3bdce" }}>/</span>
            {navigation.find((item) => item.route === route)?.label ??
              "Acompanhamento"}
          </span>
          <Logo />
          <div className="top-right">
            <span className="demo">DEMONSTRAÇÃO</span>
            <button
              className="notify"
              aria-label="Notificações"
              onClick={() =>
                notify(
                  "Seu próximo momento de cuidado está disponível no protocolo.",
                )
              }
            >
              <Icon name="bell" />
            </button>
            <a href="#profile" className="avatar" aria-label="Abrir meu perfil">
              {initials}
            </a>
          </div>
        </header>
        {children}
        <p className="footer-note">
          Resgatando almas · Seu tempo. Seu ritmo. Seu equilíbrio.
          <br />
          Práticas complementares de bem-estar · Dados ilustrativos
        </p>
      </main>
      {!["assessment", "analysis"].includes(route) && (
        <div className="support">
          <button onClick={() => openModal("whatsapp")}>
            <Icon name="chat" />
            Falar pelo WhatsApp
          </button>
          <button onClick={() => openModal("schedule")}>
            <Icon name="pin" />
            Atendimento presencial
          </button>
        </div>
      )}
      <nav className="bottomnav" aria-label="Navegação mobile">
        {navigation
          .filter((item) => item.mobile)
          .map((item) => (
            <a
              key={item.route}
              href={`#${item.route}`}
              className={route === item.route ? "active" : ""}
              aria-current={route === item.route ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.mobile}
            </a>
          ))}
      </nav>
    </>
  );
}
