# Child Health API — WombTo18 Technical Assessment (Level 1)

A clean, modular REST API built with **Node.js** and **Express.js** providing core child health registration and vaccination reminder management.

---

## 🌟 Project Highlights

- **Modular Architecture**: Clean separation of concerns across Routes, Controllers, Services, and Storage.
- **In-Memory Storage**: Fast, zero-configuration key-value storage using native JavaScript `Map` structures.
- **Strict Validation**: Input field sanitization, mandatory-field verification, calendar-correct date checking (`YYYY-MM-DD`), and future-birth prevention.
- **Robust Error Handling**: Standard HTTP status codes (`200`, `201`, `400`, `404`, `500`) with clear JSON error responses and graceful handling for malformed JSON payloads.
- **Test-Driven**: Comprehensive automated test suite verifying all required endpoints and edge cases.

---

## 📁 Project Structure

```text
ChildHealthAPI/
├── controllers/
│   ├── childController.js       # Handles child registration & profile retrieval logic
│   ├── healthController.js      # Handles health check status response
│   └── reminderController.js    # Handles vaccination reminder creation logic
├── routes/
│   ├── childRoutes.js           # Route definitions for /children
│   ├── healthRoutes.js          # Route definition for /health
│   └── reminderRoutes.js        # Route definitions for /reminders
├── services/
│   ├── childService.js          # Child business logic & UUID generation
│   └── reminderService.js       # Reminder business logic & child existence checks
├── storage/
│   └── memoryStore.js           # In-memory Map storage for children & reminders
├── utils/
│   └── validator.js             # Reusable validation & date verification helpers
├── test/
│   └── sample-tests.js          # Automated end-to-end test suite
├── .gitignore                   # Standard gitignore for Node.js
├── app.js                       # Express app configuration & middleware
├── server.js                    # HTTP server startup & port binding
├── package.json                 # Project metadata & npm scripts
└── README.md                    # Project documentation
```

---

## 🔄 Request Flow Explanation

When a client sends a request to the API, it follows a clean, single-direction flow:

```
[Client Request]
       │
       ▼
 [Express Middleware]  ── (JSON parsing & malformed JSON syntax catcher)
       │
       ▼
    [Router]           ── (e.g., routes/childRoutes.js routes to the right controller)
       │
       ▼
  [Controller]         ── (Validates inputs using utils/validator.js; returns 400 on failure)
       │
       ▼
   [Service]           ── (Executes business rules, e.g. verify child exists, generate UUID)
       │
       ▼
   [Storage]           ── (Saves/retrieves data from storage/memoryStore.js)
       │
       ▼
 [HTTP JSON Response]  ── (Returns status 200/201 with payload, or 404 if not found)
```

1. **Client Request**: A client sends an HTTP request (e.g., `POST /children`) with JSON headers and body.
2. **Middleware (`app.js`)**: `express.json()` parses the incoming body. If the JSON is malformed, custom error middleware immediately returns a `400 Bad Request` JSON error instead of crashing.
3. **Router (`routes/`)**: Maps the HTTP method and URL path to the corresponding controller function.
4. **Controller (`controllers/`)**: Invokes validation helpers (`utils/validator.js`). If invalid, responds with `400 Bad Request` and detailed error messages. If valid, forwards data to the service layer.
5. **Service (`services/`)**: Applies domain rules (such as generating unique UUIDs and checking child existence) and persists the record.
6. **Storage (`storage/memoryStore.js`)**: In-memory `Map` data structure holds the records during the server runtime.
7. **Response**: The controller returns the created/fetched object with the appropriate HTTP status code (`200 OK`, `201 Created`, or `404 Not Found`).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended, tested on Node v22)
- **npm** (v9.0.0 or higher)

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Run the Server
Start the production server:
```bash
npm start
```
Or start in development mode with auto-reload:
```bash
npm run dev
```

The server will be running at:
```
http://localhost:3000
```

### 3. Run Automated Tests
Execute the self-contained automated test suite:
```bash
npm test
```

---

## 📡 API Reference & Sample Requests

### 1. Health Check
Checks if the service is alive and healthy.

- **Method**: `GET`
- **Endpoint**: `/health`
- **Response Code**: `200 OK`

#### Sample Response:
```json
{
  "status": "UP",
  "service": "Child Health API",
  "uptime": 12.45,
  "timestamp": "2026-11-01T01:53:08.375Z"
}
```

---

### 2. Register Child
Registers a new child profile.

- **Method**: `POST`
- **Endpoint**: `/children`
- **Headers**: `Content-Type: application/json`
- **Response Code**: `201 Created` (or `400 Bad Request` if invalid)

#### Required Fields:
| Field | Type | Description |
|---|---|---|
| `name` | string | Full name of the child (non-empty) |
| `dateOfBirth` | string | Date of birth in `YYYY-MM-DD` format (cannot be in the future) |
| `guardianName` | string | Full name of the parent/guardian (non-empty) |
| `state` | string | State or region (non-empty) |
| `consentStatus` | boolean / string | Guardian consent (`true`, `false`, `"granted"`, `"pending"`) |

#### Sample Request:
```bash
curl -X POST http://localhost:3000/children \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aarav Sharma",
    "dateOfBirth": "2023-04-12",
    "guardianName": "Priya Sharma",
    "state": "Maharashtra",
    "consentStatus": true
  }'
```

#### Sample Response (`201 Created`):
```json
{
  "id": "5c015060-8032-436e-8f58-1f5b7abf6aac",
  "name": "Aarav Sharma",
  "dateOfBirth": "2023-04-12",
  "guardianName": "Priya Sharma",
  "state": "Maharashtra",
  "consentStatus": true,
  "createdAt": "2026-11-01T01:53:08.464Z"
}
```

---

### 3. Retrieve Child Profile
Fetches an existing child's profile using their generated ID.

- **Method**: `GET`
- **Endpoint**: `/children/:id`
- **Response Code**: `200 OK` (or `404 Not Found` if the child does not exist)

#### Sample Request:
```bash
curl http://localhost:3000/children/5c015060-8032-436e-8f58-1f5b7abf6aac
```

#### Sample Response (`200 OK`):
```json
{
  "id": "5c015060-8032-436e-8f58-1f5b7abf6aac",
  "name": "Aarav Sharma",
  "dateOfBirth": "2023-04-12",
  "guardianName": "Priya Sharma",
  "state": "Maharashtra",
  "consentStatus": true,
  "createdAt": "2026-11-01T01:53:08.464Z"
}
```

#### Non-existent Child Response (`404 Not Found`):
```json
{
  "error": "Child not found",
  "message": "No child found with ID 'fake-id-1234'"
}
```

---

### 4. Create Vaccination Reminder
Schedules a vaccination reminder for a verified registered child.

- **Method**: `POST`
- **Endpoint**: `/reminders`
- **Headers**: `Content-Type: application/json`
- **Response Code**: `201 Created` (`400 Bad Request` if invalid, `404 Not Found` if child doesn't exist)

#### Required Fields:
| Field | Type | Description |
|---|---|---|
| `childId` | string | ID of a previously registered child |
| `vaccineName` | string | Name of vaccine (e.g., `"BCG"`, `"MMR Dose 1"`) |
| `dueDate` | string | Scheduled date in `YYYY-MM-DD` format |
| `status` | string | Reminder status (e.g., `"scheduled"`, `"pending"`) |

#### Sample Request:
```bash
curl -X POST http://localhost:3000/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "5c015060-8032-436e-8f58-1f5b7abf6aac",
    "vaccineName": "MMR (Measles, Mumps, Rubella) Dose 1",
    "dueDate": "2026-12-15",
    "status": "scheduled"
  }'
```

#### Sample Response (`201 Created`):
```json
{
  "id": "8881ddf0-90d1-439e-915b-19b366dbd04c",
  "childId": "5c015060-8032-436e-8f58-1f5b7abf6aac",
  "vaccineName": "MMR (Measles, Mumps, Rubella) Dose 1",
  "dueDate": "2026-12-15",
  "status": "scheduled",
  "createdAt": "2026-11-01T01:53:08.474Z"
}
```

#### Non-existent Child Response (`404 Not Found`):
```json
{
  "error": "Child not found",
  "message": "Cannot create reminder: Child with ID 'invalid-id' was not found."
}
```

---

## 🛡️ Error Handling Summary

| Scenario | HTTP Status | Response Format |
|---|---|---|
| Missing mandatory fields | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Invalid date format (`dueDate` / `dateOfBirth`) | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Future `dateOfBirth` | `400 Bad Request` | `{"error": "Validation Error", "details": ["..."]}` |
| Malformed JSON body | `400 Bad Request` | `{"error": "Malformed JSON", "message": "..."}` |
| Child ID not found in storage | `404 Not Found` | `{"error": "Child not found", "message": "..."}` |
| Unhandled route path | `404 Not Found` | `{"error": "Not Found", "message": "..."}` |
| Unexpected server error | `500 Internal Server Error` | `{"error": "Internal Server Error", "message": "..."}` |

---

## 🔒 Synthetic Data Compliance

In accordance with technical assessment guidelines, all sample data provided in documentation and tests uses synthetic, non-identifiable test data.
