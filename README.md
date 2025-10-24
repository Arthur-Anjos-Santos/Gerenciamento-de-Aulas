# Plataforma de gestao de aulas

Aplicacao fullstack para gerenciamento e participacao em aulas online usando Django, SQL Server, React e TypeScript.

- Backend: Django REST Framework + JWT (SimpleJWT) + SQL Server
- Frontend: React + TypeScript (Vite) + Tailwind + shadcn/ui

## Sumario
- [Arquitetura](#arquitetura)
- [Pre-requisitos](#prerequisitos)
- [Configuração de ambiente](#configuracao-de-ambiente)
- [Execução com Docker](#execucao-com-docker)
- [Execução local](#execucao-local)
- [Seed de dados](#seed-de-dados)
- [Usuários de teste](#usuarios-de-teste)
- [Scripts uteis](#scripts-uteis)
- [URLs uteis](#urls-uteis)
- [Avisos Importantes](#avisos-importantes)

## Arquitetura
- Backend (porta 8000): APIs REST, autenticacao JWT, documentacao Swagger/Redoc, upload de avatar e contagem de inscritos.
- Frontend (porta 8080): Context API para autenticacao, dashboard de aulas, fluxo de inscricao, perfil com edicao e upload de foto.
- Banco: SQL Server (container Docker ou instancia local).

## Prerequisitos
- Docker Desktop 4.x+ e Docker Compose v2 (para execucao containerizada).
- Python 3.11, pip e virtualenv (para backend local).
- SQL Server 2019/2022 ou container equivalente.
- Node.js 18+ e npm 9+ (para frontend local).
- ODBC Driver 18 para SQL Server (Windows) ou unixODBC/msodbcsql18 (Linux/Mac).

## Configuracao de ambiente
1. Copie `backend/.env.example` para `.env` na raiz do projeto e ajuste variaveis de banco, usuarios e senhas.
2. Garanta que `DB_NAME` exista no SQL Server (veja comandos mais abaixo).
3. No frontend, configure `VITE_API_URL` (por exemplo `http://localhost:8000`).

## Execucao com Docker
1. Suba os containers:
   ```bash
   docker compose up -d --build
   ```
2. Crie o banco de dados dentro do container SQL Server (ajuste senha se necessario):
   ```bash
   docker compose exec db /opt/mssql-tools/bin/sqlcmd \
     -S localhost -U sa -P "$DB_PASSWORD" \
     -Q "IF DB_ID('NovoDB') IS NULL CREATE DATABASE NovoDB;"
   ```
3. Aplique as migracoes:
   ```bash
   docker compose exec backend python manage.py migrate
   ```
4. Popule dados padrao:
   ```bash
   docker compose exec backend python manage.py shell < seed.py
   ```
5. Opcional: crie um superusuario proprio
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

## Execucao local
1. Suba um SQL Server (exemplo via Docker):
   ```bash
   docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Pass1" \
     -p 1433:1433 --name mssql -d mcr.microsoft.com/mssql/server:2022-latest
   ```
2. Crie o banco:
   ```bash
   docker exec -it mssql /opt/mssql-tools/bin/sqlcmd \
     -S localhost -U sa -P "YourStrong@Pass1" \
     -Q "IF DB_ID('NovoDB') IS NULL CREATE DATABASE NovoDB;"
   ```
   Ou use SQL Server Management Studio/az sqlcmd, conectando com o mesmo comando.
3. Backend:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate           # Windows
   # source .venv/bin/activate      # Linux/Mac
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py shell < seed.py
   python manage.py runserver 0.0.0.0:8000
   ```
   Caso deseje um superusuario adicional:
   ```bash
   python manage.py createsuperuser
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Seed de dados
- O script `backend/seed.py` cria grupos e usuarios exemplo.
- Execute sempre apos `python manage.py migrate`.
- Usuarios criados:
  - Admin: `admin` / `Admin@123`
  - Instrutores: `instrutor1`, `instrutor2` (senha `Senha@123`)
  - Alunos: `aluno1` a `aluno5` (senha `Senha@123`)

## Usuarios de teste
- **Admin**: `admin` / `Admin@123`
- **Instrutores**:
  - `instrutor1` / `Senha@123`
  - `instrutor2` / `Senha@123`
- **Alunos**:
  - `aluno1` / `Senha@123`
  - `aluno2` / `Senha@123`
  - `aluno3` / `Senha@123`
  - `aluno4` / `Senha@123`
  - `aluno5` / `Senha@123`

## Scripts uteis
- `python manage.py test` — executa testes automatizados (usa SQLite temporario).
- `npm run lint` — valida o frontend (execute apos `npm install`).

## URLs uteis
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/api/docs/
- Redoc: http://localhost:8000/api/redoc/
- Admin: http://localhost:8000/admin/

## Avisos Importantes!
- Ambiente HTTP: este projeto roda em HTTP, caso ele fosse enviado para produção o correto seria transformar em HTTPS por questões de segurança de Dados.
- Driver SQL Server: confirme instalacao do ODBC Driver 18 ou equivalente.
- Permissao de midia: assegure que `backend/media` tenha permissao de escrita quando usar upload de avatar.
