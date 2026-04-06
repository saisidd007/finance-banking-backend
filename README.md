# Finance Dashboard Backend

A role-based finance data API built with Node.js, Express, and MongoDB.

---

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev
```

---

## Bugs Fixed from Original Code

| File | Bug | Fix |
|---|---|---|
| `auth.controller.js` | `userModel.create()` not awaited → `newUser` was a Promise → JWT signed with `undefined` id | Added `await` |
| `auth.controller.js` | `require('bcryptjs')` aliased as `bycrypt` (misleading typo) | Renamed to `bcrypt` |
| `auth.controller.js` | JWT has no expiry (security risk) | Added `expiresIn: '7d'` |
| `transaction.controller.js` | `res.status(40)` → crashes (invalid status code) | Fixed to `401` |
| `transaction.model.js` | Fields `Amount`, `Date`, `Notes` (capitalized) didn't match controller's `amount`, `date`, `notes` → data silently not saved | Lowercased all field names |
| `routes.auth.js` | `router.get()` for register and login → passwords sent in query string, not body | Changed to `router.post()` |
| `routes.transaction.js` | `router.get()` for createTransaction → creation via GET is wrong | Changed to `router.post()` |
| `routes.transaction.js` | Handler was `transactionContoller` (whole module) instead of `transactionContoller.createTransaction` | Fixed to use specific function |
| `app.js` | Missing `cookie-parser` → `req.cookies` was always `undefined` | Added `cookie-parser` middleware |
| `db.js` | `connectDB(req, res)` had unused Express parameters | Removed them |

---

## Project Structure

```
├── server.js                  # Entry point
├── app.js                     # Express app setup
├── db/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── user.model.js
│   └── transaction.model.js
├── controllers/
│   ├── auth.controller.js
│   ├── transaction.controller.js
│   └── dashboard.controller.js   # NEW
├── middlewares/
│   └── auth.middleware.js         # NEW — centralized JWT auth + role guard
└── routes/
    ├── routes.auth.js
    ├── routes.transaction.js
    └── routes.dashboard.js        # NEW
```

---

## Roles & Permissions

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ |
| View transactions (own) | ✅ | ✅ | ✅ |
| View all transactions | ❌ | ✅ | ✅ |
| Create transaction | ❌ | ✅ | ✅ |
| Update transaction | ❌ | ✅ | ✅ |
| Delete transaction (soft) | ❌ | ❌ | ✅ |
| View dashboard | ✅ (own) | ✅ (all) | ✅ (all) |
| Manage users | ❌ | ❌ | ✅ |

---

## API Reference

### Auth — `/api/auth`

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create a new account |
| POST | `/login` | Public | Log in, receive cookie |
| POST | `/logout` | Any logged-in | Clear token cookie |
| GET | `/users` | Admin | List all users |
| PATCH | `/users/:id/toggle-status` | Admin | Activate / deactivate user |

**Register body:**
```json
{ "username": "alice", "email": "alice@example.com", "password": "secret", "role": "Analyst" }
```

---

### Transactions — `/api/transactions`

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Admin, Analyst | Create a transaction |
| GET | `/` | All | List transactions (filtered, paginated) |
| GET | `/:id` | All | Get single transaction |
| PUT | `/:id` | Admin, Analyst | Update a transaction |
| DELETE | `/:id` | Admin | Soft-delete a transaction |

**Create body:**
```json
{
  "amount": 1500,
  "type": "income",
  "category": "Salary",
  "date": "2025-03-01",
  "notes": "March salary"
}
```

**GET `/` query params:**

| Param | Example | Description |
|---|---|---|
| `type` | `expense` | Filter by income / expense |
| `category` | `food` | Partial match, case-insensitive |
| `startDate` | `2025-01-01` | Date range start |
| `endDate` | `2025-03-31` | Date range end |
| `page` | `2` | Page number (default 1) |
| `limit` | `20` | Results per page (default 10) |
| `sortBy` | `amount` | `date`, `amount`, `createdAt` |
| `order` | `asc` | `asc` or `desc` |

---

### Dashboard — `/api/dashboard`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/summary` | All | Total income, expenses, net balance |
| GET | `/by-category` | All | Totals broken down by category |
| GET | `/monthly?year=2025` | All | Income vs expense per month |
| GET | `/weekly` | All | Income vs expense per week (last 12 weeks) |
| GET | `/recent?limit=5` | All | N most recent transactions |
| GET | `/top-categories?type=expense&limit=5` | All | Top spending/earning categories |

**Sample `/summary` response:**
```json
{
  "totalIncome": 45000,
  "totalExpenses": 18500,
  "netBalance": 26500,
  "totalTransactions": 34
}
```

**Sample `/monthly` response:**
```json
{
  "year": 2025,
  "data": [
    { "month": 1, "monthName": "January", "income": 15000, "expenses": 4200, "net": 10800 },
    { "month": 2, "monthName": "February", "income": 15000, "expenses": 6100, "net": 8900 }
  ]
}
```

---

## Assumptions Made

- Soft deletes are used for transactions (`isDeleted: true`) so data is never permanently lost.
- Viewers can only see their own transactions and their own dashboard data (scoped server-side).
- JWT is stored in an `httpOnly` cookie to prevent XSS access.
- Token expiry is set to 7 days.
- The `role` field in registration is accepted as-is; in production you'd want to restrict who can self-assign `Admin`.
