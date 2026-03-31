# Dlogin credentialstabase Integration Notes

This backend is being moved from in-memory arrays to `PostgreSQL + Prisma`.

## 1. Why We Added Prisma

Prisma gives us:
- a schema file that describes our tables
- migrations to create/update the database
- a generated client for querying the database from Express routes

## 2. Files Added

- `prisma/schema.prisma`
  - defines the database models
- `prisma.config.ts`
  - Prisma 7 config, including the database URL and migration path
- `prisma/seed.js`
  - inserts the same kind of sample data the app used before
- `src/lib/prisma.js`
  - creates one reusable Prisma client instance
- `docker-compose.yml`
  - starts a local PostgreSQL container

## 3. How The Models Map To The Old Arrays

Old in-memory structures:
- `users[]`
- `properties[]`
- `bookings[]`
- `wishlists{}`

New Prisma models:
- `User`
- `Property`
- `Booking`
- `Wishlist`

## 4. Why Some Fields Use JSON

We kept these as `Json` for now:
- `preferences`
- `images`
- `highlights`
- `amenities`
- `houseRules`

Reason:
- they were already array/object shaped in the app
- moving them to JSON lets us migrate faster
- later, if needed, we can normalize them into separate tables

## 5. Runtime Pattern

Instead of:

```js
const users = require("../data/users");
```

we now do:

```js
const prisma = require("../lib/prisma");
```

Then query with Prisma:

```js
const user = await prisma.user.findUnique({
  where: { email: normalizedEmail },
});
```

## 6. Commands

Start the database:

```bash
yarn db:up
```

Run the first migration:

```bash
yarn db:migrate --name init
```

Generate the Prisma client:

```bash
yarn db:generate
```

Seed the database:

```bash
yarn db:seed
```

Stop the database:

```bash
yarn db:down
```

## 7. Current Blocker

The codebase is ready, but local migration could not be executed yet because the
Docker daemon was not running on this machine when the container start was tried.

Once Docker Desktop is running, the normal flow is:

```bash
yarn db:up
yarn db:migrate --name init
yarn db:seed
```

## 8. What Was Refactored

These routes/controllers now read from Prisma instead of in-memory data:
- auth
- properties
- wishlist
- bookings
- roommate matching
- commute property lookup

## 9. What To Learn From This Integration

The main pattern is:

1. design the schema from current app entities
2. add Prisma config
3. create a shared Prisma client
4. replace one route at a time
5. validate schema
6. run migration
7. seed data
8. verify the API behavior

That is the same structure you will reuse on most Express + Prisma projects.
