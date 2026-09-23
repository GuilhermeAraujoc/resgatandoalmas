import {
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { EnergyRecord } from "../types";
import { paths } from "../data/catalog";
import { energyLabel, energyLevels } from "../state/model";

export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const path = paths[name as keyof typeof paths] ?? paths.spark;
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
export function Logo() {
  return (
    <a className="brand" href="#home">
      <span className="logo">
        <Icon name="flower" />
      </span>
      <span>
        resgatando almas<small>SEU ESPAÇO DE EQUILÍBRIO</small>
      </span>
    </a>
  );
}
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  icon?: string | false;
  full?: boolean;
}
export function Button({
  children,
  variant = "primary",
  icon = "arrow",
  full,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`btn ${variant === "primary" ? "" : variant} ${full ? "full" : ""} ${className}`}
    >
      {children}
      {icon && <Icon name={icon} />}
    </button>
  );
}
export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  );
}
export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: ReactNode;
  subtitle: string;
  extra?: ReactNode;
}) {
  return (
    <div className="pagehead">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {extra}
    </div>
  );
}
export function Badge({
  children,
  success = false,
}: {
  children: ReactNode;
  success?: boolean;
}) {
  return <span className={`badge ${success ? "green" : ""}`}>{children}</span>;
}
export function ProgressBar({
  value,
  label = "Progresso",
}: {
  value: number;
  label?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
    >
      <span style={{ width: `${safe}%` }} />
    </div>
  );
}
export function EnergyLevelIndicator({
  value,
  circular = false,
}: {
  value: number | null;
  circular?: boolean;
}) {
  if (value === null) return <p className="muted">Sem avaliação registrada.</p>;
  if (circular)
    return (
      <div
        className="circle-energy"
        role="img"
        aria-label={`Energia atual: ${energyLabel(value)}`}
      >
        <div>
          {energyLabel(value)}
          <small>ENERGIA ATUAL</small>
        </div>
      </div>
    );
  return (
    <>
      <div
        className="energy-track"
        role="img"
        aria-label={`Nível de energia: ${energyLabel(value)}`}
      >
        <span
          className="marker"
          style={
            {
              "--level": `${Math.max(3, Math.min(97, value))}%`,
            } as CSSProperties
          }
        />
      </div>
      <div className="energy-labels">
        {energyLevels.map((level) => (
          <span key={level}>{level}</span>
        ))}
      </div>
    </>
  );
}
export function EnergyChart({ records = [] }: { records?: EnergyRecord[] }) {
  const gradient = useId().replace(/:/g, "");
  const recent = [...records].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).slice(-7);
  if (!recent.length) return <p className="muted">Seu gráfico aparecerá após o primeiro registro.</p>;
  const points = recent.map((record, i) => ({
    x: recent.length === 1 ? 250 : 52 + i * (402 / (recent.length - 1)),
    y: 183 - record.value * 1.25,
  }));
  return <svg className="graph" viewBox="0 0 490 230" role="img" aria-label="Histórico dos últimos registros de energia">
    <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a999de" stopOpacity=".22" /><stop offset="1" stopColor="#a999de" stopOpacity="0" /></linearGradient></defs>
    {[0, 25, 50, 75, 100].map(value => <g key={value}><line x1="42" y1={183-value*1.25} x2="464" y2={183-value*1.25} /><text x="8" y={187-value*1.25}>{value}</text></g>)}
    <polyline points={points.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#a393d3" strokeWidth="2.5" />
    {points.map((point, index) => <g key={recent[index].id}>
      <circle cx={point.x} cy={point.y} r="4" fill="#a08dd2"><title>{`${new Date(recent[index].date).toLocaleString("pt-BR")}: ${recent[index].value}`}</title></circle>
      <text x={point.x} y="210" textAnchor="middle">{new Date(recent[index].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</text>
    </g>)}
  </svg>;
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>;
}
export function ExerciseArt({
  icon,
  color = "",
}: {
  icon: string;
  color?: string;
}) {
  return (
    <div className={`art ${color}`}>
      <Icon name={icon} />
    </div>
  );
}
export function Tabs<T extends string>({
  values,
  value,
  onChange,
  label,
}: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {values.map((item) => (
        <button
          key={item}
          type="button"
          className={value === item ? "active" : ""}
          aria-pressed={value === item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
