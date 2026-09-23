# 1 - Iniciar os containers

Na raiz do projeto, onde está localizado o arquivo docker-compose.yml, execute:

docker compose up --build

O parâmetro --build garante que as imagens dos containers sejam construídas novamente caso seja necessário.

Na primeira execução, o Docker poderá levar alguns minutos para baixar as imagens e instalar as dependências.

# 2 - Acessar o sistema

Depois que os containers estiverem executando, o frontend estará disponível em:

http://localhost:5173

O backend estará disponível em:

http://localhost:3001

A API pode ser acessada através de:

http://localhost:3001/api

O PostgreSQL estará disponível na porta:

5432
# 3 - Banco de dados

Na inicialização, o backend aplica as migrations do Prisma e executa o seed, que cadastra o catálogo de exercícios. Fora de produção, o seed também cria o usuário de demonstração `mariana@exemplo.com`, com a senha `demo123`.

Depois de alterar dependências em algum `package.json`, recrie os containers com:

docker compose up --build -V

O parâmetro -V recria o volume de `node_modules`, garantindo que as novas dependências sejam instaladas.
