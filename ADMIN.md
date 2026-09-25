# Administração

O painel fica em `/admin`. O login é compartilhado com `/login`; contas com perfil
`ADMIN` entram diretamente no painel. O cadastro público sempre cria `USER` e não
aceita campos de permissão. As APIs `/api/admin/*` consultam a sessão e o perfil
atual no banco a cada solicitação.

## Inicialização

Faça backup do PostgreSQL antes de atualizar uma instalação existente. No backend:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

O seed preserva exercícios existentes, cria a versão inicial do catálogo uma única
vez e vincula históricos legados à versão inicial. Não sobrescreve rascunhos nem
publicações. Em produção use `NODE_ENV=production` para não criar a conta de demonstração.
O cliente Prisma é gerado em `backend/src/generated/db`.

Para criar o primeiro administrador, defina `ADMIN_BOOTSTRAP_PASSWORD` no ambiente
(apenas durante o comando; no mínimo 12 caracteres) e execute:

```bash
npm run admin:bootstrap -- administrador@exemplo.com
```

No Docker, passe a variável do ambiente do operador sem incluí-la no comando:

```bash
docker compose exec -T -e ADMIN_BOOTSTRAP_PASSWORD backend npm run admin:bootstrap -- administrador@exemplo.com
```

O comando cria a conta com hash bcrypt; se o e-mail já existir, promove a conta
sem alterar sua senha. Revoga sessões anteriores e registra a operação. Nunca
adicione senhas ao código, seed ou repositório. Contas administrativas não podem
ser excluídas, bloqueadas ou promovidas pela interface; alterações desses acessos
exigem atuação do operador no ambiente confiável.

## Operação

- **Visão geral:** total e bloqueados atuais; novos cadastros, usuários com
  avaliação/atividade, avaliações, conclusões, desconfortos e energia média no período.
  Administradores não entram nos indicadores agregados.
- **Usuários:** busca por nome/e-mail, filtro de situação e paginação. Alterações
  cadastrais exigem motivo e controle de concorrência. Bloquear revoga sessões;
  alterar e-mail/CPF também exige novo login. Exclusão permanente exige `EXCLUIR`,
  motivo e a senha do administrador. Avaliações e feedbacks não têm endpoint de edição.
- **Relatórios:** avaliações e respostas originais, protocolo indicado, exercícios
  realizados e instruções da época, feedbacks e médias diárias. Listas de 25 registros
  por tipo; gráfico independente da página. Datas de filtro em UTC, intervalo máximo
  de 366 dias. Gráfico limitado a 5000 entradas por tipo, com aviso de truncamento.
  Exportação CSV cobre o período inteiro e exige um intervalo menor acima de 5000
  registros totais. Fórmulas em células de texto são neutralizadas.
- **Conteúdo:** perguntas com 2–8 alternativas, texto, tema, ordem, ativação e
  pontuação de 0–100. Exercícios com instruções, duração, categoria, ícone, cor e link
  opcional do YouTube (completo, `youtu.be`, Shorts, embed ou live). Também aceita o ID;
  o backend extrai e armazena apenas o ID ao salvar. Conteúdo novo começa inativo. Para retirar conteúdo publicado,
  desative no rascunho e publique uma nova versão.
- **Protocolos:** dois percursos configuráveis, exercícios ordenados e limiar da
  energia para indicação. Cada pergunta respondida tem o mesmo peso; a energia é a
  média das pontuações das alternativas, arredondada de 0–100.
- **Publicação:** salvar rascunho não muda o catálogo público. Publicação exige revisão,
  pelo menos uma pergunta ativa com duas alternativas ativas e exercícios ativos em
  ambos os protocolos. Revisões impedem sobrescrita por outro administrador.
- **Histórico:** versões publicadas são imutáveis. Cada avaliação e conclusão guarda
  a versão utilizada e um snapshot dos dados relevantes. Um novo protocolo é obtido
  ao realizar uma nova avaliação; uma publicação não muda um protocolo já atribuído.
- **Auditoria:** identificadores do autor e alvo, momento, ação, motivo e nomes dos
  campos alterados. Consultas e exportações individuais também são registradas.
  Senhas, tokens e cópias de dados cadastrais não são gravados no log.

A API usa cookies HttpOnly/SameSite, `Cache-Control: no-store`, validação estrita,
limitação de solicitações e cabeçalho `X-Requested-With: ResgatandoAlmas` nas escritas.
O frontend já o envia. A API não habilita CORS; use o proxy de mesma origem também
em produção, com HTTPS para os cookies seguros.

## Verificação

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix backend run typecheck
```

Os testes de integração usam Express e PostgreSQL reais. Crie um banco temporário
cujo nome comece com `resgatando_admin_test_`, aplique as migrações nele e configure
`ADMIN_TEST_DATABASE_URL` antes de executar `npm --prefix backend test`.
**O teste apaga as tabelas desse banco de teste. Nunca aponte para o banco de usuários.**
Sem essa variável a suíte é marcada como ignorada; ela recusa nomes fora do prefixo.

A suíte cobre autorização, tentativa de promoção pelo cadastro/perfil, CSRF,
revogação de sessões, versões históricas, alternativas inativas, pontuação no
servidor, concorrência, paginação, exportação CSV e exclusão confirmada.
