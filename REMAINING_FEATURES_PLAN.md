# Remaining Features Implementation Plan

**Scope:** Final 10% of features  
**Estimated Time:** 2-3 days  
**Priority Order:** Based on business impact

---

## Feature 1: Audit Log Viewer [HIGH PRIORITY - 3 hours]

### Why First?
- Data already being collected
- Critical for compliance and debugging
- Simple to implement (just a display page)

### Implementation Steps

#### 1.1 Create Audit Log API Endpoint
**File:** `src/app/api/audit-logs/route.ts`

```typescript
// GET /api/audit-logs
- Query params: page, limit, actorId, action, target, startDate, endDate
- Return paginated audit logs with user details
- Filter by role (OWNER/OPS only)
```

**Estimated:** 30 minutes

---

#### 1.2 Create Audit Log Viewer Page
**File:** `src/app/(dash)/audit/page.tsx`

**Features:**
- Table with columns: Timestamp, Actor, Action, Target, Diff (JSON)
- Filters:
  - Date range picker (start/end dates)
  - Actor dropdown (list of users)
  - Action type dropdown (work_order_created, measurement_created, etc.)
  - Target ID search input
- Pagination controls
- JSON diff viewer (expand/collapse)
- Export visible rows to CSV

**Components to Build:**
- `DateRangePicker` - use shadcn/ui calendar
- `AuditLogTable` - reusable table component

**Estimated:** 2 hours

---

#### 1.3 Add to Navigation
**Update:** `src/components/Sidebar.tsx`

```typescript
{
  label: "Audit Logs",
  icon: FileText,
  href: "/audit",
  roles: ["OWNER", "OPS"],
}
```

**Estimated:** 5 minutes

---

**Total Time: 3 hours**

---

## Feature 2: CSV Export [MEDIUM PRIORITY - 1 hour]

### Why Second?
- Useful for reporting and data analysis
- Quick win, minimal code

### Implementation Steps

#### 2.1 Create CSV Export Utility
**File:** `src/lib/csv.ts`

```typescript
export function workOrdersToCSV(workOrders: any[]) {
  const headers = [
    "ID", "Customer Name", "Customer Email", "Customer Phone",
    "Current Stage", "Priority", "Due Date", "Assigned EU Tailor",
    "Created At", "Updated At"
  ];
  
  const rows = workOrders.map(wo => [
    wo.id,
    wo.customer.name,
    wo.customer.email,
    wo.customer.phone || "",
    wo.currentStage,
    wo.priority,
    wo.dueAt || "",
    wo.assignedEuTailor?.name || "",
    wo.createdAt,
    wo.updatedAt
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");
}
```

**Estimated:** 20 minutes

---

#### 2.2 Add Export Button to Work Orders Page
**Update:** `src/app/(dash)/work-orders/page.tsx`

```typescript
// Add button in header
<Button
  variant="outline"
  onClick={handleExport}
  disabled={!filtered?.length}
>
  <Download className="h-4 w-4 mr-2" />
  Export CSV
</Button>

// Handler
const handleExport = () => {
  const csv = workOrdersToCSV(filtered);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `work-orders-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Estimated:** 30 minutes

---

#### 2.3 Add Export to Audit Logs
**Update:** `src/app/(dash)/audit/page.tsx`

Same pattern as work orders - export visible/filtered rows.

**Estimated:** 10 minutes

---

**Total Time: 1 hour**

---

## Feature 3: QC Form Editor UI [LOW PRIORITY - 4 hours]

### Why Third?
- Forms can be managed via seed data for now
- More complex UI requirements
- Not blocking daily operations

### Implementation Steps

#### 3.1 Create QC Forms List Page
**File:** `src/app/(dash)/settings/qc-forms/page.tsx`

**Features:**
- Table of all QC forms
- Columns: Name, Steps Count, Active Status, Actions
- "Create New Form" button
- Edit/Delete actions (soft delete)
- Toggle active/inactive

**Estimated:** 1 hour

---

#### 3.2 Create QC Form Editor Modal/Page
**File:** `src/app/(dash)/settings/qc-forms/[id]/page.tsx` or modal

**Features:**
- Form name input
- Steps list with add/remove buttons
- For each step:
  - Step name input
  - Checkpoints list (textarea or dynamic inputs)
  - Drag-to-reorder steps
- Active/inactive toggle
- Save/Cancel buttons

**UI Structure:**
```
┌─────────────────────────────────┐
│ Form Name: [____________]       │
│                                 │
│ Steps:                          │
│ ┌───────────────────────────┐   │
│ │ Step 1: Fabric Quality    │   │
│ │ Checkpoints:              │   │
│ │ - No loose threads        │   │
│ │ - Even stitching          │   │
│ │ [Add Checkpoint] [Remove] │   │
│ └───────────────────────────┘   │
│ [+ Add Step]                    │
│                                 │
│ Active: [✓]                     │
│ [Save] [Cancel]                 │
└─────────────────────────────────┘
```

**Estimated:** 2.5 hours

---

#### 3.3 Update QC Forms API
**Update:** `src/app/api/qc-forms/[id]/route.ts`

```typescript
// PATCH /api/qc-forms/[id] - update form
// DELETE /api/qc-forms/[id] - soft delete (set deletedAt)
```

**Estimated:** 30 minutes

---

**Total Time: 4 hours**

---

## Feature 4: Aramex Shipment Creation UI [MEDIUM PRIORITY - 3 hours]

### Why Fourth?
- Shipping is critical but can be done manually initially
- Requires external API integration

### Implementation Steps

#### 4.1 Create Aramex API Client
**File:** `src/lib/aramex.ts`

```typescript
interface ShipmentDetails {
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientCountry: string;
  recipientPhone: string;
  weight: number; // kg
  description: string;
}

export async function createAramexShipment(details: ShipmentDetails) {
  // Call Aramex API
  const response = await fetch(process.env.ARAMEX_BASE_URL + "/shipments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ARAMEX_KEY}`,
    },
    body: JSON.stringify({
      // Map to Aramex format
      accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER,
      ...details,
    }),
  });
  
  const data = await response.json();
  
  return {
    waybill: data.waybillNumber,
    labelUrl: data.labelPdfUrl,
    cost: data.shippingCost,
  };
}
```

**Estimated:** 1 hour

---

#### 4.2 Create Shipment Creation API
**File:** `src/app/api/work-orders/[id]/shipments/route.ts`

```typescript
// POST /api/work-orders/[id]/shipments
- Validate work order is in "ready_to_ship" stage
- Call createAramexShipment()
- Create Shipment record in database
- Update work order stage to "in_transit_to_eu"
- Send email notification
```

**Estimated:** 45 minutes

---

#### 4.3 Add Shipment Creation UI
**Update:** `src/app/(dash)/work-orders/[id]/page.tsx`

Add button when `currentStage === "ready_to_ship"`:

```typescript
{workOrder.currentStage === "ready_to_ship" && (
  <Button onClick={() => setShowShipmentModal(true)}>
    <Truck className="h-4 w-4 mr-2" />
    Create Shipment
  </Button>
)}

// Modal with form:
<Dialog open={showShipmentModal}>
  <DialogContent>
    <h2>Create Shipment</h2>
    <form onSubmit={handleCreateShipment}>
      <Input label="Recipient Name" defaultValue={customer.name} />
      <Input label="Address" />
      <Input label="City" />
      <Select label="Country">...</Select>
      <Input label="Phone" />
      <Input label="Weight (kg)" type="number" />
      <Textarea label="Description" />
      <Button type="submit">Create Shipment</Button>
    </form>
  </DialogContent>
</Dialog>
```

**Estimated:** 1 hour

---

#### 4.4 Display Shipment Details
**Update:** Shipments tab in work order detail

Show:
- Waybill number (copyable)
- Label download link
- Tracking status
- Cost
- Created date

**Estimated:** 15 minutes

---

**Total Time: 3 hours**

---

## Feature 5: Reminder Cron Job System [LOW PRIORITY - 4 hours]

### Why Last?
- Most complex to deploy
- Requires infrastructure (Vercel Cron or separate service)
- Can be manual initially

### Implementation Steps

#### 5.1 Create Reminders Utility
**File:** `src/lib/reminders.ts`

```typescript
export async function checkAndSendReminders() {
  // 1. Measurement pending for >24h
  const overduemeasurements = await prisma.workOrder.findMany({
    where: {
      currentStage: "measurement_pending",
      createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      deletedAt: null,
    },
    include: { assignedEuTailor: true, customer: true },
  });
  
  for (const wo of overduemeasurements) {
    if (wo.assignedEuTailor) {
      await sendEmail({
        to: wo.assignedEuTailor.email,
        subject: "Reminder: Measurement Pending",
        template: "measurementReminder",
        data: {
          workOrderId: wo.id,
          customerName: wo.customer.name,
          daysOverdue: Math.floor((Date.now() - wo.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
        },
      });
    }
  }
  
  // 2. Tasks stalled for >48h
  const stalledTasks = await prisma.task.findMany({
    where: {
      status: "in_progress",
      startedAt: { lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      deletedAt: null,
    },
    include: { assigneeTailor: true, workOrder: { include: { customer: true } } },
  });
  
  for (const task of stalledTasks) {
    if (task.assigneeTailor) {
      await sendEmail({
        to: task.assigneeTailor.email,
        subject: "Reminder: Task In Progress for 48h",
        template: "taskReminder",
        data: {
          taskType: task.type,
          workOrderId: task.workOrder.id,
          customerName: task.workOrder.customer.name,
        },
      });
    }
  }
  
  // 3. Due date in next 72h
  const upcomingDue = await prisma.workOrder.findMany({
    where: {
      dueAt: {
        gte: new Date(),
        lte: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
      currentStage: { notIn: ["completed", "blocked"] },
      deletedAt: null,
    },
    include: { customer: true },
  });
  
  for (const wo of upcomingDue) {
    await sendEmail({
      to: "ops@niloticsuits.com",
      subject: "Reminder: Work Order Due Soon",
      template: "dueDateReminder",
      data: {
        workOrderId: wo.id,
        customerName: wo.customer.name,
        dueDate: wo.dueAt,
      },
    });
  }
}
```

**Estimated:** 2 hours

---

#### 5.2 Add Email Templates for Reminders
**Update:** `src/lib/email.ts`

Add 3 new templates:
- `measurementReminder`
- `taskReminder`
- `dueDateReminder`

**Estimated:** 30 minutes

---

#### 5.3 Create Cron API Endpoint
**File:** `src/app/api/cron/reminders/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAndSendReminders } from "@/lib/reminders";

// POST /api/cron/reminders
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    await checkAndSendReminders();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

**Estimated:** 30 minutes

---

#### 5.4 Setup Vercel Cron
**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Alternative:** Use external cron service (cron-job.org, EasyCron) to call the endpoint daily.

**Estimated:** 15 minutes

---

#### 5.5 Add CRON_SECRET to .env
**Update:** `.env` and `.env.example`

```bash
CRON_SECRET="generate-random-secret-here"
```

**Estimated:** 5 minutes

---

#### 5.6 Testing
Create manual test endpoint:
**File:** `src/app/api/test/reminders/route.ts`

```typescript
// GET /api/test/reminders
// (Only in development)
```

Run and verify emails sent.

**Estimated:** 40 minutes

---

**Total Time: 4 hours**

---

## Implementation Timeline

### Option A: Sequential (12 hours / 1.5 days)
```
Day 1 Morning:   Feature 1 (Audit Log Viewer)     - 3h
Day 1 Afternoon: Feature 2 (CSV Export)            - 1h
                 Feature 4 (Aramex Shipment UI)    - 3h
Day 2 Morning:   Feature 3 (QC Form Editor)        - 4h
Day 2 Afternoon: Feature 5 (Reminder Cron)         - 4h (start)
```

### Option B: By Priority (skip low priority)
```
Day 1: Features 1, 2, 4 only (7 hours)
- Audit logs, CSV export, Aramex UI
- Skip QC form editor and reminders (can do manually)
```

### Option C: Phased Rollout
```
Week 1: Features 1 & 2 (Audit logs + CSV)
Week 2: Feature 4 (Aramex shipment creation)
Month 2: Features 3 & 5 (QC editor + Reminders)
```

---

## Dependencies to Install

```bash
# No new dependencies needed!
# All features use existing packages:
# - nodemailer (already installed)
# - date-fns (already installed)
# - UI components (already installed)
```

---

## Testing Checklist

After each feature:

### Feature 1: Audit Logs
- [ ] View all audit logs
- [ ] Filter by date range
- [ ] Filter by actor
- [ ] Filter by action type
- [ ] Search by target ID
- [ ] Pagination works
- [ ] Export to CSV

### Feature 2: CSV Export
- [ ] Export work orders to CSV
- [ ] File downloads correctly
- [ ] All columns included
- [ ] Handles empty data
- [ ] Export filtered results only

### Feature 3: QC Form Editor
- [ ] Create new QC form
- [ ] Edit existing form
- [ ] Add/remove steps
- [ ] Add/remove checkpoints
- [ ] Toggle active/inactive
- [ ] Soft delete form

### Feature 4: Aramex Shipments
- [ ] Create shipment button appears when ready_to_ship
- [ ] Form pre-fills customer data
- [ ] API successfully creates shipment
- [ ] Waybill number saved
- [ ] Label PDF downloadable
- [ ] Work order moves to in_transit_to_eu
- [ ] Email notification sent

### Feature 5: Reminders
- [ ] 24h measurement reminder sent
- [ ] 48h task reminder sent
- [ ] 72h due date reminder sent
- [ ] Cron runs daily at 9am
- [ ] No duplicate emails sent
- [ ] Only sends to active work orders

---

## Recommendation

**Start with Features 1, 2, and 4** (7 hours) for maximum business impact.

Features 3 and 5 can be deferred since:
- QC forms work fine via seed data
- Reminders can be manual initially

This gets you to **95% completion** in 1 day of focused work.

---

## Questions to Answer Before Starting

1. **Aramex API Access:** Do you have Aramex Kenya API credentials and documentation?
2. **Cron Hosting:** Will this be deployed on Vercel (built-in cron) or another platform?
3. **Priority:** Which features are absolutely needed before launch vs. nice-to-have?

Let me know your preferences and I can start implementation!
