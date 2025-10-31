# Implementation Plan: Nilotic Suits Missing Features

**Created:** 2025-10-31  
**Overall Completion:** 30% → Target: 100%

---

## 🎯 Prioritization Strategy

**Phase 1 (Critical Path):** Core workflow - work order intake → measurement → production → QC  
**Phase 2 (Integration):** Shipping, webhooks, email notifications  
**Phase 3 (Enhancement):** Role-specific optimizations, audit log viewer, CSV export

---

## 📦 Phase 1: Core Workflow (Weeks 1-3)

### 1.1 Work Order Management UI [3 days]

**Goal:** Allow ops to view and manage work orders

#### Tasks:
- [ ] **Work Orders List Page** (`src/app/(dash)/work-orders/page.tsx`)
  - Fetch from `GET /api/work-orders` with pagination
  - Display table with columns: ID, Customer, Stage, Priority, Due Date, Assigned Tailor
  - Add filters: stage dropdown, date range picker, tailor selector
  - Add "Create Work Order" button → modal/form
  
- [ ] **Create Work Order Modal**
  - Form fields: customer search/create, priority, due date
  - Customer autocomplete by email/phone
  - Submit to `POST /api/work-orders`
  - Show success toast, refresh list

- [ ] **Work Order Detail Page** (`src/app/(dash)/work-orders/[id]/page.tsx`)
  - New route: `GET /api/work-orders/[id]` - fetch single work order with all relations
  - Display customer info, current stage, timeline
  - Show tasks list with status
  - Show measurements if available
  - Show QC results if available
  - Show shipments if available
  - Add notes section with visibility toggle

**API Updates:**
```typescript
// New: GET /api/work-orders/[id]/route.ts
// New: PATCH /api/work-orders/[id]/route.ts - update stage, priority, assignments
// New: POST /api/work-orders/[id]/notes/route.ts - add note
```

---

### 1.2 Measurement Capture Module [5 days]

**Goal:** EU tailors can capture and submit measurements

#### Tasks:
- [ ] **Native Measurement Form** (`src/app/(dash)/work-orders/[id]/measurements/page.tsx`)
  - Multi-step form with grouped fields:
    - Step 1: Upper body (chest, shoulder, sleeve, neck, waist)
    - Step 2: Lower body (inseam, outseam, thigh, knee, cuff)
    - Step 3: Additional (jacket length, trouser rise, preferences)
    - Step 4: Photos (front, side, back)
  - Use `react-hook-form` + `zod` validation
  - Zod rules for outlier detection (e.g., chest 80-140cm, validate proportions)
  - Draft saving to localStorage (auto-save every 30s)
  - Photo upload via presigned URL flow
  - Submit to `POST /api/work-orders/[id]/measurements`
  
- [ ] **Measurement Display Component**
  - Show submitted measurements in work order detail
  - Display photos in gallery
  - Allow EU tailor to update measurements
  - Show approval status

- [ ] **Formbricks Integration**
  - Create webhook handler: `src/app/api/webhooks/formbricks/route.ts`
  - Parse Formbricks response payload
  - Map fields to measurement schema
  - Create measurement record with `source: "formbricks"`
  - Update work order stage to `measurement_submitted`
  - Add audit log
  - Settings UI: Formbricks survey URL configuration

**API Updates:**
```typescript
// New: POST /api/work-orders/[id]/measurements/route.ts - create measurement
// New: PATCH /api/work-orders/[id]/measurements/[measurementId]/route.ts - update
// New: POST /api/webhooks/formbricks/route.ts - webhook handler
// New: GET /api/settings/formbricks/route.ts - get/set survey URL
```

**Zod Schema Example:**
```typescript
const measurementSchema = z.object({
  chest: z.number().min(80).max(140),
  waist: z.number().min(60).max(120),
  // ... with .refine() for proportion validation
}).refine((data) => data.chest > data.waist, {
  message: "Chest must be larger than waist"
});
```

---

### 1.3 Production Board (Kanban) [4 days]

**Goal:** Visualize work orders by stage, manage task assignments

#### Tasks:
- [ ] **Kanban Board Component** (`src/components/KanbanBoard.tsx`)
  - Use `@tanstack/react-table` or custom columns
  - Create columns for each stage (measurement_pending → completed)
  - Cards show: work order ID, customer name, due date, priority badge
  - Color coding: overdue (red), due soon (yellow), on track (green)
  - Click card → navigate to work order detail
  
- [ ] **Board Filters** (top toolbar)
  - Date range: due in next 7/14/30 days, overdue
  - Assigned tailor dropdown
  - Priority dropdown
  - Search by customer name/email

- [ ] **Stage Transition Actions**
  - Add "Move to [Next Stage]" button in work order detail
  - Validate transitions (e.g., can't go to in_production without approved measurements)
  - Show confirmation modal for critical transitions
  - Update via `PATCH /api/work-orders/[id]`

- [ ] **Task Management Panel** (within work order detail)
  - List all tasks for work order
  - Show task type, status, assignee, timestamps
  - Allow ops to assign KE tailors to tasks
  - Update via `PATCH /api/work-orders/[id]/tasks/[taskId]`

**API Updates:**
```typescript
// New: PATCH /api/work-orders/[id]/tasks/[taskId]/route.ts - assign, start, finish
// Enhance: PATCH /api/work-orders/[id]/route.ts - add stage transition validation
```

---

### 1.4 QC Module [5 days]

**Goal:** QC inspectors run structured inspections with pass/fail

#### Tasks:
- [ ] **QC Form Editor** (`src/app/(dash)/settings/qc-forms/page.tsx`)
  - List all QC forms (active/inactive)
  - Create/edit form modal:
    - Form name input
    - Add/remove/reorder steps
    - Each step has: name, checkpoints array
  - JSON editor for advanced users
  - Save to `POST /api/qc-forms` or `PATCH /api/qc-forms/[id]`

- [ ] **QC Inspection Interface** (`src/app/(dash)/qc/[workOrderId]/inspect/page.tsx`)
  - Select QC form from dropdown (show active forms)
  - Step-by-step wizard:
    - Display step name
    - Show checkpoints as checkboxes or pass/fail toggles
    - Notes textarea per step
    - Photo upload per step
  - Final step: Overall pass/fail toggle
  - Submit to `POST /api/work-orders/[workOrderId]/qc-results`

- [ ] **QC Results Display**
  - Show in work order detail page
  - Display all QC results with timestamp, inspector, pass/fail
  - Expandable to show step-by-step results
  - Show photos

- [ ] **Rework Task Logic** (backend)
  - On QC fail, auto-create task with `type: "rework"`
  - Move work order stage back to `in_production`
  - Add note explaining rework reason
  - Trigger via QC result creation

**API Updates:**
```typescript
// New: GET /api/qc-forms/route.ts - list forms
// New: POST /api/qc-forms/route.ts - create form
// New: PATCH /api/qc-forms/[id]/route.ts - update form
// New: POST /api/work-orders/[workOrderId]/qc-results/route.ts - submit inspection
// Update: Add rework task creation logic in qc-results POST handler
```

---

## 🔗 Phase 2: Integrations (Week 4)

### 2.1 Shipping Module [3 days]

**Goal:** Create Aramex shipments and track status

#### Tasks:
- [ ] **Aramex Settings UI** (`src/app/(dash)/settings/integrations/page.tsx`)
  - Tabs: WooCommerce, Formbricks, Aramex, Brevo
  - Aramex section: input fields for base URL, key, secret, account number
  - Test connection button
  - Save to environment or database settings table

- [ ] **Aramex API Client** (`src/lib/aramex.ts`)
  - Function: `createShipment(workOrder, shipmentDetails)` → calls Aramex API
  - Function: `getLabel(waybill)` → fetches PDF label
  - Function: `trackShipment(waybill)` → fetches tracking updates
  - Handle authentication, error responses

- [ ] **Create Shipment UI** (in work order detail)
  - Show "Create Shipment" button when stage = `ready_to_ship`
  - Modal form: shipping address (pre-filled from customer), package details
  - Submit → call `POST /api/work-orders/[id]/shipments`
  - Display waybill number, download label button
  - Move work order to `in_transit_to_eu`

- [ ] **Aramex Webhook Handler** (`src/app/api/webhooks/aramex/route.ts`)
  - Receive tracking updates
  - Update Shipment record status and tracking JSON
  - Update work order stage based on status (delivered → `at_eu_tailor`)
  - Add audit log

**API Updates:**
```typescript
// New: POST /api/work-orders/[id]/shipments/route.ts - create shipment via Aramex
// New: GET /api/shipments/[id]/label/route.ts - download label PDF
// New: POST /api/webhooks/aramex/route.ts - tracking webhook
// New: GET /api/settings/integrations/route.ts - get integration configs
// New: POST /api/settings/integrations/route.ts - save configs
```

---

### 2.2 Email Notification System [4 days]

**Goal:** Send automated alerts and reminders via Brevo SMTP

#### Tasks:
- [ ] **Email Utility** (`src/lib/email.ts`)
  - Function: `sendEmail(to, subject, htmlBody)`
  - Use `nodemailer` with Brevo SMTP config
  - Error handling and logging

- [ ] **Handlebars Templates** (`src/emails/templates/`)
  - Create templates:
    - `measurement-submitted.hbs` - notify ops
    - `measurement-approved.hbs` - notify EU tailor
    - `production-started.hbs` - notify customer
    - `qc-passed.hbs` - notify ops
    - `qc-failed.hbs` - notify ops + tailor
    - `shipment-created.hbs` - notify customer with tracking
    - `ready-for-pickup.hbs` - notify customer
  - Variables: customer name, work order ID, tailor name, etc.
  - Compile with `handlebars` package

- [ ] **Email Trigger Points** (add to existing endpoints)
  - After measurement submission → send to ops
  - After measurement approval → send to EU tailor + customer
  - When stage moves to `in_production` → send to customer
  - After QC result created → send based on pass/fail
  - After shipment created → send to customer
  - When stage = `ready_for_pickup` → send to customer

- [ ] **Reminder Cron Job** (`src/lib/reminders.ts` + setup cron)
  - Query work orders:
    - Stage = `measurement_pending` for >24h → email EU tailor
    - Tasks with `status = in_progress` for >48h → email assignee
    - Due date in next 72h → email ops
  - Run daily via Vercel Cron, AWS EventBridge, or node-cron
  - Create `/api/cron/reminders` endpoint (protected by secret)

**Dependencies:**
```bash
pnpm add nodemailer handlebars
pnpm add -D @types/nodemailer
```

**API Updates:**
```typescript
// New: POST /api/cron/reminders/route.ts - trigger reminder emails (protected)
// Update: All existing endpoints to trigger emails on state changes
```

---

## 👥 Phase 3: Role-Specific Views (Week 5)

### 3.1 EU Tailor View [2 days]

**Goal:** Tailored interface for EU tailors to manage measurements

#### Tasks:
- [ ] **EU Tailor Dashboard** (`src/app/(dash)/my-work/page.tsx`)
  - Show only work orders assigned to current user (filter by `assignedEuTailorId`)
  - "Today" section: measurement_pending with due date today/overdue
  - Search bar: find customer by email or phone
  - Quick actions: "Record Measurements", "View Order"

- [ ] **Customer Search** (top nav search box)
  - Autocomplete API: `GET /api/customers/search?q=term`
  - Results show: name, email, phone, recent orders
  - Click → navigate to latest work order or order list

**API Updates:**
```typescript
// New: GET /api/customers/search/route.ts - search by email/phone/name
// New: GET /api/my-work/route.ts - get current user's assigned orders
```

---

### 3.2 KE Tailor View [2 days]

**Goal:** Task-focused interface for Kenya production tailors

#### Tasks:
- [ ] **My Tasks Page** (`src/app/(dash)/my-tasks/page.tsx`)
  - Query tasks assigned to current user
  - Group by work order
  - Show: task type, work order customer, status, start/finish times
  - "Start Task" button → update status to `in_progress`, set `startedAt`
  - "Finish Task" button → update status to `completed`, set `finishedAt`
  - Photo upload for progress documentation

- [ ] **Task Detail Modal**
  - Show checklist (if defined)
  - Allow marking checklist items complete
  - Notes section
  - Upload progress photos

**API Updates:**
```typescript
// New: GET /api/my-tasks/route.ts - get current user's assigned tasks
// Update: PATCH /api/work-orders/[id]/tasks/[taskId]/route.ts
  // - Add checklist update logic
  // - Add photo upload array
```

---

### 3.3 QC Inspector View [1 day]

**Goal:** Show only work orders in QC stage

#### Tasks:
- [ ] **QC Dashboard** (`src/app/(dash)/qc/page.tsx`)
  - List work orders with `currentStage = in_qc`
  - Show: customer, tailor, date entered QC
  - "Run Inspection" button → navigate to inspection interface
  - Show past inspections with results

**API Updates:**
```typescript
// New: GET /api/qc/pending/route.ts - get orders in QC stage
```

---

### 3.4 Owner/Ops Views [2 days]

**Goal:** Advanced management features for admins

#### Tasks:
- [ ] **Audit Log Viewer** (`src/app/(dash)/audit/page.tsx`)
  - Table: timestamp, actor, action, target, diff
  - Filters: date range, actor, action type
  - Search by target ID
  - Pagination
  - Export to CSV

- [ ] **CSV Export** (work orders page)
  - Add "Export CSV" button
  - Include: all work order fields, customer info, current stage, dates
  - Generate CSV client-side or server-side
  - Download file

- [ ] **Global Filters Enhancement**
  - Add to Kanban board: show all vs. my assignments toggle
  - Priority filter
  - Overdue filter

**API Updates:**
```typescript
// New: GET /api/audit-logs/route.ts - paginated audit log
// New: GET /api/work-orders/export/route.ts - CSV export
```

---

## 🔧 Technical Implementation Details

### Shared Components to Build

```
src/components/
├── WorkOrderCard.tsx          # Card for Kanban/lists
├── CustomerSearch.tsx         # Autocomplete search
├── StageTransitionButton.tsx  # Move to next stage with validation
├── TaskCard.tsx               # Display task info
├── MeasurementDisplay.tsx     # Show measurement data
├── QCResultCard.tsx           # Display QC results
├── FileUpload.tsx             # Reusable S3 upload with presigned URL
├── FilterBar.tsx              # Reusable filter controls
├── EmptyState.tsx             # No data placeholder
└── ConfirmDialog.tsx          # Confirmation modals
```

### Authentication Middleware Pattern

Every new API route should use:
```typescript
import { requirePermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const session = await requirePermission("resource:action");
  if (session instanceof NextResponse) return session;
  
  // Filter data by role
  const user = session.user as any;
  if (user.role === "EU_TAILOR") {
    // Only show assigned orders
  }
  // ... rest of logic
}
```

### State Management

- Use React Server Components for data fetching where possible
- Client components: use `useState` + `useEffect` or consider `SWR`/`React Query` for caching
- Form state: `react-hook-form`
- Global state (if needed): Context API or Zustand

### File Upload Pattern

All file uploads should follow:
1. Client requests presigned URL: `POST /api/files/presign`
2. Client uploads to S3 directly via presigned URL
3. Client saves public URL to database field

### Error Handling

- All API routes return consistent format: `{ error: string }` on failure
- Use `try/catch` blocks
- Log errors to console (add error tracking service in production)
- Display user-friendly error messages with toast notifications

---

## 📅 Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1.1** | 3 days | Work order list, create modal, detail page |
| **Phase 1.2** | 5 days | Native measurement form, Formbricks webhook |
| **Phase 1.3** | 4 days | Kanban board, task management |
| **Phase 1.4** | 5 days | QC forms editor, inspection interface |
| **Phase 2.1** | 3 days | Aramex integration, shipment creation |
| **Phase 2.2** | 4 days | Email system with templates and reminders |
| **Phase 3.1** | 2 days | EU tailor dashboard |
| **Phase 3.2** | 2 days | KE tailor task view |
| **Phase 3.3** | 1 day  | QC inspector dashboard |
| **Phase 3.4** | 2 days | Audit log viewer, CSV export |

**Total Estimated Time: 5 weeks (31 days)**

---

## 🎯 Acceptance Testing Checklist

After completion, verify:

- [ ] Ops can create manual work order → appears in Kanban
- [ ] WooCommerce webhook creates order with tasks
- [ ] EU tailor can submit measurements via native form
- [ ] Formbricks webhook imports measurements correctly
- [ ] Measurements show outlier warnings for invalid values
- [ ] Work order moves through all stages correctly
- [ ] Tasks can be assigned to KE tailors
- [ ] KE tailor can start/finish tasks and upload photos
- [ ] QC inspector can run inspection with custom forms
- [ ] QC fail creates rework task automatically
- [ ] Aramex shipment creation generates waybill and label
- [ ] Aramex webhook updates tracking status
- [ ] All 7 email notifications send correctly
- [ ] Reminder emails trigger after 24h/48h/72h
- [ ] EU tailor sees only assigned orders
- [ ] KE tailor sees only assigned tasks
- [ ] QC sees only orders in QC stage
- [ ] Audit log shows all actions
- [ ] CSV export includes all work orders

---

## 📦 Dependencies to Install

```bash
pnpm add nodemailer handlebars date-fns axios
pnpm add -D @types/nodemailer
```

---

## 🚀 Next Steps

1. Review and approve this plan
2. Set up project tracking (GitHub Issues, Linear, Jira, etc.)
3. Begin Phase 1.1: Work Order Management UI
4. Iterate with daily standups and demos
5. Deploy to staging after each phase for testing
6. Conduct full acceptance testing before production deployment

---

**Questions or Changes?** Update this plan as priorities shift or requirements change.
