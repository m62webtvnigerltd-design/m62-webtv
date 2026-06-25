# 🚀 M62 WEB TV - GETTING STARTED

**Everything is ready! Here's what you need to do:**

---

## 📋 STEP-BY-STEP SETUP

### PART 1: Run the Frontend (5 minutes)

#### Option A: Open in Browser Directly
1. Go to: `c:\Users\DELL\Desktop\M62 WEB TV\`
2. Right-click `index.html`
3. Select "Open with Browser"
4. ✅ Website is ready!

#### Option B: Use Live Server (VS Code)
1. Open `index.html` in VS Code
2. Right-click → "Open with Live Server"
3. ✅ Website opens in browser with auto-reload

---

### PART 2: Setup Backend (for email) (10-15 minutes)

#### Prerequisites Check
- [ ] Node.js installed? Download from https://nodejs.org

#### Install & Configure

**1. Open terminal in backend folder:**
```bash
cd "C:\Users\DELL\Desktop\M62 WEB TV\backend"
```

**2. Install packages:**
```bash
npm install
```

**3. Create .env file:**
- Copy `backend\.env.example` to `backend\.env`
- OR create new file: `backend\.env`

**4. Edit .env with your Gmail:**
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=info@m62webtv.ne
PORT=3000
```

**Getting Gmail App Password:**
1. Go to: https://myaccount.google.com/account
2. Select "Security" (left menu)
3. Enable 2-Step Verification if not done
4. Go to "App passwords"
5. Select "Mail" and "Windows Computer"
6. Copy the 16-character password
7. Paste in `.env` file

**5. Start the server:**
```bash
npm start
```

You should see:
```
🚀 M62 WEB TV Backend Server running on http://localhost:3000
📧 Email Service: gmail
🔗 Contact API: http://localhost:3000/api/contact
```

**✅ Backend is running!**

---

## 🎮 TEST THE WEBSITE

### 1. Test Gallery Modals
- [ ] Click on any image in gallery
- [ ] Lightbox should open
- [ ] Navigate with arrow buttons or keyboard arrows
- [ ] Press Escape to close

- [ ] Click on any video in gallery
- [ ] Video player should open
- [ ] Use play/pause controls
- [ ] Navigate between videos
- [ ] Press Escape to close

### 2. Test Contact Form (with backend running)
- [ ] Fill in contact form
- [ ] Click "Aika Saƙo 📨"
- [ ] See success message
- [ ] Check your email for both:
  - Admin notification (at ADMIN_EMAIL)
  - Auto-reply to user

### 3. Test Mobile Version
- [ ] Press F12 in browser (Developer Tools)
- [ ] Click toggle device toolbar (phone icon)
- [ ] Test hamburger menu (☰)
- [ ] Click links to open/close menu
- [ ] Test on different screen sizes

### 4. Test Search
- [ ] Type in search box
- [ ] News items should filter
- [ ] Clear search to show all

### 5. Test Carousel
- [ ] Click Previous/Next buttons
- [ ] Slides should auto-rotate every 5 seconds
- [ ] Transitions should be smooth

---

## 📁 FOLDER STRUCTURE (After Setup)

```
M62 WEB TV/
├── index.html                           ✅ Main website
├── SETUP_GUIDE.md                       ✅ Full setup guide
├── IMPLEMENTATION_SUMMARY.md            ✅ Features summary
├── GETTING_STARTED.md                   ✅ This file
│
└── backend/
    ├── server.js                        ✅ Backend server
    ├── package.json                     ✅ Dependencies list
    ├── package-lock.json                (Auto-generated)
    ├── .env                             ✅ Your config (create from .env.example)
    ├── .env.example                     ✅ Template
    ├── .gitignore                       ✅ Git ignore
    ├── README.md                        ✅ Backend docs
    └── node_modules/                    (Auto-generated, ~300MB)

└── videos/                              📁 Create & add video files here
    ├── news1.mp4
    ├── program1.mp4
    └── ...
```

---

## ⚙️ CUSTOMIZATION CHECKLIST

### Update Contact Form Emails
**In:** `backend/server.js`

Find line with `ADMIN_EMAIL`:
```javascript
to: process.env.ADMIN_EMAIL || 'info@m62webtv.ne',
```

Or change in `.env` file

### Add Video Files
1. Create folder: `M62 WEB TV\videos\`
2. Add your .mp4 files
3. Update paths in `index.html`:

Find videoData array and add your videos:
```javascript
const videoData = [
    { title: 'Video Title', url: 'videos/filename.mp4' },
    // Add more...
];
```

### Replace Placeholder Images
Current gallery uses emoji. To use real images:

Option 1: Use placeholders from URLs
```javascript
const item = galleryItems[currentImageIndex];
const imageUrl = 'https://...';
imageBody = `<img src="${imageUrl}" style="max-width:90%">`;
```

Option 2: Upload images and reference locally
```javascript
imageBody = `<img src="images/photo1.jpg" style="max-width:90%">`;
```

### Change Colors
In `index.html` CSS:
- Primary Green: Search for `#008000`
- Orange: Search for `#ff6600`
- Background: Search for `#0f0f0f`

---

## 🐛 COMMON ISSUES & FIXES

### "Port 3000 already in use"
**Solution:** Either
```bash
# Option 1: Use different port
# Edit .env: PORT=3001

# Option 2: Kill process on port 3000
# Windows: netstat -ano | findstr :3000
# Then: taskkill /PID [NUMBER] /F
```

### "Cannot find module..."
**Solution:**
```bash
npm install
```

### Contact form not sending email
**Checklist:**
- [ ] Backend is running (`npm start`)
- [ ] .env file exists and has EMAIL_USER/PASSWORD
- [ ] Gmail password is correct (16-char app password, not regular password)
- [ ] 2FA is enabled on Gmail account
- [ ] Check browser console (F12) for errors

### Video won't play
**Checklist:**
- [ ] Video file exists in `videos/` folder
- [ ] File path matches in videoData array
- [ ] File format is .mp4
- [ ] Try with sample video: https://www.w3schools.com/html/mov_bbb.mp4

### Mobile menu not working
- [ ] Ensure JavaScript is enabled
- [ ] Try different browser
- [ ] Check browser console for errors (F12)

### Images/emojis not showing
- [ ] Browser issue: clear cache (Ctrl+Shift+Del)
- [ ] Try different browser
- [ ] Reload page (F5)

---

## 📞 TESTING THE BACKEND

### Test Email Sending
**In terminal or Postman:**

```bash
# Test health check
curl http://localhost:3000/api/health

# Test email sending
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your@email.com\"}"
```

### Check Server Status
Open browser and go to:
```
http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "Server OK ✅",
  "timestamp": "2026-06-10T..."
}
```

---

## 🌐 DEPLOYMENT READY

Your website is ready to deploy! Choose one:

### Frontend Deployment (FREE)
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

### Backend Deployment (FREE TIER)
- Heroku (free tier ending soon)
- Railway (free $5/month)
- Render
- Fly.io
- AWS Lambda + API Gateway

**See SETUP_GUIDE.md for detailed deployment instructions**

---

## ✅ FINAL CHECKLIST

Before going live:
- [ ] Update ADMIN_EMAIL in .env
- [ ] Add real video files to videos/ folder
- [ ] Test all gallery features
- [ ] Test contact form with email
- [ ] Test on mobile (F12 → Device toolbar)
- [ ] Test search functionality
- [ ] Replace placeholder images
- [ ] Update contact information
- [ ] Add real social media links
- [ ] Test on different browsers
- [ ] Verify all links work

---

## 📚 DOCUMENTATION

**Read these in order:**
1. **GETTING_STARTED.md** (This file) - Quick start
2. **SETUP_GUIDE.md** - Detailed setup
3. **IMPLEMENTATION_SUMMARY.md** - Features overview
4. **backend/README.md** - Backend details

---

## 🎉 YOU'RE ALL SET!

Your M62 WEB TV website is fully functional with:
- ✅ Responsive design (mobile-first)
- ✅ Image gallery with lightbox
- ✅ Video gallery with player
- ✅ Contact form with email
- ✅ Backend API server
- ✅ Error handling
- ✅ Mobile optimization

**What to do now:**
1. Run frontend and test it
2. Setup backend for email
3. Test contact form
4. Add your content (videos, images)
5. Deploy to production

---

## 💡 QUICK COMMANDS

```bash
# Start backend
cd "C:\Users\DELL\Desktop\M62 WEB TV\backend"
npm start

# Install packages
npm install

# Development mode (with auto-reload)
npm run dev

# Stop server
# Press Ctrl+C in terminal
```

---

## 🆘 NEED HELP?

**File locations:**
- Frontend: `c:\Users\DELL\Desktop\M62 WEB TV\index.html`
- Backend: `c:\Users\DELL\Desktop\M62 WEB TV\backend\server.js`
- Config: `c:\Users\DELL\Desktop\M62 WEB TV\backend\.env`

**Common paths:**
- Videos: `c:\Users\DELL\Desktop\M62 WEB TV\videos\`
- Images: `c:\Users\DELL\Desktop\M62 WEB TV\images\` (create if needed)

**Contact:** info@m62webtv.ne

---

**Status: ✅ READY TO USE**

*Created: 2026-06-10*
*M62 WEB TV - Niger Media Online*
*PDG MULTIMEDIA TV LTD*
