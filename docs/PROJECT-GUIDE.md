# Splitwise API — Guia do projeto

## Objetivo

Backend para registrar grupos, despesas compartilhadas e saldos entre membros. A divisão de valores usa centavos inteiros no banco e nos cálculos, nunca números de ponto flutuante.

## Stack e decisões

| Área | Tecnologia | Decisão |
| --- | --- | --- |
| Backend | NestJS + TypeScript | Aplicação modular e tipada |
| Banco | PostgreSQL + Prisma | Persistência relacional e migrations |
| Autenticação | JWT | Cadastro, login e proteção de rotas |
| Testes | Vitest | Testes unitários e de integração |
| Infra | Docker Compose | API e PostgreSQL para desenvolvimento |
| CI | GitHub Actions | Lint, typecheck, testes e build |

Redis e rate limiting não fazem parte desta aplicação.

## Módulos

- `AuthModule`: cadastro, login e autenticação JWT.
- `PrismaModule`: cliente e conexão com PostgreSQL.
- `GroupsModule`, `ExpensesModule` e `BalancesModule`: serão adicionados conforme as fases do roadmap.
- Não criar CRUD genérico de usuários; manter a superfície de usuário limitada ao que os fluxos de negócio precisam.

## Modelo inicial

- `User`: identidade e credenciais.
- `Group`: nome do grupo e usuário criador.
- `GroupMember`: associação única entre usuário e grupo.

Próximos modelos do domínio: `Expense` e `ExpenseSplit`. Valores monetários devem ser persistidos como inteiros em centavos.

## Roadmap

1. Criar grupo, adicionar/remover membros e listar grupos do usuário.
2. Registrar despesas e dividir igualmente entre os membros.
3. Calcular o saldo de cada membro.
4. Simplificar dívidas com um algoritmo guloso: mínimo prático, com no máximo n − 1 transferências.
5. Ampliar testes das regras de cálculo e preparar deploy.

## Desenvolvimento local

Copie `.env.example` para `.env`, configure `DATABASE_URL` e `JWT_SECRET` e execute:

```powershell
pnpm install
pnpm exec prisma generate
docker compose up --build
docker compose exec app pnpm exec prisma migrate deploy
```

Os comandos de qualidade são `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`.

## Diretrizes de implementação

- Não mascarar erros de serviço com `catch` genérico. Tratar somente erros conhecidos e relançar o erro original quando necessário.
- Validar os DTOs na fronteira HTTP e documentar exemplos no Swagger.
- Manter o escopo enxuto; implementar somente os casos de uso previstos antes de ampliar a API.
