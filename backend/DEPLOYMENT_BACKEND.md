# 🔧 BACKEND SERVER DEPLOYMENT GUIDE

Complete guide for deploying M62 WEB TV backend server.

## 📋 PREREQUISITES

1. Node.js installed locally (v14+)
2. GitHub account
3. Railway/Render account
4. Gmail with app-specific password
5. Backend code in `backend/` folder

---

## 🚀 LOCAL TESTING (Before Deployment)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Create `.env` File
```bash
# Copy from template
cp .env.example .env

# Edit .env with your credentials
notepad .env
```

### Step 3: Configure Email
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd1234efgh5678  # 16-char app password
ADMIN_EMAIL=admin@m62webtv.ne
PORT=3000
```

### Step 4: Test Locally
```bash
npm start
# Should see: "Server running on port 3000"
```

### Step 5: Test Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Test email
curl -X POST http://localhost:3000/api/test-email

# Test contact form
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello"}'
```

---

## 🌐 DEPLOY ON RAILWAY

### Step 1: Create Railway Account
1. Go to: https://railway.app
2. Sign up with GitHub
3. Authorize access

### Step 2: Push to GitHub
```bash
cd backend

# Create git repo
git init
git add .
git commit -m "Backend server"
git remote add origin https://github.com/YOUR_USERNAME/m62-backend.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Railway Dashboard
1. Go to: https://railway.app/dashboard
2. Click "New Project"
3. Click "Deploy from GitHub repo"
4. Select `m62-backend` repository
5. Railway detects Node.js app automatically

### Step 4: Set Environment Variables
1. Click your project
2. Go to "Variables" tab
3. Add these variables:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ADMIN_EMAIL=admin@m62webtv.ne
   PORT=3000
   NODE_ENV=production
   ```
4. Click "Save"

### Step 5: View Deployment URL
1. Go to "Deployments" tab
2. Click on latest deployment
3. Copy the URL: `https://m62-backend-prod-xxxx.railway.app`

### Result
✅ Backend live and accessible
✅ Auto-deploys on GitHub push
✅ Free tier: 5GB/month bandwidth

---

## 🌐 DEPLOY ON RENDER

### Step 1: Connect GitHub
1. Go to: https://render.com
2. Sign up / Login
3. Click "New +"
4. Select "Web Service"
5. Connect GitHub account

### Step 2: Configure Service
- Name: `m62-backend`
- Repository: Select your `m62-backend` repo
- Branch: `main`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Region: Choose closest to you

### Step 3: Set Environment Variables
- Click "Environment"
- Add variables:
  ```
  EMAIL_SERVICE=gmail
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASSWORD=your-app-password
  ADMIN_EMAIL=admin@m62webtv.ne
  NODE_ENV=production
  ```

### Step 4: Deploy
- Click "Create Web Service"
- Wait for deployment to complete
- Copy URL: `https://m62-backend.onrender.com`

### Result
✅ Backend live
✅ Auto-deploys on GitHub push
✅ Free tier available (with limitations)

---

## 🌐 DEPLOY ON HEROKU

### Step 1: Create Heroku Account
1. Go to: https://heroku.com
2. Sign up
3. Create new app

### Step 2: Install Heroku CLI
```bash
# Windows
choco install heroku-cli

# macOS
brew install heroku/brew/heroku

# Verify installation
heroku --version
```

### Step 3: Login to Heroku
```bash
heroku login
# Opens browser for authentication
```

### Step 4: Create Heroku App
```bash
cd backend
heroku create m62-backend-prod
```

### Step 5: Set Environment Variables
```bash
heroku config:set EMAIL_SERVICE=gmail
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set ADMIN_EMAIL=admin@m62webtv.ne
heroku config:set NODE_ENV=production
```

### Step 6: Deploy
```bash
git push heroku main
```

### Step 7: View Live App
```bash
heroku open
# Opens browser to your app
```

### Result
✅ Backend live at: `m62-backend-prod.herokuapp.com`
✅ Logs: `heroku logs --tail`
⚠️ Note: Heroku free tier discontinued, now requires paid plan

---

## 📧 EMAIL CONFIGURATION

### Get Gmail App Password

1. Go to: https://myaccount.google.com/
2. Click "Security" (left sidebar)
3. Enable "2-Step Verification" (if not done)
4. Go back to Security
5. Click "App passwords"
6. Select:
   - App: Mail
   - Device: Windows PC / Other
7. Copy 16-character password
8. Add to `.env`:
   ```
   EMAIL_PASSWORD=abcd1234efgh5678
   ```

### Test Email Works
```bash
curl -X POST http://backend-url/api/test-email
```

Response should show:
```json
{
  "message": "Test email sent successfully",
  "mailResponse": "Email sent"
}
```

---

## 📊 MONITORING

### Watch Logs
```bash
# Railway
railway logs

# Render
render logs

# Heroku
heroku logs --tail
```

### Check Health
```bash
curl https://your-backend-url/api/health
```

Expected response:
```json
{
  "status": "Server OK ✅",
  "timestamp": "2026-06-10T10:30:00.000Z"
}
```

---

## 🔗 CONNECT FRONTEND TO BACKEND

### Update Frontend URL
In `index.html`, change all:
```javascript
// FROM
fetch('http://localhost:3000/api/contact', {

// TO
fetch('https://your-backend-url/api/contact', {
```

### Update CORS (Optional)
In `backend/server.js`:
```javascript
// Update CORS for production
const cors = require('cors');
app.use(cors({
  origin: 'https://your-frontend-url.netlify.app'
}));
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] GitHub account created
- [ ] Backend pushed to GitHub
- [ ] Railway/Render/Heroku account created
- [ ] Backend deployed successfully
- [ ] Environment variables set
- [ ] Email configured and tested
- [ ] Backend URL working
- [ ] Contact form submits successfully
- [ ] Newsletter signup works
- [ ] Logs show no errors
- [ ] Frontend connected to backend
- [ ] All forms send emails

---

## 🆘 TROUBLESHOOTING

### Backend Deployment Failed
1. Check logs: `railway logs` / `render logs`
2. Verify `package.json` exists
3. Verify `node_modules` not in git
4. Check `.env` file has correct values

### Email Not Sending
```bash
# Test endpoint
curl -X POST https://your-url/api/test-email -v

# Check logs for errors
heroku logs --tail -n 100
```

### Connection Timeout
1. Check backend is running: `/api/health`
2. Verify frontend URL in CORS
3. Check environment variables
4. Verify email credentials

### Port Issues
- Railway assigns random port automatically
- Don't hardcode port 3000
- Use `process.env.PORT || 3000`

---

## 📊 SCALING

### When Backend Gets Slow

#### Option 1: Upgrade Tier
- Railway: Increase tier
- Render: Upgrade instance size
- Heroku: Upgrade dyno

#### Option 2: Add Database
- MongoDB Atlas (free tier)
- Supabase (PostgreSQL)
- Firebase (NoSQL)

#### Option 3: Add Caching
- Redis Cloud
- Cloudflare Cache
- CDN Integration

---

## 🔒 SECURITY BEST PRACTICES

1. ✅ Never commit `.env` file
2. ✅ Rotate email passwords yearly
3. ✅ Use environment variables for secrets
4. ✅ Update dependencies: `npm update`
5. ✅ Monitor logs for errors
6. ✅ Disable debug in production
7. ✅ Add request rate limiting
8. ✅ Validate all inputs

---

## 📚 USEFUL COMMANDS

```bash
# Check Node version
node -v

# Check npm version
npm -v

# Install dependencies
npm install

# Start server
npm start

# Run with nodemon (auto-restart)
npm run dev

# Check running processes
lsof -i :3000

# Kill process on port
kill -9 <PID>

# Test connection
curl -v https://backend-url/api/health
```

---

## 📖 HELPFUL LINKS

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Heroku Documentation](https://devcenter.heroku.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [Express.js Guide](https://expressjs.com)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

**Created:** 2026-06-10
**Version:** 1.0
**Backend Deployment Guide**
