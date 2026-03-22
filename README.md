# VeriPay

## Phase-wise Progress

### Phase 1: Root Project Folder and Git Initialization
- Root project folder used: `VeriPay`
- Git repository initialized in root (`.git/` created)

### Phase 2: React Frontend Scaffold with Vite
- Created React frontend app at `client/` using Vite
- Installed frontend dependencies in `client` using `npm install`
- Corrected scaffold to plain React JavaScript (`.jsx`) setup (removed TypeScript files/config)
- Added React plugin config for Vite in `client/vite.config.js`

### Phase 3: Frontend Base Dependencies and Tailwind Initialization
- Frontend dependencies installed in `client/package.json`
- Tailwind initialized manually because `tailwindcss@4` does not support `npx tailwindcss init -p`
- Added `client/tailwind.config.js` with `./src/**/*.{js,jsx}` in the `content` array
- Added `client/postcss.config.js`

### Phase 4: Express Backend Setup
- Created backend folder at `server/`
- Initialized backend Node project with `npm init -y`
- Installed runtime dependencies: `express`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `multer`, `pdf-parse`, `node-cron`, `nodemailer`, `@prisma/client`
- Installed dev dependencies: `prisma`, `nodemon`
- Backend lockfile created at `server/package-lock.json`
- Current npm audit summary after install: `11 vulnerabilities (5 moderate, 6 high)`
- Added backend scripts so `npm run dev` uses `nodemon index.js` and `npm start` uses `node index.js`
- Added backend entry file at `server/index.js` with basic Express app setup and health routes
- Prisma starter files added manually because `prisma/` already existed: `server/prisma/schema.prisma` and `server/.env`
- Updated Prisma 7 config: moved `DATABASE_URL` handling to `server/prisma.config.ts` and removed `url` from `server/prisma/schema.prisma`
- Added Prisma enums in `server/prisma/schema.prisma`: `Role`, `InvoiceStatus`, `DisputeStatus`, and `DisputeType`
- Added initial `User` model in `server/prisma/schema.prisma` with role, auth, and timestamp fields
- Added initial `Vendor` model in `server/prisma/schema.prisma` with contact and tax fields
- Added initial `Invoice` model in `server/prisma/schema.prisma` with vendor relation and `InvoiceStatus`
- Added `Dispute`, `DisputeComment`, and `AuditLog` models in `server/prisma/schema.prisma`
- Added backend register route and controller: `POST /api/auth/register`
- Generated Prisma Client successfully and verified the Neon database is in sync with the current schema using `prisma migrate dev`
- Added backend login route and JWT auth middleware for protected requests
- Added role-based authorization middleware to allow only selected user roles on protected routes
- Added React auth context in the frontend to store `token` and `user` state with local persistence
- Fixed Tailwind 4 PostCSS configuration to use `@tailwindcss/postcss`
- Added frontend `ProtectedRoute` component to redirect unauthenticated users
- Added shared Axios client configuration to automatically attach the stored JWT token on requests
