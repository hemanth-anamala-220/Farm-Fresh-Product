# Farm Fresh Product

Farm Fresh Product is a small marketplace application connecting local farmers with customers. It includes a Node/Express backend (MongoDB via Mongoose) and a React frontend (Vite). Farmers can manage products and view orders. Customers can browse products, add items to cart and place orders.

---

## Table of Contents

- Project Overview
- Features
- Architecture & Tech Stack
- Repository Layout
- Prerequisites
- Environment Variables
- Setup & Running (Windows PowerShell)
  - Backend
  - Frontend
- Database
- API Overview (important endpoints)
- Developing & Best Practices
- Tests
- Deployment notes
- Contributing
- Troubleshooting
- License
- Contact

---

## Project Overview

This project provides a minimal e-commerce experience specifically tailored for fresh produce. It aims to let farmers list products (with images/video), manage product visibility and stock, and let customers browse and order products directly.

Key flows:
- Farmer registers/logs in and manages their product listings
- Customer browses products, adds items to cart, and places orders
- Orders adjust product stock and are viewable by the farmer


## Features

- Farmer product CRUD (create, read, update, hide/show)
- Customer product listing, search, and filters
- Cart persisted in localStorage
- Order placement and status updates
- Image and optional video support for product media
- Simple authentication storing token in localStorage
- Responsive front-end (Vite + React)


## Architecture & Tech Stack

- Backend: Node.js, Express (ESM), Mongoose (MongoDB), JSON Web Tokens
- Frontend: React (Vite), React Router, axios, sonner (toasts), lucide-react icons
- Dev tools: nodemon (backend), vite dev server (frontend)


## Repository Layout

- `Backend/` — Express API, models, routes
  - `Server.js` — app entry (starts server)
  - `models/` — Mongoose schemas (Product, Order, User)
  - `middleware/` — auth middleware
  - `products.js`, `orders.js`, `auth.js` — API routes (examples)
- `Frontend/` — React app
  - `src/Components/` — React components (Home, Dashboard, Farmer-Dashboard, etc.)
  - `src/Styles/` — CSS files
  - `public/` — static assets (placeholder image added)


## Prerequisites

- Node.js v18+ (tested with Node 18/20)
- npm (comes with Node)
- MongoDB instance (local or cloud MongoDB Atlas)


## Environment Variables

Create a `.env` file in the `Backend/` folder with the following (example):

```
PORT=5050
MONGO_URI=mongodb://localhost:27017/farm_fresh
JWT_SECRET=your_jwt_secret_here
```

Replace `MONGO_URI` and `JWT_SECRET` with your own values. If you use MongoDB Atlas, use the connection string provided by Atlas.


## Setup & Running (Windows PowerShell)

Open PowerShell and run the following commands.

### Backend

1. Change into the backend folder and install dependencies:

```powershell
cd "d:\REACT PROJECTS\NEWREACT\Backend"
npm install
```

2. Add `.env` (see Environment Variables above).

3. Start the backend server (development):

```powershell
# start with node
npm start

# or use nodemon for automatic reloads (if installed globally or via devDependencies):
npx nodemon Server.js
```

The backend listens on the port specified by `PORT` in `.env` (defaults to 5050 if not set in code).


### Frontend

1. Change into the frontend folder and install dependencies:

```powershell
cd "d:\REACT PROJECTS\NEWREACT\Frontend"
npm install
```

2. Start the dev server:

```powershell
npm run dev
```

3. Open the app in your browser at the address printed by Vite (usually `http://localhost:5173`).


## Database

This project uses MongoDB through Mongoose. Ensure MongoDB is running and `MONGO_URI` points to a valid DB. Collections you'll see are: `users`, `products`, and `orders`.

Note: The Product schema includes fields like `imageUrl`, `videoUrl`, `farmerId`, `visible`, `stock`, and `buyersCount`.


## API Overview (important endpoints)

Below is a short summary. See `Backend/` route files for full details.

- POST /api/auth/register — register user
- POST /api/auth/login — login user
- GET /api/products — get all visible products
- GET /api/products/farmer/:id — get products by farmer
- POST /api/products — create product (auth)
- PATCH /api/products/:id — update product (auth, owner)
- POST /api/products/order — place an order (auth)
- GET /api/orders/farmer/:id — get orders for farmer (auth)
- PATCH /api/orders/:id — update order status (auth)

Authentication: endpoints use a JWT token sent in Authorization header: `Authorization: Bearer <token>`


## Developing & Best Practices

- Keep sensitive values out of source control. Use `.env` for the backend.
- Use `npx nodemon Server.js` while developing the server to auto-restart on changes.
- Use the Vite dev server (`npm run dev`) for fast frontend feedback.
- Lint with `npm run lint` from the `Frontend/` folder if ESLint is configured.


## Tests

There are no automated tests included in this repo by default. Add unit tests (Jest or vitest) and integration tests for endpoints (supertest) as needed.


## Deployment notes

- Backend: Use a process manager (pm2) or containerization (Docker). Ensure `MONGO_URI` and `JWT_SECRET` are set in the production environment.
- Frontend: Build with `npm run build` and serve static files. Vite outputs to `dist/` by default.
- CORS: If hosting frontend and backend on different origins, enable CORS on the backend (CORS package is included).


## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Open a pull request

Please run the project locally and verify behavior before creating PRs. Describe what you changed and why.


## Troubleshooting

- "Cannot connect to MongoDB": verify `MONGO_URI` and that MongoDB is running.
- Backend errors about JWT: ensure `JWT_SECRET` is present in `.env`.
- Frontend images not loading: check `product.imageUrl` stored in DB and `public/placeholder.png` is present.


## License

This project currently does not specify a license. Add a `LICENSE` file if you intend to publish under a specific license (MIT, Apache-2.0, etc.).


## Contact

If you need help or want features added, open an issue in the repository or contact the project owner.


---

Thank you for building Farm Fresh Product — let me know if you'd like a shorter `README` or one tuned for deployment (Docker + Docker Compose) and CI/CD.
