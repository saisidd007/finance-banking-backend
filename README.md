# Finance Dashboard Backend

A role-based finance data API built with **Node.js**, **Express**, and **MongoDB**. Supports user authentication via JWT cookies, financial transaction management, and a suite of dashboard analytics endpoints — all locked down with role-based access control.

---

## Tech Stack

- **Runtime** — Node.js
- **Framework** — Express.js
- **Database** — MongoDB via Mongoose
- **Auth** — JSON Web Tokens stored in `httpOnly` cookies
- **Password hashing** — bcryptjs

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env

# 3. Fill in your values in .env
MONGO_URL=mongodb://localhost:27017/finance-dashboard
JWT_KEY=your_secret_key_here
PORT=3000

# 4. Start the server
npm run dev
```

---

## Project Structure

```
├── server.js                     # Entry point — connects DB, mounts routes
├── app.js                        # Express app — global middleware
├── .env.example
├── db/
│   └── db.js                     # MongoDB connection
├── models/
│   ├── user.model.js
│   └── transaction.model.js
├── controllers/
│   ├── auth.controller.js
│   ├── transaction.controller.js
│   └── dashboard.controller.js
├── middlewares/
│   └── auth.middleware.js        # JWT verify + role guard
└── routes/
    ├── routes.auth.js
    ├── routes.transaction.js
    └── routes.dashboard.js
```

---

## Roles & Permissions

Three roles are supported — **Viewer**, **Analyst**, and **Admin**.

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ |
| View own dashboard | ✅ | ✅ | ✅ |
| List all transactions | ✅ | ✅ | ✅ |
| View single transaction by ID | ❌ | ✅ | ✅ |
| Create transaction | ❌ | ❌ | ✅ |
| Update transaction | ❌ | ❌ | ✅ |
| Delete transaction (soft) | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

> **Viewers** can list all transactions and access dashboard data scoped to their own records. They cannot fetch a single transaction by ID, nor create, update, or delete anything.
>
> **Analysts** can list all transactions and fetch any single transaction by ID. They have full dashboard access across all users. They cannot create, update, or delete transactions.
>
> **Admins** have full access — creating, updating, and soft-deleting transactions, managing user accounts, and viewing everything.

---

## Key Features

### JWT Authentication via Cookies
Tokens are signed with `jsonwebtoken` and stored in an `httpOnly` cookie — inaccessible to JavaScript on the client, protecting against XSS attacks. Tokens expire after **7 days**. The cookie is set automatically on register and login, and cleared on logout.

### Role-Based Access Control
A centralized `auth.middleware.js` handles all authentication and authorization. Every protected route runs through `authenticate()` to verify the JWT, then `authorize(...roles)` to check the user's role. This keeps controllers clean — no JWT logic inside them.

```
Request → authenticate() → authorize() → controller
                ↓                ↓
              401             403
```

### Soft Delete
Transactions are never permanently removed from the database. Deleting a transaction sets `isDeleted: true` on the document. All queries automatically filter out soft-deleted records. This preserves a full audit trail while keeping deleted data invisible to users.

### Dashboard Analytics
Six analytics endpoints compute summaries, category breakdowns, monthly trends, weekly trends, recent activity, and top categories — all scoped to the requesting user's role.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a new user account |
| POST | `/api/auth/login` | Public | Log in and receive JWT cookie |
| POST | `/api/auth/logout` | Any role | Clear the JWT cookie |

**Register / Login body:**
```json
{
  "username": "alice",
  "email":    "alice@example.com",
  "password": "secret123",
  "role":     "Analyst"
}
```

**Login response:**
```json
{
  "message": "User logged in succesfully",
  "user": {
    "id":       "64f3a...",
    "username": "alice",
    "email":    "alice@example.com",
    "role":     "Analyst"
  }
}
```

---

### Transactions — `/api/create`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/create/createTransaction` | Analyst, Admin | Create a new transaction |

**Request body:**
```json
{
  "amount":   1500,
  "type":     "income",
  "category": "Salary",
  "date":     "2025-03-01",
  "notes":    "March salary"
}
```

> `type` must be exactly `"income"` or `"expense"`.

**Success response — 201:**
```json
{
  "message": "Transaction created successfully",
  "data": {
    "_id":       "64f3b...",
    "amount":    1500,
    "type":      "income",
    "category":  "Salary",
    "date":      "2025-03-01T00:00:00.000Z",
    "notes":     "March salary",
    "user":      "64f3a...",
    "isDeleted": false,
    "createdAt": "2025-03-01T10:00:00.000Z"
  }
}
```

---

### Dashboard — `/api/dashboard`

All dashboard endpoints require authentication. Viewers see only their own data. Analysts and Admins see data across all users.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Total income, expenses, net balance, transaction count |
| GET | `/api/dashboard/by-category` | Totals grouped by category |
| GET | `/api/dashboard/monthly` | Income vs expense for each month of a given year |
| GET | `/api/dashboard/weekly` | Income vs expense for the last 12 weeks |
| GET | `/api/dashboard/recent` | N most recent transactions |
| GET | `/api/dashboard/top-categories` | Top N categories by spend or income |

---

#### `GET /api/dashboard/summary`

No params required.

```json
{
  "totalIncome":       4500,
  "totalExpenses":     1000,
  "netBalance":        3500,
  "totalTransactions": 4
}
```

---

#### `GET /api/dashboard/by-category`

| Param | Example | Description |
|---|---|---|
| `type` | `expense` | Filter by `income` or `expense`. Omit for all. |

```json
{
  "Rent": 800,
  "Food": 200
}
```

---

#### `GET /api/dashboard/monthly`

| Param | Example | Description |
|---|---|---|
| `year` | `2025` | Year to fetch. Defaults to current year. |

Returns all 12 months — months with no transactions show `0`.

```json
{
  "year": 2025,
  "data": [
    { "month": 1, "income": 0,    "expense": 0    },
    { "month": 2, "income": 0,    "expense": 0    },
    { "month": 3, "income": 4500, "expense": 1000 }
  ]
}
```

---

#### `GET /api/dashboard/weekly`

No params. Returns only weeks that contain transactions, sorted oldest to newest. Week keys use ISO format.

```json
[
  { "week": "2025-W10", "income": 1500, "expense": 800 },
  { "week": "2025-W11", "income": 3000, "expense": 200 }
]
```

---

#### `GET /api/dashboard/recent`

| Param | Example | Description |
|---|---|---|
| `limit` | `10` | Number of records to return. Default `5`, max `50`. |

```json
[
  {
    "_id":      "64f3b...",
    "amount":   3000,
    "type":     "income",
    "category": "Freelance",
    "date":     "2025-03-15T00:00:00.000Z",
    "user":     { "username": "alice", "email": "alice@example.com" }
  }
]
```

---

#### `GET /api/dashboard/top-categories`

| Param | Example | Description |
|---|---|---|
| `type` | `expense` | `income` or `expense`. Default `expense`. |
| `limit` | `5` | Number of categories to return. Default `5`. |

```json
[
  { "category": "Rent",     "total": 800 },
  { "category": "Food",     "total": 200 }
]
```

---

## Error Responses

All errors follow a consistent shape:

```json
{ "message": "Description of what went wrong" }
```

| Status | Meaning |
|---|---|
| `400` | Missing or invalid fields in the request body |
| `401` | Not authenticated — no token or expired token |
| `403` | Authenticated but not authorized for this action |
| `404` | Resource not found |
| `409` | Conflict — username or email already in use |
| `500` | Internal server error |

---

## Assumptions

- The `role` field is accepted as-is during registration. In production, self-assigning `Admin` should be restricted.
- Soft delete is used for all transaction deletions — data is never permanently lost.
- JWT is stored in an `httpOnly` cookie (not localStorage) to protect against XSS.
- Token expiry is set to 7 days.
- Viewers are scoped to their own data server-side — no client-side tricks required.
