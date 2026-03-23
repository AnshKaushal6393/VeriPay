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
- Built a React Query powered vendor list page with search, category filter, metrics, and responsive dashboard UI
- Redesigned the vendor list screen into a more distinctive operations-console style interface
- Refactored the vendor screen into a true app shell with top navigation, compact filters, KPI strip, and a table-first layout
- Enriched the vendor table UI with summary chips, sorting, status indicators, and row action controls
- Added a reusable validated vendor form component for both create and edit flows in the frontend
- Added protected vendor routes in `server/routes/vendors.js` and mounted them at `/api/vendors`
- Added `getVendors` controller with Prisma search and category filtering
- Upgraded the vendor form to use `react-hook-form`, wired create/update vendor API mutations, invalidated the `vendors` query on success, and added vendor contact fields to the database schema
- Fixed Prisma 7 runtime initialization by adding a shared adapter-based Prisma client for PostgreSQL
- Added a vendor detail page with vendor info, invoice table, mini stats, and a matching backend vendor detail endpoint
- Refactored the frontend routing into a cleaner pages-based structure by adding a dedicated `LoginPage` alongside the vendor pages
- Added a dedicated `RegisterPage` so the auth flow is fully route-based with login and signup pages
- Added a manual light/dark theme toggle with persistent user preference and explicit data-theme based design tokens across the frontend UI
- Extracted a shared application header component for workspace pages and upgraded the manual theme toggle to use SVG sun/moon icons for a cleaner premium UI
- Extracted a shared auth card intro component for login/register and upgraded the shared app header to use NavLink-based active navigation styling
- Extracted shared surface and section header components to standardize page-shell spacing and section chrome across vendor workspace screens
- Upgraded the vendor workspace app shell with a product-style top header including subtitle, dedicated primary CTA, refined session block, and tighter spacing for a more intentional enterprise layout
- Enhanced the vendor KPI strip with stronger metric hierarchy, contextual support text, and refined status-card styling to better match the enterprise app shell
- Refined the vendor filter row into a denser toolbar with a dedicated filter header, search icon treatment, stronger labels, and more product-like control grouping
- Elevated the vendor table into the primary product surface with a sticky header, stronger row hover/high-risk treatment, clearer column hierarchy, richer status/category chips, and icon-based row actions
- Added richer vendor data states with a styled empty-state illustration block, skeleton loading rows, and a stronger error banner with retry action for the vendor table
- Polished the vendor detail screen with a more premium vendor info card, visually separated mini-stats, and a denser invoice table with status chips and stronger amount emphasis
- Polished the reusable vendor form by grouping related fields into sections, improving label spacing and validation copy, strengthening the primary submit action, and upgrading the surrounding panel styling
- Added subtle motion polish with page fade/slide entry, restrained card hover lift, improved button hover/press feedback, smoother input focus transitions, and a prefers-reduced-motion fallback
- Standardized the frontend design system across pages by unifying spacing tokens, border-radius usage, shared button and chip treatments, and heading scale so the app feels visually consistent end-to-end
- Refined the vendor workspace finish by compressing the header layout, combining account controls into a tighter session cluster, reducing skeleton row density, and increasing visual separation between the filter toolbar and main table
- Refined the vendor workspace further by converting nav into clearer tab-like controls, folding logout into the account card, slimming the inline error banner, muting non-primary KPI cards, and tightening the stack above the main table
- Upgraded the login and register experience with a stronger auth card hierarchy, premium brand treatment, a dedicated auth form panel, and tighter footer link styling to match the interior product UI
- Improved backend diagnostics by adding Prisma-aware auth error handling and a dedicated /api/health/db endpoint to verify live database connectivity
- Improved database health diagnostics further by mapping raw Prisma connectivity failures to clearer 503 database-unreachable responses
- Fixed the vendor create/edit UX by opening the reusable vendor form in a modal overlay with backdrop, escape-key close support, and immediate visual feedback from the New vendor action
- Reworked the shared app header into a cleaner two-row layout with separated navigation and action zones to improve responsiveness and reduce header crowding across screen sizes
- Fixed the New vendor modal glitch by rendering the form through a portal at the document level, adding proper dialog semantics, and tightening responsive behavior for the header, KPI strip, filter toolbar, and modal/table layout across laptop and tablet widths

- Fixed toast visibility above the vendor modal by elevating the toast layer above the backdrop and giving notifications a solid theme-aware surface so success/error messages stay readable during create/edit flows

- Improved the vendor create/edit modal flow with inline server error feedback, temporary success confirmation before close, and guarded escape/backdrop closing while a save is in progress

- Fixed vendor create failures by regenerating the Prisma client after schema changes, hid create/edit actions from VIEWER users on the vendor page, and upgraded toast styling to a more polished enterprise notification treatment

- Fixed duplicate vendor creation from the modal by adding a hard client-side submit lock, keeping the form disabled through the short success-confirmation window, and resetting the lock only after close or error

- Replaced default string toasts with a shared branded notification component across login, register, and vendor flows so success/error messages now use a consistent premium enterprise layout with title, message, and tone-specific icon treatment

- Added route-aware toast placement, dismiss controls, and subtle enter/exit motion so notifications now feel integrated with both auth and workspace screens instead of using one generic placement everywhere

- Removed riskScore from the reusable vendor form and stopped accepting manual riskScore values in vendor create/update controller payloads so risk remains system-controlled instead of user-entered

- Changed Vendor.riskScore in Prisma schema from a required Float defaulting to 0 into an optional Float so unknown vendor risk remains null instead of pretending to be perfect history, and updated the vendor UI to display unknown risk honestly instead of collapsing null to zero

- Updated the shared vendor risk display so null scores now render as 'No history yet' instead of showing a numeric value, making unknown vendor risk explicit across the UI
- Added a manual invoice creation backend module with a protected `POST /api/invoices` route for `ADMIN` and `MANAGER`, including vendor existence checks, amount/date/status validation, sensible SLA defaults, and Prisma-backed invoice creation
- Configured Multer for invoice PDF uploads with a reusable PDF-only middleware, 10MB file-size limit, disk storage under `server/uploads/invoices`, cleanup on failed invoice creation, and route integration on `POST /api/invoices` using the multipart field name `invoicePdf`

- Refined the vendor filter meta line by replacing raw internal sort keys like 'createdAt' with human-readable labels and slightly increasing its contrast so the toolbar summary reads cleanly in the UI

- Normalized vendor risk on backend read responses so vendors with fewer than 3 invoices are returned with riskScore = null, preventing old stored zero values from being shown as if they were real low-risk history

- Added a reusable PDF parser utility in server/utils/pdfParser.js that can parse either an uploaded file path or a raw buffer with pdf-parse and returns normalized text, page count, metadata, and document info for future invoice extraction workflows
- Added a dedicated protected PDF upload route at `POST /api/uploads/pdf` using multipart field name `pdfFile`, backed by a separate upload controller that stores the PDF, parses it immediately with the shared parser utility, and returns both file metadata and extracted text details
- Added a protected invoice listing API at `GET /api/invoices` with filters for `status`, `vendorId`, `dateFrom`, and `dateTo`, and built a new frontend invoice directory page with status/vendor/date-range controls, KPI summary cards, and a filterable invoice table wired into the shared workspace app shell

- Added a reusable InvoiceForm with dual manual-entry and PDF-upload tabs, drag-and-drop PDF parsing preview, parsed-to-manual prefill confirmation, editable item list, and safe user review before invoice submission without auto-submitting extracted PDF data
