# Quick Start Guide - AAPanel Deployment

## 🚀 5-Minute Deploy

### Step 1: Upload Project
```bash
# On AAPanel server
cd /www/wwwroot
git clone <your-repo-url> nilotic-suits
# OR upload via FTP
```

### Step 2: Install & Build
```bash
cd /www/wwwroot/nilotic-suits
npm install
npm run build
```

### Step 3: Configure Environment
Create `.env.production`:
```env
DATABASE_URL="mysql://user:pass@localhost:3306/nilotic_suits"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
SETTINGS_ENCRYPTION_KEY="generate-32-char-key"
```

### Step 4: Run Migration
```bash
npx prisma migrate deploy
```

### Step 5: Configure AAPanel
**Node.js Manager:**
- Port: 3000
- Startup: `npm start`
- Environment: Production

**Reverse Proxy:**
- Target: `http://127.0.0.1:3000`
- Enable WebSocket: Yes

**SSL:** Let's Encrypt + Force HTTPS

### Step 6: Start Application
In AAPanel Node.js Manager → Start

---

## 🧪 Quick Test

1. Visit `https://yourdomain.com`
2. Login
3. Check dashboard loads
4. Navigate to `/tasks`
5. Navigate to `/settings`

---

## 📋 Pages to Test

| Page | URL | What to Check |
|------|-----|---------------|
| Dashboard | `/dashboard` | Metrics cards, chart |
| Kanban | `/tasks` | Task board loads |
| Work Orders | `/work-orders` | List with filters |
| Settings | `/settings` | All 4 tabs |
| Users | `/users` | User list |

---

## 🐛 Quick Fixes

**502 Error?**
```bash
pm2 restart all
```

**Database Error?**
```bash
npx prisma db push --force-reset  # WARNING: Resets DB
npx prisma migrate deploy
```

**Can't Save Settings?**
Check `SETTINGS_ENCRYPTION_KEY` in `.env`

---

## 📚 Full Documentation

- `DEPLOYMENT.md` - Complete guide
- `PRE_DEPLOYMENT_CHECKLIST.md` - Testing checklist  
- `SCHEMA_MIGRATION.md` - Database details
- `IMPLEMENTATION_COMPLETE.md` - Feature overview

---

## ✅ Ready to Deploy!

Upload, configure, test! 🚀
