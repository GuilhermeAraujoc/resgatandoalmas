import {
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
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
  value: number;
  circular?: boolean;
}) {
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
/**
 * Weekly energy line. `values` holds real Monday…Sunday values (null = no
 * record that day); without it an illustrative series ending at `value` is drawn.
 */
export function EnergyChart({
  value,
  values,
}: {
  value: number;
  values?: (number | null)[];
}) {
  const gradient = useId().replace(/:/g, "");
  const illustrative = values === undefined;
  const series = values ?? [32, 38, 41, 48, 52, 55, value];
  const points = series.flatMap((v, i) =>
    v === null ? [] : [{ x: 52 + i * 67, y: 183 - v * 1.25, v, day: i }],
  );
  const coordinates = points.map((p) => `${p.x},${p.y}`).join(" ");
  const first = points[0];
  const last = points.at(-1);
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return (
    <svg
      className="graph"
      viewBox="0 0 490 230"
      role="img"
      aria-label="Evolução energética: índice ilustrativo de 0 a 100 ao longo dos dias da semana"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#a999de" stopOpacity=".22" />
          <stop offset="1" stopColor="#a999de" stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x="8" y="13" className="axis-label">
        Índice energético (0–100){illustrative ? " · demonstração" : ""}
      </text>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1="42" y1={183 - v * 1.25} x2="464" y2={183 - v * 1.25} />
          <text x="8" y={187 - v * 1.25}>
            {v}
          </text>
        </g>
      ))}
      {first && last && (
        <polygon
          points={`${first.x},183 ${coordinates} ${last.x},183`}
          fill={`url(#${gradient})`}
        />
      )}
      <polyline
        points={coordinates}
        fill="none"
        stroke="#a393d3"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p) => (
        <circle
          key={p.day}
          cx={p.x}
          cy={p.y}
          r={p === last ? 4 : 2.5}
          fill="#a08dd2"
          stroke="white"
          strokeWidth="2"
        >
          <title>{`${days[p.day]}: ${energyLabel(p.v)} (${p.v} pontos${illustrative ? " ilustrativos" : ""})`}</title>
        </circle>
      ))}
      {days.map((d, i) => (
        <text key={i} x={52 + i * 67} y="204" textAnchor="middle">
          {d}
        </text>
      ))}
      <text x="250" y="225" textAnchor="middle" className="axis-label">
        Dias da semana{illustrative ? " · período ilustrativo" : ""}
      </text>
    </svg>
  );
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
