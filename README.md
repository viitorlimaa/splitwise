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

## Funcionalidades e endpoints

Exceto cadastro e login, as rotas abaixo exigem autenticação JWT. Envie o token de acesso no cabeçalho `Authorization: Bearer <token>`.

| Método | Endpoint                        | Acesso                | Descrição                                                    |
| ------ | ------------------------------- | --------------------- | ------------------------------------------------------------ |
| `POST` | `/api/auth/register`            | Público               | Cadastra usuário e retorna token de acesso                   |
| `POST` | `/api/auth/login`               | Público               | Autentica usuário e retorna token de acesso                  |
| `GET`  | `/api/auth/me`                  | JWT                   | Retorna os dados do usuário autenticado                      |
| `POST` | `/api/groups`                   | JWT                   | Cria grupo; o criador passa a ser membro                     |
| `GET`  | `/api/groups`                   | JWT                   | Lista os grupos dos quais o usuário autenticado é membro     |
| `POST` | `/api/groups/:id/members`       | JWT, criador do grupo | Adiciona ao grupo um usuário existente, informado por e-mail |
| `POST` | `/api/groups/:groupId/expenses` | JWT, membro do grupo  | Registra uma despesa e suas divisões igualitárias            |
| `GET`  | `/api/groups/:groupId/expenses` | JWT, membro do grupo  | Lista as despesas do grupo, mais recentes primeiro           |
| `GET`  | `/api/groups/:groupId/balances` | JWT, membro do grupo  | Calcula o saldo de cada membro                               |

IDs de grupo devem ser UUIDs. A documentação interativa e os schemas de request/response estão disponíveis no Swagger.

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

## Escopo atual e próximos passos

Implementados: autenticação e rota do usuário atual; criação e listagem de grupos; inclusão de membros por e-mail pelo criador; criação e listagem de despesas; divisões iguais com participantes selecionáveis; saldos agregados por membro.

Ainda não implementados: remoção de membros, simplificação de dívidas, registro de pagamentos entre membros, saldo por par de pessoas e paginação do histórico de despesas.

## Qualidade

```powershell
pnpm exec prisma generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

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
