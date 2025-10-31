# Schema Migration Guide

This document describes the schema changes and migration steps needed.

## Changes Summary

### 1. WorkOrderStage Enum
- **Added**: `delivered` stage (between `ready_for_pickup` and `completed`)

### 2. ShipmentStatus Enum
- **Added**: `picked_up`, `out_for_delivery`, `delivery_failed`, `returned`, `on_hold`
- **Kept**: `pending`, `label_created`, `in_transit`, `delivered`
- **Removed**: `failed` (replaced by `delivery_failed`)

### 3. TaskStatus Enum
- **Changed**: 
  - `pending` → `todo`
  - `completed` → `done`
  - **Added**: `cancelled`
  - **Kept**: `in_progress`, `blocked`

### 4. Task Model
**Added fields:**
- `title` (String, required) - Task title
- `description` (String?, optional) - Task description
- `dueAt` (DateTime?, optional) - Due date
- `reminderSent` (Boolean, default: false) - Whether 24h reminder was sent
- `overdueReminderSent` (Boolean, default: false) - Whether overdue reminder was sent

**Changed fields:**
- `assigneeTailorId` → `assigneeId` (renamed for consistency)
- `workOrderId` is now optional (allows standalone tasks)
- Relation `assigneeTailor` → `assignee`

**Changed defaults:**
- `status` default changed from `pending` to `todo`

### 5. Shipment Model
**Changed fields:**
- `tracking` → `trackingHistory` (renamed)
- `waybill` now has `@unique` constraint

## Migration Steps

### Option 1: Using Prisma Migrate (Recommended)

```bash
# Generate migration
npx prisma migrate dev --name update_task_shipment_schema

# Review the generated migration file
# Apply to production
npx prisma migrate deploy
```

### Option 2: Manual SQL Migration

If you need to run SQL manually:

```sql
-- 1. Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN title VARCHAR(191) NOT NULL DEFAULT 'Untitled Task';
ALTER TABLE tasks ADD COLUMN description TEXT NULL;
ALTER TABLE tasks ADD COLUMN dueAt DATETIME NULL;
ALTER TABLE tasks ADD COLUMN reminderSent BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN overdueReminderSent BOOLEAN NOT NULL DEFAULT 0;

-- 2. Rename task assignee column
ALTER TABLE tasks CHANGE assigneeTailorId assigneeId VARCHAR(191) NULL;
ALTER TABLE tasks MODIFY workOrderId VARCHAR(191) NULL;

-- 3. Add index for dueAt
CREATE INDEX tasks_dueAt_idx ON tasks(dueAt);

-- 4. Rename shipment tracking column
ALTER TABLE shipments CHANGE tracking trackingHistory JSON NULL;

-- 5. Add unique constraint to waybill
ALTER TABLE shipments ADD UNIQUE KEY shipments_waybill_unique(waybill);

-- 6. Update existing task statuses
UPDATE tasks SET status = 'todo' WHERE status = 'pending';
UPDATE tasks SET status = 'done' WHERE status = 'completed';

-- 7. Update existing task titles based on type (set meaningful defaults)
UPDATE tasks SET title = 'Cutting' WHERE type = 'cutting' AND title = 'Untitled Task';
UPDATE tasks SET title = 'Sewing Coat' WHERE type = 'sewing_coat' AND title = 'Untitled Task';
UPDATE tasks SET title = 'Sewing Trouser' WHERE type = 'sewing_trouser' AND title = 'Untitled Task';
UPDATE tasks SET title = 'Finishing' WHERE type = 'finishing' AND title = 'Untitled Task';
UPDATE tasks SET title = 'Rework Required' WHERE type = 'rework' AND title = 'Untitled Task';

-- 8. Update shipment statuses if needed
UPDATE shipments SET status = 'delivery_failed' WHERE status = 'failed';
```

## Data Validation After Migration

Run these queries to verify migration success:

```sql
-- Check all tasks have titles
SELECT COUNT(*) FROM tasks WHERE title IS NULL OR title = '';

-- Check task statuses
SELECT status, COUNT(*) FROM tasks GROUP BY status;

-- Check shipment statuses
SELECT status, COUNT(*) FROM shipments GROUP BY status;

-- Verify assigneeId rename
SELECT COUNT(*) FROM tasks WHERE assigneeId IS NOT NULL;

-- Check waybill uniqueness
SELECT waybill, COUNT(*) FROM shipments WHERE waybill IS NOT NULL GROUP BY waybill HAVING COUNT(*) > 1;
```

## Rollback Plan

If you need to rollback:

```sql
-- Revert task changes
ALTER TABLE tasks DROP COLUMN title;
ALTER TABLE tasks DROP COLUMN description;
ALTER TABLE tasks DROP COLUMN dueAt;
ALTER TABLE tasks DROP COLUMN reminderSent;
ALTER TABLE tasks DROP COLUMN overdueReminderSent;
ALTER TABLE tasks CHANGE assigneeId assigneeTailorId VARCHAR(191) NULL;
ALTER TABLE tasks MODIFY workOrderId VARCHAR(191) NOT NULL;
UPDATE tasks SET status = 'pending' WHERE status = 'todo';
UPDATE tasks SET status = 'completed' WHERE status = 'done';

-- Revert shipment changes
ALTER TABLE shipments CHANGE trackingHistory tracking JSON NULL;
ALTER TABLE shipments DROP INDEX shipments_waybill_unique;
UPDATE shipments SET status = 'failed' WHERE status = 'delivery_failed';
```

## Post-Migration Tasks

1. Update any frontend components that reference old field names
2. Test task creation, update, and deletion
3. Test shipment tracking webhook
4. Verify cron job for task reminders works
5. Check that all API endpoints use correct field names

## Breaking Changes

⚠️ **API clients must update:**

- Task status values: `pending` → `todo`, `completed` → `done`
- Task field: `assigneeTailorId` → `assigneeId`
- Shipment field: `tracking` → `trackingHistory`
- Include `title` when creating tasks (now required)

## Notes

- All enums are updated in Prisma schema
- Backwards compatibility is NOT maintained for task statuses
- Existing shipments will need status migration if using old `failed` status
- Consider adding task titles to existing records based on type before making field required
