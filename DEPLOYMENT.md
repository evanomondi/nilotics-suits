# Deployment Guide - AAPanel

This guide covers deploying the Nilotic Suits ERP system to AAPanel.

## Prerequisites

- AAPanel installed on your server
- Node.js 18+ installed via AAPanel
- MySQL database created (AAPanel default)
- Domain pointed to server

## 1. Environment Setup

Create `.env.production` file with:

```env
# Database
DATABASE_URL="mysql://user:pass@localhost:3306/nilotic_suits"

# Auth (NextAuth.js)
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl"

# Email (Brevo/SMTP)
BREVO_HOST="smtp-relay.brevo.com"
BREVO_PORT="587"
BREVO_USER="your-brevo-user"
BREVO_PASS="your-brevo-password"
BREVO_FROM_NAME="Nilotic Suits"
BREVO_FROM_EMAIL="noreply@yourdomain.com"

# Aramex API
ARAMEX_BASE_URL="https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json"
ARAMEX_USERNAME="your-aramex-username"
ARAMEX_PASSWORD="your-aramex-password"
ARAMEX_ACCOUNT_NUMBER="your-account-number"
ARAMEX_ACCOUNT_PIN="your-pin"
ARAMEX_ACCOUNT_ENTITY="your-entity"
ARAMEX_ACCOUNT_COUNTRY_CODE="KE"
ARAMEX_WEBHOOK_SECRET="generate-a-random-string"

# Formbricks
FORMBRICKS_WEBHOOK_SECRET="generate-a-random-string"

# Cron
CRON_SECRET="generate-a-random-string"

# File uploads
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Optional: Analytics, monitoring
```

## 2. Build Application

```bash
npm install
npm run build
```

## 3. AAPanel Configuration

### Create Website

1. Go to AAPanel → Website → Add site
2. Domain: `yourdomain.com`
3. Project directory: `/www/wwwroot/nilotic-suits`
4. PHP version: None (Node.js app)

### Configure Node.js Project

1. Go to AAPanel → App Store → Install "Node.js Manager"
2. In Node.js Manager:
   - Add project: `/www/wwwroot/nilotic-suits`
   - Node version: 18.x or higher
   - Port: 3000
   - Startup file: `npm`
   - Run command: `start`
   - Environment: Production

### Configure Reverse Proxy

1. Go to AAPanel → Website → Select your site → Settings
2. Configure reverse proxy:
   - Proxy name: `nextjs`
   - Target URL: `http://127.0.0.1:3000`
   - Enable cache: No
   - Enable WebSocket: Yes

### Setup SSL

1. In site settings → SSL
2. Use Let's Encrypt or upload your certificate
3. Force HTTPS

## 4. Database Migration

```bash
cd /www/wwwroot/nilotic-suits
npx prisma migrate deploy
npx prisma db seed  # If you have seed data
```

## 5. Configure Cron Jobs

In AAPanel → Cron:

### Task Reminders (runs every hour)
```bash
0 * * * * curl -X GET "https://yourdomain.com/api/cron/task-reminders?secret=YOUR_CRON_SECRET"
```

### Optional: Database Backup (daily at 2 AM)
```bash
0 2 * * * mysqldump -u root -p nilotic_suits > /www/backup/nilotic_suits_$(date +\%Y\%m\%d).sql
```

## 6. Configure Webhooks

### Aramex Tracking Webhook
Configure in Aramex dashboard:
- URL: `https://yourdomain.com/api/webhooks/aramex-tracking`
- Method: POST
- Add webhook secret header if supported

### Formbricks Webhook
Configure in Formbricks:
- URL: `https://yourdomain.com/api/webhooks/formbricks`
- Method: POST
- Secret: Your `FORMBRICKS_WEBHOOK_SECRET`

## 7. File Permissions

```bash
chown -R www:www /www/wwwroot/nilotic-suits
chmod -R 755 /www/wwwroot/nilotic-suits
```

## 8. Start Application

In AAPanel Node.js Manager:
- Select project
- Click "Start"
- Check logs for any errors

## 9. Monitoring

### Process Manager
AAPanel Node.js Manager provides:
- Auto-restart on crash
- CPU/Memory monitoring
- Application logs

### Log Files
- Application logs: `/www/wwwroot/nilotic-suits/.next/logs`
- Access logs: `/www/wwwlogs/yourdomain.com.log`
- Error logs: `/www/wwwlogs/yourdomain.com.error.log`

## 10. Post-Deployment Checklist

- [ ] Test authentication (login/logout)
- [ ] Test work order creation
- [ ] Test measurement submission
- [ ] Test QC form submission
- [ ] Test shipment creation
- [ ] Verify email delivery
- [ ] Test webhooks with dummy data
- [ ] Check cron job execution
- [ ] Monitor performance and errors
- [ ] Setup backups

## Updating Application

```bash
cd /www/wwwroot/nilotic-suits
git pull origin main  # or upload files via FTP
npm install
npm run build
```

In AAPanel Node.js Manager → Restart project

## Troubleshooting

### Application won't start
- Check Node.js version compatibility
- Verify environment variables
- Check database connection
- Review logs in `/www/wwwroot/nilotic-suits/logs`

### 502 Bad Gateway
- Ensure Node.js app is running
- Verify port 3000 is not blocked
- Check reverse proxy configuration

### Database errors
- Verify DATABASE_URL is correct
- Check MySQL is running: `systemctl status mysql`
- Run migrations: `npx prisma migrate deploy`

### Email not sending
- Verify SMTP credentials
- Test connection: `telnet smtp-relay.brevo.com 587`
- Check firewall rules for outbound SMTP

## Security Recommendations

1. Keep AAPanel and all packages updated
2. Use strong passwords for all services
3. Enable firewall and only allow necessary ports
4. Regularly backup database
5. Monitor access logs for suspicious activity
6. Use environment variables for all secrets
7. Enable rate limiting on API endpoints
8. Setup fail2ban for brute force protection
