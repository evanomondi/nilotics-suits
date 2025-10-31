# Nilotic Suits - Back Office System

A full-stack application for managing custom suit orders from EU measurement capture to Kenya production, QC, shipping, and pickup.

## Features

- **Work Order Management**: Track orders through all stages from intake to completion
- **Multi-Region Tailors**: Support for EU (measurement) and Kenya (production) tailors
- **Measurement Capture**: Native forms and Formbricks integration with photo upload
- **Production Tracking**: Kanban board with task assignment and progress tracking
- **Quality Control**: Configurable QC forms with pass/fail inspection workflow
- **Shipping Integration**: Aramex Kenya API for airway bills and tracking
- **Email Notifications**: Brevo SMTP for alerts and reminders
- **Role-Based Access**: Owner, Ops, EU Tailor, KE Tailor, QC roles with permissions
- **Audit Logging**: Complete audit trail of all actions

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, ShadCN UI, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Auth**: NextAuth.js with email OTP
- **Storage**: S3-compatible object storage
- **Email**: Brevo SMTP
- **Integrations**: WooCommerce webhooks, Formbricks API, Aramex Kenya API

## Prerequisites

- Node.js 18+ and pnpm
- MySQL 8.0+
- S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces, etc.)
- Brevo account (for email)
- Optional: WooCommerce store, Formbricks instance, Aramex Kenya account

## Setup Instructions

### 1. Clone and Install

```bash
cd nilotic-suits/app
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required variables:**

- `DATABASE_URL`: MySQL connection string
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -hex 32` or similar
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_KEY`, `S3_SECRET`: S3 storage config
- `BREVO_HOST`, `BREVO_PORT`, `BREVO_USER`, `BREVO_PASS`: SMTP config

**Optional variables:**

- WooCommerce: `WOOCOMMERCE_BASE_URL`, `WC_KEY`, `WC_SECRET`, `WC_WEBHOOK_SECRET`
- Formbricks: `FORMBRICKS_BASE_URL`, `FORMBRICKS_TOKEN`
- Aramex: `ARAMEX_BASE_URL`, `ARAMEX_KEY`, `ARAMEX_SECRET`, `ARAMEX_ACCOUNT_NUMBER`

### 3. Initialize Database

```bash
# Generate Prisma Client
pnpm prisma:generate

# Create database schema
pnpm db:push

# Or use migrations (recommended for production)
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Core Models

- **User**: System users with roles (Owner, Ops, EU/KE Tailor, QC)
- **Customer**: End customers ordering suits
- **WorkOrder**: Orders tracking through stages
- **Measurement**: Customer measurements with photos
- **Task**: Production tasks (cutting, sewing, finishing, rework)
- **QCForm**: Configurable quality control checklists
- **QCResult**: QC inspection results
- **Shipment**: Aramex shipments with tracking
- **Note**: Internal notes on work orders
- **AuditLog**: Complete audit trail

### Work Order Stages

1. `intake_pending` - Initial intake
2. `measurement_pending` - Waiting for measurements
3. `measurement_submitted` - Measurements received
4. `measurement_approved` - Measurements approved
5. `in_production` - Being manufactured
6. `in_qc` - Quality control inspection
7. `ready_to_ship` - Passed QC, ready to ship
8. `in_transit_to_eu` - Shipping to EU
9. `at_eu_tailor` - At EU tailor for fitting
10. `eu_adjustment` - Final adjustments needed
11. `ready_for_pickup` - Ready for customer pickup
12. `completed` - Order completed
13. `blocked` - Blocked/on hold

## API Endpoints

### Work Orders

- `GET /api/work-orders` - List work orders (with filters)
- `POST /api/work-orders` - Create new work order
- `GET /api/work-orders/[id]` - Get work order details
- `PATCH /api/work-orders/[id]` - Update work order

### Files

- `POST /api/files/presign` - Get presigned URL for S3 upload

### Webhooks

- `POST /api/webhooks/woocommerce` - WooCommerce order webhook
- `POST /api/webhooks/formbricks` - Formbricks response webhook
- `POST /api/webhooks/aramex` - Aramex tracking webhook

### Auth

- `POST /api/auth/signin` - Email OTP login (handled by NextAuth)
- `GET /api/auth/session` - Get current session

## Role-Based Views

### Owner / Ops

- Full access to all work orders
- Global Kanban board with filters
- CSV export
- Audit log access
- Settings and configuration

### EU Tailor

- View assigned work orders
- Submit/update measurements
- Upload fit photos
- Search customers by email/phone
- Add notes

### KE Tailor

- View assigned tasks only
- Start/finish tasks
- Upload progress photos
- Update task status

### QC Inspector

- View work orders in QC stage
- Run QC inspections with forms
- Pass/fail with photos
- Auto-create rework tasks on failure

## Testing Checklist

### Manual Work Order Flow

1. Login as ops@niloticsuits.com
2. Create manual work order
3. Assign to EU tailor
4. Login as EU tailor, submit measurements
5. Login as ops, approve measurements
6. Assign production tasks to KE tailors
7. Login as KE tailor, complete tasks
8. Login as QC, run inspection
9. Test both pass and fail scenarios
10. On pass, create shipment
11. Verify email notifications

### WooCommerce Integration

1. Configure WooCommerce webhook to point to `/api/webhooks/woocommerce`
2. Place test order in WooCommerce
3. Verify work order and tasks created automatically
4. Check customer record created/updated

### File Upload

1. Request presigned URL from `/api/files/presign`
2. Upload file to presigned URL using PUT
3. Store returned public URL in database

### Email Notifications

Configure Brevo SMTP and test:

- Measurement submitted alert
- Measurement approved alert
- Production started alert
- QC passed/failed alert
- Shipment created alert
- Ready for pickup alert
- Reminders for overdue items

## Default Seed Users

After running `pnpm db:seed`, you can login with these emails (check email for OTP):

- `owner@niloticsuits.com` - Owner (full access)
- `ops@niloticsuits.com` - Operations
- `tailor.eu@niloticsuits.com` - EU Tailor
- `tailor.ke1@niloticsuits.com` - KE Tailor #1
- `tailor.ke2@niloticsuits.com` - KE Tailor #2
- `qc@niloticsuits.com` - QC Inspector

## Development Scripts

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Database commands
pnpm db:push          # Push schema to database
pnpm db:migrate       # Create migration
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
pnpm prisma:generate  # Generate Prisma Client
```

## Production Deployment

1. Set all environment variables in your hosting platform
2. Ensure MySQL database is accessible
3. Run `pnpm prisma:generate && pnpm db:migrate`
4. Run `pnpm build`
5. Start with `pnpm start`
6. Configure reverse proxy (nginx/Apache) if needed
7. Set up SSL certificate
8. Configure WooCommerce webhook URLs
9. Test email delivery
10. Monitor audit logs

## Project Structure

```
app/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── src/
│   ├── app/
│   │   ├── (dash)/        # Dashboard routes
│   │   │   ├── work-orders/
│   │   │   ├── tailors/
│   │   │   ├── qc/
│   │   │   ├── shipments/
│   │   │   └── settings/
│   │   └── api/           # API routes
│   │       ├── auth/
│   │       ├── work-orders/
│   │       ├── files/
│   │       └── webhooks/
│   ├── auth/              # NextAuth config
│   ├── components/        # React components
│   │   └── ui/            # ShadCN components
│   └── lib/               # Utilities
│       ├── prisma.ts      # Prisma client
│       ├── rbac.ts        # Role-based access
│       ├── audit.ts       # Audit logging
│       └── s3.ts          # S3 utilities
├── .env                   # Environment variables
├── .env.example           # Environment template
└── README.md              # This file
```

## Support & Contributions

For issues, questions, or contributions, please refer to the project repository.

## License

Proprietary - Nilotic Suits
