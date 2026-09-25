import type { EnergyRecord } from "../types";

export type EnergyChartPeriod = "day" | "week" | "month" | "year";

export interface EnergyChartPoint {
  key: string;
  label: string;
  title: string;
  value: number | null;
  count: number;
  /** Position on the time axis, from 0 to 1. */
  position?: number;
}

const pad = (value: number) => String(value).padStart(2, "0");
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fullDate = (date: Date) => date.toLocaleDateString("pt-BR");

function recordKey(date: Date, period: EnergyChartPeriod) {
  if (period === "year")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  return dayKey(date);
}

/** Calendar periods follow the browser's local timezone. Empty buckets stay empty. */
export function buildEnergyChart(
  records: EnergyRecord[],
  period: EnergyChartPeriod,
  now = new Date(),
): {
  points: EnergyChartPoint[];
  description: string;
  rangeLabel: string;
} {
  if (period === "day") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daily = records.filter((record) => {
      const time = Date.parse(record.date);
      return Number.isFinite(record.value) && record.value >= 0 && record.value <= 100
        && time >= start.getTime() && time <= now.getTime();
    }).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const first = daily.length ? Date.parse(daily[0].date) : 0;
    const span = daily.length ? Date.parse(daily[daily.length - 1].date) - first : 0;
    return {
      points: daily.map((record) => {
        const date = new Date(record.date);
        return {
          key: `${record.kind}:${record.id}`,
          label: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", ...(span < 60_000 ? { second: "2-digit" } : {}) }),
          title: date.toLocaleString("pt-BR"),
          value: record.value,
          count: 1,
          position: span ? (date.getTime() - first) / span : 0.5,
        };
      }),
      description: "Hoje: cada registro no seu horário, do primeiro ao último registro do dia.",
      rangeLabel: fullDate(start),
    };
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, now.getDate());
  let bucketCount: number;
  let description: string;

  switch (period) {
    case "week":
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      bucketCount = 7;
      description = "Semana atual, de segunda a domingo: média de energia por dia.";
      break;
    case "month":
      start.setDate(1);
      bucketCount = new Date(year, month + 1, 0).getDate();
      description = "Mês atual: média de energia por dia.";
      break;
    case "year":
      start.setMonth(0, 1);
      bucketCount = 12;
      description = "Ano atual: média de energia por mês.";
      break;
  }

  const end = new Date(start);
  if (period === "year") end.setFullYear(year + 1);
  else if (period === "month") end.setMonth(month + 1);
  else end.setDate(end.getDate() + (period === "week" ? 7 : 1));

  const points: EnergyChartPoint[] = Array.from(
    { length: bucketCount },
    (_, index) => {
      const date = new Date(start);
      if (period === "year") date.setMonth(index);
      else date.setDate(start.getDate() + index);

      return {
        key: recordKey(date, period),
        label:
          period === "year"
            ? date.toLocaleDateString("pt-BR", { month: "short" })
            : period === "week"
              ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
              : pad(date.getDate()),
        title:
          period === "year"
            ? date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
            : date.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              }),
        value: null,
        count: 0,
      };
    },
  );
  const bucketByKey = new Map(points.map((point) => [point.key, point]));
  const totals = new Map<string, number>();

  for (const record of records) {
    if (!Number.isFinite(record.value) || record.value < 0 || record.value > 100)
      continue;
    const date = new Date(record.date);
    if (
      !Number.isFinite(date.getTime()) ||
      date < start ||
      date >= end ||
      date > now
    )
      continue;
    const bucket = bucketByKey.get(recordKey(date, period));
    if (!bucket) continue;
    bucket.count++;
    totals.set(bucket.key, (totals.get(bucket.key) ?? 0) + record.value);
  }

  for (const point of points) {
    if (point.count) point.value = totals.get(point.key)! / point.count;
  }

  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  return {
    points,
    description,
    rangeLabel: `${fullDate(start)} a ${fullDate(lastDay)}`,
  };
}
