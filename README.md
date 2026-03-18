# Influencer Marketplace Backend

NestJS backend for an Influencer Marketplace platform with TypeORM, PostgreSQL, JWT auth, RBAC, Swagger, Winston logging, and Docker-based local infrastructure.

## Tech Stack

- NestJS
- TypeORM
- PostgreSQL
- Redis
- Adminer
- Swagger
- Winston
- pnpm

## Features

- Modular architecture
  - Auth
  - Users
  - Influencers
  - Campaigns
  - Bookings
  - Reviews
- JWT authentication
- Role-based access control
- DTO validation with `class-validator`
- Swagger API documentation
- URL-based PostgreSQL configuration
- Global exception handling and response interception
- Winston logging to console and files
- Local Docker setup for PostgreSQL, Redis, and Adminer
- Custom `/api` status page for local development

## Project Structure

```text
src/
├── common/
│   ├── decorators/
│   ├── dto/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── logger/
├── config/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── influencers/
│   ├── campaigns/
│   ├── bookings/
│   └── reviews/
├── views/
├── app.controller.ts
├── app.module.ts
└── main.ts
```

## Prerequisites

- Node.js 20+ recommended
- pnpm installed
- Docker Desktop or Docker Engine
- PostgreSQL only if you are not using Docker

## Installation

```bash
pnpm install
```

## Environment Setup

Create a local `.env` file in the project root.

Example:

```env
NODE_ENV=development
PORT=8000

DATABASE_URL=postgresql://postgres:root@localhost:5432/influeser_db
DB_SYNC=true

JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=1d
```

### Environment Notes

- `PORT`
  - Backend port, default is `8000`
- `DATABASE_URL`
  - PostgreSQL connection string
- `DB_SYNC`
  - Keep `true` only for local development
  - Use migrations for production
- `JWT_SECRET`
  - Secret used to sign access tokens
- `JWT_EXPIRES_IN`
  - Token expiry, for example `1d`

## Docker Setup

Docker services are defined in:

- [deployment/docker-compose.yml](/d:/Abhinav_Github/influencer_backend/deployment/docker-compose.yml)

Included services:

- PostgreSQL on `5432`
- Redis on `6379`
- Adminer on `8080`

Start infrastructure:

```bash
docker compose -f deployment/docker-compose.yml up -d
```

Stop infrastructure:

```bash
docker compose -f deployment/docker-compose.yml down
```

Adminer:

```text
http://localhost:8080
```

Suggested Adminer connection values:

- System: `PostgreSQL`
- Server: `postgres` if using Docker network, or `localhost` from host machine
- Username: `postgres`
- Password: `root`
- Database: `influeser_db`

## Running the App

Run once:

```bash
pnpm dev
```

Run in watch mode:

```bash
pnpm dev:watch
```

Production build:

```bash
pnpm build
pnpm start:prod
```

## Startup URLs

When the server starts, it logs:

- DB connection status
- Backend port
- Backend URL
- Swagger URL

Default local URLs:

- Backend status page: `http://localhost:8000/api`
- Swagger docs: `http://localhost:8000/docs`

## Logging

Winston is configured as the global Nest logger.

### Console Logging

In development:

- colorful output
- `debug`, `info`, `warn`, `error`

In production:

- debug disabled
- focused operational output

### File Logging

Logs are written automatically to:

- `logs/app.log`
- `logs/error.log`

The `logs` folder is auto-created if it does not exist.

Log file behavior:

- `app.log`
  - all application logs
- `error.log`
  - only error logs

File logs use JSON format with timestamps.

## Swagger

Swagger is enabled globally.

Open:

```text
http://localhost:8000/docs
```

Swagger includes:

- JWT bearer auth support
- grouped controllers by module
- DTO-based request schemas

## Auth

Available auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

JWT is required for protected routes.

## Roles

Supported roles:

- `customer`
- `influencer`
- `admin`

RBAC is enforced with custom decorators and guards.

## Status Page

The project includes a custom developer status page at:

```text
http://localhost:8000/api
```

It shows:

- backend running state
- version
- backend URL
- Swagger URL

## Database

Current setup uses TypeORM with entity-based schema sync for local development.

Key relationships:

- User ↔ Influencer as `1:1`
- Customer(User) ↔ Campaign as `1:N`
- Campaign ↔ Booking as `1:N`
- Influencer ↔ Booking as `1:N`

## Useful Commands

```bash
pnpm dev
pnpm dev:watch
pnpm build
pnpm start:prod
pnpm lint
pnpm format
pnpm typeorm:generate
pnpm typeorm:run
```

## Recommended Next Improvements

- Add TypeORM migrations for production
- Add request logging middleware/interceptor
- Add health check endpoint like `/api/health`
- Add unit and e2e tests
- Add Redis integration inside Nest if caching/queues are needed
- Add `helmet` and rate limiting for production APIs

## Troubleshooting

### Port already in use

Change `PORT` in `.env` or stop the process using `8000`.

### Database connection fails

- Ensure PostgreSQL is running
- Check `DATABASE_URL`
- If using Docker, confirm containers are healthy

### Swagger not opening

- Confirm the app started successfully
- Open `http://localhost:8000/docs`

### Logs not generated

- Ensure the app has started at least once
- Check the `logs/` folder in the project root

