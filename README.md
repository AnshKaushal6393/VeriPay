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
