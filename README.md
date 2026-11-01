# Child Health API — WombTo18 Technical Assessment (Level 2)

A modular, robust REST API built with **Node.js**, **Express.js**, and persistent **SQLite** storage for child health profile management and vaccination reminder tracking.

---

## 🌟 Key Features & Level 2 Upgrades

- **Persistent SQLite Database**: Replaced the Level 1 in-memory store with SQLite using `better-sqlite3`. Data persists across server restarts.
- **Relational Integrity**: Foreign key constraints enforced at both the database level (`PRAGMA foreign_keys = ON`) and application service layer.
- **Data Access Layer**: Repositories encapsulate all database queries using strictly parameterized prepared statements to eliminate SQL injection vulnerabilities.
- **Enhanced Validation**:
  - Rejection of empty or whitespace-only strings.
  - Strict calendar-accurate `YYYY-MM-DD` date validation (prevents leap-year and month-overflow errors).
  - Validation ensuring `dateOfBirth` is not in the future.
  - Standardized consent status values (booleans or `'granted'`, `'denied'`, `'pending'`, `'revoked'`).
  - Strict reminder statuses (`'scheduled'`, `'completed'`, `'pending'`, `'cancelled'`, `'overdue'`).
  - Proper UUID format checks for `childId`.
- **Centralized Error Handling**: Standardized JSON error response format without leaking database details or internal stack traces.
- **Automated API Testing**: Fully automated test suite built with **Jest** and **Supertest** running against an isolated in-memory test database.

---

## 📁 Project Structure

```text
ChildHealthAPI/
├── controllers/
│   ├── childController.js       # Request handling for /children
│   ├── healthController.js      # System health and DB connectivity check
│   └── reminderController.js    # Request handling for /reminders
├── database/
│   ├── db.js                    # SQLite connection, schema setup & PRAGMA configurations
│   ├── childRepository.js       # Parameterized SQL queries for children
│   └── reminderRepository.js    # Parameterized SQL queries for reminders
├── middleware/
│   └── errorHandler.js          # Centralized error handler
├── routes/
│   ├── childRoutes.js           # Express routes for /children
│   ├── healthRoutes.js          # Express route for /health
│   └── reminderRoutes.js        # Express routes for /reminders
├── services/
│   ├── childService.js          # Child business logic & UUID generation
│   └── reminderService.js       # Reminder business logic & referential checks
├── utils/
│   ├── AppError.js              # Operational error class
│   └── validator.js             # Comprehensive request & date validation rules
├── tests/
│   └── api.test.js              # Jest & Supertest integration test suite
├── test/
│   └── sample-tests.js          # Standalone runner test script
├── data/                        # Persistent SQLite database directory (gitignored)
├── .gitignore                   # Ignore rules for node_modules, DB files, logs, etc.
├── app.js                       # Express application setup & middleware assembly
├── server.js                    # Server bootstrap, database init & graceful shutdown
├── package.json                 # Project configuration & npm scripts
└── README.md                    # Project documentation
```

---

## ⚙️ Environment Configuration

The application works out of the box with default settings. Optional environment variables can be configured:

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `3000` | Port on which the HTTP server listens |
| `NODE_ENV` | `development` | Set to `test` during testing to isolate storage in `:memory:` |
| `DB_PATH` | `./data/child_health.db` | Custom file path for the SQLite database |

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended, tested on Node v22)
- **npm** (v9.0.0 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
Start the production server:
```bash
npm start
```

Or start with auto-reload for development:
```bash
npm run dev
```

The server will be reachable at:
```
http://localhost:3000
```

---

## 🧪 Running Automated Tests

Run the full Jest test suite with Supertest:
```bash
npm test
```

Generate test coverage reports:
```bash
npm run test:coverage
```

All 16 test cases execute against an isolated `:memory:` database, ensuring zero contamination of your development data.

---

## 📡 API Reference & Example Requests

### 1. Health Check
Checks system health, uptime, and live SQLite database connectivity.

- **Method**: `GET`
- **Endpoint**: `/health`
- **Response Code**: `200 OK`

#### Sample Response:
```json
{
  "status": "UP",
  "service": "Child Health API",
  "database": "connected",
  "uptime": 11.20,
  "timestamp": "2026-11-01T04:22:51.352Z"
}
```

---

### 2. Register a Child
Registers a child profile with an automatically generated UUID.

- **Method**: `POST`
- **Endpoint**: `/children`
- **Headers**: `Content-Type: application/json`
- **Response Code**: `201 Created` (`400 Bad Request` if invalid)

#### Payload Requirements:
- `name` *(string, mandatory)*: 2–100 characters.
- `dateOfBirth` *(string, mandatory)*: `YYYY-MM-DD` calendar date (cannot be in the future).
- `guardianName` *(string, mandatory)*: 2–100 characters.
- `state` *(string, mandatory)*: 2–50 characters.
- `consentStatus` *(boolean or string, mandatory)*: `true`, `false`, or `'granted'`, `'denied'`, `'pending'`, `'revoked'`.

#### Sample Request:
```bash
curl -X POST http://localhost:3000/children \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kavya Nair",
    "dateOfBirth": "2023-07-19",
    "guardianName": "Radhika Nair",
    "state": "Kerala",
    "consentStatus": true
  }'
```

#### Sample Response (`201 Created`):
```json
{
  "id": "a2ccc169-bb0b-494a-8178-ccdde2693362",
  "name": "Kavya Nair",
  "dateOfBirth": "2023-07-19",
  "guardianName": "Radhika Nair",
  "state": "Kerala",
  "consentStatus": true,
  "createdAt": "2026-11-01T04:22:51.430Z"
}
```

---

### 3. Retrieve Child Profile
Fetches a child profile by ID.

- **Method**: `GET`
- **Endpoint**: `/children/:id`
- **Response Code**: `200 OK` (`400 Bad Request` if ID is invalid UUID, `404 Not Found` if nonexistent)

#### Sample Request:
```bash
curl http://localhost:3000/children/a2ccc169-bb0b-494a-8178-ccdde2693362
```

#### Sample Response (`200 OK`):
```json
{
  "id": "a2ccc169-bb0b-494a-8178-ccdde2693362",
  "name": "Kavya Nair",
  "dateOfBirth": "2023-07-19",
  "guardianName": "Radhika Nair",
  "state": "Kerala",
  "consentStatus": true,
  "createdAt": "2026-11-01T04:22:51.430Z"
}
```

#### Nonexistent Child (`404 Not Found`):
```json
{
  "error": "Child not found",
  "message": "No child found with ID '00000000-0000-0000-0000-000000000000'"
}
```

---

### 4. Create Vaccination Reminder
Schedules a vaccination reminder for a registered child.

- **Method**: `POST`
- **Endpoint**: `/reminders`
- **Headers**: `Content-Type: application/json`
- **Response Code**: `201 Created` (`400 Bad Request` if invalid, `404 Not Found` if child does not exist)

#### Payload Requirements:
- `childId` *(string, mandatory)*: Valid UUID of an existing child.
- `vaccineName` *(string, mandatory)*: 2–100 characters.
- `dueDate` *(string, mandatory)*: Valid calendar date in `YYYY-MM-DD` format.
- `status` *(string, mandatory)*: One of `scheduled`, `completed`, `pending`, `cancelled`, `overdue`.

#### Sample Request:
```bash
curl -X POST http://localhost:3000/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "a2ccc169-bb0b-494a-8178-ccdde2693362",
    "vaccineName": "Rotavirus Dose 2",
    "dueDate": "2026-12-05",
    "status": "scheduled"
  }'
```

#### Sample Response (`201 Created`):
```json
{
  "id": "404db1a3-941b-470c-b297-01072d835c41",
  "childId": "a2ccc169-bb0b-494a-8178-ccdde2693362",
  "vaccineName": "Rotavirus Dose 2",
  "dueDate": "2026-12-05",
  "status": "scheduled",
  "createdAt": "2026-11-01T04:22:51.441Z"
}
```

#### Nonexistent Child (`404 Not Found`):
```json
{
  "error": "Child not found",
  "message": "Cannot create reminder: Child with ID '00000000-0000-0000-0000-000000000000' was not found."
}
```

---

## 🛡️ Centralized Error Responses

All errors are handled uniformly across the application:

| Error Case | HTTP Status | Format |
|---|---|---|
| Missing mandatory fields | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Empty / whitespace string | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Invalid date format | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Future dateOfBirth | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Invalid reminder status | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Malformed JSON syntax | `400 Bad Request` | `{"error": "Malformed JSON", "message": "..."}` |
| Child ID not found | `404 Not Found` | `{"error": "Child not found", "message": "..."}` |
| Route not found | `404 Not Found` | `{"error": "Not Found", "message": "..."}` |
| Database constraint error | `404 / 409 / 500` | Sanitized JSON without exposing internal SQL |
| Unhandled server error | `500 Internal Server Error` | `{"error": "Internal Server Error", "message": "..."}` |

---

## 🔒 Synthetic Data Compliance

All test cases, demonstrations, and documentation strictly use synthetic, non-identifiable test data in compliance with technical assessment standards.
