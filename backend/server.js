const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const validator = require('validator');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const COMMENT_ARCHIVE_DAYS = Math.max(Number(process.env.COMMENT_ARCHIVE_DAYS || 180), 1);
const DATA_DIR = path.join(__dirname, 'data');
const ENGAGEMENT_FILE = path.join(DATA_DIR, 'engagement.json');
const BLOCKED_TERMS = ['spam', 'scam', 'fraud', 'casino', 'betting', 'porn'];
const rateLimitStore = new Map();

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
}

function createRateLimiter(windowMs, maxRequests) {
    return (req, res, next) => {
        const ip = getClientIp(req);
        const now = Date.now();
        const key = `${req.path}:${ip}`;
        const existing = rateLimitStore.get(key);

        if (!existing || existing.expiresAt <= now) {
            rateLimitStore.set(key, {
                count: 1,
                expiresAt: now + windowMs
            });
            return next();
        }

        if (existing.count >= maxRequests) {
            const retryAfterSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
            res.set('Retry-After', String(retryAfterSeconds));
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfterSeconds
            });
        }

        existing.count += 1;
        rateLimitStore.set(key, existing);
        next();
    };
}

function isBlockedText(message) {
    const text = String(message || '').toLowerCase();
    return BLOCKED_TERMS.some((word) => text.includes(word));
}

function makeId() {
    return typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function requireAdminKey(req, res, next) {
    if (!ADMIN_API_KEY) {
        return res.status(503).json({
            success: false,
            message: 'Admin API key is not configured on server'
        });
    }

    if (req.headers['x-admin-key'] !== ADMIN_API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized admin request'
        });
    }

    next();
}

function ensureEngagementStore() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(ENGAGEMENT_FILE)) {
        fs.writeFileSync(
            ENGAGEMENT_FILE,
            JSON.stringify({ news: {}, video: {} }, null, 2),
            'utf8'
        );
    }
}

function readEngagementStore() {
    ensureEngagementStore();

    try {
        return JSON.parse(fs.readFileSync(ENGAGEMENT_FILE, 'utf8'));
    } catch (error) {
        return { news: {}, video: {} };
    }
}

function writeEngagementStore(store) {
    fs.writeFileSync(ENGAGEMENT_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function getItemBucket(store, itemType, itemId) {
    if (!store[itemType]) {
        store[itemType] = {};
    }

    if (!store[itemType][itemId]) {
        store[itemType][itemId] = {
            comments: [],
            ratings: []
        };
    }

    return store[itemType][itemId];
}

function normalizeComment(comment) {
    return {
        id: comment.id || makeId(),
        name: comment.name || 'Anonymous',
        message: comment.message || '',
        createdAt: comment.createdAt || new Date().toISOString(),
        hidden: Boolean(comment.hidden),
        archived: Boolean(comment.archived),
        archivedAt: comment.archivedAt || null
    };
}

function escapeCsvValue(value) {
    const text = String(value ?? '');

    if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
}

function archiveOldCommentsInStore(store) {
    const nowMs = Date.now();
    const archiveThresholdMs = COMMENT_ARCHIVE_DAYS * 24 * 60 * 60 * 1000;
    let archivedCount = 0;

    ['news', 'video'].forEach((itemType) => {
        Object.entries(store[itemType] || {}).forEach(([itemId, bucket]) => {
            const normalized = (bucket.comments || []).map(normalizeComment);

            normalized.forEach((comment) => {
                if (comment.archived) {
                    return;
                }

                const createdMs = Number(new Date(comment.createdAt).getTime());

                if (!Number.isFinite(createdMs)) {
                    return;
                }

                if (nowMs - createdMs >= archiveThresholdMs) {
                    comment.archived = true;
                    comment.archivedAt = new Date().toISOString();
                    archivedCount += 1;
                }
            });

            store[itemType][itemId].comments = normalized;
        });
    });

    return archivedCount;
}

function readAndArchiveStore() {
    const store = readEngagementStore();
    const archivedCount = archiveOldCommentsInStore(store);

    if (archivedCount > 0) {
        writeEngagementStore(store);
    }

    return { store, archivedCount };
}

function commentMatchesStatus(comment, status) {
    if (status === 'visible') {
        return !comment.hidden && !comment.archived;
    }

    if (status === 'hidden') {
        return comment.hidden && !comment.archived;
    }

    if (status === 'archived') {
        return comment.archived;
    }

    return true;
}

function collectModerationComments(store, filters) {
    const {
        status,
        itemTypeFilter,
        itemIdFilter,
        queryText
    } = filters;

    const comments = [];

    ['news', 'video'].forEach((itemType) => {
        if (itemTypeFilter && itemTypeFilter !== itemType) {
            return;
        }

        Object.entries(store[itemType] || {}).forEach(([itemId, bucket]) => {
            if (itemIdFilter && itemIdFilter !== itemId) {
                return;
            }

            (bucket.comments || []).map(normalizeComment).forEach((comment) => {
                if (!commentMatchesStatus(comment, status)) {
                    return;
                }

                if (queryText) {
                    const haystack = `${comment.name} ${comment.message} ${itemType} ${itemId}`.toLowerCase();
                    if (!haystack.includes(queryText)) {
                        return;
                    }
                }

                comments.push({
                    itemType,
                    itemId,
                    ...comment
                });
            });
        });
    });

    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return comments;
}

function buildSummary(bucket) {
    const ratingsCount = bucket.ratings.length;
    const totalRatings = bucket.ratings.reduce((sum, entry) => sum + entry.value, 0);
    const visibleCommentsCount = bucket.comments.filter((comment) => !comment.hidden && !comment.archived).length;
    const averageRating = ratingsCount > 0
        ? Number((totalRatings / ratingsCount).toFixed(1))
        : 0;

    return {
        averageRating,
        ratingsCount,
        commentsCount: visibleCommentsCount
    };
}

function validateItemParams(req, res, next) {
    const { itemType, itemId } = req.params;

    if (!['news', 'video'].includes(itemType)) {
        return res.status(400).json({
            success: false,
            message: 'itemType must be news or video'
        });
    }

    if (!validator.matches(itemId, '^[a-zA-Z0-9_-]{1,50}$')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid itemId format'
        });
    }

    next();
}

// Middleware
const localOrigins = ['http://localhost', 'http://localhost:5500', 'http://127.0.0.1:5500'];
const configuredOrigins = String(process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Email configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Validation middleware
function validateContactForm(req, res, next) {
    const { name, email, subject, message } = req.body;

    // Check required fields
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Duk filayen da suke nuni sai a cika!' 
        });
    }

    // Validate email
    if (!validator.isEmail(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email address ba ta dace ba!' 
        });
    }

    // Sanitize inputs
    req.body.name = validator.trim(validator.escape(name));
    req.body.email = validator.trim(validator.normalizeEmail(email));
    req.body.subject = validator.trim(validator.escape(subject));
    req.body.message = validator.trim(validator.escape(message));

    next();
}

// Contact form endpoint
app.post('/api/contact', createRateLimiter(5 * 60 * 1000, 5), validateContactForm, async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        const companyPhone = process.env.COMPANY_PHONE || '+227 XX XXX XXXX';
        const companyEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'info@m62webtv.ne';

        // Email to admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || 'info@m62webtv.ne',
            subject: `Saƙo Cusewa: ${subject}`,
            html: `
                <h2>Saƙon Cusewa Daga M62 WEB TV</h2>
                <p><strong>Suna:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${phone ? `<p><strong>Tarowa:</strong> ${phone}</p>` : ''}
                <p><strong>Jiya:</strong> ${subject}</p>
                <p><strong>Saƙo:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><small>Saƙon yayi daga M62 WEB TV website</small></p>
            `
        };

        // Auto-reply to user
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Godiya - M62 WEB TV (Thank you for contacting us)`,
            html: `
                <h2>Godiya!</h2>
                <p>Sannu ${name},</p>
                <p>Mun gida saƙonka. Zamu mayar da sauni kamar mai zafi.</p>
                <p style="margin-top: 30px; font-size: 12px;">
                    <strong>M62 WEB TV</strong><br>
                    📞 ${companyPhone}<br>
                    📧 ${companyEmail}<br>
                    🇳🇪 Niamey, Niger
                </p>
            `
        };

        // Send emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);

        // Log successful submission
        console.log(`✅ Contact form submitted by ${name} (${email})`);

        res.json({ 
            success: true, 
            message: 'Saƙonka ya aika da nasara! Godiya! ✅' 
        });

    } catch (error) {
        console.error('❌ Email Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Jiya, saƙo na bugi. Da fatan a sake gwada.' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server OK ✅', timestamp: new Date() });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
    try {
        const testMailOptions = {
            from: process.env.EMAIL_USER,
            to: req.body.email || process.env.EMAIL_USER,
            subject: 'M62 WEB TV - Test Email',
            html: '<h2>Test Email</h2><p>Server is working correctly!</p>'
        };

        await transporter.sendMail(testMailOptions);
        res.json({ success: true, message: 'Test email sent successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Engagement endpoints (comments + ratings)
app.get('/api/engagement/:itemType(news|video)/:itemId', validateItemParams, (req, res) => {
    const { itemType, itemId } = req.params;
    const { store } = readAndArchiveStore();
    const bucket = getItemBucket(store, itemType, itemId);
    bucket.comments = bucket.comments.map(normalizeComment);
    const visibleComments = bucket.comments.filter((comment) => !comment.hidden && !comment.archived);

    res.json({
        success: true,
        data: {
            summary: buildSummary(bucket),
            comments: visibleComments.slice(-20).reverse()
        }
    });
});

app.post('/api/engagement/:itemType(news|video)/:itemId/comments', createRateLimiter(60 * 1000, 6), validateItemParams, (req, res) => {
    const { itemType, itemId } = req.params;
    const name = validator.trim(String(req.body.name || 'Anonymous'));
    const message = validator.trim(String(req.body.message || ''));

    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'Comment message is required'
        });
    }

    if (message.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'Comment must be 500 characters or less'
        });
    }

    if (isBlockedText(message)) {
        return res.status(400).json({
            success: false,
            message: 'Comment contains blocked words'
        });
    }

    const safeName = validator.escape(name).slice(0, 60) || 'Anonymous';
    const safeMessage = validator.escape(message);

    const store = readEngagementStore();
    const bucket = getItemBucket(store, itemType, itemId);
    bucket.comments = bucket.comments.map(normalizeComment);

    bucket.comments.push({
        id: makeId(),
        name: safeName,
        message: safeMessage,
        createdAt: new Date().toISOString(),
        hidden: false
    });

    writeEngagementStore(store);

    res.status(201).json({
        success: true,
        message: 'Comment added',
        data: {
            summary: buildSummary(bucket)
        }
    });
});

app.post('/api/engagement/:itemType(news|video)/:itemId/ratings', createRateLimiter(60 * 1000, 10), validateItemParams, (req, res) => {
    const { itemType, itemId } = req.params;
    const rating = Number(req.body.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Rating must be an integer between 1 and 5'
        });
    }

    const store = readEngagementStore();
    const bucket = getItemBucket(store, itemType, itemId);
    bucket.comments = bucket.comments.map(normalizeComment);

    bucket.ratings.push({
        value: rating,
        createdAt: new Date().toISOString()
    });

    writeEngagementStore(store);

    res.status(201).json({
        success: true,
        message: 'Rating added',
        data: {
            summary: buildSummary(bucket)
        }
    });
});

app.get('/api/engagement/moderation/comments', requireAdminKey, (req, res) => {
    const status = String(req.query.status || 'all');
    const itemTypeFilter = String(req.query.itemType || '');
    const itemIdFilter = String(req.query.itemId || '');
    const queryText = validator.trim(String(req.query.q || '')).toLowerCase();
    const requestedLimit = Number(req.query.limit || 0);
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSizeFromLimit = requestedLimit > 0 ? requestedLimit : Number(req.query.pageSize || 25);
    const pageSize = Math.min(Math.max(pageSizeFromLimit, 1), 100);
    const { store, archivedCount } = readAndArchiveStore();
    const comments = collectModerationComments(store, {
        status,
        itemTypeFilter,
        itemIdFilter,
        queryText
    });
    const totalItems = comments.length;
    const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    res.json({
        success: true,
        data: comments.slice(start, end),
        meta: {
            page: safePage,
            pageSize,
            totalItems,
            totalPages,
            hasPrev: safePage > 1,
            hasNext: safePage < totalPages,
            autoArchivedInRun: archivedCount
        }
    });
});

app.get('/api/engagement/moderation/comments/export.csv', requireAdminKey, (req, res) => {
    const status = String(req.query.status || 'all');
    const itemTypeFilter = String(req.query.itemType || '');
    const itemIdFilter = String(req.query.itemId || '');
    const queryText = validator.trim(String(req.query.q || '')).toLowerCase();
    const { store } = readAndArchiveStore();
    const comments = collectModerationComments(store, {
        status,
        itemTypeFilter,
        itemIdFilter,
        queryText
    });

    const header = [
        'itemType',
        'itemId',
        'commentId',
        'name',
        'message',
        'createdAt',
        'hidden',
        'archived',
        'archivedAt'
    ];

    const rows = comments.map((comment) => [
        comment.itemType,
        comment.itemId,
        comment.id,
        comment.name,
        comment.message,
        comment.createdAt,
        comment.hidden,
        comment.archived,
        comment.archivedAt || ''
    ]);

    const csv = [header, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
    const fileName = `comments_export_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csv);
});

app.patch('/api/engagement/moderation/comments/bulk', requireAdminKey, (req, res) => {
    const action = String(req.body.action || '').toLowerCase();
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!['hide', 'unhide', 'delete', 'archive', 'unarchive'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'Action must be hide, unhide, delete, archive, or unarchive'
        });
    }

    if (!items.length || items.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'Items list must contain between 1 and 500 entries'
        });
    }

    const store = readEngagementStore();
    let updated = 0;
    let notFound = 0;
    let invalid = 0;

    items.forEach((item) => {
        const itemType = String(item.itemType || '');
        const itemId = String(item.itemId || '');
        const commentId = String(item.commentId || '');

        if (!['news', 'video'].includes(itemType) || !validator.matches(itemId, '^[a-zA-Z0-9_-]{1,50}$') || !commentId) {
            invalid += 1;
            return;
        }

        const bucket = getItemBucket(store, itemType, itemId);
        bucket.comments = bucket.comments.map(normalizeComment);
        const commentIndex = bucket.comments.findIndex((comment) => comment.id === commentId);

        if (commentIndex === -1) {
            notFound += 1;
            return;
        }

        const comment = bucket.comments[commentIndex];

        if (action === 'delete') {
            bucket.comments.splice(commentIndex, 1);
            updated += 1;
            return;
        }

        if (action === 'hide') {
            comment.hidden = true;
            updated += 1;
            return;
        }

        if (action === 'unhide') {
            comment.hidden = false;
            updated += 1;
            return;
        }

        if (action === 'archive') {
            comment.archived = true;
            comment.archivedAt = new Date().toISOString();
            updated += 1;
            return;
        }

        if (action === 'unarchive') {
            comment.archived = false;
            comment.archivedAt = null;
            updated += 1;
        }
    });

    writeEngagementStore(store);

    res.json({
        success: true,
        message: `Bulk ${action} completed`,
        data: {
            requested: items.length,
            updated,
            notFound,
            invalid
        }
    });
});

app.patch('/api/engagement/:itemType(news|video)/:itemId/comments/:commentId', requireAdminKey, validateItemParams, (req, res) => {
    const { itemType, itemId, commentId } = req.params;
    const action = String(req.body.action || '').toLowerCase();

    if (!['hide', 'unhide', 'delete', 'archive', 'unarchive'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'Action must be hide, unhide, delete, archive, or unarchive'
        });
    }

    const store = readEngagementStore();
    const bucket = getItemBucket(store, itemType, itemId);
    bucket.comments = bucket.comments.map(normalizeComment);
    const commentIndex = bucket.comments.findIndex((comment) => comment.id === commentId);

    if (commentIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Comment not found'
        });
    }

    if (action === 'delete') {
        bucket.comments.splice(commentIndex, 1);
    } else if (action === 'hide') {
        bucket.comments[commentIndex].hidden = true;
    } else if (action === 'unhide') {
        bucket.comments[commentIndex].hidden = false;
    } else if (action === 'archive') {
        bucket.comments[commentIndex].archived = true;
        bucket.comments[commentIndex].archivedAt = new Date().toISOString();
    } else if (action === 'unarchive') {
        bucket.comments[commentIndex].archived = false;
        bucket.comments[commentIndex].archivedAt = null;
    }

    writeEngagementStore(store);

    res.json({
        success: true,
        message: `Comment ${action} successful`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Server error occurred' 
    });
});

// Start server
app.listen(PORT, () => {
    const { archivedCount } = readAndArchiveStore();
    console.log(`\n🚀 M62 WEB TV Backend Server running on http://localhost:${PORT}`);
    console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
    console.log(`🔗 Contact API: http://localhost:${PORT}/api/contact\n`);
    console.log(`💬 Engagement API: http://localhost:${PORT}/api/engagement/news/1\n`);
    console.log(`🗂️ Auto-archive: ${COMMENT_ARCHIVE_DAYS} days (archived on start: ${archivedCount})\n`);
});
