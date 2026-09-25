import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rolldown } from 'rolldown';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chartPath = fileURLToPath(new URL('../src/components/ui.tsx', import.meta.url));
const bundle = await rolldown({
  input: 'chart-render-test',
  platform: 'node',
  transform: { jsx: 'react-jsx' },
  plugins: [{
    name: 'chart-render-test',
    resolveId(id) { if (id === 'chart-render-test') return id; },
    load(id) {
      if (id === 'chart-render-test') return `
        import { createElement } from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import { EnergyChart } from ${JSON.stringify(chartPath)};
        export const render = props => renderToStaticMarkup(createElement(EnergyChart, props));
      `;
    },
  }],
});
const { output } = await bundle.generate({ format: 'esm' });
await bundle.close();
const temporary = await mkdtemp(join(tmpdir(), 'energy-chart-test-'));
let render;
try {
  const entry = join(temporary, 'chart.mjs');
  await writeFile(entry, output[0].code);
  ({ render } = await import(pathToFileURL(entry).href));
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const record = (id, date, value) => ({ id, date: date.toISOString(), value, kind: 'assessment' });

test('year chart averages monthly records and leaves missing months disconnected', () => {
  // Freeze the calendar so results do not depend on the month tests run in.
  const OriginalDate = globalThis.Date;
  globalThis.Date = class extends OriginalDate {
    constructor(...args) { super(...(args.length ? args : [2026, 11, 20, 12])); }
  };
  try {
    const html = render({ period: 'year', records: [
      record('a', new Date(2026, 0, 10), 20),
      record('b', new Date(2026, 0, 20), 80),
      record('c', new Date(2026, 1, 10), 0),
      record('d', new Date(2026, 3, 10), 100),
    ] });
    assert.equal((html.match(/<circle /g) ?? []).length, 3);
    assert.equal((html.match(/<polyline /g) ?? []).length, 1);
    assert.equal((html.match(/<polygon /g) ?? []).length, 1);
    assert.match(html, /média 50 \(2 registros\)/);
    assert.match(html, /cy="220"/); // A measured zero is a real point.
    assert.doesNotMatch(html, /NaN|undefined/);
  } finally {
    globalThis.Date = OriginalDate;
  }
});

test('empty and single-point periods render without fabricated lines', () => {
  const empty = render({ period: 'day', records: [] });
  assert.match(empty, /Nenhum registro neste período/);
  assert.doesNotMatch(empty, /<polyline/);
  const single = render({ period: 'day', records: [record('a', new Date(), 50)] });
  assert.equal((single.match(/<circle /g) ?? []).length, 1);
  assert.match(single, /Há apenas um registro/);
  assert.match(single, /cx="326"/);
  assert.doesNotMatch(single, /<polyline|<polygon|NaN/);
});

test('shared chart keeps the latest seven entries when no period is selected', () => {
  const html = render({ records: Array.from({ length: 10 }, (_, i) =>
    record(String(i), new Date(2026, 0, i + 1), i * 10)) });
  assert.equal((html.match(/<circle /g) ?? []).length, 7);
  assert.match(html, /Histórico dos últimos registros/);
});


test('daily readings within an hour draw a line and shaded area instead of one average dot', () => {
  const OriginalDate = globalThis.Date;
  globalThis.Date = class extends OriginalDate {
    constructor(...args) { super(...(args.length ? args : [2026, 8, 25, 12])); }
  };
  try {
    const html = render({ period: 'day', records: [
      record('a', new Date(2026, 8, 25, 0, 5), 50),
      record('b', new Date(2026, 8, 25, 0, 15), 80),
      record('c', new Date(2026, 8, 25, 0, 55), 60),
    ] });
    assert.equal((html.match(/<circle /g) ?? []).length, 3);
    assert.equal((html.match(/<polyline /g) ?? []).length, 1);
    assert.equal((html.match(/<polygon /g) ?? []).length, 1);
    assert.match(html, /00:05/);
    assert.match(html, /00:55/);
    assert.match(html, /viewBox="0 0 640 260"/);
    assert.doesNotMatch(html, /média|NaN|undefined/);
  } finally {
    globalThis.Date = OriginalDate;
  }
});
