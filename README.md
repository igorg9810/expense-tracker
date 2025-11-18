# ExpenseTracker API

> A RESTful API for tracking personal expenses with OCR invoice scanning, user authentication, and comprehensive expense management.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Docker](#docker)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Features

- **User Authentication**

  - JWT-based authentication with access and refresh tokens
  - Password reset via email with verification codes
  - Secure password hashing with bcrypt

- **Expense Management**

  - CRUD operations for expense records
  - Pagination and filtering support
  - Drag & drop ordering capability
  - Date range filtering

- **OCR Invoice Scanning**

  - Upload JPG invoices (up to 5MB)
  - Automatic data extraction (name, amount, currency, date)
  - Powered by Tesseract.js

- **Performance & Security**

  - Response compression (gzip/brotli)
  - Rate limiting (100 requests per 15 minutes)
  - CORS protection
  - Security headers (Helmet)
  - Request caching

- **Monitoring & Logging**

  - Winston logger with multiple log levels
  - HTTP request logging
  - File-based logs (error, combined, http)
  - Health check endpoint

- **Background Jobs**
  - Scheduled tasks with node-cron
  - Automatic cleanup of expired tokens
  - Email notifications

## Development

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Language**: TypeScript 5
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **OCR**: Tesseract.js
- **Image Processing**: Sharp
- **Logging**: Winston
- **Email**: Nodemailer
- **Validation**: Zod
- **Testing**: Jest with Supertest
- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

**Optional:**

- **Docker** 20.10+ and **Docker Compose** 2.0+ ([Download](https://www.docker.com/))

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/expense-tracker-api.git
cd expense-tracker-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

**Required for authentication:**

- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_REFRESH_SECRET` - Generate with: `openssl rand -base64 32`

**Required for email (password reset):**

- `GMAIL_USER` - Your Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password ([How to get](https://support.google.com/accounts/answer/185833))

### 4. Set Up Database

Run Prisma migrations to create the database schema:

```bash
npm run migrate:dev
```

This creates:

- SQLite database at `./data/expense-tracker.db`
- Prisma Client for type-safe database access

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

**Health Check**: `http://localhost:3000/health`

### 6. Run Tests (Optional)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## \ud83d\udd11 Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_PATH=./data/expense-tracker.db

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (REQUIRED for password reset)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# Logging Configuration
LOG_ENABLED=true
LOG_LEVEL=debug  # error | warn | info | http | debug

# Security
CORS_ORIGIN=*  # Use specific origins in production
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# API Configuration
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

### Gmail App Password Setup

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Other (Custom name)"
4. Generate and copy the 16-character password
5. Use this password in `GMAIL_APP_PASSWORD`

## \ud83d\udcda API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

Most endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <access_token>
```

### Endpoints

#### Authentication

| Method | Endpoint                | Description            | Auth Required |
| ------ | ----------------------- | ---------------------- | ------------- |
| POST   | `/auth/register`        | Register new user      | No            |
| POST   | `/auth/login`           | Login user             | No            |
| POST   | `/auth/refresh`         | Refresh access token   | No            |
| POST   | `/auth/logout`          | Logout user            | Yes           |
| POST   | `/auth/forgot-password` | Request password reset | No            |
| POST   | `/auth/verify-code`     | Verify reset code      | No            |
| POST   | `/auth/reset-password`  | Reset password         | No            |

#### Users

| Method | Endpoint          | Description      | Auth Required |
| ------ | ----------------- | ---------------- | ------------- |
| GET    | `/users/profile`  | Get user profile | Yes           |
| PUT    | `/users/profile`  | Update profile   | Yes           |
| PUT    | `/users/password` | Change password  | Yes           |

#### Expenses

| Method | Endpoint            | Description               | Auth Required |
| ------ | ------------------- | ------------------------- | ------------- |
| GET    | `/expenses`         | List expenses (paginated) | Yes           |
| GET    | `/expenses/:id`     | Get expense by ID         | Yes           |
| POST   | `/expenses`         | Create expense            | Yes           |
| PUT    | `/expenses/:id`     | Update expense            | Yes           |
| DELETE | `/expenses/:id`     | Delete expense            | Yes           |
| PUT    | `/expenses/reorder` | Update expense order      | Yes           |

#### Invoice Analysis

| Method | Endpoint            | Description         | Auth Required |
| ------ | ------------------- | ------------------- | ------------- |
| POST   | `/invoices/analyze` | Analyze JPG invoice | Yes           |

#### Health

| Method | Endpoint  | Description  | Auth Required |
| ------ | --------- | ------------ | ------------- |
| GET    | `/health` | Health check | No            |

### Example Requests

#### Register User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Response:**

```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Create Expense

```bash
curl -X POST http://localhost:3000/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "Coffee",
    "amount": 4.50,
    "currency": "USD",
    "date": "2025-01-18"
  }'
```

#### List Expenses

```bash
curl -X GET "http://localhost:3000/expenses?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

#### Analyze Invoice

```bash
curl -X POST http://localhost:3000/invoices/analyze \
  -H "Authorization: Bearer <access_token>" \
  -F "invoice=@/path/to/invoice.jpg"
```

**Response:**

```json
{
  "name": "Grocery Store",
  "amount": 45.99,
  "currency": "USD",
  "date": "2025-01-18"
}
```

### Interactive API Testing

Open `test-api.html` or `test-api-auth.html` in a browser for interactive API testing with a user-friendly interface.

## \ud83d\udee0 Development

### Available Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start development server with hot reload |
| `npm run build`         | Build TypeScript to JavaScript           |
| `npm start`             | Start production server                  |
| `npm test`              | Run tests                                |
| `npm run test:watch`    | Run tests in watch mode                  |
| `npm run test:coverage` | Run tests with coverage report           |
| `npm run lint`          | Lint code with ESLint                    |
| `npm run lint:fix`      | Fix linting issues                       |
| `npm run format`        | Format code with Prettier                |
| `npm run migrate:dev`   | Run database migrations (development)    |
| `npm run migrate`       | Run database migrations (production)     |
| `npm run validate`      | Run lint and format checks               |

### Code Quality

The project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for Git hooks
- **lint-staged** for pre-commit checks

Commits are automatically validated for:

- TypeScript compilation
- Linting rules
- Code formatting
- Test passing

### Database Migrations

**Create new migration:**

```bash
npx prisma migrate dev --name your_migration_name
```

**Apply migrations:**

```bash
npm run migrate:dev  # Development
npm run migrate      # Production
```

**View database:**

```bash
npx prisma studio
```

Opens Prisma Studio at `http://localhost:5555` for visual database management.

## \ud83e\uddea Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- expenses.controller.test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

Tests are located in the `tests/` directory:

```
tests/
\u251c\u2500\u2500 auth/
\u2502   \u251c\u2500\u2500 auth.controller.test.ts
\u2502   \u251c\u2500\u2500 auth.middleware.test.ts
\u2502   \u2514\u2500\u2500 password-reset.controller.test.ts
\u251c\u2500\u2500 users/
\u2502   \u2514\u2500\u2500 users.controller.test.ts
\u251c\u2500\u2500 expenses.controller.test.ts
\u251c\u2500\u2500 mocks.ts
\u2514\u2500\u2500 setup.ts
```

### Test Coverage

Current coverage:

- **Statements**: 85%+
- **Branches**: 80%+
- **Functions**: 85%+
- **Lines**: 85%+

Coverage reports are generated in `coverage/` directory.

## \ud83d\udc33 Docker

### Build and Run with Docker

**Build image:**

```bash
docker build -t expensetracker-api .
```

**Run container:**

```bash
docker run -d \
  --name expensetracker-api \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -e JWT_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  -e GMAIL_USER=your-email@gmail.com \
  -e GMAIL_APP_PASSWORD=your-password \
  expensetracker-api
```

### Docker Compose

**Start all services:**

```bash
docker-compose up -d
```

**View logs:**

```bash
docker-compose logs -f
```

**Stop services:**

```bash
docker-compose down
```

**Rebuild after changes:**

```bash
docker-compose up -d --build
```

### Docker Configuration

The project includes:

- **Dockerfile** - Multi-stage optimized production build
- **docker-compose.yml** - Development environment
- **docker-compose.production.yml** - Production deployment
- **.dockerignore** - Excluded files from image

**Features:**

- Multi-stage build (builder + production)
- Alpine-based images (~120MB final size)
- Non-root user for security
- Health checks every 30 seconds
- Volume mounts for data persistence
- Automatic restart on failure

## \ud83d\ude80 Deployment

### GitHub Actions CI/CD

The project includes automated CI/CD pipeline (`.github/workflows/ci.yml`):

**Pipeline Stages:**

1. **Code Quality** - ESLint, Prettier checks
2. **Type Checking** - TypeScript compilation
3. **Tests** - Unit and integration tests
4. **Build** - Application build verification
5. **Docker Build** - Container build and test
6. **Security Audit** - npm audit, Trivy scan
7. **Docker Push** - Push to GitHub Container Registry (on master)
8. **Deploy** - Deploy to production (on master)

**Deployment Options:**

- Custom server via SSH + Docker
- Docker Compose orchestration

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

### Quick Production Deployment

1. Set up production server with Docker
2. Configure GitHub Secrets (deployment credentials, JWT secrets, etc.)
3. Push to master branch
4. Automated deployment via GitHub Actions

**Required GitHub Secrets:**

- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`

### Manual Deployment

```bash
# Build application
npm run build

# Run migrations
npm run migrate

# Start production server
NODE_ENV=production npm start
```

## Project Structure

```
expensetracker-api/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
├── prisma/
│   ├── migrations/             # Database migrations
│   └── schema.prisma           # Database schema
├── src/
│   ├── auth/                   # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.middleware.ts
│   │   ├── auth.service.ts
│   │   └── dto/
│   ├── config/                 # Configuration
│   │   └── index.ts
│   ├── db/                     # Database client
│   │   └── index.ts
│   ├── expenses/               # Expenses module
│   │   ├── expenses.controller.ts
│   │   ├── expenses.service.ts
│   │   └── dto/
│   ├── helpers/                # Utilities
│   │   ├── Logger.ts
│   │   └── middlewares/
│   ├── invoices/               # Invoice OCR module
│   │   ├── invoice-analysis.controller.ts
│   │   └── invoice-analysis.service.ts
│   ├── routes/                 # Route definitions
│   ├── services/               # Background services
│   │   ├── cache.service.ts
│   │   ├── email.service.ts
│   │   └── scheduler.service.ts
│   ├── users/                  # Users module
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── app.ts                  # Express app setup
│   └── index.ts                # Entry point
├── tests/                      # Test files
├── .dockerignore
├── .env.example
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── jest.config.mjs
├── package.json
├── README.md
└── tsconfig.json
```

### Key Modules

- **auth/** - User authentication, JWT tokens, password reset
- **users/** - User profile management
- **expenses/** - Expense CRUD operations, filtering, ordering
- **invoices/** - OCR invoice scanning and parsing
- **helpers/** - Logger, middlewares, utilities
- **services/** - Background jobs, email, caching

## \ud83e\udd1d Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards

- Follow existing code style (enforced by ESLint/Prettier)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep commits atomic and well-described

### Pull Request Process

1. Update README.md if needed
2. Ensure test coverage remains above 80%
3. Update API documentation for new endpoints
4. Request review from maintainers
5. Ensure CI/CD pipeline passes

## License

ISC

## Author

**Igor Golubenkov**

## Related Projects

- [ExpenseTracker Frontend](https://github.com/yourusername/expense-tracker-frontend) - React frontend application

## Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing issues and documentation
- Review DEPLOYMENT_GUIDE.md and MONITORING.md for ops-related questions

## Acknowledgments

- Built as a test project for JS division
- Implements modern Node.js/Express.js best practices
- Includes production-ready CI/CD pipeline
- Comprehensive testing and documentation

---

**Happy Expense Tracking!**
