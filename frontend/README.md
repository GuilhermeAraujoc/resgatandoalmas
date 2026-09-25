# Frontend — Resgatando Almas

Interface React integrada ao backend Express deste repositório. Perfil, energia,
histórico e progresso vêm da API. Uma conta sem avaliação tem energia e protocolo
nulos: a interface mostra estados vazios, sem atribuir valores fictícios.

## Executar e verificar

Na raiz do projeto: `docker compose up --build`.

No diretório frontend:

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

Login: `http://localhost:5173/login`.

## Navegação

As páginas usam caminhos como `/assessment` e `/progress`, com suporte aos botões
voltar/avançar do navegador. Links antigos como `/#assessment` são convertidos.
O Vite já atende essas rotas ao abrir ou recarregar uma página diretamente.
Em produção, configure o servidor para servir `index.html` nas rotas do frontend
(fallback de SPA), mantendo `/api` e arquivos estáticos em seus destinos próprios.

## API e sessão

O endereço padrão é `/api`, encaminhado pelo proxy do Vite ao backend.
`API_PROXY_TARGET` configura o destino do proxy (padrão `http://localhost:3001`;
no Docker Compose, `http://backend:3001`).

`VITE_API_URL` pode substituir a URL pública da API, conforme `.env.example`.
Nunca coloque credenciais do banco ou segredos nessa variável. Para usar uma origem
diferente, o backend precisa configurar CORS com credenciais; a configuração atual
usa o proxy de mesma origem. Em produção, configure também o proxy `/api`.

A autenticação usa o cookie HttpOnly do backend. Requisições enviam credenciais,
tratam erros HTTP e de rede e têm limite de 15 segundos. Mensagens de sucesso só
aparecem após resposta da API.

## Rotas integradas

| Método e caminho | Dados enviados | Resposta |
| --- | --- | --- |
| `POST /api/auth/register` | `{ name, cpf, email, password, acceptedTerms }` | `{ user }` e cookie |
| `POST /api/auth/login` | `{ email, password, remember }` | `{ user }` e cookie |
| `POST /api/auth/logout` | — | `204` |
| `GET /api/me` | — | `{ user }` |
| `PATCH /api/me` | `{ name, email, cpf, phone, birthDate }` | `{ user }` |
| `DELETE /api/me` | — | `204` |
| `GET /api/me/progress` | — | `ProgressDto` |
| `POST /api/assessments` | `{ answers }` com os enums de energia | `{ assessment }` |
| `POST /api/feedbacks` | `{ activityId, energyLevel, feeling, ease, hadDiscomfort, note }` | `{ feedback }` |

Os formatos completos estão em `src/services/dto.ts`; os módulos em `src/services/`
convertem as opções dos formulários para os enums do backend. Datas de nascimento
usam `YYYY-MM-DD`; o histórico usa datas ISO 8601. O servidor calcula pontuações e
progresso e identifica o usuário pela sessão.

**O contrato final usa `/api/me` e `/api/me/progress`, não `/api/me/state`.**
Essa escolha preserva a integração implementada na main ao unir a branch guilherme.

## Funcionalidades ainda pendentes no backend

Os formulários estão preparados para enviar estas solicitações, mas as rotas ainda
não existem em `backend/src/routes/index.ts`:

- `POST /api/auth/forgot-password`: `{ email }`.
- `POST /api/auth/change-password`: `{ currentPassword, newPassword }`.
- `POST /api/appointments`: `{ date, time, note }`.

Essas operações mostram erro se o servidor não atender; não simulam sucesso.

## Catálogo e administração

Perguntas, exercícios e protocolos vêm de `/api/catalog` e das versões atribuídas
às avaliações. O catálogo local antigo não dirige mais os fluxos dos usuários.
Administradores acessam `/admin` para editar rascunhos, publicar versões e consultar
relatórios. Consulte [ADMIN.md](../ADMIN.md) para operação, permissões e inicialização.

`src/config.tsx` mantém apenas as configurações públicas de apresentação.

`npm test` verifica ausência de dados fictícios, mapeamento do progresso do backend,
limpeza de estado, requisições autenticadas e tratamento de erros com respostas
controladas apenas nos testes.
