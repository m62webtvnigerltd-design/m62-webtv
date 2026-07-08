const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const validator = require('validator');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = String(process.env.NODE_ENV || 'development').trim().toLowerCase();
const IS_PRODUCTION = NODE_ENV === 'production';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const COMMENT_ARCHIVE_DAYS = Math.max(Number(process.env.COMMENT_ARCHIVE_DAYS || 180), 1);
const MONGODB_URI = String(process.env.MONGODB_URI || '').trim();
const MONGODB_DB_NAME = String(process.env.MONGODB_DB_NAME || '').trim();
const MONGODB_INMEMORY_FALLBACK = toBoolean(process.env.MONGODB_INMEMORY_FALLBACK, true);
const JWT_SECRET = String(process.env.JWT_SECRET || '').trim();
const JWT_EXPIRES_IN = String(process.env.JWT_EXPIRES_IN || '7d').trim();
const ADMIN_BOOTSTRAP_EMAIL = String(process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
const ADMIN_BOOTSTRAP_PASSWORD = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();
const MEDIA_STORAGE_PROVIDER = String(process.env.MEDIA_STORAGE_PROVIDER || 'local').trim().toLowerCase();
const UPLOAD_MAX_MB = Math.max(Number(process.env.UPLOAD_MAX_MB || 10), 1);
const VIDEO_UPLOAD_MAX_MB = Math.max(Number(process.env.VIDEO_UPLOAD_MAX_MB || 200), 10);
const REQUEST_BODY_LIMIT_MB = Math.max(Number(process.env.REQUEST_BODY_LIMIT_MB || (IS_PRODUCTION ? 2 : 10)), 1);
const TRUST_PROXY_HOPS = Math.max(Number(process.env.TRUST_PROXY_HOPS || 1), 0);
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.m4v']);
const ALLOWED_UPLOAD_EXTENSIONS = new Set([...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS]);
const ENGAGEMENT_FILE = path.join(DATA_DIR, 'engagement.json');
const STATS_FILE = path.join(DATA_DIR, 'app-stats.json');
const BLOCKED_TERMS = ['spam', 'scam', 'fraud', 'casino', 'betting', 'porn'];
const rateLimitStore = new Map();
const passwordResetStore = new Map();
const PASSWORD_RESET_TOKEN_TTL_MINUTES = Math.max(Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30), 5);
const PASSWORD_RESET_TOKEN_TTL_MS = PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000;
const MAIL_SEND_TIMEOUT_MS = Math.max(Number(process.env.MAIL_SEND_TIMEOUT_MS || 12000), 3000);
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '').trim();
const EMAIL_FROM = String(process.env.EMAIL_FROM || '').trim();
const RESEND_EMAILS_API_URL = 'https://api.resend.com/emails';
let mongoReady = false;
let NewsModel = null;
let UserModel = null;
let VideoModel = null;
let SharedMediaAssetModel = null;
let mongoMemoryServer = null;

// Prevent unbounded memory growth in in-memory rate-limit buckets.
setInterval(() => {
    const now = Date.now();

    for (const [key, value] of rateLimitStore.entries()) {
        if (!value || value.expiresAt <= now) {
            rateLimitStore.delete(key);
        }
    }

    for (const [key, value] of passwordResetStore.entries()) {
        if (!value || value.expiresAt <= now) {
            passwordResetStore.delete(key);
        }
    }
}, 5 * 60 * 1000).unref();

function getClientIp(req) {
    // Only trust proxy-derived IPs when trust proxy is explicitly enabled.
    if (TRUST_PROXY_HOPS > 0) {
        if (Array.isArray(req.ips) && req.ips.length > 0) {
            return req.ips[0];
        }

        if (req.ip) {
            return req.ip;
        }
    }

    return req.socket.remoteAddress || req.ip || 'unknown';
}

function escapeRegexLiteral(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasPrivilegedAccess(req) {
    if (ADMIN_API_KEY && req.headers['x-admin-key'] === ADMIN_API_KEY) {
        return true;
    }

    const authHeader = String(req.headers.authorization || '');
    if (!authHeader.startsWith('Bearer ') || !JWT_SECRET) {
        return false;
    }

    try {
        const token = authHeader.slice('Bearer '.length).trim();
        const payload = jwt.verify(token, JWT_SECRET);
        const role = String(payload?.role || '').toLowerCase();
        return role === 'admin' || role === 'editor';
    } catch (error) {
        return false;
    }
}

function createRateLimiter(windowMs, maxRequests) {
    return (req, res, next) => {
        const ip = getClientIp(req);
        const now = Date.now();
        const key = `${req.method}:${req.path}:${ip}`;
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

function slugifyTitle(value) {
    const clean = validator.trim(String(value || '').toLowerCase());
    const slug = clean
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return slug || `news-${Date.now()}`;
}

function toBoolean(value, defaultValue = false) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const lowered = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'on'].includes(lowered)) {
            return true;
        }
        if (['0', 'false', 'no', 'off'].includes(lowered)) {
            return false;
        }
    }

    return defaultValue;
}

function requireMongo(req, res, next) {
    if (!mongoReady || !NewsModel || !UserModel || !VideoModel) {
        return res.status(503).json({
            success: false,
            message: 'MongoDB is not configured or not connected'
        });
    }

    next();
}

function ensureUploadsDirectory() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

function createLocalLegacyStorageAdapter() {
    return {
        ensureReady() {
            ensureUploadsDirectory();
        },
        getPublicMountPath() {
            return '/uploads';
        },
        createPublicReadGuard() {
            return (req, res, next) => {
                const extension = path.extname(String(req.path || '')).toLowerCase();
                if (!ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
                    return res.status(403).json({
                        success: false,
                        message: 'File type is not allowed for direct access'
                    });
                }

                return next();
            };
        },
        createStaticMiddleware() {
            return express.static(UPLOADS_DIR);
        },
        createMulterStorage() {
            return multer.diskStorage({
                destination: (req, file, cb) => {
                    cb(null, UPLOADS_DIR);
                },
                filename: (req, file, cb) => {
                    const extension = path.extname(file.originalname || '').toLowerCase();
                    const safeExtension = ALLOWED_UPLOAD_EXTENSIONS.has(extension) ? extension : '';
                    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    cb(null, `media_${unique}${safeExtension || '.bin'}`);
                }
            });
        },
        buildRelativeUrl(fileName) {
            return `/uploads/${fileName}`;
        },
        buildAbsoluteUrl(req, relativeUrl) {
            return `${req.protocol}://${req.get('host')}${relativeUrl}`;
        }
    };
}

function getUploadCreatedByOrActorId(req) {
    const authUser = req?.authUser || {};
    const actorId = String(authUser.sub || authUser.email || 'unknown').trim();
    return actorId || 'unknown';
}

function buildSharedMediaAssetRecordFromUpload({ req, file, relativeUrl, absoluteUrl, mediaType }) {
    const actorId = getUploadCreatedByOrActorId(req);

    return {
        ownerType: '',
        ownerId: '',
        storageProvider: 'local',
        objectKey: String(file?.filename || '').trim(),
        deliveryUrl: String(absoluteUrl || '').trim(),
        originalFilename: String(file?.originalname || '').trim(),
        mimeType: String(file?.mimetype || '').trim(),
        sizeBytes: Number(file?.size || 0),
        mediaType: String(mediaType || '').trim().toLowerCase(),
        healthStatus: 'unknown',
        migrationStatus: 'not_required',
        createdBy: actorId,
        deletedAt: null,
        relativeUrl: String(relativeUrl || '').trim()
    };
}

async function recordUploadedMediaAssetBestEffort(payload) {
    if (!mongoReady || !SharedMediaAssetModel) {
        return { success: false, skipped: true, reason: 'mongo_unavailable' };
    }

    const storageProvider = String(payload?.storageProvider || '').trim().toLowerCase();
    const objectKey = String(payload?.objectKey || '').trim();

    if (!storageProvider || !objectKey) {
        console.warn('Media registry skipped: missing storageProvider or objectKey', {
            storageProvider,
            objectKey,
            mediaType: String(payload?.mediaType || '').trim().toLowerCase()
        });
        return { success: false, skipped: true, reason: 'missing_identity' };
    }

    const query = { storageProvider, objectKey };
    const update = {
        $setOnInsert: {
            ownerType: String(payload?.ownerType || '').trim(),
            ownerId: String(payload?.ownerId || '').trim(),
            storageProvider,
            objectKey,
            healthStatus: 'unknown',
            migrationStatus: 'not_required',
            createdBy: String(payload?.createdBy || 'unknown').trim(),
            deletedAt: null
        },
        $set: {
            deliveryUrl: String(payload?.deliveryUrl || '').trim(),
            originalFilename: String(payload?.originalFilename || '').trim(),
            mimeType: String(payload?.mimeType || '').trim(),
            sizeBytes: Number(payload?.sizeBytes || 0),
            mediaType: String(payload?.mediaType || '').trim().toLowerCase()
        }
    };

    try {
        const result = await SharedMediaAssetModel.updateOne(query, update, { upsert: true });

        return {
            success: true,
            upserted: Boolean(result?.upsertedCount)
        };
    } catch (error) {
        const code = String(error?.code || '');
        if (code === '11000' || code === 'E11000') {
            console.warn('Media registry duplicate key ignored', {
                storageProvider,
                objectKey,
                mediaType: String(payload?.mediaType || '').trim().toLowerCase()
            });
            return { success: false, duplicate: true, skipped: true, reason: 'duplicate_key' };
        }

        console.warn('Media registry write failed', {
            storageProvider,
            objectKey,
            mediaType: String(payload?.mediaType || '').trim().toLowerCase(),
            errorCode: code || 'UNKNOWN_ERROR',
            errorMessage: String(error?.message || 'Unknown registry error')
        });
        return { success: false, error: true, reason: 'write_failed' };
    }
}

function resolveStorageAdapter() {
    const localAdapter = createLocalLegacyStorageAdapter();

    if (!MEDIA_STORAGE_PROVIDER || MEDIA_STORAGE_PROVIDER === 'local') {
        return {
            adapter: localAdapter,
            provider: 'local',
            status: 'active'
        };
    }

    if (MEDIA_STORAGE_PROVIDER === 'r2') {
        return {
            adapter: localAdapter,
            provider: 'r2',
            status: 'not-configured',
            message: 'MEDIA_STORAGE_PROVIDER=r2 is recognized but R2 is not enabled yet; using local storage.'
        };
    }

    return {
        adapter: localAdapter,
        provider: MEDIA_STORAGE_PROVIDER,
        status: 'unsupported',
        message: `Unsupported MEDIA_STORAGE_PROVIDER value: ${MEDIA_STORAGE_PROVIDER}; using local storage.`
    };
}

function ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function mapUser(doc) {
    return {
        id: String(doc._id),
        name: doc.name,
        email: doc.email,
        role: doc.role,
        isActive: Boolean(doc.isActive),
        lastLoginAt: doc.lastLoginAt || null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

function createAuthToken(user) {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
        {
            sub: String(user._id),
            email: user.email,
            role: user.role,
            name: user.name
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function buildPasswordResetTokenHash(token) {
    return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function issuePasswordResetToken(email) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = buildPasswordResetTokenHash(rawToken);

    passwordResetStore.set(tokenHash, {
        email: String(email || '').toLowerCase(),
        expiresAt: Date.now() + PASSWORD_RESET_TOKEN_TTL_MS
    });

    return rawToken;
}

function consumePasswordResetToken(rawToken) {
    const tokenHash = buildPasswordResetTokenHash(rawToken);
    const entry = passwordResetStore.get(tokenHash);

    if (!entry) {
        return null;
    }

    if (entry.expiresAt <= Date.now()) {
        passwordResetStore.delete(tokenHash);
        return null;
    }

    passwordResetStore.delete(tokenHash);
    return entry;
}

function requireJwtAuth(req, res, next) {
    const authHeader = String(req.headers.authorization || '');

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token required'
        });
    }

    const token = authHeader.slice('Bearer '.length).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token required'
        });
    }

    if (!JWT_SECRET) {
        return res.status(503).json({
            success: false,
            message: 'JWT is not configured on server'
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.authUser = payload;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        const role = String(req.authUser?.role || '').toLowerCase();
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
}

function requireAdminAccess(req, res, next) {
    if (ADMIN_API_KEY && req.headers['x-admin-key'] === ADMIN_API_KEY) {
        req.authUser = {
            sub: 'legacy-admin-key',
            email: 'legacy-admin-key',
            role: 'admin',
            name: 'Legacy Admin Key'
        };
        return next();
    }

    return requireJwtAuth(req, res, () => requireRole(['admin', 'editor'])(req, res, next));
}

async function ensureBootstrapAdmin() {
    if (!mongoReady || !UserModel) {
        return;
    }

    const usersCount = await UserModel.countDocuments();
    if (usersCount > 0) {
        return;
    }

    if (!ADMIN_BOOTSTRAP_EMAIL || !ADMIN_BOOTSTRAP_PASSWORD) {
        console.log('⚠️ No bootstrap admin created: set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD');
        return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_BOOTSTRAP_PASSWORD, 12);

    await UserModel.create({
        name: 'Administrator',
        email: ADMIN_BOOTSTRAP_EMAIL,
        passwordHash,
        role: 'admin',
        isActive: true
    });

    console.log(`👤 Bootstrap admin created: ${ADMIN_BOOTSTRAP_EMAIL}`);
}

function mapNews(doc) {
    return {
        id: String(doc._id),
        title: doc.title,
        slug: doc.slug,
        summary: doc.summary,
        content: doc.content,
        category: doc.category,
        coverImageUrl: doc.coverImageUrl,
        videoUrl: doc.videoUrl,
        tags: doc.tags,
        status: doc.status,
        featured: Boolean(doc.featured),
        publishedAt: doc.publishedAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

function mapVideo(doc) {
    return {
        id: String(doc._id),
        title: doc.title,
        slug: doc.slug,
        description: doc.description,
        category: doc.category,
        videoUrl: doc.videoUrl,
        thumbnailUrl: doc.thumbnailUrl,
        sourceType: doc.sourceType,
        status: doc.status,
        featured: Boolean(doc.featured),
        publishedAt: doc.publishedAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

function validateNewsPayload(req, res, next) {
    const title = validator.trim(String(req.body.title || ''));
    const summary = validator.trim(String(req.body.summary || ''));
    const content = validator.trim(String(req.body.content || ''));
    const category = validator.trim(String(req.body.category || 'General'));
    const coverImageUrl = validator.trim(String(req.body.coverImageUrl || ''));
    const videoUrl = validator.trim(String(req.body.videoUrl || ''));
    const status = validator.trim(String(req.body.status || 'draft')).toLowerCase();
    const tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => validator.trim(String(tag))).filter(Boolean).slice(0, 20)
        : [];

    if (!title || title.length < 5 || title.length > 180) {
        return res.status(400).json({
            success: false,
            message: 'Title must be between 5 and 180 characters'
        });
    }

    if (!summary || summary.length > 400) {
        return res.status(400).json({
            success: false,
            message: 'Summary is required and must be 400 characters or less'
        });
    }

    if (!content || content.length < 20) {
        return res.status(400).json({
            success: false,
            message: 'Content must be at least 20 characters'
        });
    }

    if (!['draft', 'published'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status must be draft or published'
        });
    }

    if (coverImageUrl && !validator.isURL(coverImageUrl, { require_protocol: true })) {
        return res.status(400).json({
            success: false,
            message: 'coverImageUrl must be a valid absolute URL'
        });
    }

    if (videoUrl && !validator.isURL(videoUrl, { require_protocol: true })) {
        return res.status(400).json({
            success: false,
            message: 'videoUrl must be a valid absolute URL'
        });
    }

    req.body.title = validator.escape(title);
    req.body.summary = validator.escape(summary);
    req.body.content = validator.escape(content);
    req.body.category = validator.escape(category).slice(0, 60);
    req.body.coverImageUrl = coverImageUrl;
    req.body.videoUrl = videoUrl;
    req.body.status = status;
    req.body.featured = toBoolean(req.body.featured, false);
    req.body.tags = tags.map((tag) => validator.escape(tag).slice(0, 40));
    req.body.slug = validator.trim(String(req.body.slug || ''));

    next();
}

function validateVideoPayload(req, res, next) {
    const title = validator.trim(String(req.body.title || ''));
    const description = validator.trim(String(req.body.description || ''));
    const category = validator.trim(String(req.body.category || 'General'));
    const status = validator.trim(String(req.body.status || 'draft')).toLowerCase();
    const sourceType = validator.trim(String(req.body.sourceType || 'external')).toLowerCase();
    const videoUrl = validator.trim(String(req.body.videoUrl || ''));
    const thumbnailUrl = validator.trim(String(req.body.thumbnailUrl || ''));

    if (!title || title.length < 3 || title.length > 180) {
        return res.status(400).json({
            success: false,
            message: 'Video title must be between 3 and 180 characters'
        });
    }

    if (!description || description.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'Description is required and must be 500 characters or less'
        });
    }

    if (!['draft', 'published'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status must be draft or published'
        });
    }

    if (!['external', 'upload'].includes(sourceType)) {
        return res.status(400).json({
            success: false,
            message: 'sourceType must be external or upload'
        });
    }

    if (!videoUrl || !validator.isURL(videoUrl, { require_protocol: true })) {
        return res.status(400).json({
            success: false,
            message: 'videoUrl must be a valid absolute URL'
        });
    }

    if (thumbnailUrl && !validator.isURL(thumbnailUrl, { require_protocol: true })) {
        return res.status(400).json({
            success: false,
            message: 'thumbnailUrl must be a valid absolute URL'
        });
    }

    req.body.title = validator.escape(title);
    req.body.description = validator.escape(description);
    req.body.category = validator.escape(category).slice(0, 60);
    req.body.status = status;
    req.body.sourceType = sourceType;
    req.body.videoUrl = videoUrl;
    req.body.thumbnailUrl = thumbnailUrl;
    req.body.featured = toBoolean(req.body.featured, false);
    req.body.slug = validator.trim(String(req.body.slug || ''));

    next();
}

function initMongoModels() {
    const userSchema = new mongoose.Schema({
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'editor' },
        isActive: { type: Boolean, default: true },
        lastLoginAt: { type: Date, default: null }
    }, {
        timestamps: true
    });

    const newsSchema = new mongoose.Schema({
        title: { type: String, required: true, trim: true, minlength: 5, maxlength: 180 },
        slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
        summary: { type: String, required: true, trim: true, maxlength: 400 },
        content: { type: String, required: true, trim: true },
        category: { type: String, default: 'General', trim: true, maxlength: 60 },
        coverImageUrl: { type: String, default: '' },
        videoUrl: { type: String, default: '' },
        tags: { type: [String], default: [] },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        featured: { type: Boolean, default: false },
        publishedAt: { type: Date, default: null },
        createdBy: { type: String, default: 'admin' },
        updatedBy: { type: String, default: 'admin' },
        deletedAt: { type: Date, default: null }
    }, {
        timestamps: true
    });

    newsSchema.index({ status: 1, deletedAt: 1, publishedAt: -1, createdAt: -1 });
    newsSchema.index({ category: 1, deletedAt: 1, createdAt: -1 });

    const videoSchema = new mongoose.Schema({
        title: { type: String, required: true, trim: true, minlength: 3, maxlength: 180 },
        slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
        description: { type: String, required: true, trim: true, maxlength: 500 },
        category: { type: String, default: 'General', trim: true, maxlength: 60 },
        videoUrl: { type: String, required: true },
        thumbnailUrl: { type: String, default: '' },
        sourceType: { type: String, enum: ['external', 'upload'], default: 'external' },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        featured: { type: Boolean, default: false },
        publishedAt: { type: Date, default: null },
        createdBy: { type: String, default: 'admin' },
        updatedBy: { type: String, default: 'admin' },
        deletedAt: { type: Date, default: null }
    }, {
        timestamps: true
    });

    videoSchema.index({ status: 1, deletedAt: 1, publishedAt: -1, createdAt: -1 });
    videoSchema.index({ category: 1, deletedAt: 1, createdAt: -1 });

    const sharedMediaAssetSchema = new mongoose.Schema({
        ownerType: { type: String, default: '' },
        ownerId: { type: String, default: '' },
        storageProvider: { type: String, required: true, default: 'local', trim: true, lowercase: true },
        objectKey: { type: String, required: true, trim: true },
        deliveryUrl: { type: String, required: true, trim: true },
        originalFilename: { type: String, required: true, trim: true },
        mimeType: { type: String, required: true, trim: true },
        sizeBytes: { type: Number, required: true, min: 0 },
        mediaType: { type: String, required: true, trim: true, lowercase: true },
        healthStatus: { type: String, default: 'unknown', trim: true, lowercase: true },
        migrationStatus: { type: String, default: 'not_required', trim: true, lowercase: true },
        createdBy: { type: String, default: 'admin' },
        deletedAt: { type: Date, default: null }
    }, {
        timestamps: true
    });

    sharedMediaAssetSchema.index(
        { storageProvider: 1, objectKey: 1 },
        {
            unique: true,
            partialFilterExpression: {
                storageProvider: { $type: 'string' },
                objectKey: { $type: 'string' }
            }
        }
    );
    sharedMediaAssetSchema.index({ ownerType: 1, ownerId: 1, deletedAt: 1, createdAt: -1 });
    sharedMediaAssetSchema.index({ healthStatus: 1, deletedAt: 1, updatedAt: -1 });
    sharedMediaAssetSchema.index({ migrationStatus: 1, deletedAt: 1, createdAt: -1 });
    sharedMediaAssetSchema.index(
        { deliveryUrl: 1 },
        {
            sparse: true,
            partialFilterExpression: {
                deliveryUrl: { $type: 'string' }
            }
        }
    );

    UserModel = mongoose.models.User || mongoose.model('User', userSchema);
    NewsModel = mongoose.models.News || mongoose.model('News', newsSchema);
    VideoModel = mongoose.models.Video || mongoose.model('Video', videoSchema);
    SharedMediaAssetModel = mongoose.models.SharedMediaAsset || mongoose.model('SharedMediaAsset', sharedMediaAssetSchema);
}

async function connectMongoIfConfigured() {
    if (!MONGODB_URI) {
        if (!MONGODB_INMEMORY_FALLBACK) {
            console.log('⚠️ MongoDB disabled: MONGODB_URI is not set and fallback is disabled');
            mongoReady = false;
            return;
        }

        console.log('ℹ️ MONGODB_URI not set. Starting in-memory MongoDB fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const inMemoryUri = mongoMemoryServer.getUri();

        await mongoose.connect(inMemoryUri, {
            dbName: MONGODB_DB_NAME || 'm62_webtv_local',
            autoIndex: true
        });

        initMongoModels();
        mongoReady = true;
        console.log('🧪 In-memory MongoDB fallback enabled');
        return;
    }

    await mongoose.connect(MONGODB_URI, {
        dbName: MONGODB_DB_NAME || undefined,
        autoIndex: true
    });

    initMongoModels();
    mongoReady = true;
    console.log(`🗄️ MongoDB connected${MONGODB_DB_NAME ? ` (${MONGODB_DB_NAME})` : ''}`);
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
    ensureDataDirectory();

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

function ensureStatsStore() {
    ensureDataDirectory();

    if (!fs.existsSync(STATS_FILE)) {
        fs.writeFileSync(
            STATS_FILE,
            JSON.stringify({ visitorsCount: 0, updatedAt: new Date().toISOString() }, null, 2),
            'utf8'
        );
    }
}

function readStatsStore() {
    ensureStatsStore();

    try {
        const parsed = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
        return {
            visitorsCount: Math.max(Number(parsed.visitorsCount || 0), 0),
            updatedAt: parsed.updatedAt || null
        };
    } catch (error) {
        return {
            visitorsCount: 0,
            updatedAt: null
        };
    }
}

function writeStatsStore(store) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function countModerationComments(store) {
    return ['news', 'video'].reduce((total, itemType) => {
        const bucket = store[itemType] || {};
        return total + Object.values(bucket).reduce((innerTotal, item) => {
            const comments = Array.isArray(item.comments) ? item.comments : [];
            return innerTotal + comments.length;
        }, 0);
    }, 0);
}

function countEngagementTotals(store) {
    return ['news', 'video'].reduce((totals, itemType) => {
        const bucket = store[itemType] || {};

        Object.values(bucket).forEach((item) => {
            const comments = Array.isArray(item.comments) ? item.comments : [];
            const ratings = Array.isArray(item.ratings) ? item.ratings : [];

            totals.commentsCount += comments.length;
            totals.ratingsCount += ratings.length;
        });

        return totals;
    }, {
        commentsCount: 0,
        ratingsCount: 0
    });
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

function applySecurityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    if (IS_PRODUCTION) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
}

function validateProductionConfig(configuredOrigins) {
    if (!IS_PRODUCTION) {
        return;
    }

    const issues = [];

    if (!JWT_SECRET || JWT_SECRET.length < 32) {
        issues.push('JWT_SECRET must be set and at least 32 characters in production.');
    }

    if (!MONGODB_URI) {
        issues.push('MONGODB_URI must be set in production.');
    }

    if (!configuredOrigins.length) {
        issues.push('FRONTEND_ORIGIN must include at least one allowed origin in production.');
    }

    const hasLocalhostOrigin = configuredOrigins.some((origin) =>
        /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(origin)
    );

    if (hasLocalhostOrigin) {
        issues.push('FRONTEND_ORIGIN must not include localhost or 127.0.0.1 in production.');
    }

    if (MONGODB_INMEMORY_FALLBACK) {
        issues.push('MONGODB_INMEMORY_FALLBACK should be false in production.');
    }

    if (issues.length) {
        throw new Error(`Invalid production configuration: ${issues.join(' ')}`);
    }
}

// Middleware
const localOrigins = IS_PRODUCTION ? [] : ['http://localhost', 'http://localhost:5500', 'http://127.0.0.1:5500'];
const configuredOrigins = String(process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]);

if (TRUST_PROXY_HOPS > 0) {
    app.set('trust proxy', TRUST_PROXY_HOPS);
}

app.disable('x-powered-by');
app.use(applySecurityHeaders);

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
app.use(bodyParser.json({ limit: `${REQUEST_BODY_LIMIT_MB}mb` }));
app.use(bodyParser.urlencoded({ limit: `${REQUEST_BODY_LIMIT_MB}mb`, extended: true }));
const storageProviderSelection = resolveStorageAdapter();
const storageAdapter = storageProviderSelection.adapter;

if (storageProviderSelection.message) {
    console.warn(storageProviderSelection.message);
} else {
    console.log(`Storage provider active: ${storageProviderSelection.provider}`);
}

storageAdapter.ensureReady();
app.use(
    storageAdapter.getPublicMountPath(),
    storageAdapter.createPublicReadGuard(),
    storageAdapter.createStaticMiddleware()
);

const uploadStorage = storageAdapter.createMulterStorage();

const uploadImageMiddleware = multer({
    storage: uploadStorage,
    limits: {
        fileSize: UPLOAD_MAX_MB * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const mimeType = String(file.mimetype || '').toLowerCase();
        const extension = path.extname(String(file.originalname || '')).toLowerCase();
        if (!mimeType.startsWith('image/') || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
            return cb(new Error('Only image files are allowed'));
        }

        cb(null, true);
    }
});

const uploadVideoMiddleware = multer({
    storage: uploadStorage,
    limits: {
        fileSize: VIDEO_UPLOAD_MAX_MB * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const mimeType = String(file.mimetype || '').toLowerCase();
        const extension = path.extname(String(file.originalname || '')).toLowerCase();
        if (!mimeType.startsWith('video/') || !ALLOWED_VIDEO_EXTENSIONS.has(extension)) {
            return cb(new Error('Only video files are allowed'));
        }

        cb(null, true);
    }
});

// Email configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: MAIL_SEND_TIMEOUT_MS,
    greetingTimeout: MAIL_SEND_TIMEOUT_MS,
    socketTimeout: MAIL_SEND_TIMEOUT_MS
});

async function sendMailWithTimeout(mailOptions, timeoutMs = MAIL_SEND_TIMEOUT_MS) {
    const timeoutError = new Error(`Email send timed out after ${timeoutMs}ms`);
    timeoutError.code = 'EMAIL_TIMEOUT';

    return Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => {
            setTimeout(() => reject(timeoutError), timeoutMs).unref();
        })
    ]);
}

function getSanitizedMailErrorCode(error) {
    const code = String(error?.code || '').trim();

    if (code) {
        return code;
    }

    const status = Number(error?.status || 0);
    if (status > 0) {
        return `MAIL_HTTP_${status}`;
    }

    return 'EMAIL_DELIVERY_FAILED';
}

async function sendPasswordResetEmail({ to, token, resetUrl, expiresInMinutes }) {
    const subject = 'M62 WEB TV Admin Password Reset';
    const html = `
        <h2>Password Reset Request</h2>
        <p>Someone requested to reset your M62 WEB TV admin password.</p>
        <p>This token expires in ${expiresInMinutes} minutes.</p>
        <p><strong>Reset token:</strong> ${token}</p>
        <p><strong>Reset link:</strong> <a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this message.</p>
    `;

    // Production: prefer Resend HTTPS API when key exists.
    if (IS_PRODUCTION && RESEND_API_KEY) {
        if (!EMAIL_FROM) {
            const error = new Error('EMAIL_FROM is required for production password reset delivery');
            error.code = 'EMAIL_FROM_MISSING';
            throw error;
        }

        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => controller.abort(), MAIL_SEND_TIMEOUT_MS);

        try {
            const response = await fetch(RESEND_EMAILS_API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: EMAIL_FROM,
                    to: [to],
                    subject,
                    html
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const error = new Error(`Resend API failed with status ${response.status}`);
                error.code = 'RESEND_API_ERROR';
                error.status = response.status;
                throw error;
            }

            return;
        } catch (error) {
            if (error?.name === 'AbortError') {
                const timeoutError = new Error(`Resend API timed out after ${MAIL_SEND_TIMEOUT_MS}ms`);
                timeoutError.code = 'EMAIL_TIMEOUT';
                throw timeoutError;
            }

            throw error;
        } finally {
            clearTimeout(timeoutHandle);
        }
    }

    // Non-production only: keep existing SMTP fallback.
    if (!IS_PRODUCTION && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        await sendMailWithTimeout({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        });
    }
}

// Validation middleware
function validateContactForm(req, res, next) {
    const { name, email, subject, message } = req.body;
    const phone = validator.trim(String(req.body.phone || ''));

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
    req.body.phone = phone ? validator.escape(phone).slice(0, 30) : '';

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
        await sendMailWithTimeout(adminMailOptions);
        await sendMailWithTimeout(userMailOptions);

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

app.get('/api/stats/dashboard', async (req, res, next) => {
    try {
        const statsStore = readStatsStore();
        const engagementStore = readEngagementStore();
        const engagementTotals = countEngagementTotals(engagementStore);
        let newsCount = 0;
        let videosCount = 0;
        let usersCount = 0;

        if (mongoReady && NewsModel && VideoModel && UserModel) {
            newsCount = await NewsModel.countDocuments({ deletedAt: null });
            videosCount = await VideoModel.countDocuments({ deletedAt: null });
            usersCount = await UserModel.countDocuments({ isActive: true });
        }

        res.json({
            success: true,
            data: {
                newsCount,
                videosCount,
                usersCount,
                commentsCount: engagementTotals.commentsCount,
                ratingsCount: engagementTotals.ratingsCount,
                engagementCount: engagementTotals.commentsCount + engagementTotals.ratingsCount,
                visitorsCount: statsStore.visitorsCount,
                mongoReady
            }
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/stats/visit', createRateLimiter(60 * 1000, 30), (req, res) => {
    const statsStore = readStatsStore();
    statsStore.visitorsCount += 1;
    statsStore.updatedAt = new Date().toISOString();
    writeStatsStore(statsStore);

    res.status(201).json({
        success: true,
        data: {
            visitorsCount: statsStore.visitorsCount
        }
    });
});

// Test email endpoint
app.post('/api/test-email', requireAdminAccess, createRateLimiter(10 * 60 * 1000, 3), async (req, res) => {
    try {
        const destination = validator.trim(String(req.body.email || process.env.EMAIL_USER || ''));
        if (!destination || !validator.isEmail(destination)) {
            return res.status(400).json({
                success: false,
                message: 'Valid destination email is required'
            });
        }

        const testMailOptions = {
            from: process.env.EMAIL_USER,
            to: destination,
            subject: 'M62 WEB TV - Test Email',
            html: '<h2>Test Email</h2><p>Server is working correctly!</p>'
        };

        await sendMailWithTimeout(testMailOptions);
        res.json({ success: true, message: 'Test email sent successfully!' });
    } catch (error) {
        const isTimeout = error && error.code === 'EMAIL_TIMEOUT';
        const statusCode = isTimeout ? 504 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
});

app.post('/api/uploads/image', requireAdminAccess, (req, res, next) => {
    uploadImageMiddleware.single('image')(req, res, (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: `Image is too large. Maximum size is ${UPLOAD_MAX_MB}MB`
                });
            }

            return res.status(400).json({
                success: false,
                message: error.message || 'Image upload failed'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image file is required'
            });
        }

        const relativeUrl = storageAdapter.buildRelativeUrl(req.file.filename);
        const absoluteUrl = storageAdapter.buildAbsoluteUrl(req, relativeUrl);

        void recordUploadedMediaAssetBestEffort(
            buildSharedMediaAssetRecordFromUpload({
                req,
                file: req.file,
                relativeUrl,
                absoluteUrl,
                mediaType: 'image'
            })
        );

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                fileName: req.file.filename,
                mimeType: req.file.mimetype,
                size: req.file.size,
                url: absoluteUrl,
                relativeUrl
            }
        });
    });
});

app.post('/api/uploads/video', requireAdminAccess, (req, res, next) => {
    uploadVideoMiddleware.single('video')(req, res, (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: `Video is too large. Maximum size is ${VIDEO_UPLOAD_MAX_MB}MB`
                });
            }

            return res.status(400).json({
                success: false,
                message: error.message || 'Video upload failed'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Video file is required'
            });
        }

        const relativeUrl = storageAdapter.buildRelativeUrl(req.file.filename);
        const absoluteUrl = storageAdapter.buildAbsoluteUrl(req, relativeUrl);

        void recordUploadedMediaAssetBestEffort(
            buildSharedMediaAssetRecordFromUpload({
                req,
                file: req.file,
                relativeUrl,
                absoluteUrl,
                mediaType: 'video'
            })
        );

        res.status(201).json({
            success: true,
            message: 'Video uploaded successfully',
            data: {
                fileName: req.file.filename,
                mimeType: req.file.mimetype,
                size: req.file.size,
                url: absoluteUrl,
                relativeUrl
            }
        });
    });
});

// Authentication endpoints
app.post('/api/auth/login', createRateLimiter(60 * 1000, 12), requireMongo, async (req, res, next) => {
    try {
        const email = validator.trim(String(req.body.email || '')).toLowerCase();
        const password = String(req.body.password || '');

        if (!validator.isEmail(email) || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password format'
            });
        }

        const user = await UserModel.findOne({ email, isActive: true });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        user.lastLoginAt = new Date();
        await user.save();

        const token = createAuthToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: mapUser(user)
            }
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/password-reset/request', createRateLimiter(10 * 60 * 1000, 6), requireMongo, async (req, res, next) => {
    try {
        const email = validator.trim(String(req.body.email || '')).toLowerCase();

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        const user = await UserModel.findOne({ email, isActive: true });
        let token = '';
        let resetUrl = '';

        if (user) {
            token = issuePasswordResetToken(email);
            resetUrl = String(process.env.ADMIN_RESET_URL || `${req.protocol}://${req.get('host')}/admin/login.html#reset-token=${token}`);

            sendPasswordResetEmail({
                to: email,
                token,
                resetUrl,
                expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES
            }).catch((mailError) => {
                const reasonCode = getSanitizedMailErrorCode(mailError);
                console.warn('Password reset mail failed:', reasonCode);
            });
        }

        const responsePayload = {
            success: true,
            message: 'If that email exists, password reset instructions have been issued.'
        };

        if (!IS_PRODUCTION && token) {
            responsePayload.data = {
                token,
                resetUrl,
                expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES
            };
        }

        res.json(responsePayload);
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/password-reset/confirm', createRateLimiter(10 * 60 * 1000, 12), requireMongo, async (req, res, next) => {
    try {
        const token = validator.trim(String(req.body.token || ''));
        const password = String(req.body.password || '');

        if (!token || token.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({
                success: false,
                message: 'Password must be between 8 and 128 characters'
            });
        }

        const tokenEntry = consumePasswordResetToken(token);
        if (!tokenEntry || !tokenEntry.email) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is invalid or expired'
            });
        }

        const user = await UserModel.findOne({ email: tokenEntry.email, isActive: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        user.passwordHash = await bcrypt.hash(password, 12);
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful. You can now sign in.'
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/auth/me', requireMongo, requireJwtAuth, async (req, res, next) => {
    try {
        const userId = String(req.authUser?.sub || '');
        if (!validator.isMongoId(userId)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token payload'
            });
        }

        const user = await UserModel.findOne({ _id: userId, isActive: true });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        res.json({
            success: true,
            data: mapUser(user)
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/auth/users', requireMongo, requireJwtAuth, requireRole(['admin']), async (req, res, next) => {
    try {
        const q = validator.trim(String(req.query.q || '')).toLowerCase();
        const role = validator.trim(String(req.query.role || '')).toLowerCase();
        const status = validator.trim(String(req.query.status || '')).toLowerCase();
        const page = Math.max(Number(req.query.page || 1), 1);
        const pageSize = Math.min(Math.max(Number(req.query.pageSize || 25), 1), 100);

        const filter = {};

        if (q) {
            const safeQuery = escapeRegexLiteral(q);
            filter.$or = [
                { name: { $regex: safeQuery, $options: 'i' } },
                { email: { $regex: safeQuery, $options: 'i' } }
            ];
        }

        if (['admin', 'editor', 'viewer'].includes(role)) {
            filter.role = role;
        }

        if (status === 'active') {
            filter.isActive = true;
        }

        if (status === 'inactive') {
            filter.isActive = false;
        }

        const totalItems = await UserModel.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
        const safePage = Math.min(page, totalPages);
        const skip = (safePage - 1) * pageSize;

        const users = await UserModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        res.json({
            success: true,
            data: users.map(mapUser),
            meta: {
                page: safePage,
                pageSize,
                totalItems,
                totalPages,
                hasPrev: safePage > 1,
                hasNext: safePage < totalPages
            }
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/users', requireMongo, requireJwtAuth, requireRole(['admin']), async (req, res, next) => {
    try {
        const name = validator.trim(String(req.body.name || ''));
        const email = validator.trim(String(req.body.email || '')).toLowerCase();
        const password = String(req.body.password || '');
        const role = validator.trim(String(req.body.role || 'editor')).toLowerCase();

        if (!name || name.length < 2 || name.length > 120) {
            return res.status(400).json({
                success: false,
                message: 'Name must be between 2 and 120 characters'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({
                success: false,
                message: 'Password must be between 8 and 128 characters'
            });
        }

        if (!['admin', 'editor', 'viewer'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be admin, editor, or viewer'
            });
        }

        const exists = await UserModel.exists({ email });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await UserModel.create({
            name: validator.escape(name),
            email,
            passwordHash,
            role,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: mapUser(user)
        });
    } catch (error) {
        next(error);
    }
});

app.patch('/api/auth/users/:id', requireMongo, requireJwtAuth, requireRole(['admin']), async (req, res, next) => {
    try {
        const id = String(req.params.id || '').trim();

        if (!validator.isMongoId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user id'
            });
        }

        const user = await UserModel.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const currentUserId = String(req.authUser?.sub || '');
        const nextName = req.body.name === undefined ? user.name : validator.trim(String(req.body.name || ''));
        const nextRole = req.body.role === undefined ? user.role : validator.trim(String(req.body.role || '')).toLowerCase();
        const nextIsActive = req.body.isActive === undefined ? user.isActive : toBoolean(req.body.isActive, true);

        if (!nextName || nextName.length < 2 || nextName.length > 120) {
            return res.status(400).json({
                success: false,
                message: 'Name must be between 2 and 120 characters'
            });
        }

        if (!['admin', 'editor', 'viewer'].includes(nextRole)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be admin, editor, or viewer'
            });
        }

        if (String(user._id) === currentUserId && !nextIsActive) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        user.name = validator.escape(nextName);
        user.role = nextRole;
        user.isActive = nextIsActive;
        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            data: mapUser(user)
        });
    } catch (error) {
        next(error);
    }
});

app.patch('/api/auth/users/:id/password', requireMongo, requireJwtAuth, requireRole(['admin']), async (req, res, next) => {
    try {
        const id = String(req.params.id || '').trim();
        const password = String(req.body.password || '');

        if (!validator.isMongoId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user id'
            });
        }

        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({
                success: false,
                message: 'Password must be between 8 and 128 characters'
            });
        }

        const user = await UserModel.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.passwordHash = await bcrypt.hash(password, 12);
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

// News CRUD endpoints (MongoDB)
app.get('/api/news', requireMongo, async (req, res, next) => {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 100);
        const status = String(req.query.status || 'published').toLowerCase();
        const category = validator.trim(String(req.query.category || ''));
        const query = validator.trim(String(req.query.q || ''));
        const canReadDraft = hasPrivilegedAccess(req);

        if (status === 'draft' && !canReadDraft) {
            return res.status(403).json({
                success: false,
                message: 'Draft access requires admin or editor permissions'
            });
        }

        const filter = { deletedAt: null };
        if (status === 'draft' || status === 'published') {
            filter.status = status;
        } else {
            filter.status = 'published';
        }
        if (category) {
            filter.category = category;
        }
        if (query) {
            const safeQuery = escapeRegexLiteral(query);
            filter.$or = [
                { title: { $regex: safeQuery, $options: 'i' } },
                { summary: { $regex: safeQuery, $options: 'i' } },
                { content: { $regex: safeQuery, $options: 'i' } },
                { tags: { $regex: safeQuery, $options: 'i' } }
            ];
        }

        const totalItems = await NewsModel.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
        const safePage = Math.min(page, totalPages);
        const skip = (safePage - 1) * pageSize;

        const docs = await NewsModel.find(filter)
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        res.json({
            success: true,
            data: docs.map(mapNews),
            meta: {
                page: safePage,
                pageSize,
                totalItems,
                totalPages,
                hasPrev: safePage > 1,
                hasNext: safePage < totalPages
            }
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/news/:idOrSlug', requireMongo, async (req, res, next) => {
    try {
        const idOrSlug = String(req.params.idOrSlug || '').trim();
        let doc = null;

        if (validator.isMongoId(idOrSlug)) {
            doc = await NewsModel.findOne({ _id: idOrSlug, deletedAt: null }).lean();
        }

        if (!doc) {
            doc = await NewsModel.findOne({ slug: idOrSlug.toLowerCase(), deletedAt: null }).lean();
        }

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'News not found'
            });
        }

        if (doc.status !== 'published' && !hasPrivilegedAccess(req)) {
            return res.status(404).json({
                success: false,
                message: 'News not found'
            });
        }

        res.json({
            success: true,
            data: mapNews(doc)
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/news', requireMongo, requireAdminAccess, validateNewsPayload, async (req, res, next) => {
    try {
        const baseSlug = req.body.slug ? slugifyTitle(req.body.slug) : slugifyTitle(req.body.title);
        let slug = baseSlug;
        let suffix = 1;

        while (await NewsModel.exists({ slug })) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        const shouldPublish = req.body.status === 'published';
        const doc = await NewsModel.create({
            title: req.body.title,
            slug,
            summary: req.body.summary,
            content: req.body.content,
            category: req.body.category,
            coverImageUrl: req.body.coverImageUrl,
            videoUrl: req.body.videoUrl,
            tags: req.body.tags,
            status: req.body.status,
            featured: req.body.featured,
            publishedAt: shouldPublish ? new Date() : null,
            createdBy: 'admin',
            updatedBy: 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'News created successfully',
            data: mapNews(doc.toObject())
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Slug already exists. Please try another title or slug.'
            });
        }

        next(error);
    }
});

app.patch('/api/news/:id', requireMongo, requireAdminAccess, validateNewsPayload, async (req, res, next) => {
    try {
        const id = String(req.params.id || '').trim();

        if (!validator.isMongoId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid news id'
            });
        }

        const doc = await NewsModel.findOne({ _id: id, deletedAt: null });

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'News not found'
            });
        }

        const baseSlug = req.body.slug
            ? slugifyTitle(req.body.slug)
            : slugifyTitle(req.body.title);
        let slug = baseSlug;
        let suffix = 1;

        while (await NewsModel.exists({ _id: { $ne: doc._id }, slug })) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        doc.title = req.body.title;
        doc.slug = slug;
        doc.summary = req.body.summary;
        doc.content = req.body.content;
        doc.category = req.body.category;
        doc.coverImageUrl = req.body.coverImageUrl;
        doc.videoUrl = req.body.videoUrl;
        doc.tags = req.body.tags;
        doc.status = req.body.status;
        doc.featured = req.body.featured;
        doc.updatedBy = 'admin';

        if (doc.status === 'published' && !doc.publishedAt) {
            doc.publishedAt = new Date();
        }

        if (doc.status === 'draft') {
            doc.publishedAt = null;
        }

        await doc.save();

        res.json({
            success: true,
            message: 'News updated successfully',
            data: mapNews(doc.toObject())
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Slug already exists. Please try another title or slug.'
            });
        }

        next(error);
    }
});

app.delete('/api/news/:id', requireMongo, requireAdminAccess, async (req, res, next) => {
    try {
        const id = String(req.params.id || '').trim();

        if (!validator.isMongoId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid news id'
            });
        }

        const doc = await NewsModel.findOne({ _id: id, deletedAt: null });

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'News not found'
            });
        }

        doc.deletedAt = new Date();
        doc.updatedBy = 'admin';
        await doc.save();

        res.json({
            success: true,
            message: 'News deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Video CRUD endpoints (MongoDB)
app.get('/api/videos', requireMongo, async (req, res, next) => {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 100);
        const status = String(req.query.status || 'published').toLowerCase();
        const category = validator.trim(String(req.query.category || ''));
        const query = validator.trim(String(req.query.q || ''));
        const canReadDraft = hasPrivilegedAccess(req);

        if (status === 'draft' && !canReadDraft) {
            return res.status(403).json({
                success: false,
                message: 'Draft access requires admin or editor permissions'
            });
        }

        const filter = { deletedAt: null };
        if (status === 'draft' || status === 'published') {
            filter.status = status;
        } else {
            filter.status = 'published';
        }
        if (category) {
            filter.category = category;
        }
        if (query) {
            const safeQuery = escapeRegexLiteral(query);
            filter.$or = [
                { title: { $regex: safeQuery, $options: 'i' } },
                { description: { $regex: safeQuery, $options: 'i' } },
                { category: { $regex: safeQuery, $options: 'i' } }
            ];
        }

        const totalItems = await VideoModel.countDocuments(filter);
        const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
        const safePage = Math.min(page, totalPages);
        const skip = (safePage - 1) * pageSize;

        const docs = await VideoModel.find(filter)
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        res.json({
            success: true,
            data: docs.map(mapVideo),
            meta: {
                page: safePage,
                pageSize,
                totalItems,
                totalPages,
                hasPrev: safePage > 1,
                hasNext: safePage < totalPages
            }
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/videos', requireMongo, requireAdminAccess, validateVideoPayload, async (req, res, next) => {
    try {
        const baseSlug = req.body.slug ? slugifyTitle(req.body.slug) : slugifyTitle(req.body.title);
        let slug = baseSlug;
        let suffix = 1;

        while (await VideoModel.exists({ slug })) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        const shouldPublish = req.body.status === 'published';
        const doc = await VideoModel.create({
            title: req.body.title,
            slug,
            description: req.body.description,
            category: req.body.category,
            videoUrl: req.body.videoUrl,
            thumbnailUrl: req.body.thumbnailUrl,
            sourceType: req.body.sourceType,
            status: req.body.status,
            featured: req.body.featured,
            publishedAt: shouldPublish ? new Date() : null,
            createdBy: 'admin',
            updatedBy: 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'Video created successfully',
            data: mapVideo(doc.toObject())
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Slug already exists. Please try another title or slug.'
            });
        }

        next(error);
    }
});

app.patch('/api/videos/:id', requireMongo, requireAdminAccess, validateVideoPayload, async (req, res, next) => {
    try {
        const id = String(req.params.id || '').trim();

        if (!validator.isMongoId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid video id'
            });
        }

        const doc = await VideoModel.findOne({ _id: id, deletedAt: null });

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        const baseSlug = req.body.slug
            ? slugifyTitle(req.body.slug)
            : slugifyTitle(req.body.title);
        let slug = baseSlug;
        let suffix = 1;

        while (await VideoModel.exists({ _id: { $ne: doc._id }, slug })) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        doc.title = req.body.title;
        doc.slug = slug;
        doc.description = req.body.description;
        doc.category = req.body.category;
        doc.videoUrl = req.body.videoUrl;
        doc.thumbnailUrl = req.body.thumbnailUrl;
        doc.sourceType = req.body.sourceType;
        doc.status = req.body.status;
        doc.featured = req.body.featured;
        doc.updatedBy = 'admin';

        if (doc.status === 'published' && !doc.publishedAt) {
            doc.publishedAt = new Date();
        }

        if (doc.status === 'draft') {
            doc.publishedAt = null;
        }

        await doc.save();

        res.json({
            success: true,
            message: 'Video updated successfully',
            data: mapVideo(doc.toObject())
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Slug already exists. Please try another title or slug.'
            });
        }

        next(error);
    }
});

app.delete('/api/videos/:id', requireMongo, requireAdminAccess, async (req, res, next) => {
    try {
        const id = String(req.params.id || '').trim();

        if (!validator.isMongoId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid video id'
            });
        }

        const doc = await VideoModel.findOne({ _id: id, deletedAt: null });

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        doc.deletedAt = new Date();
        doc.updatedBy = 'admin';
        await doc.save();

        res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    } catch (error) {
        next(error);
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

app.get('/api/engagement/moderation/comments', requireAdminAccess, (req, res) => {
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

app.get('/api/engagement/moderation/comments/export.csv', requireAdminAccess, (req, res) => {
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

app.patch('/api/engagement/moderation/comments/bulk', requireAdminAccess, (req, res) => {
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

app.patch('/api/engagement/:itemType(news|video)/:itemId/comments/:commentId', requireAdminAccess, validateItemParams, (req, res) => {
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
async function startServer() {
    const { archivedCount } = readAndArchiveStore();

    try {
        validateProductionConfig(configuredOrigins);
        await connectMongoIfConfigured();
        await ensureBootstrapAdmin();
    } catch (error) {
        mongoReady = false;
        console.error('❌ Startup validation/connection failed:', error.message);

        if (IS_PRODUCTION) {
            process.exit(1);
        }
    }

    app.listen(PORT, () => {
        console.log(`\n🚀 M62 WEB TV Backend Server running on http://localhost:${PORT}`);
        console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
        console.log(`🔗 Contact API: http://localhost:${PORT}/api/contact\n`);
        console.log(`💬 Engagement API: http://localhost:${PORT}/api/engagement/news/1\n`);
        console.log(`🗂️ Auto-archive: ${COMMENT_ARCHIVE_DAYS} days (archived on start: ${archivedCount})\n`);
        console.log(`📰 News API: http://localhost:${PORT}/api/news (MongoDB ${mongoReady ? 'enabled' : 'disabled'})\n`);
    });
}

startServer();

process.on('SIGINT', async () => {
    if (mongoMemoryServer) {
        await mongoMemoryServer.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (mongoMemoryServer) {
        await mongoMemoryServer.stop();
    }
    process.exit(0);
});
