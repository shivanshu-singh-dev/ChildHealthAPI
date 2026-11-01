# Child Health API

A robust, modular REST API built with **Node.js**, **Express.js**, and persistent **SQLite** storage for child health profile management and vaccination reminder tracking.

---

## 🌟 Security & Architecture Features

### 1. Identity & Access Control
- **Guardian Identity Management**: Relational `guardians` database table storing guardian profiles.
- **Mock Bearer Authentication**: Secures protected endpoints using `Authorization: Bearer <token>`.
- **Pre-configured Test Tokens**:
  - `mock-token-priya` (Associated with guardian Priya Sharma, ID: `guardian-101`)
  - `mock-token-rohit` (Associated with guardian Rohit Sen, ID: `guardian-102`)
- **Strict Ownership Enforcement**: Children are linked to the authenticated guardian upon registration. Guardians can only retrieve profiles and schedule vaccination reminders for children they own. Cross-guardian access attempts return `403 Forbidden`.

### 2. Consent & Data Protection
- **Standardized Consent Lifecycle**: Enforces standardized consent statuses (`'granted'`, `'denied'`, `'pending'`, `'revoked'`). Booleans (`true`/`false`) are automatically normalized to `'granted'`/`'denied'`.
- **Consent Pre-condition Check**: Vaccination reminders are blocked with `403 Forbidden` if active granted consent is not present on the child record.
- **Data Minimization**: API responses expose only required profile fields, omitting internal foreign keys, credentials, or tokens.
- **Redacted Safe Logging**: Request logging explicitly strips authorization headers, tokens, and sensitive personal identifiable information (PII) from log streams.

### 3. Application-Level Protection
- **Helmet Security Headers**: Injects HTTP security headers including `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Strict-Transport-Security`.
- **CORS Configuration**: Configures cross-origin access control policies.
- **Request Body Size Limits**: Enforces a strict `10kb` body size limit on JSON payloads to prevent memory exhaustion and payload injection attacks.
- **Rate Limiting**: Protects endpoints against brute-force and denial-of-service attempts via `express-rate-limit` with standard HTTP rate limit headers.
- **Centralized Error Boundary**: Sanitizes operational and database errors to prevent leaking internal stack traces or SQL statements.

---

## 📁 Project Structure

```text
ChildHealthAPI/
├── controllers/
│   ├── childController.js          # Handles child registration & profile retrieval
│   ├── healthController.js         # Health check and database connectivity probe
│   └── reminderController.js       # Handles vaccination reminder scheduling
├── database/
│   ├── db.js                       # SQLite initialization, pragmas, and schema migrations
│   ├── childRepository.js          # Parameterized data access for children table
│   ├── guardianRepository.js       # Parameterized data access for guardians table
│   └── reminderRepository.js       # Parameterized data access for reminders table
├── middleware/
│   ├── auth.js                     # Mock Bearer token authentication middleware
│   ├── errorHandler.js             # Centralized JSON error handling
│   ├── logger.js                   # Safe request logging redacting sensitive headers
│   └── rateLimiter.js              # IP-based rate limiting middleware
├── routes/
│   ├── childRoutes.js              # Express routing for /children
│   ├── healthRoutes.js             # Express routing for /health
│   └── reminderRoutes.js           # Express routing for /reminders
├── services/
│   ├── childService.js             # Child business logic & UUID generation
│   └── reminderService.js          # Reminder business logic, ownership & consent checks
├── utils/
│   ├── AppError.js                 # Custom operational error wrapper
│   └── validator.js                # Input sanitization and calendar date validation
├── tests/
│   └── api.test.js                 # Comprehensive Jest & Supertest integration suite
├── test/
│   └── sample-tests.js             # Standalone runner test script
├── data/                           # Directory storing SQLite database file (gitignored)
├── .gitignore                      # Git exclusion rules
├── app.js                          # Express application pipeline & middleware configuration
├── server.js                       # HTTP server bootstrap and graceful shutdown hooks
├── package.json                    # Project metadata, scripts, and dependencies
└── README.md                       # Documentation
```

---

## ⚙️ Environment Configuration

Optional environment variables:

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `3000` | Port for the HTTP server |
| `NODE_ENV` | `development` | Setting to `test` runs the database in `:memory:` |
| `DB_PATH` | `./data/child_health.db` | Custom file path for SQLite database |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `RATE_LIMIT_MAX` | `100` | Max requests per rate limit window |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 mins) | Duration for rate limit window |

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Or with automatic reload during development:
```bash
npm run dev
```

The server will listen at:
```
http://localhost:3000
```

---

## 🧪 Automated Testing

Execute the comprehensive test suite with Jest and Supertest:
```bash
npm test
```

Execute tests with coverage:
```bash
npm run test:coverage
```

Tests run against an isolated in-memory SQLite database (`:memory:`), ensuring zero test side effects on production data.

---

## 📡 API Reference

### 1. Health Check
Checks system health, uptime, and live SQLite database connectivity.

- **Method**: `GET`
- **Endpoint**: `/health`
- **Authentication**: None (Public)
- **Response Code**: `200 OK`

```bash
curl http://localhost:3000/health
```

#### Sample Response:
```json
{
  "status": "UP",
  "service": "Child Health API",
  "database": "connected",
  "uptime": 12.45,
  "timestamp": "2026-11-01T04:22:51.352Z"
}
```

---

### 2. Register Child
Registers a child profile linked to the authenticated guardian.

- **Method**: `POST`
- **Endpoint**: `/children`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer mock-token-priya`
- **Response Code**: `201 Created` (`400 Bad Request`, `401 Unauthorized`)

#### Sample Request:
```bash
curl -X POST http://localhost:3000/children \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token-priya" \
  -d '{
    "name": "Aarav Sharma",
    "dateOfBirth": "2023-04-12",
    "guardianName": "Priya Sharma",
    "state": "Maharashtra",
    "consentStatus": "granted"
  }'
```

#### Sample Response (`201 Created`):
```json
{
  "id": "a2ccc169-bb0b-494a-8178-ccdde2693362",
  "name": "Aarav Sharma",
  "dateOfBirth": "2023-04-12",
  "guardianName": "Priya Sharma",
  "state": "Maharashtra",
  "consentStatus": "granted",
  "createdAt": "2026-11-01T04:22:51.430Z"
}
```

---

### 3. Retrieve Child Profile
Fetches a child profile. Requires guardian ownership.

- **Method**: `GET`
- **Endpoint**: `/children/:id`
- **Headers**: `Authorization: Bearer mock-token-priya`
- **Response Code**: `200 OK` (`401 Unauthorized`, `403 Forbidden`, `404 Not Found`)

```bash
curl http://localhost:3000/children/a2ccc169-bb0b-494a-8178-ccdde2693362 \
  -H "Authorization: Bearer mock-token-priya"
```

#### Sample Response (`200 OK`):
```json
{
  "id": "a2ccc169-bb0b-494a-8178-ccdde2693362",
  "name": "Aarav Sharma",
  "dateOfBirth": "2023-04-12",
  "guardianName": "Priya Sharma",
  "state": "Maharashtra",
  "consentStatus": "granted",
  "createdAt": "2026-11-01T04:22:51.430Z"
}
```

#### Cross-Guardian Access Response (`403 Forbidden`):
```json
{
  "error": "Forbidden",
  "message": "Access denied: You do not have permission to view this child's profile."
}
```

---

### 4. Create Vaccination Reminder
Schedules a reminder for a child. Enforces guardian ownership and active granted consent.

- **Method**: `POST`
- **Endpoint**: `/reminders`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer mock-token-priya`
- **Response Code**: `201 Created` (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`)

#### Sample Request:
```bash
curl -X POST http://localhost:3000/reminders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token-priya" \
  -d '{
    "childId": "a2ccc169-bb0b-494a-8178-ccdde2693362",
    "vaccineName": "MMR Dose 1",
    "dueDate": "2026-12-15",
    "status": "scheduled"
  }'
```

#### Sample Response (`201 Created`):
```json
{
  "id": "404db1a3-941b-470c-b297-01072d835c41",
  "childId": "a2ccc169-bb0b-494a-8178-ccdde2693362",
  "vaccineName": "MMR Dose 1",
  "dueDate": "2026-12-15",
  "status": "scheduled",
  "createdAt": "2026-11-01T04:22:51.441Z"
}
```

#### Denied/Revoked Consent Response (`403 Forbidden`):
```json
{
  "error": "Consent Required",
  "message": "Cannot create reminder: Active granted consent is required. Current consent status is 'denied'."
}
```

---

## 🛡️ Error Response Structure

All application errors return structured JSON:

| Scenario | HTTP Status | Format |
|---|---|---|
| Missing or invalid Bearer token | `401 Unauthorized` | `{"error": "Unauthorized", "message": "..."}` |
| Cross-guardian access attempt | `403 Forbidden` | `{"error": "Forbidden", "message": "..."}` |
| Reminder creation without consent | `403 Forbidden` | `{"error": "Consent Required", "message": "..."}` |
| Validation failure | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Malformed JSON body | `400 Bad Request` | `{"error": "Malformed JSON", "message": "..."}` |
| Resource not found | `404 Not Found` | `{"error": "Child not found", "message": "..."}` |
| Body size exceeds 10kb | `413 Payload Too Large` | `{"error": "Payload Too Large", "message": "..."}` |
| Rate limit exceeded | `429 Too Many Requests` | `{"error": "Too Many Requests", "message": "..."}` |
| Unhandled server error | `500 Internal Server Error` | `{"error": "Internal Server Error", "message": "..."}` |
