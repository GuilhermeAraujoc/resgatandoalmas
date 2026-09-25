import { dateLabel, useAdminData } from "./admin/data";
import { useState, type FormEvent } from "react";
import { useApp } from "../state/AppContext";
import { Button, Card, Field, PageHeader } from "../components/ui";
import type { AdminStats, AuditResponse } from "../services/admin";
import { LoadingError, Pager } from "./admin/shared";
import { AdminUsers } from "./admin/Users";
import { AdminContent } from "./admin/Content";

type Section = "overview" | "users" | "content" | "audit";
export function Admin() {
  const { state } = useApp();
  if (state.role !== "ADMIN") return <Card><h2>Acesso restrito</h2><p>Esta área está disponível apenas para administradores.</p></Card>;
  return <AdminPanel />;
}
function AdminPanel() {
  const [section, setSection] = useState<Section>("overview");
  const [range, setRange] = useState(() => ({
    from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  }));
  const query = new URLSearchParams(range).toString();
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setRange({ from: String(form.get("from")), to: String(form.get("to")) });
  }
  return <>
    <PageHeader title="Administração" subtitle="Gerencie os usuários e o conteúdo publicado no acompanhamento." />
    <nav className="tabs" aria-label="Seções administrativas">
      {([["overview", "Visão geral"], ["users", "Usuários e relatórios"], ["content", "Perguntas, exercícios e protocolos"], ["audit", "Auditoria"]] as const).map(([key, label]) =>
        <button type="button" key={key} className={section === key ? "active" : ""} aria-current={section === key ? "page" : undefined} onClick={() => setSection(key)}>{label}</button>)}
    </nav>
    {(section === "overview" || section === "users") && <form className="admin-toolbar" onSubmit={filter}>
      <Field label="De"><input name="from" type="date" defaultValue={range.from} required /></Field>
      <Field label="Até"><input name="to" type="date" defaultValue={range.to} required /></Field>
      <Button type="submit" icon={false}>Aplicar período</Button>
      <span className="small muted">Relatórios por data UTC · até 366 dias</span>
    </form>}
    {section === "overview" && <Overview query={query} />}
    {section === "users" && <AdminUsers query={query} />}
    <div hidden={section !== "content"}><AdminContent /></div>
    {section === "audit" && <Audit />}
  </>;
}
function Overview({ query }: { query: string }) {
  const { data, loading, error } = useAdminData<AdminStats>(`/stats?${query}`);
  return <><LoadingError loading={loading} error={error} />{data && <>
    <div className="grid four">
      {[["Total de usuários", data.totalUsers], ["Contas bloqueadas", data.blockedUsers], ["Novos cadastros", data.newUsers], ["Usuários ativos", data.activeUsers], ["Avaliações", data.assessments], ["Exercícios concluídos", data.completed], ["Feedbacks com desconforto", data.discomfort], ["Energia média relatada", data.averageEnergy?.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) ?? "Sem registros"]].map(([label, value]) =>
        <Card className="stat" key={label}><span className="eyebrow">{label}</span><strong>{value}</strong></Card>)}
    </div>
    <p className="small muted" style={{ marginTop: 18 }}>Ativos: usuários com avaliação ou exercício no período. Total e bloqueios refletem o cadastro atual. Contas administrativas não entram nas estatísticas. A energia média é ilustrativa, sem finalidade diagnóstica.</p>
  </>}</>;
}
const auditLabels: Record<string, string> = {
  USER_UPDATED: "Cadastro alterado", USER_DELETED: "Conta excluída", USER_REPORT_VIEWED: "Relatório consultado", USER_REPORT_EXPORTED: "Relatório exportado",
  CONTENT_DRAFT_SAVED: "Rascunho salvo", CONTENT_PUBLISHED: "Conteúdo publicado", ADMIN_BOOTSTRAPPED: "Administrador configurado",
};
function Audit() {
  const [page, setPage] = useState(1);
  const result = useAdminData<AuditResponse>(`/audit?page=${page}`);
  return <Card><h2>Registro de acessos e alterações</h2><LoadingError {...result} />{result.data && <>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Quando</th><th>Ação</th><th>Administrador (ID)</th><th>Registro (ID)</th><th>Motivo / campos</th></tr></thead><tbody>
      {result.data.entries.map(entry => <tr key={entry.id}><td>{dateLabel(entry.createdAt)}</td><td>{auditLabels[entry.action] ?? entry.action}</td><td>{entry.actorId}</td><td>{entry.targetId ?? "—"}</td><td>{entry.reason}<br />{entry.fields.join(", ")}</td></tr>)}
    </tbody></table></div>
    {!result.data.entries.length && <p>Nenhuma alteração registrada.</p>}
    <Pager page={page} pages={result.data.pages} change={setPage} />
  </>}</Card>;
}
