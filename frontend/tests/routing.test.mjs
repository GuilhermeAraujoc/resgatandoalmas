import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rolldown } from 'rolldown';

const bundle = await rolldown({
  input: new URL('../src/hooks/usePathRoute.ts', import.meta.url).pathname,
  plugins: [{
    name: 'hook-harness',
    resolveId(id) { if (id === 'react') return '\0react'; },
    load(id) {
      if (id === '\0react') return `
        export const useCallback = fn => fn;
        export const useState = init => [init(), value => { globalThis.currentRoute = value; }];
        export const useEffect = fn => { globalThis.effects.push(fn); };
      `;
    },
  }],
});
const { output } = await bundle.generate({ format: 'esm' });
await bundle.close();
const { usePathRoute: runHookHarness } = await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`);

function setup(path) {
  globalThis.effects = [];
  const listeners = {};
  const entries = [];
  globalThis.window = {
    location: new URL(path, 'http://localhost:5173'),
    history: {
      pushState(_, __, url) { entries.push(url); window.location = new URL(url, window.location); },
      replaceState(_, __, url) { window.location = new URL(url, window.location); },
    },
    addEventListener(name, fn) { listeners[name] = fn; },
    removeEventListener() {},
    scrollTo() {},
  };
  globalThis.document = {
    addEventListener(name, fn) { listeners[name] = fn; },
    removeEventListener() {},
  };
  globalThis.Element = class { closest() { return this.link; } };
  const hook = runHookHarness();
  effects.forEach(fn => fn());
  return { hook, listeners, entries };
}

test('direct paths, legacy bookmarks and history navigation', () => {
  let app = setup('/assessment');
  assert.equal(app.hook.route, 'assessment');
  app.hook.navigate('progress');
  assert.equal(window.location.pathname, '/progress');
  assert.equal(currentRoute, 'progress');
  app.hook.navigate('progress');
  assert.equal(app.entries.length, 1);
  window.location = new URL('http://localhost:5173/assessment');
  app.listeners.popstate();
  assert.equal(currentRoute, 'assessment');
  app = setup('/?source=bookmark#assessment');
  assert.equal(app.hook.route, 'assessment');
  assert.equal(window.location.pathname, '/assessment');
  assert.equal(window.location.hash, '');
  assert.equal(window.location.search, '?source=bookmark');
  assert.equal(setup('/').hook.route, 'home');
});

test('internal links navigate without reload; special and external clicks stay native', () => {
  const { listeners, entries } = setup('/home');
  const target = new Element();
  target.link = { href: 'http://localhost:5173/assessment', target: '', hasAttribute: () => false };
  let prevented = false;
  const click = { target, button: 0, preventDefault() { prevented = true; } };
  listeners.click({ ...click, ctrlKey: true });
  assert.equal(prevented, false);
  listeners.click({ ...click, defaultPrevented: true });
  assert.equal(entries.length, 0);
  listeners.click(click);
  assert.equal(prevented, true);
  assert.equal(window.location.pathname, '/assessment');
  target.link.href = 'https://example.com/assessment';
  listeners.click(click);
  target.link.href = 'http://localhost:5173/progress';
  target.link.target = '_blank';
  listeners.click(click);
  assert.equal(entries.length, 1);
});
