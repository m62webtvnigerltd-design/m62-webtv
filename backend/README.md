# M62 WEB TV Backend Server

Backend API server for M62 WEB TV contact form and email handling.

## Features

✅ Contact form submission handling
✅ Email sending with Gmail/Nodemailer
✅ Auto-reply to users
✅ Admin notifications
✅ Form validation and sanitization
✅ CORS support for frontend integration
✅ Error handling and logging
✅ MongoDB Atlas integration for News CRUD
✅ JWT login/authentication with role-based access
✅ News image upload endpoint
✅ Video upload and Video CRUD endpoints

## Installation

### 1. Install Node.js
Download and install from [nodejs.org](https://nodejs.org)

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your email credentials:

```bash
cp .env.example .env
```

Edit `.env` file:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=info@m62webtv.ne
ADMIN_API_KEY=change-this-to-a-strong-key
COMMENT_ARCHIVE_DAYS=180
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=m62_webtv
MONGODB_INMEMORY_FALLBACK=true
JWT_SECRET=change-this-to-a-very-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_BOOTSTRAP_EMAIL=m62webtvnigerltd@gmail.com
ADMIN_BOOTSTRAP_PASSWORD=use-your-current-admin-password
UPLOAD_MAX_MB=10
VIDEO_UPLOAD_MAX_MB=200
REQUEST_BODY_LIMIT_MB=2
TRUST_PROXY_HOPS=1
PORT=3000
```

Production notes:
- Set `NODE_ENV=production`
- Set `MONGODB_INMEMORY_FALLBACK=false`
- Ensure `JWT_SECRET` is at least 32 characters
- Set `FRONTEND_ORIGIN` to your real frontend domain(s)

### 4. Gmail Setup (If using Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use this password in your `.env` file as `EMAIL_PASSWORD`

## Running the Server

### Recommended local startup
Start the installed MongoDB Windows service, then launch the backend:
```powershell
Start-Service MongoDB
cd "C:\Users\DELL\Desktop\M62 WEB TV\backend"
npm start
```

Or from the project root:
```powershell
cd "C:\Users\DELL\Desktop\M62 WEB TV"
start-project.cmd
```

Check status or stop the local stack from the project root:
```powershell
status-project.cmd
stop-project.cmd
```

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

### MongoDB Backup
Run manual backup (gzip archive) from `backend` folder:
```powershell
npm run backup:mongo
```

Optional arguments:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-mongodb.ps1 -MongoUri "mongodb://127.0.0.1:27017" -DatabaseName "m62_webtv" -RetentionDays 14
```

The server will start on `http://localhost:3000`

## API Endpoints

### POST /api/contact
Submit a contact form

**Request:**
```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "phone": "+227XXXXXXXX",
  "subject": "Your Subject",
  "message": "Your message here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Saƙonka ya aika da nasara! Godiya! ✅"
}
```

### GET /api/health
Health check endpoint

**Response:**
```json
{
  "status": "Server OK ✅",
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

### POST /api/test-email
Send a test email (for debugging)

### GET /api/engagement/:itemType/:itemId
Get comments and ratings summary for an item.

### GET /api/news
List news items from MongoDB.

Query params:
- `status`: `published` (default) | `draft` | `all`
- `q`: text search
- `category`: exact category filter
- `page`: page number
- `pageSize`: items per page (max 100)

### GET /api/news/:idOrSlug
Fetch one news item by MongoDB id or slug.

### POST /api/auth/login
Authenticate user and return JWT token.

Request body:
```json
{
  "email": "admin@example.com",
  "password": "strong-password"
}
```

### GET /api/auth/me
Get current authenticated user.

Header required:
```
Authorization: Bearer <JWT_TOKEN>
```

### POST /api/auth/users
Admin-only create user account.

### GET /api/auth/users
Admin-only list users with optional filters.

Query params:
- `q`: search by name/email
- `role`: `admin` | `editor` | `viewer`
- `status`: `active` | `inactive`
- `page`, `pageSize`

### PATCH /api/auth/users/:id
Admin-only update user profile fields (`name`, `role`, `isActive`).

### PATCH /api/auth/users/:id/password
Admin-only reset user password.

### POST /api/uploads/image
Admin-only image upload endpoint for News cover images.

Auth required (either one):
```
Authorization: Bearer <JWT_TOKEN>
```
or
```
x-admin-key: <ADMIN_API_KEY>
```

Request:
- `multipart/form-data`
- field name: `image`

### POST /api/uploads/video
Admin-only video upload endpoint.

Auth required (either one):
```
Authorization: Bearer <JWT_TOKEN>
```
or
```
x-admin-key: <ADMIN_API_KEY>
```

Request:
- `multipart/form-data`
- field name: `video`

### GET /api/videos
Public list endpoint for videos.

Query params:
- `status`: `published` (default) | `draft` | `all`
- `q`: text search
- `category`: exact category filter
- `page`: page number
- `pageSize`: items per page (max 100)

### POST /api/videos
Admin-only create video item.

### DELETE /api/videos/:id
Admin-only soft delete video item.

### POST /api/news
Admin-only create news item.

Header required:
```
Authorization: Bearer <JWT_TOKEN>
```

Backward-compatibility: legacy `x-admin-key` still works for News CRUD while migrating.

Request body example:
```json
{
  "title": "Sabon labari",
  "summary": "Takaitaccen bayani",
  "content": "Cikakken labari...",
  "category": "Politics",
  "coverImageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "tags": ["niger", "news"],
  "status": "published",
  "featured": true
}
```

### PATCH /api/news/:id
Admin-only update a news item.

### DELETE /api/news/:id
Admin-only soft delete (sets `deletedAt`).

### POST /api/engagement/:itemType/:itemId/comments
Add a new comment.

### POST /api/engagement/:itemType/:itemId/ratings
Add a new rating from 1 to 5.

### GET /api/engagement/moderation/comments
Admin-only list for moderation.

Query params:
- `status`: `all` | `visible` | `hidden` | `archived`
- `q`: text search against name/message/item
- `page`: page number (default `1`)
- `pageSize`: results per page (default `25`, max `100`)

Auth required (either one):
```
Authorization: Bearer <JWT_TOKEN>
```
or
```
x-admin-key: <ADMIN_API_KEY>
```

### PATCH /api/engagement/:itemType/:itemId/comments/:commentId
Admin-only moderation action.

Request body:
```json
{
  "action": "hide"
}
```

Allowed actions: `hide`, `unhide`, `archive`, `unarchive`, `delete`.

### PATCH /api/engagement/moderation/comments/bulk
Admin-only bulk moderation endpoint.

Request body:
```json
{
  "action": "hide",
  "items": [
    {
      "itemType": "news",
      "itemId": "news_abc123",
      "commentId": "comment_uuid"
    }
  ]
}
```

### GET /api/engagement/moderation/comments/export.csv
Admin-only CSV export of filtered moderation comments.

Moderation endpoints also support JWT bearer auth with the same fallback to `x-admin-key`.

Query params:
- `status`: `all` | `visible` | `hidden` | `archived`
- `q`: text search

### Auto-archive behavior
- Comments older than `COMMENT_ARCHIVE_DAYS` are automatically archived.
- Auto-archive runs at server startup and when moderation list/export is queried.
- Archived comments are excluded from public comment display.

### Rate limiting behavior
If a client exceeds limits, API returns HTTP `429` with:
- `Retry-After` header
- JSON field `retryAfterSeconds`

## Troubleshooting

### "Cannot find module 'express'"
Run `npm install` again

### Email not sending
- Check `.env` file is correctly configured
- Verify Gmail App Password is correct
- Check Gmail allows "Less secure apps" (if not using App Password)
- Check internet connection

### CORS errors
Make sure the frontend URL is in the `origin` array in server.js

### MongoDB not connected
- Confirm `MONGODB_URI` is present and valid
- If using Atlas, whitelist your server IP in Atlas Network Access
- Check Atlas username/password and database permissions

### Login fails with JWT error
- Ensure `JWT_SECRET` is set in `.env`
- Restart server after editing env variables
- Use `POST /api/auth/login` to get a fresh token after password updates

### Port already in use
Change `PORT` in `.env` file or kill the process using port 3000

### Uploaded files location
- Uploaded image files are stored in `backend/uploads/`
- Files are served at `/uploads/<filename>`
- Uploaded videos are stored in the same `backend/uploads/` folder

## Deployment

To deploy to production:

1. Use a service like Heroku, Railway, or Render
2. Set environment variables on the hosting platform
3. Update frontend `fetch` URL to match your server URL
4. Consider using a production-grade email service (SendGrid, AWS SES, etc.)

## Security Notes

- Never commit `.env` file to version control
- Always use environment variables for sensitive data
- Validate and sanitize all inputs
- Use HTTPS in production
- Implement rate limiting for production
- Use strong email passwords or app-specific passwords

## Support

For issues, contact: info@m62webtv.ne
