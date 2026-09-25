import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { rolldown } from 'rolldown';
import { fileURLToPath } from 'node:url';

const originalTimezone = process.env.TZ;
process.env.TZ = 'America/Sao_Paulo';
after(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

const bundle = await rolldown({
  input: fileURLToPath(new URL('../src/lib/energyChart.ts', import.meta.url)),
  platform: 'node',
});
const { output } = await bundle.generate({ format: 'esm' });
await bundle.close();
const { buildEnergyChart } = await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`);

const localDate = (year, month, day, hour = 0, minute = 0, second = 0) =>
  new Date(year, month - 1, day, hour, minute, second);
const record = (date, value) => ({
  id: `${date}-${value}`,
  date: date instanceof Date ? date.toISOString() : date,
  value,
  kind: 'assessment',
});
const observed = chart => chart.points.filter(point => point.value !== null);

test('day preserves every reading in chronological order, including within the same hour', () => {
  const now = localDate(2026, 9, 25, 23, 59, 59);
  const records = [
    record(localDate(2026, 9, 25, 1, 30), 41),
    record(localDate(2026, 9, 25, 1), 0),
    record(localDate(2026, 9, 25, 1, 10), 20),
    record(localDate(2026, 9, 24, 23, 59), 90),
    record(localDate(2026, 9, 26), 90),
  ];
  const original = structuredClone(records);
  const chart = buildEnergyChart(records, 'day', now);
  assert.deepEqual(chart.points.map(point => point.value), [0, 20, 41]);
  assert.deepEqual(chart.points.map(point => point.label), ['01:00', '01:10', '01:30']);
  assert.deepEqual(chart.points.map(point => point.position), [0, 1 / 3, 1]);
  assert.ok(chart.points.every(point => point.count === 1));
  assert.equal(chart.rangeLabel, '25/09/2026');
  assert.match(chart.description, /cada registro/);
  assert.deepEqual(records, original);
});

test('day centers a single reading and distinguishes readings seconds apart', () => {
  const now = localDate(2026, 9, 25, 12);
  const a = record(localDate(2026, 9, 25, 9, 0, 5), 80);
  const b = record(localDate(2026, 9, 25, 9, 0, 45), 60);
  const single = buildEnergyChart([a], 'day', now);
  assert.equal(single.points[0].position, 0.5);
  const chart = buildEnergyChart([b, a], 'day', now);
  assert.deepEqual(chart.points.map(point => point.label), ['09:00:05', '09:00:45']);
  assert.deepEqual(chart.points.map(point => point.position), [0, 1]);
});

test('week starts on Monday, includes Sunday, and can cross a month and year boundary', () => {
  const chart = buildEnergyChart([
    record(localDate(2025, 12, 28, 23, 59), 90),
    record(localDate(2025, 12, 29), 20),
    record(localDate(2026, 1, 1, 12), 40),
    record(localDate(2026, 1, 1, 18), 60),
    record(localDate(2026, 1, 4, 23), 80),
    record(localDate(2026, 1, 5), 90),
  ], 'week', localDate(2026, 1, 4, 23, 59, 59));
  assert.deepEqual(chart.points.map(point => point.label), ['29/12', '30/12', '31/12', '01/01', '02/01', '03/01', '04/01']);
  assert.deepEqual(chart.points.map(point => point.value), [20, null, null, 50, null, null, 80]);
  assert.equal(chart.points[3].count, 2);
  assert.equal(chart.rangeLabel, '29/12/2025 a 04/01/2026');
  assert.match(chart.points[0].title, /segunda-feira/);
  assert.match(chart.points[6].title, /domingo/);
});

test('Monday starts a new week and upcoming days stay empty', () => {
  const chart = buildEnergyChart([
    record(localDate(2026, 9, 20, 23), 10),
    record(localDate(2026, 9, 21, 9), 40),
    record(localDate(2026, 9, 22, 9), 80),
  ], 'week', localDate(2026, 9, 21, 12));
  assert.equal(chart.rangeLabel, '21/09/2026 a 27/09/2026');
  assert.deepEqual(chart.points.map(point => point.value), [40, null, null, null, null, null, null]);
});

test('month creates the correct calendar days, including leap years', () => {
  const chart = buildEnergyChart([
    record(localDate(2024, 1, 31, 23, 59), 90),
    record(localDate(2024, 2, 1), 10),
    record(localDate(2024, 2, 29, 12), 40),
    record(localDate(2024, 2, 29, 18), 60),
    record(localDate(2024, 3, 1), 90),
  ], 'month', localDate(2024, 2, 29, 23, 59, 59));
  assert.equal(chart.points.length, 29);
  assert.equal(chart.points[0].label, '01');
  assert.equal(chart.points[28].label, '29');
  assert.deepEqual(observed(chart).map(point => point.value), [10, 50]);
  assert.equal(chart.rangeLabel, '01/02/2024 a 29/02/2024');
  for (const [year, month, count] of [[2025, 2, 28], [2026, 4, 30], [2026, 1, 31]]) {
    assert.equal(buildEnergyChart([], 'month', localDate(year, month, 15)).points.length, count);
  }
});

test('year has 12 ordered Portuguese months and averages all records in each month', () => {
  const chart = buildEnergyChart([
    record(localDate(2025, 12, 31, 23, 59), 90),
    record(localDate(2026, 1, 1), 10),
    record(localDate(2026, 1, 31, 23), 20),
    record(localDate(2026, 3, 1), 30),
    record(localDate(2026, 3, 4), 31),
    record(localDate(2026, 3, 30), 31),
    record(localDate(2026, 12, 31, 23), 100),
    record(localDate(2027, 1, 1), 90),
  ], 'year', localDate(2026, 12, 31, 23, 59, 59));
  assert.equal(chart.points.length, 12);
  assert.deepEqual(chart.points.map(point => point.label), ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']);
  assert.deepEqual(observed(chart).map(point => point.value), [15, 92 / 3, 100]);
  assert.equal(chart.points[2].count, 3);
  assert.equal(chart.points[1].value, null);
  assert.equal(chart.points[11].title, 'dezembro de 2026');
  assert.equal(chart.rangeLabel, '01/01/2026 a 31/12/2026');
});

test('future timestamps and invalid dates or scores do not enter any period average', () => {
  const now = localDate(2026, 9, 25, 12, 30);
  const records = [
    record(now, 0),
    record(now, 100),
    record(new Date(now.getTime() + 1), 100),
    record(localDate(2026, 9, 25, 13), 100),
    record(localDate(2026, 9, 26), 100),
    record('invalid', 100),
    ...[NaN, Infinity, -Infinity, -1, 101, null, '20'].map(value => record(now, value)),
  ];
  for (const period of ['day', 'week', 'month', 'year']) {
    const chart = buildEnergyChart(records, period, now);
    if (period === 'day') {
      assert.deepEqual(chart.points.map(point => point.value), [0, 100]);
      assert.ok(chart.points.every(point => point.position === 0.5));
    } else {
      assert.equal(observed(chart).length, 1);
      assert.equal(observed(chart)[0].value, 50);
      assert.equal(observed(chart)[0].count, 2);
    }
  }
});

test('ISO timestamps are grouped by local calendar boundaries, not UTC dates', () => {
  const records = [
    record('2026-09-25T02:59:59Z', 10),
    record('2026-09-25T03:00:00Z', 70),
    record('2026-09-26T02:00:00Z', 90),
  ];
  const chart = buildEnergyChart(records, 'day', localDate(2026, 9, 25, 23, 59));
  assert.deepEqual(observed(chart).map(point => [point.label, point.value]), [['00:00', 70], ['23:00', 90]]);
});

test('empty periods contain only null values and distinct chronological keys', () => {
  for (const period of ['day', 'week', 'month', 'year']) {
    const chart = buildEnergyChart([], period, localDate(2026, 9, 25));
    assert.ok(chart.points.every(point => point.value === null && point.count === 0));
    const keys = chart.points.map(point => point.key);
    assert.equal(new Set(keys).size, keys.length);
    assert.deepEqual(keys, [...keys].sort());
  }
});
