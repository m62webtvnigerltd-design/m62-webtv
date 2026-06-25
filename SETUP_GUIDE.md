# M62 WEB TV - Complete Setup Guide

This document provides setup instructions for both frontend and backend of M62 WEB TV.

## Project Structure

```
M62 WEB TV/
├── index.html              (Main website)
├── backend/                (Backend server)
│   ├── server.js          (Express server)
│   ├── package.json       (Dependencies)
│   ├── .env.example       (Environment template)
│   ├── .gitignore         (Git ignore rules)
│   └── README.md          (Backend documentation)
```

## Frontend Setup

### Quick Start
1. Open `index.html` in your browser
2. Or use Live Server in VS Code
3. Website works offline (except email features)

### Features
✅ Responsive mobile design
✅ Hamburger navigation menu
✅ Image gallery with lightbox modal
✅ Video gallery with modal player
✅ Carousel with featured news
✅ News section with search
✅ Programs schedule
✅ Contact form
✅ Keyboard navigation (Arrow keys in modals)
✅ Touch-optimized buttons

## Backend Setup

### Prerequisites
- Node.js 14+ installed
- Gmail account or other email service

### Installation Steps

1. **Navigate to backend folder:**
   ```bash
   cd "M62 WEB TV\backend"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure email (.env file):**
   ```bash
   Copy .env.example to .env
   ```

4. **Edit .env with your credentials:**
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ADMIN_EMAIL=info@m62webtv.ne
   PORT=3000
   ```

   **For Gmail:**
   - Enable 2FA on account
   - Get App Password: https://myaccount.google.com/apppasswords
   - Use App Password in .env

5. **Start the server:**
   ```bash
   npm start
   ```
   OR development mode:
   ```bash
   npm run dev
   ```

6. **Verify server is running:**
   - Open http://localhost:3000/api/health
   - Should show: `{"status": "Server OK ✅", ...}`

## Testing Contact Form

1. Ensure backend server is running
2. Fill contact form on website
3. Click "Aika Saƙo 📨"
4. You should receive:
   - Admin notification at ADMIN_EMAIL
   - Auto-reply at user's email

## Gallery Features

### Image Gallery
- Click any image to open lightbox
- Use arrow buttons to navigate
- Press keyboard arrows or Escape
- Click outside modal to close

### Video Gallery
- Click any video to open player
- Full video controls (play, pause, volume, fullscreen)
- Navigate between videos
- Keyboard shortcuts work

## Mobile Optimization

### Breakpoints
- **Desktop (>768px)**: Full navigation
- **Tablet (768px)**: Hamburger menu
- **Phone (<480px)**: Compact layout

### Features
- Touch-optimized buttons (44x44px minimum)
- Full-width forms and inputs
- Optimized font sizes
- Smooth animations

## API Documentation

### Contact Form
**POST** `/api/contact`

Request:
```json
{
  "name": "String (required)",
  "email": "String (required)",
  "phone": "String (optional)",
  "subject": "String (required)",
  "message": "String (required)"
}
```

Response:
```json
{
  "success": true/false,
  "message": "Status message"
}
```

### Health Check
**GET** `/api/health`

Response:
```json
{
  "status": "Server OK ✅",
  "timestamp": "ISO datetime"
}
```

## Customization

### Change Admin Email
Edit backend/server.js:
```javascript
to: process.env.ADMIN_EMAIL || 'your-email@example.com',
```

### Change Colors
Edit index.html CSS:
- Primary green: #008000
- Secondary orange: #ff6600
- Background: #0f0f0f (dark)

### Add More Gallery Items
Edit index.html gallery sections and update JavaScript arrays.

### Change Videos
Edit videoData array in index.html:
```javascript
const videoData = [
    { title: 'Title', url: 'videos/file.mp4' },
    ...
];
```

## Deployment

### Frontend (GitHub Pages)
1. Push index.html to GitHub repo
2. Enable Pages in repo settings
3. Accessible at username.github.io/repo-name

### Backend (Heroku)
1. Create Heroku account
2. `heroku create app-name`
3. Set environment variables:
   ```bash
   heroku config:set EMAIL_USER=xxx
   heroku config:set EMAIL_PASSWORD=xxx
   heroku config:set ADMIN_EMAIL=xxx
   ```
4. Update frontend fetch URL to Heroku app

## Troubleshooting

**Contact form not sending?**
- Check backend is running
- Check .env credentials
- Check browser console for errors
- Verify Gmail 2FA and App Password

**Modals not working?**
- Check browser console
- Ensure JavaScript is enabled
- Try different browser

**Email still not working?**
- Test with: POST to http://localhost:3000/api/test-email
- Check spam folder
- Verify Gmail security settings

**CORS errors?**
- Ensure backend is running
- Check fetch URL in index.html
- Verify backend CORS settings

## File Locations

- Frontend: `c:\Users\DELL\Desktop\M62 WEB TV\index.html`
- Backend server: `c:\Users\DELL\Desktop\M62 WEB TV\backend\server.js`
- Config: `c:\Users\DELL\Desktop\M62 WEB TV\backend\.env`

## Next Steps

After setup:
1. Add real video files to `videos/` folder
2. Replace placeholder images with real content
3. Update contact form emails
4. Add favicon and logo
5. Set up production deployment
6. Add analytics tracking
7. Consider adding user authentication

## Support & Issues

For issues with:
- Frontend: Check browser console (F12)
- Backend: Check terminal output
- Email: Check spam folder and Gmail settings
- Gallery: Verify video files exist in /videos/ folder

---

**Created:** 2026-06-10
**Version:** 1.0
**Contact:** info@m62webtv.ne
