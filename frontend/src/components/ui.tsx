import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type ReactElement,
} from "react";
import type { EnergyRecord } from "../types";
import { buildEnergyChart, type EnergyChartPeriod } from "../lib/energyChart";
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
    <a className="brand" href="/home">
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
export function EnergyChart({
  records = [],
  period,
  allRecords = false,
}: {
  records?: EnergyRecord[];
  period?: EnergyChartPeriod;
  allRecords?: boolean;
}) {
  const gradient = useId().replace(/:/g, "");
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    if (!container.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const chart = period ? buildEnergyChart(records, period) : null;
  const entries = chart?.points ?? [...records]
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(allRecords ? 0 : -7)
    .map((record) => ({
      key: record.id,
      label: new Date(record.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      title: new Date(record.date).toLocaleString("pt-BR"),
      value: record.value,
      count: 1,
      position: undefined,
    }));
  const populated = entries.filter((entry) => entry.value !== null);
  if (!populated.length) {
    return <div ref={container}><p className="muted graph-empty" role="status">{period
      ? "Nenhum registro neste período. Escolha outro período ou faça uma avaliação."
      : "Seu gráfico aparecerá após o primeiro registro."}</p></div>;
  }
  const left = 44;
  const right = width - 32;
  const baseline = 220;
  const xAt = (index: number) => left + (entries[index].position ??
    (entries.length === 1 ? 0.5 : index / (entries.length - 1))) * (right - left);
  // Missing days/months break the line instead of implying an energy value.
  const segments: { key: string; x: number; y: number; title: string; index: number }[][] = [];
  let segment: (typeof segments)[number] = [];
  entries.forEach((entry, index) => {
    if (entry.value === null) {
      segment = [];
      return;
    }
    if (!segment.length) segments.push(segment);
    const value = entry.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    segment.push({
      key: entry.key,
      x: xAt(index),
      y: baseline - entry.value * 2,
      title: `${entry.title}: ${period && period !== "day" ? "média " : ""}${value}${period ? ` (${entry.count} ${entry.count === 1 ? "registro" : "registros"})` : ""}`,
      index,
    });
  });
  // Keep labels readable at their actual pixel size, including on narrow screens.
  const labelIndexes: number[] = [];
  entries.forEach((_, index) => {
    const last = labelIndexes.at(-1);
    if (last === undefined || xAt(index) - xAt(last) >= 72) labelIndexes.push(index);
  });
  const finalIndex = entries.length - 1;
  if (labelIndexes.at(-1) !== finalIndex && xAt(finalIndex) > xAt(0)) {
    if (xAt(finalIndex) - xAt(labelIndexes.at(-1)!) < 72) labelIndexes.pop();
    labelIndexes.push(finalIndex);
  }
  return (
    <div ref={container} className="graph-container">
      <svg key={period ?? "recent"} className="graph" viewBox={`0 0 ${width} 260`} role="img"
        aria-label={chart ? `Evolução da energia: ${chart.rangeLabel}. ${chart.description}` : "Histórico dos últimos registros de energia"}>
        <defs>
          <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2={baseline}>
            <stop stopColor="#a999de" stopOpacity=".35" />
            <stop offset="1" stopColor="#a999de" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line x1={left} y1={baseline - value * 2} x2={right} y2={baseline - value * 2} />
            <text x="30" y={baseline + 4 - value * 2} textAnchor="end">{value}</text>
          </g>
        ))}
        {segments.map((points) => {
          const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
          return (
            <g key={points[0].key}>
              {points.length > 1 && <>
                <polygon className="graph-area" points={`${points[0].x},${baseline} ${linePoints} ${points[points.length - 1].x},${baseline}`} fill={`url(#${gradient})`} />
                <polyline className="graph-line" points={linePoints} pathLength="1" fill="none" stroke="#a393d3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </>}
              {points.map((point) => (
                <circle key={point.key} className="graph-point" style={{ animationDelay: `${point.index / Math.max(1, entries.length - 1) * 600 + 200}ms` }} cx={point.x} cy={point.y} r="4" fill="#a08dd2">
                  <title>{point.title}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {labelIndexes.map((index) => (
          <text key={entries[index].key} x={xAt(index)} y="248" textAnchor="middle">{entries[index].label}</text>
        ))}
      </svg>
      {populated.length === 1 && <p className="small muted graph-hint">
        {populated[0].count === 1
          ? "Há apenas um registro neste período. A evolução aparecerá com novos registros."
          : "Os registros deste período estão concentrados em um único intervalo."}
      </p>}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const generatedId = useId();
  const id = children.props.id ?? generatedId;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
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
