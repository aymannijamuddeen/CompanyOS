# 🚀 Quick Start Guide — CompanyOS

Get up and running with CompanyOS in under 5 minutes.

---

## 1. Prerequisites

Ensure you have the following installed:
- **Node.js**: v18+ or v20+
- **npm**: v9+
- **PostgreSQL**: v14+
- **Redis**: v6+

---

## 2. Fast Setup with Docker (Recommended)

If you don't already have local PostgreSQL and Redis installed:

```bash
# Start PostgreSQL (port 5432)
docker run -d --name companyos-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=companyos \
  -p 5432:5432 postgres:15-alpine

# Start Redis (port 6379)
docker run -d --name companyos-redis \
  -p 6379:6379 redis:7-alpine
```

---

## 3. Clone & Install Dependencies

```bash
git clone https://github.com/aymannijamuddeen/CompanyOS.git
cd CompanyOS
npm install
```

---

## 4. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

Verify that `DATABASE_URL` matches your local credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/companyos?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="companyos-dev-super-secret-jwt-key"
JWT_REFRESH_SECRET="companyos-dev-super-secret-refresh-key"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

---

## 5. Initialize the Database

Run migrations to apply the schema and seed default departments and agents:

```bash
cd backend
npx prisma migrate dev --name init
npm run seed
cd ..
```

---

## 6. Start Development Servers

Run both the frontend and backend with a single command from the project root:

```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)
- **WebSocket Gateway**: `ws://localhost:4000/ws`

---

## 7. Verify Working Installation

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **Register** to create an admin user and company.
3. Test asking a question in the Executive Intelligence bar (e.g., *"What departments and agents do we have?"*).
4. Browse to **Agents**, **Tasks**, and **Knowledge** to inspect your pre-seeded organizational structure.
