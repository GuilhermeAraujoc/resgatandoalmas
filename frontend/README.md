# Frontend — Resgatando Almas

Interface React preparada para consumir uma API. Não há usuário, histórico ou
progresso de demonstração. O backend atual ainda precisa implementar as rotas abaixo;
a rota existente `GET /api` sozinha não atende este contrato.

## Executar

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

O login fica em `http://localhost:5173/#login`.

## Endereço e sessão

Crie `frontend/.env.local` com:

```dotenv
VITE_API_URL=http://localhost:3001/api
```

Esse é também o endereço padrão. Reinicie o Vite ao alterar a variável.
Ela é pública: não coloque senha de banco ou segredos no frontend.

A API deve autenticar por cookie de sessão HttpOnly. Todas as requisições usam
`credentials: include`. Para desenvolvimento com portas distintas, o backend
precisa responder ao preflight OPTIONS e permitir a origem exata
`http://localhost:5173`, credenciais, Content-Type e os métodos usados abaixo.
Em produção, configure as origens e o cookie para HTTPS, com proteção CSRF nas
operações de escrita. O servidor deve identificar o usuário pela sessão e conferir
a autorização de cada operação; esconder telas no frontend não substitui isso.

`401` representa sessão ausente/expirada ou credenciais inválidas. `404` apresenta
serviço indisponível. Erros de rede, JSON inválido e falhas do servidor não usam dados
fictícios como alternativa. As requisições têm limite de 15 segundos.

## Contrato da API

Os caminhos abaixo são relativos a `/api`. São requisitos de integração; não são
rotas já implementadas neste repositório.

| Método e caminho | Corpo enviado | Resposta de sucesso |
| --- | --- | --- |
| `GET /me/state` | — | `UserSnapshot` abaixo |
| `POST /auth/login` | `{ email, password }` | `204`, criando cookie de sessão |
| `POST /auth/register` | `{ name, cpf, email, password }` | `204`, criando conta e sessão |
| `POST /auth/logout` | — | `204`, invalidando sessão |
| `PATCH /me` | `{ name, email, phone, birth }` | Perfil atualizado com os mesmos quatro campos |
| `POST /assessments` | `{ answers: number[] }` | `UserSnapshot` atualizado |
| `POST /feedbacks` | `{ exerciseId, energy, feeling, ease, pain, note }` | `UserSnapshot` atualizado |
| `POST /auth/forgot-password` | `{ email }` | `204` com resposta uniforme para evitar revelar contas |
| `POST /auth/change-password` | `{ currentPassword, newPassword }` | `204` |
| `DELETE /me` | — | `204`, excluindo a conta e invalidando sessão |
| `POST /appointments` | `{ date, time, note }` | `204`, registrando solicitação de atendimento |

Login e cadastro são seguidos de `GET /me/state`. O frontend só libera o painel
depois de carregar e validar os dados dessa resposta. Mensagens de salvamento
aparecem somente após confirmação da API. O backend deve validar os campos,
armazenar hashes de senha e persistir os registros antes de responder com sucesso.

### UserSnapshot

```ts
interface UserSnapshot {
  profile: { name: string; email: string; phone: string; birth: string };
  energy: number | null;
  before: number | null;
  scenario: 'vitality' | 'calm' | null;
  completed: string[];
  currentExerciseId: string;
  history: Array<{
    id: string;
    date: string;
    value: number;
    kind: 'assessment' | 'feedback';
  }>;
  feedbackHistory: Array<{
    exerciseId: string;
    before: number | null;
    after: number;
    date: string;
    energy?: number;
    feeling?: number;
    ease?: number;
    pain?: number;
    note: string;
  }>;
}
```

- `phone` e `birth` ausentes devem ser enviados como `""`. Nascimento usa `YYYY-MM-DD`.
- Datas de histórico usam ISO 8601 com fuso, por exemplo `2026-09-23T12:00:00Z`.
- Energia e valores de histórico vão de 0 a 100. Ausência de avaliação é `null`, não zero.
- Conta nova: `energy`, `before` e `scenario` nulos; arrays vazios; `currentExerciseId: ""`.
- `answers` contém uma resposta de 0 a 4 para cada pergunta de `data/catalog.ts`, na mesma ordem.
- Feedback: `energy`, `feeling` e `ease` de 0 a 4; `pain` é 0 para sim e 1 para não.
- O servidor calcula o resultado, atribui o protocolo e registra a conclusão. O frontend não calcula pontuação ou inventa histórico.
- Ao responder ao feedback, `before` e `energy` representam antes/depois, e `currentExerciseId` identifica a atividade recém-concluída.
- `feedbackHistory` precisa conter todos os registros usados na contagem de atividades; não é uma página parcial.

## Conteúdo local que permanece

Perguntas, textos dos protocolos e catálogo de exercícios permanecem em
`src/data/catalog.ts`. São conteúdo do produto, não dados pessoais. A atribuição do
protocolo vem de `scenario` na API; os IDs retornados devem corresponder ao catálogo.
Os vídeos de exemplo foram removidos: preencha os `videoId` com os vídeos oficiais.
Para oferecer protocolos arbitrários no futuro, será necessário ampliar este contrato
para receber também o catálogo e a composição de cada protocolo.

A página Design System mantém amostras visuais isoladas. Termos e política aguardam
conteúdo definitivo. O número de WhatsApp fica em `src/config.tsx`.

## Verificação

`npm test` verifica estado inicial sem dados pessoais, limpeza ao sair, validação
do contrato e erros da API, usando respostas controladas somente nos testes.
A integração real depende da implementação das rotas no backend.
