# Splitwise API — Guia do projeto

## Objetivo

Backend para registrar grupos, despesas compartilhadas e saldos entre membros. A divisão de valores usa centavos inteiros no banco e nos cálculos, nunca números de ponto flutuante.

## Stack e decisões

| Área         | Tecnologia          | Decisão                               |
| ------------ | ------------------- | ------------------------------------- |
| Backend      | NestJS + TypeScript | Aplicação modular e tipada            |
| Banco        | PostgreSQL + Prisma | Persistência relacional e migrations  |
| Autenticação | JWT                 | Cadastro, login e proteção de rotas   |
| Testes       | Vitest              | Testes unitários e de integração      |
| Infra        | Docker Compose      | API e PostgreSQL para desenvolvimento |
| CI           | GitHub Actions      | Lint, typecheck, testes e build       |

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
- `Expense` e `ExpenseSplit`: despesas e divisões entre participantes.

Valores monetários são persistidos como inteiros em centavos. A remoção de um
membro apaga somente sua associação ativa; despesas e divisões antigas são
preservadas, e seu saldo continua aparecendo nos cálculos do grupo.

## Roadmap

1. **Concluído:** criar/listar grupos e adicionar/remover membros pelo criador.
2. **Concluído:** registrar despesas e dividir igualmente entre os membros.
3. **Concluído:** calcular o saldo de cada membro e simplificar dívidas com um
   algoritmo guloso (mínimo prático, com no máximo n − 1 transferências).
4. **Concluído:** cobrir o fluxo principal com testes e2e sobre PostgreSQL e
   preparar execução de produção via Docker Compose.
5. **Fora do MVP atual:** registrar pagamentos realizados, consultar saldo por
   par de pessoas, paginar o histórico e automatizar deploy em um provedor.

## Desenvolvimento local

Copie `.env.example` para `.env`, configure `DATABASE_URL` e `JWT_SECRET` e execute:

```powershell
pnpm install
pnpm exec prisma generate
docker compose up --build
docker compose exec app pnpm exec prisma migrate deploy
```

Os comandos de qualidade são `pnpm lint`, `pnpm typecheck`, `pnpm test`,
`pnpm test:e2e` (com migrations aplicadas em PostgreSQL) e `pnpm build`.

Para produção genérica com Docker Compose, configure um `.env.production` local
e use `docker compose --env-file .env.production -f docker-compose.prod.yml up
-d --build`. A stack aplica migrations na inicialização e mantém o banco em um
volume nomeado. TLS, backups, gestão dos segredos e provisionamento do host
devem ser configurados para o ambiente escolhido.

## Diretrizes de implementação

- Não mascarar erros de serviço com `catch` genérico. Tratar somente erros conhecidos e relançar o erro original quando necessário.
- Validar os DTOs na fronteira HTTP e documentar exemplos no Swagger.
- Manter o escopo enxuto; implementar somente os casos de uso previstos antes de ampliar a API.
