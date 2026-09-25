import { Button } from "../../components/ui";

export function LoadingError({ loading, error }: { loading: boolean; error?: string | undefined }) {
  if (loading) return <p role="status">Carregando…</p>;
  if (error) return <p className="form-error" role="alert">{error}</p>;
  return null;
}
export function Pager({ page, pages, change }: { page: number; pages: number; change: (page: number) => void }) {
  return <div className="admin-pager">
    <Button variant="outline" icon={false} disabled={page <= 1} onClick={() => change(page - 1)}>Anterior</Button>
    <span className="small">Página {page} de {pages}</span>
    <Button variant="outline" icon={false} disabled={page >= pages} onClick={() => change(page + 1)}>Próxima</Button>
  </div>;
}
