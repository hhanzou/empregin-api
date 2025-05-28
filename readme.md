# 🧠 EmpregIn API

API RESTful para gerenciamento de vagas de emprego, empresas e usuários. Desenvolvida com TypeScript, Express, Prisma ORM e documentada com Swagger via TSOA.

---

## 🚀 Tecnologias

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/)
- [TSOA](https://tsoa-community.github.io/docs/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

## 🔧 Como rodar o projeto localmente (dev)

```bash
# 1. Clone o repositório
git clone https://github.com/hhanzou/empregin-api.git
cd empregin-api

# 2. Instale as dependências
npm install

# 3. Configure o ambiente (.env)
echo "DATABASE_URL=postgresql://usuario:senha@localhost:5432/nomedobanco" > .env

# 4. Gere o Prisma Client
npx prisma generate

# 5. (Opcional) Crie e aplique a primeira migration (se necessário)
npx prisma migrate dev --name init

# 6. (Opcional) Execute a seed (se configurada)
npx prisma db seed

# 7. Gere rotas e documentação Swagger com TSOA
npx tsoa routes && npx tsoa spec

# 8. Inicie o servidor em modo desenvolvimento
npx ts-node-dev -r tsconfig-paths/register src/index.ts

```

### A API estará disponível em:

👉 http://localhost:3000
👉 Swagger: http://localhost:3000/docs

### Para testar a aplicação em Deploy:
 - https://empregin-api.onrender.com/docs
