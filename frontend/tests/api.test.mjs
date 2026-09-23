import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { rolldown } from 'rolldown';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
const bundle = await rolldown({
  input: 'test-entry',
  platform: 'node',
  plugins: [{
    name: 'test-entry',
    resolveId(id) { if (id === 'test-entry') return id; },
    load(id) {
      if (id === 'test-entry') return `export * as api from ${JSON.stringify(sourceRoot + 'services/api.ts')}; export * as model from ${JSON.stringify(sourceRoot + 'state/model.ts')};`;
    },
  }],
});
const { output } = await bundle.generate({ format: 'esm' });
await bundle.close();
const { api, model } = await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`);
const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

test('new users have no fabricated profile, scores, protocol or history', () => {
  const state = model.initialState();
  assert.equal(state.profile.name, '');
  assert.equal(state.energy, null);
  assert.equal(state.scenario, null);
  assert.deepEqual(state.history, []);
  assert.deepEqual(state.completed, []);
  assert.deepEqual(model.protocolItems(null), []);
  assert.equal(model.energyLabel(null), 'Sem avaliação');
  assert.notEqual(model.energyLabel(0), 'Sem avaliação');
});

test('backend progress preserves missing evaluations and real scores', () => {
  const progress = {
    currentEnergy: null, scenario: null, completedActivityIds: [],
    history: [], weeklyEnergy: Array(7).fill(null),
    summary: { totalCompleted: 0, completedThisWeek: 0, activeDaysThisWeek: Array(7).fill(false), streakDays: 0 },
  };
  const empty = model.reducer(model.initialState(), { type: 'progress', progress });
  assert.equal(empty.energy, null);
  assert.equal(empty.scenario, null);
  assert.equal(empty.currentExerciseId, '');
  const saved = model.reducer(empty, { type: 'progress', progress: { ...progress, currentEnergy: 0, scenario: 'VITALITY' } });
  assert.equal(saved.energy, 0);
  assert.equal(saved.scenario, 'vitality');
  assert.equal(saved.currentExerciseId, 'exercises-0');
  const profile = model.profileFromUser({ name: 'Teste', email: 'test@example.com', cpf: '', phone: null, birthDate: null });
  assert.equal(profile.phone, '');
  assert.equal(profile.birth, '');
});

test('reset clears previous user data; drafts do not invent saved results', () => {
  const state = { ...model.initialState(), profile: { name: 'Usuário de teste', email: 'test@example.com', phone: '', birth: '' }, energy: 80 };
  assert.deepEqual(model.reducer(state, { type: 'reset' }), model.initialState());
  const draft = model.reducer(model.initialState(), { type: 'answer', index: 0, value: 4 });
  assert.equal(draft.answers[0], 4);
  assert.equal(draft.energy, null);
  assert.deepEqual(draft.history, []);
});

test('API sends credentials and JSON; supports 204 without parsing JSON', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/auth/login');
    assert.equal(options.credentials, 'include');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { email: 'test@example.com' });
    return new Response(null, { status: 204 });
  };
  assert.equal(await api.request('POST', '/auth/login', { email: 'test@example.com' }), undefined);
});

test('API fails explicitly on unauthorized, unavailable, invalid JSON and network errors', async () => {
  for (const status of [401, 404, 500]) {
    globalThis.fetch = async () => new Response('', { status });
    await assert.rejects(api.request('GET', '/me'), error => error.status === status);
  }
  globalThis.fetch = async () => new Response('<html>');
  await assert.rejects(api.request('GET', '/me'), /resposta inválida/);
  globalThis.fetch = async () => { throw new TypeError('network'); };
  await assert.rejects(api.request('GET', '/me'), error => error.status === 0);
});
