
# Department Summary Service
 
A small, production-shaped **NestJS + Axios + TypeScript** service that fetches
the user directory from a configurable upstream and transforms it into a
per-department summary. Validated env + DTOs, tested with **Vitest**.
 
## Prerequisites
 
- **Node.js** ≥ 20
- **Yarn** (Classic v1)

## Getting Started
 
### 1. Clone the Repository
 
```bash
git clone https://github.com/your-org/your-repo.git
cd your-repo
```
 
### 2. Install Dependencies
 
```bash
yarn
```
 
This installs all packages and generates / verifies `yarn.lock`.
 
### 3. Configure Environment
 
Copy the example file and adjust as needed:
 
```bash
cp .env.example .env
```
 
| Variable               | Description                              | Default                 |
| ---------------------- | ---------------------------------------- | ----------------------- |
| `PORT`                 | Port the server listens on               | `3000`                  |
| `NODE_ENV`             | Runtime environment                      | `development`           |
| `USERS_API_BASE_URL`   | Upstream users API (must be a valid URL) | `https://dummyjson.com` |
| `USERS_API_TIMEOUT_MS` | Upstream request timeout (ms)            | `5000`                  |
| `USERS_API_PAGE_SIZE`  | Users fetched per ingestion page         | `50`                   |
 
 
### 4. Run the Tests
 
```bash
yarn test
```
 
Runs the full Vitest suite.
 
### 5. Build
 
```bash
yarn build
```
 
Compiles with `tsc` and rewrites path aliases with `tsc-alias`, emitting to `dist/`.
 
### 6. Start
 
```bash
yarn start
```
 
Runs `node dist/main.js`, serving on `PORT` (or `3000` if unset).
 
## Endpoint
 
```
GET /users/department-summary
```
 
| Param              | Type     | Default | Meaning                                  |
| ------------------ | -------- | ------- | ---------------------------------------- |
| `departments`      | CSV list | (all)   | Return only these departments.           |
| `includeAddresses` | boolean  | `false` | Opt in to the `userAddress` map (PII).   |
 
```jsonc
// GET /users/department-summary?departments=Marketing&includeAddresses=true
{
  "Marketing": {
    "male": 1, "female": 1, "ageRange": "26-50",
    "hair": { "Black": 1, "Blond": 1 },
    "userAddress": { "TerryMedhurst": "47225" }   // only when opted in
  }
}
```

### Example 1 — All Departments with Addresses

```http
GET /users/department-summary?includeAddresses=true
```

Once the server is up, hit it with curl (or just open the URL in a browser, since it's a GET):

```bash
curl 'http://localhost:3000/users/department-summary?includeAddresses=true'
```

Returns summaries for every department.

### Example 2 — Single Department

```http
GET /users/department-summary?departments=Marketing
```

```json
{
  "Marketing": {
    "male": 1,
    "female": 1,
    "ageRange": "26-50",
    "hair": {
      "Black": 1,
      "Blond": 1
    }
  }
}
```

### Example 3 — Multiple Departments

```http
GET /users/department-summary?departments=Marketing,Engineering
```

```json
{
  "Marketing": {
    "male": 1,
    "female": 1,
    "ageRange": "26-50",
    "hair": {
      "Black": 1,
      "Blond": 1
    }
  },
  "Engineering": {
    "male": 3,
    "female": 2,
    "ageRange": "24-58",
    "hair": {
      "Black": 3,
      "Brown": 2
    }
  }
}
```
