# URBNLY Backend

Express + Prisma + PostgreSQL backend for URBNLY.

## Prerequisites

- Node.js 18+
- Yarn 1.x
- Docker Desktop running locally

## 1. Clone and install

```bash
git clone <your-backend-repo-url>
cd urbnly-backend
yarn install
```

## 2. Configure environment

Create a local env file from the example:

```bash
cp .env.example .env
```

Default backend env:

```env
PORT=5000
JWT_SECRET=urbanly_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
DATABASE_URL=postgresql://urbnly:urbnly@localhost:5432/urbnly?schema=public
```

Notes:

- `GOOGLE_MAPS_API_KEY` is needed for live commute and places autocomplete
- Razorpay is currently not active in the product flow, so those keys can stay as placeholders for now

## 3. Start PostgreSQL with Docker

```bash
yarn db:up
```

This uses the local `docker-compose.yml` and starts PostgreSQL on:

```text
localhost:5432
```

## 4. Run migrations and seed data

```bash
yarn db:migrate --name init
yarn db:seed
```

If the database was already migrated before, just run:

```bash
yarn db:seed
```

## 5. Start the backend

```bash
yarn dev
```

Backend runs on:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/
```

## 6. Stop the database

```bash
yarn db:down
```

## Local full-stack flow

If you want the entire app running locally:

1. Start Docker Desktop
2. In this backend repo:
   - `yarn install`
   - `cp .env.example .env`
   - `yarn db:up`
   - `yarn db:migrate --name init`
   - `yarn db:seed`
   - `yarn dev`
3. In the frontend repo:
   - `yarn install`
   - `cp .env.example .env`
   - `yarn dev`

## Tech stack

- Express
- Prisma
- PostgreSQL
- JWT auth
- Google Maps APIs for commute and autocomplete

## Extra notes

- Database schema: `prisma/schema.prisma`
- Seed file: `prisma/seed.js`
- Detailed DB notes: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
