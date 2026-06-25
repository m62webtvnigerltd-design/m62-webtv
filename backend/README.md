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
PORT=3000
```

### 4. Gmail Setup (If using Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use this password in your `.env` file as `EMAIL_PASSWORD`

## Running the Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
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

Header required:
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

### Port already in use
Change `PORT` in `.env` file or kill the process using port 3000

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
