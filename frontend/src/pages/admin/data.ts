import { useEffect, useState } from "react";
import { adminRequest } from "../../services/admin";
import { errorMessage } from "../../services/api";
export function useAdminData<T>(path: string, revision = 0) {
  const key = `${path}:${revision}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string }>({ key: "" });
  useEffect(() => {
    let active = true;
    adminRequest<T>("GET", path).then(data => {
      if (active) setResult({ key, data });
    }).catch(error => { if (active) setResult({ key, error: errorMessage(error) }); });
    return () => { active = false; };
  }, [path, key]);
  return { loading: result.key !== key, data: result.key === key ? result.data : undefined, error: result.key === key ? result.error : undefined };
}

export const dateLabel = (value: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "—";
