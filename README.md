# Splitwise API

Backend para dividir despesas entre grupos, construído com NestJS, TypeScript, PostgreSQL e Prisma. Valores monetários serão armazenados em centavos inteiros para evitar erros de arredondamento.

## Stack

- NestJS e TypeScript
- PostgreSQL e Prisma
- JWT para autenticação
- Vitest
- Docker Compose
- GitHub Actions

## Começando

Requisitos: Node.js 20+, pnpm 12.4.1 e Docker com Docker Compose.

```powershell
pnpm install
Copy-Item .env.example .env
docker compose up --build
```

O Compose inicia a API e o PostgreSQL. Aplique as migrations em outro terminal:

```powershell
docker compose exec app pnpm exec prisma migrate deploy
```

Sem Docker, configure `DATABASE_URL` e `JWT_SECRET` no `.env`, gere o Prisma Client, aplique as migrations e inicie em desenvolvimento:

```powershell
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm start:dev
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`

## Estado atual

- Health check em `GET /api`
- Cadastro/login e autenticação JWT
- Modelos Prisma para usuários, grupos e membros de grupos
- Rate limiting, Redis e módulos do domínio de encurtamento removidos

Próximas entregas: operações de grupos, despesas e divisões, consulta de saldos e simplificação de dívidas.

## Qualidade

```powershell
pnpm exec prisma generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `PORT` | Porta HTTP (padrão: `3000`) |
| `JWT_SECRET` | Segredo usado para assinar tokens JWT |
| `NODE_ENV` | Ambiente de execução |
| `POSTGRES_DB` | Nome do banco no Docker Compose |
| `POSTGRES_USER` | Usuário PostgreSQL no Docker Compose |
| `POSTGRES_PASSWORD` | Senha PostgreSQL no Docker Compose |
