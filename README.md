# Splitwise API

API backend para registrar grupos e despesas compartilhadas e consultar saldos por membro. A aplicação usa NestJS, TypeScript, PostgreSQL e Prisma. Valores monetários são armazenados e calculados como inteiros em centavos.

## Stack

- NestJS e TypeScript
- PostgreSQL e Prisma
- JWT para autenticação
- Vitest para testes
- Docker Compose para desenvolvimento
- GitHub Actions para integração contínua

## Requisitos

- Node.js 20 ou superior
- pnpm 12.4.1
- Docker com Docker Compose (opcional, recomendado para iniciar o PostgreSQL)

## Desenvolvimento local

Instale as dependências, configure as variáveis de ambiente e inicie a API e o banco:

```powershell
pnpm install
Copy-Item .env.example .env
docker compose up --build
```

O Compose inicia a API e o PostgreSQL. Em outro terminal, aplique as migrations:

```powershell
docker compose exec app pnpm exec prisma migrate deploy
```

Sem Docker, configure `DATABASE_URL` e `JWT_SECRET` no `.env`, disponibilize um PostgreSQL e execute:

```powershell
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm start:dev
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`
- Health check: `GET /api`

### Preparar ambiente de produção com Docker Compose

Crie um arquivo `.env.production` local (não o versione) com os valores abaixo.
Use segredos aleatórios e uma senha PostgreSQL hexadecimal para evitar caracteres
que precisem de escape na URL de conexão:

```dotenv
POSTGRES_DB=splitwise
POSTGRES_USER=splitwise
POSTGRES_PASSWORD=<senha-aleatoria-hexadecimal>
JWT_SECRET=<segredo-aleatorio-com-pelo-menos-32-bytes>
PORT=3000
```

Inicie a stack de produção:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
```

O container da API aguarda o PostgreSQL ficar saudável, aplica migrations antes
de iniciar e expõe um health check em `GET /api`. Os dados do PostgreSQL ficam
no volume `postgres_data`; planeje backups e teste restaurações antes de operar
com dados reais. Para acesso público, coloque a API atrás de um proxy TLS e
restrinja o acesso direto à porta publicada. Esse setup é uma base Docker
genérica: provisionamento do host, TLS, gestão de segredos, backups e deploy
automatizado continuam dependendo do ambiente escolhido.

## Funcionalidades e endpoints

Exceto cadastro e login, as rotas abaixo exigem autenticação JWT. Envie o token de acesso no cabeçalho `Authorization: Bearer <token>`.

| Método   | Endpoint                           | Acesso                | Descrição                                                    |
| -------- | ---------------------------------- | --------------------- | ------------------------------------------------------------ |
| `POST`   | `/api/auth/register`               | Público               | Cadastra usuário e retorna token de acesso                   |
| `POST`   | `/api/auth/login`                  | Público               | Autentica usuário e retorna token de acesso                  |
| `GET`    | `/api/auth/me`                     | JWT                   | Retorna os dados do usuário autenticado                      |
| `POST`   | `/api/groups`                      | JWT                   | Cria grupo; o criador passa a ser membro                     |
| `GET`    | `/api/groups`                      | JWT                   | Lista os grupos dos quais o usuário autenticado é membro     |
| `POST`   | `/api/groups/:id/members`          | JWT, criador do grupo | Adiciona ao grupo um usuário existente, informado por e-mail |
| `DELETE` | `/api/groups/:id/members/:userId`  | JWT, criador do grupo | Remove um membro sem apagar despesas ou divisões existentes  |
| `POST`   | `/api/groups/:groupId/expenses`    | JWT, membro do grupo  | Registra uma despesa e suas divisões igualitárias            |
| `GET`    | `/api/groups/:groupId/expenses`    | JWT, membro do grupo  | Lista as despesas do grupo, mais recentes primeiro           |
| `GET`    | `/api/groups/:groupId/balances`    | JWT, membro do grupo  | Calcula o saldo de cada membro                               |
| `GET`    | `/api/groups/:groupId/settlements` | JWT, membro do grupo  | Sugere transferências para zerar os saldos                   |

IDs de grupo devem ser UUIDs. A documentação interativa e os schemas de request/response estão disponíveis no Swagger.
O criador não pode ser removido. Ao remover outro membro, seu acesso ao grupo
é revogado, mas seu histórico permanece e seu saldo continua incluído nas
consultas e sugestões de transferências.

### Criar uma despesa

Exemplo de corpo para `POST /api/groups/:groupId/expenses`:

```json
{
  "description": "Jantar",
  "amountCents": 9000,
  "paidById": "550e8400-e29b-41d4-a716-446655440000",
  "participantIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

`amountCents` é obrigatório e representa o valor total em centavos. `paidById` é opcional e, quando omitido, usa o usuário autenticado. `participantIds` também é opcional; se omitido, a despesa é dividida entre todos os membros do grupo. A lista deve conter IDs UUID únicos de membros do grupo. Os centavos restantes são distribuídos em ordem crescente de ID, garantindo uma divisão determinística.

### Consultar saldos

O saldo é calculado como **total pago − total devido nas divisões**. Um saldo positivo significa que o membro tem a receber; um saldo negativo significa que tem a pagar. O resultado inclui todos os membros, inclusive aqueles com saldo zero, e mantém a soma dos saldos igual a zero.

```json
{
  "groupId": "550e8400-e29b-41d4-a716-446655440010",
  "balances": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Ana",
      "balanceCents": 6000
    },
    {
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Bia",
      "balanceCents": -3000
    },
    {
      "userId": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Caio",
      "balanceCents": -3000
    }
  ]
}
```

Os saldos são calculados em memória a cada consulta, carregando apenas os valores e participantes necessários. Para grupos com milhares de despesas, agregação SQL ou cache pode ser avaliado se medições reais indicarem lentidão.

### Simplificar dívidas

`GET /api/groups/:groupId/settlements` transforma os saldos em transferências sugeridas entre membros, incluindo IDs e nomes de quem paga e recebe. O algoritmo guloso reduz as dívidas ao mínimo prático e produz no máximo `n − 1` transferências; ele não garante o menor número global possível em todos os casos.

Para os saldos do exemplo anterior, a resposta contém duas transferências:

```json
{
  "groupId": "550e8400-e29b-41d4-a716-446655440010",
  "transfers": [
    {
      "fromUserId": "550e8400-e29b-41d4-a716-446655440001",
      "fromName": "Bia",
      "toUserId": "550e8400-e29b-41d4-a716-446655440000",
      "toName": "Ana",
      "amountCents": 3000
    },
    {
      "fromUserId": "550e8400-e29b-41d4-a716-446655440002",
      "fromName": "Caio",
      "toUserId": "550e8400-e29b-41d4-a716-446655440000",
      "toName": "Ana",
      "amountCents": 3000
    }
  ]
}
```

## Escopo atual e próximos passos

Implementados: autenticação e rota do usuário atual; criação e listagem de grupos; inclusão e remoção de membros pelo criador; criação e listagem de despesas; divisões iguais com participantes selecionáveis; saldos agregados por membro; sugestão de transferências para simplificar dívidas.

Ainda não implementados: registro/baixa de pagamentos entre membros, saldo por par de pessoas e paginação do histórico de despesas.

## Qualidade

```powershell
pnpm exec prisma generate
pnpm lint
pnpm typecheck
pnpm test
pnpm exec prisma migrate deploy
pnpm test:e2e
pnpm build
```

Os testes e2e usam um PostgreSQL real local; configure `DATABASE_URL` para
`localhost`/`127.0.0.1`, aplique as migrations e execute-os com
`pnpm test:e2e`. A suíte recusa conexões com hosts remotos para evitar escrita
acidental em bases compartilhadas. O CI provisiona esse banco e roda os testes
automaticamente.

## Variáveis de ambiente

Os valores de desenvolvimento estão documentados em `.env.example`. Configure os valores adequados ao ambiente antes de iniciar a aplicação.

| Variável            | Descrição                            |
| ------------------- | ------------------------------------ |
| `DATABASE_URL`      | URL de conexão com PostgreSQL        |
| `PORT`              | Porta HTTP da API (padrão: `3000`)   |
| `JWT_SECRET`        | Segredo para assinar tokens JWT      |
| `NODE_ENV`          | Ambiente de execução                 |
| `POSTGRES_DB`       | Nome do banco no Docker Compose      |
| `POSTGRES_USER`     | Usuário PostgreSQL no Docker Compose |
| `POSTGRES_PASSWORD` | Senha PostgreSQL no Docker Compose   |
