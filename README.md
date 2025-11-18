# ExpenseTracker API

> A RESTful API for tracking personal expenses with OCR invoice scanning, user authentication, and comprehensive expense management.

## 📋 Table of Contents

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

## ✨ Features

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

## 🛠 Tech Stack

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

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

**Optional:**

- **Docker** 20.10+ and **Docker Compose** 2.0+ ([Download](https://www.docker.com/))

## 🚀 Getting Started

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

## \ud83d\udcc2 Project Structure

```
expensetracker-api/
\u251c\u2500\u2500 .github/
\u2502   \u2514\u2500\u2500 workflows/
\u2502       \u2514\u2500\u2500 ci.yml              # CI/CD pipeline
\u251c\u2500\u2500 prisma/
\u2502   \u251c\u2500\u2500 migrations/             # Database migrations
\u2502   \u2514\u2500\u2500 schema.prisma           # Database schema
\u251c\u2500\u2500 src/
\u2502   \u251c\u2500\u2500 auth/                   # Authentication module
\u2502   \u2502   \u251c\u2500\u2500 auth.controller.ts
\u2502   \u2502   \u251c\u2500\u2500 auth.middleware.ts
\u2502   \u2502   \u251c\u2500\u2500 auth.service.ts
\u2502   \u2502   \u2514\u2500\u2500 dto/
\u2502   \u251c\u2500\u2500 config/                 # Configuration
\u2502   \u2502   \u2514\u2500\u2500 index.ts
\u2502   \u251c\u2500\u2500 db/                     # Database client
\u2502   \u2502   \u2514\u2500\u2500 index.ts
\u2502   \u251c\u2500\u2500 expenses/               # Expenses module
\u2502   \u2502   \u251c\u2500\u2500 expenses.controller.ts
\u2502   \u2502   \u251c\u2500\u2500 expenses.service.ts
\u2502   \u2502   \u2514\u2500\u2500 dto/
\u2502   \u251c\u2500\u2500 helpers/                # Utilities
\u2502   \u2502   \u251c\u2500\u2500 Logger.ts
\u2502   \u2502   \u2514\u2500\u2500 middlewares/
\u2502   \u251c\u2500\u2500 invoices/               # Invoice OCR module
\u2502   \u2502   \u251c\u2500\u2500 invoice-analysis.controller.ts
\u2502   \u2502   \u2514\u2500\u2500 invoice-analysis.service.ts
\u2502   \u251c\u2500\u2500 routes/                 # Route definitions
\u2502   \u251c\u2500\u2500 services/               # Background services
\u2502   \u2502   \u251c\u2500\u2500 cache.service.ts
\u2502   \u2502   \u251c\u2500\u2500 email.service.ts
\u2502   \u2502   \u2514\u2500\u2500 scheduler.service.ts
\u2502   \u251c\u2500\u2500 users/                  # Users module
\u2502   \u2502   \u251c\u2500\u2500 users.controller.ts
\u2502   \u2502   \u251c\u2500\u2500 users.service.ts
\u2502   \u2502   \u2514\u2500\u2500 dto/
\u2502   \u251c\u2500\u2500 app.ts                  # Express app setup
\u2502   \u2514\u2500\u2500 index.ts                # Entry point
\u251c\u2500\u2500 tests/                      # Test files
\u251c\u2500\u2500 .dockerignore
\u251c\u2500\u2500 .env.example
\u251c\u2500\u2500 .gitignore
\u251c\u2500\u2500 .prettierrc
\u251c\u2500\u2500 docker-compose.yml
\u251c\u2500\u2500 Dockerfile
\u251c\u2500\u2500 eslint.config.mjs
\u251c\u2500\u2500 jest.config.mjs
\u251c\u2500\u2500 package.json
\u251c\u2500\u2500 README.md
\u2514\u2500\u2500 tsconfig.json
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

## \ud83d\udcdd License

ISC

## \ud83d\udc68\u200d\ud83d\udcbb Author

**Igor Golubenkov**

## \ud83d\udd17 Related Projects

- [ExpenseTracker Frontend](https://github.com/yourusername/expense-tracker-frontend) - React frontend application

## \ud83d\udcde Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing issues and documentation
- Review DEPLOYMENT_GUIDE.md and MONITORING.md for ops-related questions

## \u2b50 Acknowledgments

- Built as a test project for JS division
- Implements modern Node.js/Express.js best practices
- Includes production-ready CI/CD pipeline
- Comprehensive testing and documentation

---

**Happy Expense Tracking! \ud83d\udcb0**"

- Validate the file format and size (jpg, ≤5MB)
- Do not save the file anywhere
- Analyze the image and return an object with fields: name, amount, currency (USD/EUR), date
- Return an error if the file could not be parsed
- Add unit tests for the endpoint and logic
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 2: Saving the order in which records are displayed</summary>

---

**Description:**

Drag & drag functionality will be added to the frontend. It is necessary to provide support for this functionality on the backend.

**Acceptance Criteria:**

- A new field has been added to the `Expenses` model to save the display order of a record.
- Added a new endpoint for updating the order of records.
- Updated endpoint for receiving records. Now the data should be sorted by the order field.

---

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 2 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Add a new field to the `Expenses` model to store the display order
- Create a new endpoint for updating the order of records
- Update the endpoint for retrieving records to sort by the order field
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 3: Add logger</summary>

---

**Description:**

To improve debugging, monitoring, and error tracking, we need to integrate a logging system into the project. The logger should provide different log levels (e.g., info, warn, error, debug) and support structured logging.

**Acceptance Criteria:**

- A logging system has been implemented with support for multiple log levels (e.g., info, warn, error, debug).
- Logs have been structured to include timestamps and relevant contextual information.
- Logging has been added to key application areas, such as API requests, database operations, and error handling.
- A mechanism has been introduced to store logs efficiently, supporting both local and external log management solutions.
- Configuration options have been provided to enable or disable logging in different environments (development, production).
- Unit tests added.
- ***

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 3 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Integrate a logging system with multiple log levels (info, warn, error, debug)
- Structure logs with timestamps and contextual information
- Add logging to key areas: API requests, DB operations, error handling
- Support both local and external log management solutions
- Provide configuration for enabling/disabling logging in different environments
- Add unit tests for logging logic
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 4: Analyze and Optimize RPS Performance</summary>

---

**Description:**

To ensure optimal system performance and scalability, an analysis of the existing endpoints has been conducted. The goal was to identify bottlenecks, explore optimization opportunities, and implement improvements. After implementing the solutions, RPS was analyzed again to measure performance gains.

**Acceptance Criteria:**

- Existing endpoints have been analyzed to identify performance bottlenecks.
- Potential optimization techniques (e.g., caching, indexing, query optimization, load balancing, multi threads) have been evaluated and implemented where applicable.
- After optimizations, RPS has been measured again to assess performance improvements.
- A summary report with findings, implemented solutions, and performance comparisons has been created.

---

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 4 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Analyze existing endpoints to identify performance bottlenecks
- Evaluate and implement optimization techniques (caching, indexing, query optimization, load balancing, multi-threading) where applicable
- Measure RPS before and after optimizations
- Create a summary report with findings, solutions, and performance comparisons
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 5: Containerize Backend with Docker</summary>

---

**Description:**

To improve deployment efficiency and maintainability, the backend has been containerized using Docker. The application can now be consistently deployed across different environments with minimal configuration overhead.

**Acceptance Criteria:**

- A Dockerfile has been created and optimized for production use.
- A .dockerignore file has been added to exclude unnecessary files from the image.
- The application runs successfully inside a Docker container.
- Environment variables are managed securely and injected into the container.
- The container has been tested locally to ensure it functions correctly.

---

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 5 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Create and optimize a Dockerfile for production use
- Add a .dockerignore file to exclude unnecessary files
- Ensure the application runs successfully inside a Docker container
- Manage environment variables securely and inject them into the container
- Test the container locally
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 6: Add GitHub Action for CI/CD</summary>

---

**Description:**

To automate the development workflow, a GitHub Action has been added. This workflow ensures that all necessary checks are performed before merging code changes.

**Acceptance Criteria:**

- A GitHub Action workflow file (`.github/workflows/ci.yml`) has been created.
- The workflow includes the following steps:
  - Run unit and integration tests.
  - Perform type checking.
  - Check code formatting (e.g., Prettier, ESLint).
  - Build the application to ensure there are no compilation errors.
  - Build a Docker container to validate the deployment process.
- The workflow runs automatically on every pull request and push to main.
- Status checks have been integrated into GitHub to prevent merging if tests fail.

---

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 6 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Create a GitHub Action workflow file (`.github/workflows/ci.yml`)
- Add steps for running unit/integration tests, type checking, code formatting, building the app, and building a Docker container
- Ensure the workflow runs on every pull request and push to main
- Integrate status checks to prevent merging if tests fail
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 7: Deploy Application</summary>

---

**Description:**

To make the application available for production use, a deployment pipeline has been set up. The deployment process ensures smooth updates with minimal downtime.

**Acceptance Criteria:**

- The backend application has been deployed to the target environment.
- The deployment process is automated through a CI/CD pipeline.
- Environment variables are securely injected during deployment.
- Monitoring and logging tools have been configured to track application performance.

---

<details>
<summary>AI Prompt (NodeJS)</summary>

Perform Backend Task 7 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Deploy the backend application to the target environment
- Automate the deployment process through a CI/CD pipeline
- Securely inject environment variables during deployment
- Configure monitoring and logging tools to track application performance
- Do not skip any Acceptance Criteria from the README
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

## Frontend

<details>
<summary>Task 1: Upload Invoice and Pre-fill Expense Form</summary>

---

**Description:**

To streamline the expense creation process, a feature for uploading invoices has been implemented. Users can upload a JPG image (up to 5MB) via a modal, and the backend extracts relevant data to pre-fill the expense form.

**Acceptance Criteria:**

- A "Upload Invoice" button has been added to the sidebar.
- Clicking the button opens a modal window.
- The modal supports drag & drop and file selection.
- Only JPG files up to 5MB are accepted.
- The image is sent to the backend, which returns extracted invoice data.
- The expense form is pre-filled with the received data.
- Proper validation and error handling have been implemented.
- Storybook added.
- Unit tests added.

---

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 1 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Add a "Upload Invoice" button to the sidebar
- Implement a modal window with drag & drop and file selection for JPG files up to 5MB
- Send the image to the backend and pre-fill the expense form with the received data
- Add validation and error handling for file type, size, and backend errors
- Add Storybook stories for the modal and upload components
- Add unit tests for the upload and pre-fill logic
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 2: Implement Drag & Drop Functionality</summary>

---

**Description:**

Drag & Drop functionality has been added to enhance usability. Users can now interact with expense table records.

**Acceptance Criteria:**

- Drag & Drop functionality has been integrated.
- The system correctly processes dropped elements.
- The previously created API endpoint is used to persist changes.

---

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 2 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Integrate drag & drop functionality for expense table records
- Use the backend API endpoint to persist the new order of records
- Ensure correct processing of dropped elements and update the UI accordingly
- Add unit tests for drag & drop logic
- Add Storybook stories for drag & drop components
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 3: DevTools and Render Optimization</summary>

---

**Description:**

To improve application performance, DevTools have been used to analyze and optimize unnecessary re-renders.

**Acceptance Criteria:**

- DevTools for performance analysis (React DevTools, Redux DevTools, why-did-you-render) have been installed.
- Components with excessive re-renders have been identified.
- Unnecessary renders have been optimized using memoization, useCallback, and useMemo where applicable.
- Performance improvements have been verified with updated benchmarks.

---

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 3 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Install and use DevTools (React DevTools, Redux DevTools, why-did-you-render) to analyze re-renders
- Identify components with excessive re-renders and optimize them using memoization, useCallback, and useMemo
- Verify performance improvements with updated benchmarks
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 4: Integrate Logging Tools (Sentry)</summary>

---

**Description:**

To improve error tracking and debugging, logging tools have been integrated into the frontend.

**Acceptance Criteria:**

- Sentry has been integrated for logging errors and performance issues.
- Source maps have been configured for better debugging.
- Global error boundaries have been added to prevent UI crashes.
- Logs include user actions and relevant context for debugging.

---

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 4 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Integrate Sentry for error and performance logging
- Configure source maps for better debugging
- Add global error boundaries to prevent UI crashes
- Ensure logs include user actions and relevant context
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 5: Add Docker Container for Frontend</summary>

---

**Description:**

To ensure consistency across environments, the frontend has been containerized using Docker.

**Acceptance Criteria:**

- A Dockerfile has been created for the frontend.
- A .dockerignore file has been added.
- The application runs successfully inside a Docker container.

---

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 5 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Create a Dockerfile and .dockerignore for the frontend
- Ensure the application runs successfully inside a Docker container
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 6: CI/CD for Frontend</summary>

---

**Description:**

A CI/CD pipeline has been added to automate testing, linting, and building of the frontend application.

**Acceptance Criteria:**

- A GitHub Action workflow has been created.
- The workflow includes:
  - Linting and formatting checks.
  - Unit and integration tests execution.
  - Building the frontend application.
  - Building a Docker image for deployment.
- The pipeline runs on pull requests and pushes to main.

---

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 6 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Create a GitHub Action workflow for the frontend (`.github/workflows/ci.yml`)
- Add steps for linting, formatting, unit/integration tests, building the app, and building a Docker image
- Ensure the pipeline runs on pull requests and pushes to main
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

<details>
<summary>Task 7: Deploy Frontend to Server</summary>

---

**Description:**

To make the frontend application accessible, an automated deployment pipeline has been set up.

**Acceptance Criteria:**

- The application has been deployed to the target environment.
- The deployment process is automated and triggered by the CI/CD pipeline.
- Environment variables are securely managed.

---

<details>
<summary>AI Prompt (React)</summary>

Perform Frontend Task 7 from the README file `ExpenseTracker/README.md`:

- Work in the `ExpenseTracker` folder
- Deploy the frontend application to the target environment
- Automate the deployment process via the CI/CD pipeline
- Ensure environment variables are securely managed
- After completion, provide a short report on what was done and what needs to be done manually

</details>

---

</details>

## Solution

In progress...

<!-- If you've already finished working on this part or are stuck, these repositories might be useful to you.
  - [API](https://github.com/petproject-dev/expense-tracker-backend-part-4) - Express.js
  - [UI](https://github.com/petproject-dev/expense-tracker-frontend-part-4) - React -->

## Found an Issue?

We strive to make the project as clear and helpful as possible. If you notice any errors, inconsistencies, or unclear instructions, please open a Pull Request in this repository with your suggested fixes or improvements. Your feedback helps improve the learning experience for everyone!

Happy coding, and good luck with this part of the project!
