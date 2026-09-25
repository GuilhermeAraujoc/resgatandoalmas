import { dateLabel, useAdminData } from "./data";
import { useState, type FormEvent } from "react";
import { Button, Card, EnergyChart, Field } from "../../components/ui";
import { adminRequest, downloadReport, type AdminUser, type UserList, type UserReport } from "../../services/admin";
import { errorMessage } from "../../services/api";
import { LoadingError, Pager } from "./shared";

export function AdminUsers({ query }: { query: string }) {
  const [filter, setFilter] = useState({ q: "", status: "all", page: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const search = new URLSearchParams({ q: filter.q, status: filter.status, page: String(filter.page) });
  const result = useAdminData<UserList>(`/users?${search}`, revision);
  if (selected) return <UserDetail key={selected} id={selected} query={query} close={() => { setSelected(null); setRevision(value => value + 1); }} />;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFilter({ q: String(data.get("q") ?? ""), status: String(data.get("status")), page: 1 });
  }
  return <Card><h2>Usuários</h2>
    <form className="admin-toolbar" onSubmit={submit}>
      <Field label="Nome ou e-mail"><input name="q" type="search" maxLength={120} defaultValue={filter.q} /></Field>
      <Field label="Situação"><select name="status" defaultValue={filter.status}><option value="all">Todas</option><option value="active">Ativos</option><option value="blocked">Bloqueados</option></select></Field>
      <Button type="submit" icon={false}>Buscar</Button>
    </form>
    <LoadingError {...result} />{result.data && <>
      <p className="small muted">{result.data.total} usuários encontrados. A busca considera todos os cadastros.</p>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Situação</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>
        {result.data.users.map(user => <tr key={user.id}><td>{user.name}{user.role === "ADMIN" && <small> · Administrador</small>}</td><td>{user.email}</td><td>{user.blockedAt ? "Bloqueado" : "Ativo"}</td><td>{dateLabel(user.createdAt)}</td><td><Button variant="outline" icon={false} onClick={() => setSelected(user.id)}>Abrir relatório</Button></td></tr>)}
      </tbody></table></div>
      {!result.data.users.length && <p>Nenhum usuário encontrado.</p>}
      <Pager page={filter.page} pages={result.data.pages} change={page => setFilter(value => ({ ...value, page }))} />
    </>}
  </Card>;
}
function UserDetail({ id, query, close }: { id: string; query: string; close: () => void }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const result = useAdminData<UserReport>(`/users/${id}/report?${query}&page=${page}`, revision);
  return <div className="stack">
    <div className="between admin-wrap"><Button variant="outline" icon={false} onClick={close}>Voltar aos usuários</Button>
      <Button icon={false} disabled={exporting || !result.data} onClick={async () => { setExporting(true); setError(""); try { await downloadReport(id, query); } catch (failure) { setError(errorMessage(failure)); } finally { setExporting(false); } }}>{exporting ? "Exportando…" : "Exportar período em CSV"}</Button>
    </div>
    <LoadingError {...result} />{error && <p className="form-error" role="alert">{error}</p>}
    {result.data && <>
      <UserEditor key={`${id}:${result.data.user.updatedAt}`} user={result.data.user} saved={() => setRevision(value => value + 1)} deleted={close} />
      <Card><h2>Evolução de {result.data.user.name}</h2><p className="small muted">Médias diárias de avaliações e feedbacks no período selecionado (UTC).</p>
        {result.data.historyTruncated && <p role="status">Volume alto: gráfico limitado aos 5000 registros mais recentes de cada tipo. Reduza o período.</p>}
        <EnergyChart records={result.data.energyHistory} allRecords />
      </Card>
      <Card><h2>Avaliações ({result.data.counts.assessments})</h2>
        {!result.data.assessments.length && <p className="muted">Nenhuma avaliação nesta página do período.</p>}
        {result.data.assessments.map(item => <details key={item.id} className="admin-record"><summary>{dateLabel(item.createdAt)} · Energia {item.energyScore} · {item.protocol?.name ?? item.scenario} · Versão {item.version ?? "legada"}</summary>
          <h3>Respostas registradas</h3><ul>{item.answerSnapshot?.map((answer, i) => <li key={i}>{answer.question} <strong>{answer.label}</strong> ({answer.score ?? "—"})</li>)}</ul>
          <h3>Protocolo indicado na avaliação</h3><ol>{item.protocol?.exercises.map((name, i) => <li key={i}>{name}</li>)}</ol>
        </details>)}
      </Card>
      <Card><h2>Exercícios realizados ({result.data.counts.activities})</h2>
        {!result.data.activities.length && <p className="muted">Nenhum exercício nesta página do período.</p>}
        {result.data.activities.map(item => <details key={item.id} className="admin-record"><summary>{dateLabel(item.completedAt)} · {item.name} · Versão {item.version ?? "legada"}</summary><p>{item.snapshot?.desc}</p><ol>{item.snapshot?.steps?.map((step, i) => <li key={i}>{step}</li>)}</ol></details>)}
      </Card>
      <Card><h2>Feedbacks ({result.data.counts.feedbacks})</h2>
        {!result.data.feedbacks.length && <p className="muted">Nenhum feedback nesta página do período.</p>}
        {result.data.feedbacks.map(item => <div key={item.id} className="admin-record"><h3>{item.activityName}</h3><p className="small">{dateLabel(item.createdAt)} · Energia: {item.energyBefore ?? "Sem registro"} → {item.after}</p><p className="small">Sensação: {item.feeling.replaceAll("_", " ").toLowerCase()} · Facilidade: {item.ease.replaceAll("_", " ").toLowerCase()} · Desconforto: {item.hadDiscomfort ? "Sim" : "Não"}</p>{item.note && <p>{item.note}</p>}</div>)}
      </Card>
      <p className="small muted">As listas são paginadas em 25 registros de cada tipo. O gráfico e a exportação usam o período inteiro. Avaliações e feedbacks são somente leitura.</p>
      <Pager page={page} pages={result.data.pages} change={setPage} />
    </>}
  </div>;
}
function UserEditor({ user, saved, deleted }: { user: AdminUser; saved: () => void; deleted: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const protectedAccount = user.role === "ADMIN";
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      await adminRequest("PATCH", `/users/${user.id}`, { name: data.get("name"), email: data.get("email"), cpf: data.get("cpf"), phone: data.get("phone"), birthDate: data.get("birthDate"), blocked: data.get("blocked") === "on", reason: data.get("reason"), updatedAt: user.updatedAt });
      setMessage("Cadastro atualizado."); saved();
    } catch (failure) { setError(errorMessage(failure)); } finally { setPending(false); }
  }
  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = event.currentTarget; const data = new FormData(form);
    try {
      await adminRequest("DELETE", `/users/${user.id}`, { confirmation: data.get("confirmation"), currentPassword: data.get("currentPassword"), reason: data.get("reason"), updatedAt: user.updatedAt });
      deleted();
    } catch (failure) { setError(errorMessage(failure)); } finally { setPending(false); (form.elements.namedItem("currentPassword") as HTMLInputElement).value = ""; }
  }
  return <Card><h2>Dados cadastrais</h2><p className="small muted">{user.name} · {user.email}</p>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {protectedAccount ? <p>Esta é uma conta administrativa. Alterações de acesso são realizadas pelo operador do sistema.</p> : <>
      <form className="form" onSubmit={save}>
        <div className="grid two">
          <Field label="Nome"><input name="name" defaultValue={user.name} required maxLength={120} /></Field>
          <Field label="E-mail"><input name="email" type="email" defaultValue={user.email} required maxLength={254} /></Field>
          <Field label="CPF"><input name="cpf" defaultValue={user.cpf ?? ""} required inputMode="numeric" /></Field>
          <Field label="Telefone"><input name="phone" type="tel" defaultValue={user.phone ?? ""} /></Field>
          <Field label="Nascimento"><input name="birthDate" type="date" defaultValue={user.birthDate?.slice(0, 10) ?? ""} /></Field>
        </div>
        <label className="check"><input name="blocked" type="checkbox" defaultChecked={Boolean(user.blockedAt)} />Bloquear acesso e encerrar as sessões deste usuário</label>
        <Field label="Motivo da alteração"><textarea name="reason" required minLength={5} maxLength={300} /></Field>
        <Button type="submit" icon={false} disabled={pending}>{pending ? "Aguarde…" : "Salvar cadastro"}</Button>
      </form>
      <details className="admin-danger"><summary>Excluir conta permanentemente</summary>
        <p>A exclusão remove o cadastro, as avaliações, os exercícios realizados e os feedbacks de <strong>{user.email}</strong>. A ação não pode ser desfeita. Para suspender o acesso sem perder o histórico, use o bloqueio acima.</p>
        <form className="form" onSubmit={remove}>
          <Field label="Motivo da exclusão"><textarea name="reason" required minLength={5} maxLength={300} /></Field>
          <Field label="Digite EXCLUIR para confirmar"><input name="confirmation" required pattern="EXCLUIR" autoComplete="off" /></Field>
          <Field label="Sua senha de administrador"><input name="currentPassword" type="password" autoComplete="current-password" required /></Field>
          <Button variant="danger" type="submit" icon={false} disabled={pending}>Excluir permanentemente {user.name}</Button>
        </form>
      </details>
    </>}
  </Card>;
}
