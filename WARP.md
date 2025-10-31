# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Nilotic Suits Back Office System**: A full-stack Next.js application managing custom suit orders from EU measurement capture through Kenya production, QC, shipping, and pickup. Multi-region workflow with role-based access control.

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, MySQL, NextAuth.js, ShadCN UI, Tailwind CSS 4

## Development Commands

### Package Manager
This project uses **pnpm** (not npm or yarn).

### Common Commands
```bash
# Development
pnpm dev                 # Start dev server (http://localhost:3000)
pnpm build               # Production build
pnpm start               # Start production server
pnpm lint                # Lint with ESLint

# Database
pnpm prisma:generate     # Generate Prisma Client (run after schema changes)
pnpm db:push             # Push schema to database (dev)
pnpm db:migrate          # Create and run migrations (production)
pnpm db:seed             # Seed database with test users and data
pnpm db:studio           # Open Prisma Studio GUI
```

### Testing Development Flows
After code changes, test multi-role workflows:
1. Run `pnpm db:seed` to create test users
2. Login with different roles (owner@, ops@, tailor.eu@, tailor.ke1@, qc@niloticsuits.com)
3. Check email console logs for OTP codes in development

### Before Committing
- Run `pnpm lint` to check for errors
- Regenerate Prisma Client if schema changed: `pnpm prisma:generate`

## Architecture

### Authentication & Authorization
- **NextAuth.js** with email OTP (no passwords)
- Session stored in JWT, includes user role
- Auth configuration: `src/auth/auth.ts`
- RBAC system: `src/lib/rbac.ts` defines permissions per role
- Roles: OWNER (full access), OPS, EU_TAILOR, KE_TAILOR, QC
- Role permissions control API access and UI visibility

### Database Layer
- **Prisma ORM** with MySQL backend
- Schema: `prisma/schema.prisma`
- Singleton client: `src/lib/prisma.ts` (prevents multiple instances in dev)
- Main models: User, Customer, WorkOrder, Task, Measurement, QCResult, Shipment, Note, AuditLog
- All models have soft delete (`deletedAt` field)

### Work Order Workflow
Orders progress through 13 stages (enum `WorkOrderStage`):
1. `intake_pending` → `measurement_pending` → `measurement_submitted` → `measurement_approved`
2. `in_production` (Tasks: cutting, sewing_coat, sewing_trouser, finishing, rework)
3. `in_qc` → `ready_to_ship` → `in_transit_to_eu`
4. `at_eu_tailor` → `eu_adjustment` → `ready_for_pickup` → `completed`
5. `blocked` (can occur at any stage)

Stage transitions are controlled by role permissions and business logic in API routes.

### File Structure
```
src/
├── app/
│   ├── (dash)/              # Dashboard routes (authenticated)
│   │   ├── work-orders/     # Work order management
│   │   ├── tailors/         # Tailor assignment views
│   │   ├── qc/              # QC inspection interface
│   │   ├── shipments/       # Shipment tracking
│   │   └── settings/        # System configuration
│   └── api/                 # API routes
│       ├── auth/[...nextauth]/  # NextAuth handlers
│       ├── work-orders/     # CRUD operations
│       ├── files/presign/   # S3 presigned URL generation
│       └── webhooks/        # External integrations
│           ├── woocommerce/ # Auto-create orders from WooCommerce
│           ├── formbricks/  # Import measurements from Formbricks
│           └── aramex/      # Shipping tracking updates
├── auth/                    # NextAuth configuration
├── components/
│   └── ui/                  # ShadCN UI components
└── lib/                     # Utilities
    ├── prisma.ts            # Database client
    ├── rbac.ts              # Role-based access control
    ├── audit.ts             # Audit logging helper
    ├── s3.ts                # S3-compatible file storage
    └── utils.ts             # General utilities
```

### API Route Patterns
- **Authentication**: All API routes check session via `requireAuth()` or `requirePermission()`
- **Audit logging**: Use `logAudit()` for all mutations (creates, updates, deletes)
- **Soft deletes**: Set `deletedAt` instead of deleting records
- **Error handling**: Return `NextResponse.json({ error: "..." }, { status: XXX })`
- **Permissions**: Check role-specific permissions before operations

### File Upload Flow
1. Client requests presigned URL: `POST /api/files/presign` with `{ filename, contentType }`
2. Server generates S3 presigned URL (1 hour expiry)
3. Client uploads directly to S3 using presigned URL (PUT request)
4. Client stores returned public URL in database field (e.g., `Measurement.photos`, `QCResult.photos`)

### External Integrations
- **WooCommerce**: Webhook creates WorkOrder + Customer + Tasks from e-commerce order
- **Formbricks**: Webhook imports measurement data from form submissions
- **Aramex Kenya**: API for generating shipping labels and tracking updates
- **Brevo SMTP**: Email notifications (measurement updates, QC results, shipping alerts)

All webhook secrets should be verified in production (currently TODO in code).

## Development Patterns

### TypeScript
- Strict mode enabled
- Path alias: `@/*` maps to `src/*`
- Prisma generates types automatically after schema changes

### Component Library
- **ShadCN UI** components in `src/components/ui/`
- Tailwind CSS 4 for styling
- Dark/light theme support via `next-themes`

### Form Handling
- **react-hook-form** with **zod** validation
- Pattern: Define zod schema → use `useForm()` with `zodResolver` → handle submit

### Data Fetching
- Server Components: Direct Prisma queries
- Client Components: API routes with fetch/SWR/React Query (check existing patterns)

### RBAC in UI
```typescript
import { hasPermission } from "@/lib/rbac";
// Show UI elements based on user role
if (hasPermission(user.role, "work-orders:update")) {
  // Show edit button
}
```

### Database Migrations
- **Development**: `pnpm db:push` (quick schema sync)
- **Production**: `pnpm db:migrate` (creates migration files, version control)
- After schema changes: Always run `pnpm prisma:generate`

## Environment Variables

Required:
- `DATABASE_URL`: MySQL connection string
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: Auth configuration
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_KEY`, `S3_SECRET`: File storage
- `BREVO_HOST`, `BREVO_PORT`, `BREVO_USER`, `BREVO_PASS`: SMTP email

Optional (integrations):
- `WOOCOMMERCE_BASE_URL`, `WC_KEY`, `WC_SECRET`, `WC_WEBHOOK_SECRET`
- `FORMBRICKS_BASE_URL`, `FORMBRICKS_TOKEN`
- `ARAMEX_BASE_URL`, `ARAMEX_KEY`, `ARAMEX_SECRET`, `ARAMEX_ACCOUNT_NUMBER`

## Key Constraints

1. **Role permissions must be checked** before all mutations
2. **Audit logs should be created** for all work order changes, task updates, QC results
3. **Soft deletes only** - never hard delete WorkOrders, Customers, Users, Tasks
4. **Stage transitions** must follow workflow logic (e.g., can't skip from `measurement_pending` to `in_qc`)
5. **File uploads** must use presigned URLs (never upload through Next.js API routes)
6. **Email OTPs** expire after 10 minutes (configured in NextAuth)
7. **Tailors only see assigned work** - filter queries by `assignedEuTailorId` or `assigneeTailorId`

## Testing Multi-Role Flows

Seed users (after `pnpm db:seed`):
- `owner@niloticsuits.com` - Full system access
- `ops@niloticsuits.com` - Operations management
- `tailor.eu@niloticsuits.com` - EU measurement capture
- `tailor.ke1@niloticsuits.com`, `tailor.ke2@niloticsuits.com` - Kenya production
- `qc@niloticsuits.com` - Quality control inspector

Check terminal logs for OTP codes during development (no actual emails sent to these addresses).
