# Influencer Marketplace Backend

NestJS backend for an Influencer Marketplace platform with TypeORM, PostgreSQL, JWT auth, RBAC, Swagger, Winston logging, sockets, S3 uploads, and Docker-based local infrastructure.

## Tech Stack

- NestJS
- TypeORM
- PostgreSQL
- Redis
- Socket.IO
- AWS S3
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
  - Chat
  - Upload
- JWT authentication
- Role-based access control
- DTO validation with `class-validator`
- Swagger API documentation
- URL-based PostgreSQL configuration
- Redis integration inside Nest
- Socket-based realtime events
- S3-based file uploads
- Global exception handling and response interception
- Winston logging to console and files
- Local Docker setup for PostgreSQL, Redis, and Adminer
- Custom `/api` status page for local development

## Project Structure

```text
src/
|-- common/
|   |-- decorators/
|   |-- dto/
|   |-- filters/
|   |-- guards/
|   |-- interceptors/
|   |-- jwt/
|   `-- logger/
|-- config/
|-- modules/
|   |-- auth/
|   |-- users/
|   |-- influencers/
|   |-- campaigns/
|   |-- bookings/
|   |-- reviews/
|   |-- chat/
|   |-- s3/
|   |-- socket/
|   |-- otp/
|   `-- notifications/
|-- views/
|-- app.controller.ts
|-- app.module.ts
`-- main.ts
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

REDIS_URL=redis://localhost:6379

JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=1d

AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=influencer308
AWS_S3_PUBLIC_URL=
```

### Required Environment Variables

The app validates these on startup and fails fast if they are missing:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`

### Environment Notes

- `PORT`
  - Backend port, default is `8000`
- `DATABASE_URL`
  - PostgreSQL connection string
- `DB_SYNC`
  - Keep `true` only for local development
  - Use migrations for production
- `REDIS_URL`
  - Redis connection string
- `JWT_SECRET`
  - Secret used to sign access tokens
- `JWT_EXPIRES_IN`
  - Token expiry, for example `1d`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`
  - Required when using file upload features
- `AWS_S3_PUBLIC_URL`
  - Optional public base URL or CDN URL

## Shared Config Architecture

The project now uses a shared config pattern for infrastructure and auth:

- [env.config.ts](/d:/Abhinav_Github/influencer_backend/src/config/env.config.ts)
  - shared env helpers
  - required/optional/boolean env parsing
  - startup env validation
- [jwt.config.ts](/d:/Abhinav_Github/influencer_backend/src/config/jwt.config.ts)
  - centralized JWT secret and expiry config
- [aws.config.ts](/d:/Abhinav_Github/influencer_backend/src/config/aws.config.ts)
  - centralized AWS S3 config
- [database.config.ts](/d:/Abhinav_Github/influencer_backend/src/config/database.config.ts)
  - TypeORM config using shared env helpers
- [redis.config.ts](/d:/Abhinav_Github/influencer_backend/src/config/redis.config.ts)
  - Redis config using shared env helpers
- [jwt.module.ts](/d:/Abhinav_Github/influencer_backend/src/common/jwt/jwt.module.ts)
  - single shared JWT module used by auth and socket

This keeps configuration:

- centralized
- fail-fast
- reusable
- easier to maintain across modules

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
- Redis connection status
- Socket status
- Backend port
- Backend URL
- Swagger URL
- Socket URL

Default local URLs:

- Backend status page: `http://localhost:8000/api`
- Swagger docs: `http://localhost:8000/docs`
- Socket namespace: `ws://localhost:8000/ws`

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
- collapsed module sections by default

## Auth

Available auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/register/verify-otp`
- `POST /api/auth/login`
- `POST /api/auth/login/verify-otp`
- `POST /api/auth/forgot-password`
- `GET /api/auth/me`

JWT is required for protected routes.

In local development:

- OTP is mocked
- OTP code is `123456`
- SendGrid and Twilio stay in mock mode

## Roles

Supported roles:

- `customer`
- `influencer`
- `admin`

RBAC is enforced with custom decorators and guards.

## Chat and Upload

The platform includes:

- booking-scoped chat between customer and influencer
- S3-backed attachment support for chat
- protected socket room join/leave
- typing indicators
- edit/delete chat message support

Detailed chat test flow:

- [Chat Module README](/d:/Abhinav_Github/influencer_backend/src/modules/chat/README.md)

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

- User <-> Influencer as `1:1`
- Customer(User) <-> Campaign as `1:N`
- Campaign <-> Booking as `1:N`
- Influencer <-> Booking as `1:N`
- Booking <-> ChatRoom as booking-scoped chat
- ChatRoom <-> ChatMessage as `1:N`
- ChatMessage <-> ChatMessageAttachment as `1:N`

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
- Add `helmet` and rate limiting for production APIs
- Add background jobs/queues for notifications and heavy async work

## Troubleshooting

### Port already in use

Change `PORT` in `.env` or stop the process using `8000`.

### Database connection fails

- Ensure PostgreSQL is running
- Check `DATABASE_URL`
- If using Docker, confirm containers are healthy

### Redis connection fails

- Ensure Redis is running
- Check `REDIS_URL`
- If using Docker, confirm the Redis container is healthy

### Swagger not opening

- Confirm the app started successfully
- Open `http://localhost:8000/docs`

### Logs not generated

- Ensure the app has started at least once
- Check the `logs/` folder in the project root

### Uploads fail

- Check AWS env values
- Confirm bucket name and region are correct
- Confirm IAM credentials allow S3 access
