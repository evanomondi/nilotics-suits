# Pre-Deployment Checklist for AAPanel

## ✅ Completed Work (Phases 9-14)

### Phase 9: Kanban Board UI
- ✅ `/tasks` - Full kanban board with drag-and-drop
- ✅ Task cards with metadata
- ✅ Create task modal
- ✅ Task detail modal with edit/delete
- ✅ Filters (status, assignee)

### Phase 10: Settings Page
- ✅ `/settings` - General settings
- ✅ `/settings/aramex` - Aramex API config
- ✅ `/settings/email` - SMTP config
- ✅ `/settings/company` - Company info
- ✅ AES-256 encryption for sensitive data

### Phase 11: Dashboard
- ✅ `/dashboard` - Overview dashboard
- ✅ Metrics cards (4)
- ✅ Stage distribution chart
- ✅ Recent activity feed
- ✅ Pending tasks widget
- ✅ Quick actions

### Phase 12: Task Management
- ✅ Task detail modal integrated with kanban
- ✅ Status quick-change
- ✅ Delete functionality
- ✅ Full metadata display

### Phase 13: Work Order List
- ✅ `/work-orders` - Work order list page
- ✅ Search by ID, name, email
- ✅ Advanced filters (stage, priority, tailor)
- ✅ Color-coded stages and priorities
- ✅ Click row to view details

### Phase 14: User Management
- ✅ `/users` - User list page
- ✅ Role badges and verification status
- ✅ Delete user functionality
- ✅ User avatars

## 🗄️ Database Changes Required

### New/Updated Models:
1. **Setting** - Key-value store for system settings
2. **Task** - Added fields:
   - `title` (required)
   - `description`
   - `dueAt`
   - `reminderSent`
   - `overdueReminderSent`
   - Renamed: `assigneeTailorId` → `assigneeId`
   - `workOrderId` now optional
3. **Shipment** - Changed:
   - `tracking` → `trackingHistory`
   - `waybill` now unique
4. **WorkOrderStage** - Added: `delivered`
5. **ShipmentStatus** - Added multiple statuses
6. **TaskStatus** - Changed: `pending`→`todo`, `completed`→`done`

### Migration Command:
```bash
npx prisma migrate deploy
```

## 📦 Environment Variables Needed

Create `.env.production` with:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/nilotic_suits"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"

# Email (Brevo/SMTP)
BREVO_HOST="smtp-relay.brevo.com"
BREVO_PORT="587"
BREVO_USER="your-user"
BREVO_PASS="your-password"
BREVO_FROM_NAME="Nilotic Suits"
BREVO_FROM_EMAIL="noreply@yourdomain.com"

# Aramex
ARAMEX_BASE_URL="https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json"
ARAMEX_USERNAME="your-username"
ARAMEX_PASSWORD="your-password"
ARAMEX_ACCOUNT_NUMBER="your-account"
ARAMEX_ACCOUNT_PIN="your-pin"
ARAMEX_ACCOUNT_ENTITY="your-entity"
ARAMEX_ACCOUNT_COUNTRY_CODE="KE"
ARAMEX_WEBHOOK_SECRET="random-secret"

# Settings Encryption
SETTINGS_ENCRYPTION_KEY="generate-32-char-key"

# Formbricks
FORMBRICKS_WEBHOOK_SECRET="your-secret"

# Cron
CRON_SECRET="random-secret"

# UploadThing
UPLOADTHING_SECRET="your-secret"
UPLOADTHING_APP_ID="your-app-id"
```

## 🚀 Deployment Steps

### 1. Prepare Files
```bash
# Build the application
npm install
npm run build
```

### 2. Upload to AAPanel
- Upload entire project to `/www/wwwroot/nilotic-suits`
- Or use Git clone if available

### 3. Database Setup
```bash
cd /www/wwwroot/nilotic-suits
npx prisma migrate deploy
```

### 4. Configure Node.js Manager
- Project path: `/www/wwwroot/nilotic-suits`
- Node version: 18.x or higher
- Port: 3000
- Startup file: `npm`
- Run command: `start`
- Environment: Production

### 5. Configure Reverse Proxy (in AAPanel)
- Proxy name: `nextjs`
- Target URL: `http://127.0.0.1:3000`
- Enable WebSocket: Yes
- Cache: No

### 6. Setup SSL
- Use Let's Encrypt or upload certificate
- Force HTTPS

### 7. Configure Cron Job (Task Reminders)
```bash
0 * * * * curl -X GET "https://yourdomain.com/api/cron/task-reminders?secret=YOUR_CRON_SECRET"
```

### 8. File Permissions
```bash
chown -R www:www /www/wwwroot/nilotic-suits
chmod -R 755 /www/wwwroot/nilotic-suits
```

## 🧪 Testing Checklist

Once deployed, test these flows:

### Authentication
- [ ] Login works
- [ ] Logout works
- [ ] Session persistence

### Dashboard
- [ ] Metrics display correctly
- [ ] Stage chart shows data
- [ ] Recent activity loads
- [ ] Pending tasks show

### Tasks (Kanban)
- [ ] Board loads with tasks
- [ ] Drag-and-drop works
- [ ] Create new task
- [ ] Click task to view details
- [ ] Update task status
- [ ] Delete task
- [ ] Filters work (status, assignee)

### Work Orders
- [ ] List loads
- [ ] Search works (ID, name, email)
- [ ] Filters work (stage, priority, tailor)
- [ ] Click row navigates to detail

### Settings
- [ ] General settings save
- [ ] Aramex settings save (check encryption)
- [ ] Email settings save
- [ ] Company settings save
- [ ] Values persist after refresh

### Users
- [ ] User list loads
- [ ] Delete user works
- [ ] Cannot delete own account

### API Endpoints
- [ ] `/api/dashboard` returns metrics
- [ ] `/api/tasks` returns tasks with filters
- [ ] `/api/work-orders` returns orders with search
- [ ] `/api/settings` saves/retrieves correctly
- [ ] `/api/users` returns user list

## 🐛 Known Issues to Test

1. **Database Connection**: Verify DATABASE_URL is correct
2. **RBAC Permissions**: Check if permissions are properly enforced
3. **Encryption**: Test that Aramex/SMTP passwords are encrypted in DB
4. **Cron Job**: Test task reminder cron manually first
5. **Webhooks**: Test Aramex tracking webhook with dummy data

## 📝 Post-Deployment Tasks

1. Create initial admin user (via database or seed script)
2. Configure Aramex webhook URL in their dashboard
3. Configure Formbricks webhook (if used)
4. Test email sending (SMTP connection)
5. Create a test work order through full workflow
6. Monitor logs for errors: `/www/wwwroot/nilotic-suits/.next/logs`

## 🔧 Troubleshooting

### Application won't start
- Check Node.js version: `node -v` (should be 18+)
- Check build output: `npm run build`
- Check logs: `pm2 logs` or AAPanel logs

### Database errors
- Verify DATABASE_URL format
- Check MySQL is running: `systemctl status mysql`
- Test connection: `npx prisma db pull`

### 502 Bad Gateway
- Check if app is running: `pm2 status`
- Check port 3000 is not blocked
- Verify reverse proxy configuration

### Settings not saving
- Check SETTINGS_ENCRYPTION_KEY is set
- Check permissions on database
- Check API logs for errors

## 📊 Current System State

**Total Files Created/Modified**: ~50+  
**API Endpoints**: ~35+  
**Database Models**: 12  
**Pages**: 10+  
**Components**: 15+

**Ready for production!** 🎉
