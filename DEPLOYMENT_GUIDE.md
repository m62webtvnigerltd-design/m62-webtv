# 🚀 DEPLOYMENT GUIDE - M62 WEB TV

This guide shows how to deploy your website to production.

## 📋 DEPLOYMENT OPTIONS

### **FRONTEND (Website)**
1. GitHub Pages (FREE - easiest)
2. Netlify (FREE - with CI/CD)
3. Vercel (FREE - very fast)

### **BACKEND (Server)**
1. Railway (Cheap - $5/month)
2. Render (Free tier available)
3. Heroku (Paid - very reliable)

---

## 🌐 OPTION 1: Deploy Frontend on Netlify (RECOMMENDED)

### Step 1: Push Code to GitHub
1. Create GitHub account: https://github.com
2. Create new repository: `m62-webtv`
3. Upload your files:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/m62-webtv.git
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to: https://netlify.com
2. Click "New site from Git"
3. Select GitHub
4. Choose your repository
5. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: . (root)
6. Click "Deploy"

### Result
- Website live at: `m62-webtv.netlify.app`
- Auto-deploys when you push to GitHub
- Free HTTPS certificate

---

## 🚀 OPTION 2: Deploy Backend on Railway (RECOMMENDED)

### Prerequisites
- Railway account: https://railway.app
- GitHub account (to connect repo)

### Step 1: Push Backend to GitHub
```bash
cd backend
git init
git add .
git commit -m "Backend initial"
git remote add origin https://github.com/YOUR_USERNAME/m62-backend.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to: https://railway.app/dashboard
2. Click "New Project"
3. Click "Deploy from GitHub repo"
4. Select your backend repository
5. Railway will auto-detect `package.json`
6. Set environment variables:
   - Go to "Variables"
   - Add:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ADMIN_EMAIL=info@m62webtv.ne
   ```

7. Click "Deploy"

### Result
- Backend live at: `m62-backend-production.up.railway.app`
- Auto-deploys when you push
- $5/month for starter plan

### Step 3: Connect Frontend to Backend
Update `index.html` fetch URL:
```javascript
// Change from:
fetch('http://localhost:3000/api/contact', {

// To:
fetch('https://m62-backend-production.up.railway.app/api/contact', {
```

---

## 🌐 OPTION 3: GitHub Pages (Free but Limited)

### Step 1: Setup Repository
1. Create `gh-pages` branch
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose `gh-pages` branch
5. Save

### Step 2: Deploy
Push to `gh-pages` branch:
```bash
git checkout -b gh-pages
git push origin gh-pages
```

### Result
- Website live at: `username.github.io/m62-webtv`
- Free forever
- But backend services limited

---

## 📱 CUSTOM DOMAIN SETUP

### Add Your Own Domain

#### Netlify
1. Domain settings → "Add custom domain"
2. Update DNS records (at domain registrar)
3. Let Netlify auto-provision SSL

#### Railway
1. Go to project settings
2. Add "Custom Domain"
3. Update DNS at registrar
4. SSL auto-provisioned

---

## 📧 UPDATE YOUR WEBSITE

After deployment, update these with real values:

### In `index.html`:
```javascript
// Change backend URL
fetch('https://YOUR_BACKEND_URL/api/contact', {

// Update social links
<a href="https://facebook.com/m62webtv" target="_blank">

// Update contact info
+227 XX XXX XXXX  → Your real phone
info@m62webtv.ne  → Your real email
```

### In `backend/.env`:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-real-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=your-email@gmail.com
```

---

## ✅ VERIFICATION CHECKLIST

After deployment:

- [ ] Frontend loads without errors
- [ ] Dark mode works
- [ ] Images load correctly
- [ ] Gallery modals open
- [ ] Video player works
- [ ] Search functionality works
- [ ] Navigation links work
- [ ] Contact form submits
- [ ] Newsletter signup works
- [ ] Social share buttons work
- [ ] Mobile responsive (test on phone)
- [ ] All pages load (About, FAQ, Privacy)

### Backend Security Checklist
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_INMEMORY_FALLBACK=false`
- [ ] `JWT_SECRET` is strong (32+ chars)
- [ ] `FRONTEND_ORIGIN` only includes trusted domain(s)
- [ ] `REQUEST_BODY_LIMIT_MB` set to a safe value for production
- [ ] `TRUST_PROXY_HOPS` configured for your host

### Backup Checklist
- [ ] `mongodump` is installed on server
- [ ] Manual backup works: `npm run backup:mongo`
- [ ] Automatic backup scheduled daily
- [ ] Backup retention policy is defined (for example 14 days)
- [ ] Restore test was performed at least once

---

## 🔧 TROUBLESHOOTING

### 404 Error on Custom Domain
- Wait 15-30 minutes for DNS to propagate
- Clear browser cache
- Check DNS settings

### Contact Form Not Working
- Check backend is deployed
- Verify email configuration
- Check browser console (F12) for errors
- Make sure fetch URL is correct

### Email Not Sending
- Verify Gmail App Password
- Check 2FA is enabled
- Try test endpoint: `/api/test-email`

### Videos Not Playing
- Verify video files exist
- Check file paths in code
- Try different browser

---

## 📊 MONITORING

### Check Website Status
- Netlify: Dashboard shows build status
- Railway: Dashboard shows app status
- Uptime Robot: Monitor 24/7

### Monitor Errors
- Sentry.io (error tracking)
- LogRocket (user session replay)
- Google Analytics (traffic)

---

## 💰 COST BREAKDOWN

| Service | Cost | Type |
|---------|------|------|
| Netlify Frontend | FREE | Hosting |
| Railway Backend | $5/month | Hosting |
| Custom Domain | $10-15/year | Domain |
| Gmail for Email | FREE | Email |
| **TOTAL** | ~$5/month | |

---

## 📚 NEXT STEPS

1. ✅ Deploy frontend first
2. ✅ Test website online
3. ✅ Deploy backend
4. ✅ Test email sending
5. ✅ Add custom domain
6. ✅ Update all credentials
7. ✅ Submit sitemap to Google
8. ✅ Setup analytics

---

## 🆘 NEED HELP?

**Deployment Issues:**
- Railway docs: https://docs.railway.app
- Netlify docs: https://docs.netlify.com
- GitHub Pages: https://pages.github.com

**Contact Support:**
- info@m62webtv.ne
- +227 XX XXX XXXX

---

**Created:** 2026-06-10
**Version:** 1.0
**M62 WEB TV Deployment Guide**
