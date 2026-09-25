import { dateLabel, useAdminData } from "./data";
import { useEffect, useState } from "react";
import { Button, Card, Field } from "../../components/ui";
import { adminRequest, type ContentDraft, type ContentResponse } from "../../services/admin";
import { errorMessage } from "../../services/api";
import type { CatalogData, Scenario } from "../../types";
import { LoadingError } from "./shared";

type EditorTab = "questions" | "exercises" | "protocols";
const labels = ["Muito baixo", "Baixo", "Médio", "Alto", "Muito alto"];
function move<T>(items: T[], index: number, offset: number) {
  const next = [...items]; const target = index + offset;
  if (target >= 0 && target < items.length) [next[index], next[target]] = [next[target], next[index]];
  return next;
}
function OrderButtons({ index, length, change, name }: { index: number; length: number; change: (offset: number) => void; name: string }) {
  return <span className="admin-order">
    <Button variant="outline" icon={false} type="button" disabled={index === 0} onClick={() => change(-1)} aria-label={`Mover ${name} para cima`}>↑</Button>
    <Button variant="outline" icon={false} type="button" disabled={index === length - 1} onClick={() => change(1)} aria-label={`Mover ${name} para baixo`}>↓</Button>
  </span>;
}
export function AdminContent() {
  const [reload, setReload] = useState(0);
  const result = useAdminData<ContentResponse>("/content", reload);
  return <><LoadingError {...result} />{result.data?.draft ?
    <ContentEditor key={result.data.draft.revision} initial={result.data.draft} releases={result.data.releases} reload={() => setReload(value => value + 1)} />
    : !result.loading && !result.error && <Card>Catálogo não inicializado. Execute o seed do backend.</Card>}</>;
}
function ContentEditor({ initial, releases, reload }: { initial: ContentDraft; releases: ContentResponse["releases"]; reload: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [tab, setTab] = useState<EditorTab>("questions");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const data = draft.data;
  function edit(update: (data: CatalogData) => CatalogData) {
    setDraft(value => ({ ...value, data: update(value.data) })); setDirty(true); setConfirmed(false); setMessage("");
  }
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const leave = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link && !event.ctrlKey && !event.metaKey && link.getAttribute("target") !== "_blank" && !window.confirm("Há alterações de conteúdo não salvas. Deseja sair e descartá-las?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", leave, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", leave, true); };
  }, [dirty]);
  async function save() {
    setPending(true); setError("");
    try { const saved = await adminRequest<{ draft: ContentDraft }>("PATCH", "/content", { revision: draft.revision, data }); setDraft(saved.draft); setDirty(false); setMessage("Rascunho salvo. As alterações ainda não estão publicadas."); }
    catch (failure) { setError(errorMessage(failure)); } finally { setPending(false); }
  }
  async function publish() {
    if (dirty || !confirmed) return;
    setPending(true); setError("");
    try { await adminRequest("POST", "/content/publish", { revision: draft.revision }); reload(); }
    catch (failure) { setError(errorMessage(failure)); } finally { setPending(false); }
  }
  return <div className="stack">
    <Card><div className="between admin-wrap"><div><h2>Catálogo de conteúdo</h2><p className="small muted">Rascunho {draft.revision} · {dirty ? "Alterações não salvas" : "Salvo"} · Última versão publicada: {releases[0]?.version ?? "—"}</p></div>
      <Button type="button" icon={false} disabled={pending || !dirty} onClick={() => void save()}>{pending ? "Aguarde…" : "Salvar rascunho"}</Button></div>
      <p className="small muted">As versões publicadas são preservadas. Novas avaliações usam o conteúdo publicado; protocolos já atribuídos mantêm sua versão.</p>
      {error && <p className="form-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    </Card>
    <nav className="tabs" aria-label="Editar conteúdo">
      {([["questions", "Perguntas"], ["exercises", "Exercícios"], ["protocols", "Protocolos"]] as const).map(([key, label]) => <button type="button" className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key)}>{label}</button>)}
    </nav>
    <fieldset className="admin-editor" disabled={pending}>
      {tab === "questions" && <Card><div className="between admin-wrap"><h2>Perguntas ({data.questions.length})</h2><Button icon={false} disabled={data.questions.length >= 100} onClick={() => edit(value => ({ ...value, questions: [...value.questions, { id: crypto.randomUUID(), text: "Nova pergunta", topic: "Bem-estar", active: false, options: labels.map((label, i) => ({ label, score: i * 25, active: true })) }] }))}>Adicionar pergunta</Button></div>
        {data.questions.map((question, index) => <details className="admin-record" key={question.id}>
          <summary>{index + 1}. {question.text} · {question.active ? "Ativa" : "Inativa"}</summary>
          <div className="between"><label className="check"><input type="checkbox" checked={question.active} onChange={event => edit(value => ({ ...value, questions: value.questions.map(item => item.id === question.id ? { ...item, active: event.target.checked } : item) }))} />Pergunta ativa</label><OrderButtons name={`pergunta ${index + 1}`} index={index} length={data.questions.length} change={offset => edit(value => ({ ...value, questions: move(value.questions, index, offset) }))} /></div>
          <Field label="Pergunta"><textarea maxLength={500} value={question.text} onChange={event => edit(value => ({ ...value, questions: value.questions.map(item => item.id === question.id ? { ...item, text: event.target.value } : item) }))} /></Field>
          <Field label="Tema"><input maxLength={80} value={question.topic} onChange={event => edit(value => ({ ...value, questions: value.questions.map(item => item.id === question.id ? { ...item, topic: event.target.value } : item) }))} /></Field>
          <h3>Alternativas e pontuação (0 a 100)</h3>
          {question.options.map((option, optionIndex) => <div className="admin-option" key={optionIndex}>
            <Field label={`Alternativa ${optionIndex + 1}`}><input maxLength={120} value={option.label} onChange={event => edit(value => ({ ...value, questions: value.questions.map(item => item.id === question.id ? { ...item, options: item.options.map((entry, i) => i === optionIndex ? { ...entry, label: event.target.value } : entry) } : item) }))} /></Field>
            <Field label="Pontos"><input type="number" min={0} max={100} value={option.score} onChange={event => edit(value => ({ ...value, questions: value.questions.map(item => item.id === question.id ? { ...item, options: item.options.map((entry, i) => i === optionIndex ? { ...entry, score: Number(event.target.value) } : entry) } : item) }))} /></Field>
            <label className="check"><input type="checkbox" checked={option.active} onChange={event => edit(value => ({ ...value, questions: value.questions.map(item => item.id === question.id ? { ...item, options: item.options.map((entry, i) => i === optionIndex ? { ...entry, active: event.target.checked } : entry) } : item) }))} />Ativa</label>
            <OrderButtons name={`alternativa ${optionIndex + 1}`} index={optionIndex} length={question.options.length} change={offset => edit(value => ({ ...value, questions: value.questions.map(item => item.id === question.id ? { ...item, options: move(item.options, optionIndex, offset) } : item) }))} />
          </div>)}
          <Button variant="outline" icon={false} disabled={question.options.length >= 8} onClick={() => edit(value => ({ ...value, questions: value.questions.map(item => item.id === question.id ? { ...item, options: [...item.options, { label: "Nova alternativa", score: 50, active: false }] } : item) }))}>Adicionar alternativa</Button>
        </details>)}
      </Card>}
      {tab === "exercises" && <Card><div className="between admin-wrap"><h2>Exercícios ({data.exercises.length})</h2><Button icon={false} disabled={data.exercises.length >= 200} onClick={() => edit(value => ({ ...value, exercises: [...value.exercises, { id: crypto.randomUUID(), name: "Novo exercício", cat: "Bem-estar", desc: "Descreva o objetivo do exercício.", time: 5, steps: ["Descreva a primeira instrução."], icon: "activity", art: "green", videoId: "", active: false }] }))}>Adicionar exercício</Button></div>
        {data.exercises.map(exercise => {
          const update = (patch: Partial<typeof exercise>) => edit(value => ({ ...value, exercises: value.exercises.map(item => item.id === exercise.id ? { ...item, ...patch } : item) }));
          return <details className="admin-record" key={exercise.id}><summary>{exercise.name} · {exercise.active ? "Ativo" : "Arquivado / rascunho"}</summary>
            <label className="check"><input type="checkbox" checked={exercise.active} onChange={event => update({ active: event.target.checked })} />Exercício ativo</label>
            <div className="grid two"><Field label="Título"><input maxLength={120} value={exercise.name} onChange={event => update({ name: event.target.value })} /></Field><Field label="Categoria"><input maxLength={80} value={exercise.cat} onChange={event => update({ cat: event.target.value })} /></Field>
              <Field label="Duração em minutos"><input type="number" min={1} max={180} value={exercise.time} onChange={event => update({ time: Number(event.target.value) })} /></Field>
              <Field label="Link do vídeo do YouTube (opcional)"><input maxLength={2048} placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..." value={exercise.videoId} onChange={event => update({ videoId: event.target.value })} /></Field>
              <p className="small muted">Aceita links completos, curtos, Shorts ou o ID do vídeo. Ao salvar, apenas o ID é armazenado.</p>
              <Field label="Ícone"><select value={exercise.icon} onChange={event => update({ icon: event.target.value })}>{["wind", "activity", "sun", "leaf", "flower", "heart", "spark"].map(icon => <option key={icon}>{icon}</option>)}</select></Field>
              <Field label="Cor"><select value={exercise.art} onChange={event => update({ art: event.target.value })}><option value="">Lilás</option><option value="green">Verde</option><option value="orange">Laranja</option><option value="rose">Rosa</option></select></Field>
            </div>
            <Field label="Descrição"><textarea maxLength={1500} value={exercise.desc} onChange={event => update({ desc: event.target.value })} /></Field>
            <Field label="Instruções (uma por linha)"><textarea rows={5} value={exercise.steps.join("\n")} onChange={event => update({ steps: event.target.value.split("\n") })} /></Field>
            <p className="small muted">Para incluir em um protocolo, use a aba Protocolos. Ao arquivar, retire-o das sequências antes de publicar. Conclusões antigas permanecem intactas.</p>
          </details>;
        })}
      </Card>}
      {tab === "protocols" && <Card><h2>Protocolos e indicação</h2>
        <Field label="Indicar o protocolo de serenidade quando a energia for maior que"><input type="number" min={0} max={99} value={data.calmAbove} onChange={event => edit(value => ({ ...value, calmAbove: Number(event.target.value) }))} /></Field>
        <p className="small muted">A energia é a média das pontuações das respostas, arredondada de 0 a 100. Até {data.calmAbove}: {data.protocols.vitality.name}. Acima: {data.protocols.calm.name}.</p>
        {(["vitality", "calm"] as Scenario[]).map(key => {
          const protocol = data.protocols[key];
          const update = (patch: Partial<typeof protocol>) => edit(value => ({ ...value, protocols: { ...value.protocols, [key]: { ...value.protocols[key], ...patch } } }));
          return <section key={key} className="admin-record"><h3>{key === "calm" ? "Energia acima do limite" : "Energia até o limite"}</h3>
            <Field label="Nome"><input maxLength={120} value={protocol.name} onChange={event => update({ name: event.target.value })} /></Field>
            <Field label="Objetivo"><textarea maxLength={1500} value={protocol.description} onChange={event => update({ description: event.target.value })} /></Field>
            <ol className="admin-protocol-list">{protocol.exerciseIds.map((id, index) => <li key={id}><span>{data.exercises.find(exercise => exercise.id === id)?.name ?? id}{!data.exercises.find(exercise => exercise.id === id)?.active && " (inativo)"}</span>
              <OrderButtons name={`exercício ${index + 1}`} index={index} length={protocol.exerciseIds.length} change={offset => update({ exerciseIds: move(protocol.exerciseIds, index, offset) })} />
              <Button variant="outline" icon={false} onClick={() => update({ exerciseIds: protocol.exerciseIds.filter(value => value !== id) })}>Retirar</Button>
            </li>)}</ol>
            <Field label="Adicionar exercício ao final"><select value="" onChange={event => { if (event.target.value) update({ exerciseIds: [...protocol.exerciseIds, event.target.value] }); }}><option value="">Selecione um exercício</option>{data.exercises.filter(exercise => exercise.active && !protocol.exerciseIds.includes(exercise.id)).map(exercise => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></Field>
          </section>;
        })}
      </Card>}
    </fieldset>
    <Card><h2>Publicar conteúdo revisado</h2><p>{data.questions.filter(item => item.active).length} perguntas ativas · {data.exercises.filter(item => item.active).length} exercícios ativos · 2 protocolos</p>
      <p className="small muted">A publicação disponibiliza o rascunho salvo para novas avaliações. Versões anteriores e históricos continuam preservados.</p>
      <label className="check"><input type="checkbox" checked={confirmed} disabled={dirty || pending} onChange={event => setConfirmed(event.target.checked)} />Revisei as perguntas, pontuações, exercícios e protocolos desta versão.</label>
      <Button icon={false} disabled={dirty || !confirmed || pending} onClick={() => void publish()}>Publicar nova versão</Button>
      {dirty && <p className="small muted">Salve o rascunho antes de publicar.</p>}
      <details className="admin-record"><summary>Últimas versões publicadas</summary><ul>{releases.map(release => <li key={release.id}>Versão {release.version} · {dateLabel(release.createdAt)}</li>)}</ul></details>
    </Card>
  </div>;
}
