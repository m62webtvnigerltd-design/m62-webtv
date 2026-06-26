function resolveApiBaseUrl() {
    const fromWindow = typeof window !== "undefined" ? window.M62_API_BASE_URL : "";
    if (fromWindow) {
        return String(fromWindow).replace(/\/+$/, "");
    }

    const fromStorage = localStorage.getItem("m62ApiBaseUrl") || "";
    if (fromStorage) {
        return String(fromStorage).replace(/\/+$/, "");
    }

    if (typeof window !== "undefined" && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
        const host = window.location.hostname;
        if (host === "localhost" || host === "127.0.0.1") {
            return "http://localhost:3000";
        }

        // In production, default to same-origin API when no explicit backend URL is set.
        return window.location.origin;
    }

    return "http://localhost:3000";
}

const API_BASE_URL = resolveApiBaseUrl();
const moderationState = {
    page: 1,
    pageSize: 25,
    query: "",
    status: "all",
    totalPages: 1,
    selected: new Set()
};
const adminEditorState = {
    newsId: "",
    videoId: "",
    newsItems: [],
    videoItems: []
};

class ApiError extends Error {
    constructor(message, status, retryAfterSeconds = 0) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

function makeClientId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStore(key, fallbackValue) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
        return fallbackValue;
    }
}

function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function createDebouncedFunction(callback, delayMs = 320) {
    let timeoutId = null;

    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            callback(...args);
        }, delayMs);
    };
}

function getLocalVisitorCount() {
    return Number(localStorage.getItem("m62VisitorCount") || "0");
}

function setLocalVisitorCount(value) {
    localStorage.setItem("m62VisitorCount", String(Math.max(Number(value || 0), 0)));
}

async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats/dashboard`);

        if (!response.ok) {
            throw new Error("Dashboard stats request failed");
        }

        const payload = await response.json();
        return payload.data || {};
    } catch (error) {
        return {
            newsCount: 0,
            videosCount: 0,
            usersCount: 0,
            commentsCount: 0,
            ratingsCount: 0,
            engagementCount: 0,
            visitorsCount: getLocalVisitorCount()
        };
    }
}

async function updateDashboardStats() {
    const totalNews = document.getElementById("totalNews");
    const totalVideos = document.getElementById("totalVideos");
    const totalVisitors = document.getElementById("totalVisitors");
    const totalUsers = document.getElementById("totalUsers");
    const totalComments = document.getElementById("totalComments");
    const totalEngagement = document.getElementById("totalEngagement");

    const stats = await fetchDashboardStats();

    if (totalNews) {
        totalNews.innerText = String(stats.newsCount || 0);
    }

    if (totalVideos) {
        totalVideos.innerText = String(stats.videosCount || 0);
    }

    if (totalVisitors) {
        totalVisitors.innerText = String(stats.visitorsCount || 0);
    }

    if (totalUsers) {
        totalUsers.innerText = String(stats.usersCount || 0);
    }

    if (totalComments) {
        totalComments.innerText = String(stats.commentsCount || 0);
    }

    if (totalEngagement) {
        totalEngagement.innerText = String(stats.engagementCount || 0);
    }
}

async function incrementVisitorCounterIfPublicPage() {
    if (typeof window === "undefined") {
        return;
    }

    const path = String(window.location.pathname || "").toLowerCase();
    const isAdminPage = path.includes("/admin/");

    if (isAdminPage) {
        return;
    }

    const sessionKey = "m62VisitorCounted";
    if (sessionStorage.getItem(sessionKey) === "1") {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/stats/visit`, {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Visitor tracking failed");
        }

        const payload = await response.json();
        setLocalVisitorCount(payload?.data?.visitorsCount || 0);
    } catch (error) {
        setLocalVisitorCount(getLocalVisitorCount() + 1);
    }

    sessionStorage.setItem(sessionKey, "1");
}

function ensureContentIds() {
    const news = readStore("news", []);
    const videos = readStore("videos", []);
    let newsChanged = false;
    let videosChanged = false;

    news.forEach((item, index) => {
        if (!item.id) {
            item.id = `news_${index + 1}`;
            newsChanged = true;
        }
    });

    videos.forEach((item, index) => {
        if (!item.id) {
            item.id = `video_${index + 1}`;
            videosChanged = true;
        }
    });

    if (newsChanged) {
        writeStore("news", news);
    }

    if (videosChanged) {
        writeStore("videos", videos);
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function isAdminPage() {
    if (typeof window === "undefined") {
        return false;
    }

    return String(window.location.pathname || "").toLowerCase().includes("/admin/");
}

function redirectToAdminLogin(reason = "") {
    if (typeof window === "undefined") {
        return;
    }

    const currentPath = String(window.location.pathname || "").toLowerCase();
    const loginPath = currentPath.includes("/admin/")
        ? currentPath.replace(/[^/]+$/, "login.html")
        : "admin/login.html";

    if (currentPath.endsWith("/login.html") || currentPath.endsWith("\\login.html") || currentPath.endsWith("login.html")) {
        return;
    }

    if (reason) {
        sessionStorage.setItem("m62AdminLoginMessage", reason);
    }

    window.location.href = loginPath;
}

function setEngagementFeedback(form, message, tone) {
    const feedback = form.querySelector(".engagement-feedback");

    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.classList.remove("is-error", "is-success", "is-warning");

    if (tone === "error") {
        feedback.classList.add("is-error");
    }

    if (tone === "success") {
        feedback.classList.add("is-success");
    }

    if (tone === "warning") {
        feedback.classList.add("is-warning");
    }
}

async function parseApiError(response, fallbackMessage) {
    const payload = await response.json().catch(() => ({}));
    const retryAfterHeader = Number(response.headers.get("Retry-After") || 0);
    const retryAfterSeconds = Number(payload.retryAfterSeconds || retryAfterHeader || 0);
    const message = payload.message || fallbackMessage;

    if (isAdminPage() && (response.status === 401 || response.status === 403) && !String(window.location.pathname || "").toLowerCase().endsWith("login.html")) {
        clearAdminAuthSession();
        redirectToAdminLogin("Your admin session expired. Please sign in again.");
    }

    return new ApiError(message, response.status, retryAfterSeconds);
}

function normalizeLegacyNewsItem(item, index) {
    const content = String(item.content || "").trim();
    const summary = String(item.summary || content.slice(0, 180) || "No summary");
    const id = item.id || `news_${index + 1}`;
    return {
        id,
        title: String(item.title || "Untitled"),
        slug: String(item.slug || id),
        summary,
        content,
        category: String(item.category || "General"),
        coverImageUrl: String(item.coverImageUrl || ""),
        status: String(item.status || "published"),
        publishedAt: item.publishedAt || item.date || null,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null
    };
}

async function fetchNewsList(options = {}) {
    const {
        status = "published",
        page = 1,
        pageSize = 20,
        q = "",
        category = ""
    } = options;

    try {
        const params = new URLSearchParams({
            status,
            page: String(page),
            pageSize: String(pageSize),
            q: String(q || ""),
            category: String(category || "")
        });
        const response = await fetch(`${API_BASE_URL}/api/news?${params.toString()}`);

        if (!response.ok) {
            throw new Error("News API request failed");
        }

        const payload = await response.json();
        return {
            data: Array.isArray(payload.data) ? payload.data : [],
            meta: payload.meta || null,
            source: "api"
        };
    } catch (error) {
        const localNews = readStore("news", []).map(normalizeLegacyNewsItem);
        const filtered = status === "all"
            ? localNews
            : localNews.filter((item) => item.status === status);

        return {
            data: filtered,
            meta: null,
            source: "fallback"
        };
    }
}

function formatNewsDate(value) {
    if (!value) {
        return "-";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    return parsed.toLocaleDateString();
}

async function createNewsItem(payload) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/news`, {
        method: "POST",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to create news item");
    }

    return response.json();
}

async function updateNewsItem(newsId, payload) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/news/${encodeURIComponent(newsId)}`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to update news item");
    }

    return response.json();
}

async function deleteNewsItem(newsId) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/news/${encodeURIComponent(newsId)}`, {
        method: "DELETE",
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to delete news item");
    }

    return response.json();
}

async function uploadNewsImageFile(file) {
    ensureAdminCredentialAvailable();

    if (!file) {
        throw new Error("Choose an image file first.");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/api/uploads/image`, {
        method: "POST",
        headers: buildAdminRequestHeaders(false),
        body: formData
    });

    if (!response.ok) {
        throw await parseApiError(response, "Image upload failed");
    }

    const payload = await response.json();
    return payload?.data || {};
}

async function publishNews() {
    const title = String(document.getElementById("newsTitle")?.value || "").trim();
    const summary = String(document.getElementById("newsSummary")?.value || "").trim();
    const category = String(document.getElementById("newsCategory")?.value || "General").trim();
    const status = String(document.getElementById("newsStatus")?.value || "published").trim();
    const coverImageUrl = String(document.getElementById("newsCoverImage")?.value || "").trim();
    const content = String(document.getElementById("newsContent")?.value || "").trim();

    if (!title || !summary || !content) {
        alert("Title, summary, and content are required.");
        return;
    }

    const isEditing = Boolean(adminEditorState.newsId);

    try {
        const payload = {
            title,
            summary,
            category: category || "General",
            status,
            coverImageUrl,
            content,
            tags: []
        };

        if (isEditing) {
            await updateNewsItem(adminEditorState.newsId, payload);
        } else {
            await createNewsItem(payload);
        }

        alert(isEditing ? "News updated successfully" : "News published successfully");
        resetNewsEditor();

        await loadAdminNewsTable();
        await loadNews();
    } catch (error) {
        alert(error.message || (isEditing ? "Unable to update news" : "Unable to publish news"));
    }
}

function resetNewsEditor() {
    adminEditorState.newsId = "";
    const contentInput = document.getElementById("newsContent");
    const summaryInput = document.getElementById("newsSummary");
    const titleInput = document.getElementById("newsTitle");
    const imageInput = document.getElementById("newsCoverImage");
    const categoryInput = document.getElementById("newsCategory");
    const statusInput = document.getElementById("newsStatus");
    const publishButton = document.getElementById("publishNewsButton");
    const cancelButton = document.getElementById("cancelNewsEditButton");

    if (contentInput) contentInput.value = "";
    if (summaryInput) summaryInput.value = "";
    if (titleInput) titleInput.value = "";
    if (imageInput) imageInput.value = "";
    if (categoryInput) categoryInput.value = "General";
    if (statusInput) statusInput.value = "published";
    if (publishButton) publishButton.textContent = "Publish News";
    if (cancelButton) cancelButton.style.display = "none";
}

function beginNewsEdit(newsId) {
    const item = adminEditorState.newsItems.find((entry) => entry.id === newsId);

    if (!item) {
        alert("Unable to load selected news item.");
        return;
    }

    adminEditorState.newsId = newsId;
    const titleInput = document.getElementById("newsTitle");
    const summaryInput = document.getElementById("newsSummary");
    const categoryInput = document.getElementById("newsCategory");
    const statusInput = document.getElementById("newsStatus");
    const imageInput = document.getElementById("newsCoverImage");
    const contentInput = document.getElementById("newsContent");
    const publishButton = document.getElementById("publishNewsButton");
    const cancelButton = document.getElementById("cancelNewsEditButton");

    if (titleInput) titleInput.value = item.title || "";
    if (summaryInput) summaryInput.value = item.summary || "";
    if (categoryInput) categoryInput.value = item.category || "General";
    if (statusInput) statusInput.value = item.status || "published";
    if (imageInput) imageInput.value = item.coverImageUrl || "";
    if (contentInput) contentInput.value = item.content || "";
    if (publishButton) publishButton.textContent = "Update News";
    if (cancelButton) cancelButton.style.display = "inline-block";
}

async function loadNews() {
    const result = await fetchNewsList({ status: "all", pageSize: 200 });
    const news = result.data || [];
    const table = document.getElementById("latestNews");

    updateDashboardStats();

    if (!table) {
        return;
    }

    table.innerHTML = "";

    news.slice(0, 10).forEach((item) => {
        table.innerHTML += `
<tr>
<td>${escapeHtml(item.title)}</td>
<td>${escapeHtml(formatNewsDate(item.publishedAt || item.createdAt))}</td>
<td>${escapeHtml(item.status || "published")}</td>
</tr>
`;
    });
}

function renderAdminNewsRows(items) {
    if (!items.length) {
        return `
<tr>
    <td colspan="5">No news items found.</td>
</tr>
`;
    }

    return items.map((item) => `
<tr>
    <td>${escapeHtml(item.title)}</td>
    <td>${escapeHtml(item.category || "General")}</td>
    <td>${escapeHtml(item.status || "published")}</td>
    <td>${escapeHtml(formatNewsDate(item.publishedAt || item.createdAt))}</td>
    <td>
        <button type="button" data-news-edit-id="${escapeHtml(item.id)}">Edit</button>
        <button type="button" data-news-delete-id="${escapeHtml(item.id)}">Delete</button>
    </td>
</tr>
`).join("");
}

function getAdminNewsFilteredItems() {
    const searchInput = document.getElementById("adminNewsSearch");
    const statusFilter = document.getElementById("adminNewsStatusFilter");
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const status = String(statusFilter?.value || "all").trim().toLowerCase();

    return adminEditorState.newsItems.filter((item) => {
        const itemStatus = String(item.status || "published").toLowerCase();
        const matchesStatus = status === "all" || itemStatus === status;

        if (!matchesStatus) {
            return false;
        }

        if (!query) {
            return true;
        }

        const haystack = [
            String(item.title || ""),
            String(item.category || ""),
            String(item.summary || "")
        ].join(" ").toLowerCase();

        return haystack.includes(query);
    });
}

function renderAdminNewsTableFromState() {
    const tableBody = document.getElementById("adminNewsTableBody");

    if (!tableBody) {
        return;
    }

    const filteredItems = getAdminNewsFilteredItems();
    tableBody.innerHTML = renderAdminNewsRows(filteredItems);
}

async function loadAdminNewsTable() {
    const tableBody = document.getElementById("adminNewsTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "<tr><td colspan=\"5\">Loading...</td></tr>";

    const result = await fetchNewsList({ status: "all", pageSize: 100 });
    adminEditorState.newsItems = result.data || [];
    renderAdminNewsTableFromState();
}

function normalizeLegacyVideoItem(item, index) {
    const id = item.id || `video_${index + 1}`;
    return {
        id,
        title: String(item.title || "Untitled video"),
        description: String(item.description || "No description"),
        category: String(item.category || "General"),
        status: String(item.status || "published"),
        sourceType: String(item.sourceType || "external"),
        videoUrl: String(item.videoUrl || item.link || ""),
        thumbnailUrl: String(item.thumbnailUrl || ""),
        publishedAt: item.publishedAt || null,
        createdAt: item.createdAt || null
    };
}

async function fetchVideosList(options = {}) {
    const {
        status = "published",
        page = 1,
        pageSize = 20,
        q = "",
        category = ""
    } = options;

    try {
        const params = new URLSearchParams({
            status,
            page: String(page),
            pageSize: String(pageSize),
            q: String(q || ""),
            category: String(category || "")
        });
        const response = await fetch(`${API_BASE_URL}/api/videos?${params.toString()}`);

        if (!response.ok) {
            throw new Error("Video API request failed");
        }

        const payload = await response.json();
        return {
            data: Array.isArray(payload.data) ? payload.data : [],
            source: "api"
        };
    } catch (error) {
        const videos = readStore("videos", []).map(normalizeLegacyVideoItem);
        const filtered = status === "all"
            ? videos
            : videos.filter((item) => item.status === status);

        return {
            data: filtered,
            source: "fallback"
        };
    }
}

async function createVideoItem(payload) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/videos`, {
        method: "POST",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to create video item");
    }

    return response.json();
}

async function updateVideoItem(videoId, payload) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/videos/${encodeURIComponent(videoId)}`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to update video item");
    }

    return response.json();
}

async function deleteVideoItem(videoId) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/videos/${encodeURIComponent(videoId)}`, {
        method: "DELETE",
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to delete video item");
    }

    return response.json();
}

async function uploadVideoFile(file) {
    ensureAdminCredentialAvailable();

    if (!file) {
        throw new Error("Choose a video file first.");
    }

    const formData = new FormData();
    formData.append("video", file);

    const response = await fetch(`${API_BASE_URL}/api/uploads/video`, {
        method: "POST",
        headers: buildAdminRequestHeaders(false),
        body: formData
    });

    if (!response.ok) {
        throw await parseApiError(response, "Video upload failed");
    }

    const payload = await response.json();
    return payload?.data || {};
}

async function fetchUsersList(options = {}) {
    ensureAdminCredentialAvailable();
    const params = new URLSearchParams({
        q: String(options.q || ""),
        role: String(options.role || ""),
        status: String(options.status || ""),
        page: String(options.page || 1),
        pageSize: String(options.pageSize || 100)
    });

    const response = await fetch(`${API_BASE_URL}/api/auth/users?${params.toString()}`, {
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to load users");
    }

    const payload = await response.json();
    return payload.data || [];
}

async function createUserAccount(payload) {
    ensureAdminCredentialAvailable();
    const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: "POST",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to create user");
    }

    return response.json();
}

async function updateUserAccount(userId, payload) {
    ensureAdminCredentialAvailable();
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to update user");
    }

    return response.json();
}

async function resetUserPassword(userId, password) {
    ensureAdminCredentialAvailable();
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${encodeURIComponent(userId)}/password`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify({ password })
    });

    if (!response.ok) {
        throw await parseApiError(response, "Failed to reset password");
    }

    return response.json();
}

function renderUsersRows(users) {
    if (!users.length) {
        return `
<tr>
    <td colspan="6">No users found.</td>
</tr>
`;
    }

    return users.map((user) => `
<tr>
    <td>${escapeHtml(user.name || "-")}</td>
    <td>${escapeHtml(user.email || "-")}</td>
    <td>${escapeHtml(user.role || "-")}</td>
    <td>${user.isActive ? "Active" : "Inactive"}</td>
    <td>${escapeHtml(user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never")}</td>
    <td>
        <div class="user-actions">
            <button type="button" data-user-action="toggle-status" data-user-id="${escapeHtml(user.id)}" data-user-active="${user.isActive ? "1" : "0"}">${user.isActive ? "Deactivate" : "Activate"}</button>
            <button type="button" data-user-action="promote-admin" data-user-id="${escapeHtml(user.id)}">Make Admin</button>
            <button type="button" data-user-action="set-editor" data-user-id="${escapeHtml(user.id)}">Set Editor</button>
            <button type="button" data-user-action="reset-password" data-user-id="${escapeHtml(user.id)}">Reset Password</button>
        </div>
    </td>
</tr>
`).join("");
}

async function publishVideo() {
    const title = String(document.getElementById("videoTitle")?.value || "").trim();
    const description = String(document.getElementById("videoDescription")?.value || "").trim();
    const category = String(document.getElementById("videoCategory")?.value || "General").trim();
    const status = String(document.getElementById("videoStatus")?.value || "published").trim();
    const videoUrl = String(document.getElementById("videoLink")?.value || "").trim();
    const thumbnailUrl = String(document.getElementById("videoThumbnailUrl")?.value || "").trim();
    const sourceType = videoUrl.includes('/uploads/') ? "upload" : "external";

    if (!title || !description || !videoUrl) {
        alert("Title, description, and video URL are required.");
        return;
    }

    const isEditing = Boolean(adminEditorState.videoId);

    try {
        const payload = {
            title,
            description,
            category: category || "General",
            status,
            sourceType,
            videoUrl,
            thumbnailUrl
        };

        if (isEditing) {
            await updateVideoItem(adminEditorState.videoId, payload);
        } else {
            await createVideoItem(payload);
        }

        alert(isEditing ? "Video updated successfully" : "Video published successfully");
        resetVideoEditor();

        await loadVideos();
        await renderHomeVideos();
    } catch (error) {
        alert(error.message || (isEditing ? "Unable to update video" : "Unable to publish video"));
    }
}

function resetVideoEditor() {
    adminEditorState.videoId = "";
    const titleInput = document.getElementById("videoTitle");
    const descriptionInput = document.getElementById("videoDescription");
    const categoryInput = document.getElementById("videoCategory");
    const statusInput = document.getElementById("videoStatus");
    const videoInput = document.getElementById("videoLink");
    const thumbnailInput = document.getElementById("videoThumbnailUrl");
    const publishButton = document.getElementById("publishVideoButton");
    const cancelButton = document.getElementById("cancelVideoEditButton");

    if (titleInput) titleInput.value = "";
    if (descriptionInput) descriptionInput.value = "";
    if (categoryInput) categoryInput.value = "General";
    if (statusInput) statusInput.value = "published";
    if (videoInput) videoInput.value = "";
    if (thumbnailInput) thumbnailInput.value = "";
    if (publishButton) publishButton.textContent = "Publish Video";
    if (cancelButton) cancelButton.style.display = "none";
}

function beginVideoEdit(videoId) {
    const item = adminEditorState.videoItems.find((entry) => entry.id === videoId);

    if (!item) {
        alert("Unable to load selected video item.");
        return;
    }

    adminEditorState.videoId = videoId;
    const titleInput = document.getElementById("videoTitle");
    const descriptionInput = document.getElementById("videoDescription");
    const categoryInput = document.getElementById("videoCategory");
    const statusInput = document.getElementById("videoStatus");
    const videoInput = document.getElementById("videoLink");
    const thumbnailInput = document.getElementById("videoThumbnailUrl");
    const publishButton = document.getElementById("publishVideoButton");
    const cancelButton = document.getElementById("cancelVideoEditButton");

    if (titleInput) titleInput.value = item.title || "";
    if (descriptionInput) descriptionInput.value = item.description || "";
    if (categoryInput) categoryInput.value = item.category || "General";
    if (statusInput) statusInput.value = item.status || "published";
    if (videoInput) videoInput.value = item.videoUrl || "";
    if (thumbnailInput) thumbnailInput.value = item.thumbnailUrl || "";
    if (publishButton) publishButton.textContent = "Update Video";
    if (cancelButton) cancelButton.style.display = "inline-block";
}

async function loadVideos() {
    const result = await fetchVideosList({ status: "all", pageSize: 100 });
    const videos = result.data || [];
    const table = document.getElementById("videoTable");

    updateDashboardStats();

    if (!table) {
        return;
    }

    adminEditorState.videoItems = videos;
    renderAdminVideosTableFromState();
}

function renderAdminVideoRows(items) {
    if (!items.length) {
        return `
<tr>
    <td colspan="5">No videos found.</td>
</tr>
`;
    }

    return items.map((video) => `
<tr>
    <td>${escapeHtml(video.title)}</td>
    <td>${escapeHtml(video.category || "General")}</td>
    <td>${escapeHtml(video.status || "published")}</td>
    <td>${escapeHtml(video.sourceType || "external")}</td>
    <td>
        <button type="button" data-video-edit-id="${escapeHtml(video.id)}">Edit</button>
        <button type="button" data-video-delete-id="${escapeHtml(video.id)}">Delete</button>
    </td>
</tr>
`).join("");
}

function getAdminVideosFilteredItems() {
    const searchInput = document.getElementById("adminVideoSearch");
    const statusFilter = document.getElementById("adminVideoStatusFilter");
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const status = String(statusFilter?.value || "all").trim().toLowerCase();

    return adminEditorState.videoItems.filter((video) => {
        const itemStatus = String(video.status || "published").toLowerCase();
        const matchesStatus = status === "all" || itemStatus === status;

        if (!matchesStatus) {
            return false;
        }

        if (!query) {
            return true;
        }

        const haystack = [
            String(video.title || ""),
            String(video.category || ""),
            String(video.sourceType || ""),
            String(video.description || "")
        ].join(" ").toLowerCase();

        return haystack.includes(query);
    });
}

function renderAdminVideosTableFromState() {
    const table = document.getElementById("videoTable");

    if (!table) {
        return;
    }

    const filteredVideos = getAdminVideosFilteredItems();
    table.innerHTML = renderAdminVideoRows(filteredVideos);
}

function saveLiveTV() {
    const url = document.getElementById("liveUrl").value;
    const status = document.getElementById("liveStatus").value;

    if (url === "") {
        alert("Please paste Live Stream URL");
        return;
    }

    writeStore("liveTV", { url, status });
    alert("Live TV Saved Successfully");
    window.location.href = "livetv.html";
}

function loadLiveTV() {
    const liveTV = readStore("liveTV", null);
    const table = document.getElementById("liveTable");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (liveTV) {
        table.innerHTML = `
        <tr>
            <td>${liveTV.url}</td>
            <td>${liveTV.status}</td>
        </tr>
        `;
    }
}

function loadHomeLiveTV() {
    const liveTV = readStore("liveTV", null);
    const iframe = document.getElementById("homeLiveTV");

    if (iframe && liveTV && liveTV.url) {
        iframe.src = liveTV.url;
    }
}

function buildEngagementFallbackKey(itemType, itemId) {
    return `engagement_${itemType}_${itemId}`;
}

function getFallbackEngagement(itemType, itemId) {
    return readStore(buildEngagementFallbackKey(itemType, itemId), {
        comments: [],
        ratings: []
    });
}

function saveFallbackEngagement(itemType, itemId, data) {
    writeStore(buildEngagementFallbackKey(itemType, itemId), data);
}

async function getEngagement(itemType, itemId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}`);

        if (!response.ok) {
            throw new Error("Failed request");
        }

        const payload = await response.json();
        return payload.data;
    } catch (error) {
        const fallback = getFallbackEngagement(itemType, itemId);
        const ratingsCount = fallback.ratings.length;
        const ratingsTotal = fallback.ratings.reduce((sum, value) => sum + value, 0);

        return {
            summary: {
                averageRating: ratingsCount ? Number((ratingsTotal / ratingsCount).toFixed(1)) : 0,
                ratingsCount,
                commentsCount: fallback.comments.length
            },
            comments: [...fallback.comments].reverse().slice(0, 20)
        };
    }
}

async function createComment(itemType, itemId, name, message) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, message })
        });

        if (!response.ok) {
            throw await parseApiError(response, "Comment submit failed");
        }

        return { source: "api" };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        const fallback = getFallbackEngagement(itemType, itemId);
        fallback.comments.push({
            id: Date.now().toString(),
            name: name || "Anonymous",
            message,
            createdAt: new Date().toISOString()
        });
        saveFallbackEngagement(itemType, itemId, fallback);
        return { source: "fallback" };
    }
}

async function createRating(itemType, itemId, rating) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}/ratings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ rating })
        });

        if (!response.ok) {
            throw await parseApiError(response, "Rating submit failed");
        }

        return { source: "api" };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        const fallback = getFallbackEngagement(itemType, itemId);
        fallback.ratings.push(rating);
        saveFallbackEngagement(itemType, itemId, fallback);
        return { source: "fallback" };
    }
}

function renderEngagementWidget(itemType, itemId) {
    return `
<div class="engagement-widget" data-item-type="${itemType}" data-item-id="${itemId}">
    <div class="engagement-summary">Loading ratings and comments...</div>
    <form class="engagement-form" data-item-type="${itemType}" data-item-id="${itemId}">
        <input type="text" name="name" placeholder="Your name (optional)">
        <textarea name="message" rows="3" placeholder="Write a comment"></textarea>
        <label>
            Rate this item
            <select name="rating">
                <option value="">No rating</option>
                <option value="1">1 star</option>
                <option value="2">2 stars</option>
                <option value="3">3 stars</option>
                <option value="4">4 stars</option>
                <option value="5">5 stars</option>
            </select>
        </label>
        <button type="submit">Send</button>
        <p class="engagement-feedback" aria-live="polite"></p>
    </form>
    <div class="engagement-comments"></div>
</div>
`;
}

async function renderHomeNews() {
    const container = document.getElementById("homeNews");
    const defaultCover = "assets/images/banner.png";

    if (!container) {
        return;
    }

    const result = await fetchNewsList({ status: "published", pageSize: 12 });
    const news = result.data || [];

    if (!news.length) {
        container.innerHTML = "<p>No news published yet.</p>";
        return;
    }

    container.innerHTML = news.map((item, index) => `
<article class="news-card">
    <img class="news-cover" loading="lazy" src="${escapeHtml(item.coverImageUrl || defaultCover)}" alt="${escapeHtml(item.title)}">
    <h3>${escapeHtml(item.title)}</h3>
    <p><strong>Date:</strong> ${escapeHtml(formatNewsDate(item.publishedAt || item.createdAt))}</p>
    <p>${escapeHtml(item.summary || item.content || "")}</p>
    ${renderEngagementWidget("news", item.id || `news_${index + 1}`)}
</article>
`).join("");
}

async function renderFeaturedNews() {
    const container = document.getElementById("featuredNews");
    const defaultCover = "assets/images/banner.png";

    if (!container) {
        return;
    }

    const result = await fetchNewsList({ status: "published", pageSize: 8 });
    const news = (result.data || []).slice(0, 4);

    if (!news.length) {
        container.innerHTML = "<p>No featured news available yet.</p>";
        return;
    }

    container.innerHTML = news.map((item, index) => `
<article class="featured-card">
    <span class="featured-badge">${index === 0 ? "TOP STORY" : "FEATURED"}</span>
    <img class="featured-cover" loading="lazy" src="${escapeHtml(item.coverImageUrl || defaultCover)}" alt="${escapeHtml(item.title)}">
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.summary || item.content || "")}</p>
</article>
`).join("");
}

let homeCarouselIndex = 0;
let homeCarouselItems = [];

function updateFeaturedCarouselPosition() {
    const track = document.getElementById("featuredCarouselTrack");
    if (!track || !homeCarouselItems.length) {
        return;
    }

    track.style.transform = `translateX(-${homeCarouselIndex * 100}%)`;
}

function initializeFeaturedCarouselControls() {
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (!homeCarouselItems.length) {
                return;
            }
            homeCarouselIndex = (homeCarouselIndex - 1 + homeCarouselItems.length) % homeCarouselItems.length;
            updateFeaturedCarouselPosition();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (!homeCarouselItems.length) {
                return;
            }
            homeCarouselIndex = (homeCarouselIndex + 1) % homeCarouselItems.length;
            updateFeaturedCarouselPosition();
        });
    }
}

async function renderFeaturedCarousel() {
    const track = document.getElementById("featuredCarouselTrack");

    if (!track) {
        return;
    }

    const result = await fetchNewsList({ status: "published", pageSize: 6 });
    homeCarouselItems = (result.data || []).slice(0, 4);

    if (!homeCarouselItems.length) {
        track.innerHTML = `
<article class="carousel-item">
    <h3>M62 WEB TV</h3>
    <p>Babu fitattun labarai yanzu. Da fatan a kara labarai daga admin.</p>
</article>`;
        homeCarouselIndex = 0;
        updateFeaturedCarouselPosition();
        return;
    }

    track.innerHTML = homeCarouselItems.map((item) => `
<article class="carousel-item">
    <h3>${escapeHtml(item.title || "Fitaccen Labari")}</h3>
    <p>${escapeHtml(item.summary || item.content || "")}</p>
</article>
`).join("");

    homeCarouselIndex = 0;
    updateFeaturedCarouselPosition();
}

function initializeHomeSearch() {
    const input = document.getElementById("homeSearchInput");
    const button = document.getElementById("homeSearchButton");

    if (!input || !button) {
        return;
    }

    const runSearch = () => {
        const query = String(input.value || "").trim().toLowerCase();
        const selectors = [
            ".news-card",
            ".featured-card",
            ".video-card",
            ".gallery-card"
        ];

        const cards = document.querySelectorAll(selectors.join(","));
        let firstMatch = null;

        cards.forEach((card) => {
            const text = String(card.textContent || "").toLowerCase();
            const matched = !query || text.includes(query);
            card.style.display = matched ? "" : "none";

            if (!firstMatch && matched) {
                firstMatch = card;
            }
        });

        if (query && firstMatch) {
            firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    button.addEventListener("click", runSearch);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            runSearch();
        }
    });
}

async function renderHomeVideos() {
    const container = document.getElementById("homeVideos");

    if (!container) {
        return;
    }

    const result = await fetchVideosList({ status: "published", pageSize: 12 });
    const videos = result.data || [];

    if (!videos.length) {
        container.innerHTML = "<p>No videos published yet.</p>";
        return;
    }

    container.innerHTML = videos.map((video, index) => `
<article class="video-card">
    ${video.thumbnailUrl ? `<img class="news-cover" loading="lazy" src="${escapeHtml(video.thumbnailUrl)}" alt="${escapeHtml(video.title)}">` : ""}
    <h3>${escapeHtml(video.title)}</h3>
    <p>${escapeHtml(video.description || "")}</p>
    ${video.videoUrl && video.videoUrl.includes('/uploads/')
        ? `<video controls style="width:100%;max-height:240px;" src="${escapeHtml(video.videoUrl)}"></video>`
        : `<p><a href="${escapeHtml(video.videoUrl)}" target="_blank" rel="noopener noreferrer">Watch video</a></p>`}
    ${renderEngagementWidget("video", video.id || `video_${index + 1}`)}
</article>
`).join("");
}

async function renderHomeGallery() {
    const container = document.getElementById("homeGallery");

    if (!container) {
        return;
    }

    const [newsResult, videoResult] = await Promise.all([
        fetchNewsList({ status: "published", pageSize: 10 }),
        fetchVideosList({ status: "published", pageSize: 10 })
    ]);

    const newsImages = (newsResult.data || [])
        .filter((item) => String(item.coverImageUrl || "").trim())
        .map((item) => ({
            url: item.coverImageUrl,
            caption: item.title || "News image"
        }));

    const videoImages = (videoResult.data || [])
        .filter((item) => String(item.thumbnailUrl || "").trim())
        .map((item) => ({
            url: item.thumbnailUrl,
            caption: item.title || "Video thumbnail"
        }));

    const items = [...newsImages, ...videoImages].slice(0, 12);

    if (!items.length) {
        container.innerHTML = "<p>No gallery images available yet. Add cover images/thumbnails from admin pages.</p>";
        return;
    }

    container.innerHTML = items.map((item) => `
<article class="gallery-card">
    <img class="gallery-photo" loading="lazy" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.caption)}">
    <p>${escapeHtml(item.caption)}</p>
</article>
`).join("");
}

function formatComments(comments) {
    if (!comments.length) {
        return "<p class=\"engagement-empty\">No comments yet.</p>";
    }

    return comments.map((comment) => `
<div class="comment-item">
    <p class="comment-meta">${escapeHtml(comment.name || "Anonymous")} - ${new Date(comment.createdAt).toLocaleString()}</p>
    <p>${escapeHtml(comment.message)}</p>
</div>
`).join("");
}

function getAdminApiKey() {
    return localStorage.getItem("adminApiKey") || "";
}

function setAdminApiKey(value) {
    localStorage.setItem("adminApiKey", value);
}

function getAdminAuthToken() {
    return localStorage.getItem("adminAuthToken") || "";
}

function setAdminAuthToken(value) {
    localStorage.setItem("adminAuthToken", value);
}

function clearAdminAuthSession() {
    localStorage.removeItem("adminAuthToken");
    localStorage.removeItem("adminAuthUser");
}

function getAdminAuthUser() {
    const raw = localStorage.getItem("adminAuthUser");

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function setAdminAuthUser(user) {
    localStorage.setItem("adminAuthUser", JSON.stringify(user || null));
}

function buildAdminRequestHeaders(includeJsonContentType) {
    const headers = {};
    const token = getAdminAuthToken();
    const adminKey = getAdminApiKey();

    if (includeJsonContentType) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (adminKey) {
        headers["x-admin-key"] = adminKey;
    }

    return headers;
}

function ensureAdminCredentialAvailable() {
    const token = getAdminAuthToken();
    const adminKey = getAdminApiKey();

    if (!token && !adminKey) {
        throw new Error("Login required. Use Admin Login page or set legacy API key.");
    }
}

function enforceAdminAccessOnLoad(options = {}) {
    const { allowLegacyKey = false } = options;

    if (!isAdminPage()) {
        return true;
    }

    const path = String(window.location.pathname || "").toLowerCase();
    if (path.endsWith("login.html")) {
        return true;
    }

    const hasToken = Boolean(getAdminAuthToken());
    const hasLegacyKey = allowLegacyKey && Boolean(getAdminApiKey());

    if (!hasToken && !hasLegacyKey) {
        redirectToAdminLogin("Please sign in to access the admin area.");
        return false;
    }

    synchronizeAdminSession().then((user) => {
        if (!user && !hasLegacyKey) {
            clearAdminAuthSession();
            redirectToAdminLogin("Your admin session expired. Please sign in again.");
        }
    });

    return true;
}

function renderAdminAuthStatus() {
    const statusNode = document.getElementById("adminAuthStatus");

    if (!statusNode) {
        return;
    }

    const user = getAdminAuthUser();
    const token = getAdminAuthToken();
    const key = getAdminApiKey();

    if (token && user && user.email) {
        statusNode.innerHTML = `Auth: <strong>${escapeHtml(user.email)}</strong> (${escapeHtml(user.role || "user")})`;
        return;
    }

    if (key) {
        statusNode.innerHTML = "Auth: <strong>Legacy API key mode</strong>";
        return;
    }

    statusNode.innerHTML = "Auth: <strong>Not logged in</strong>";
}

async function loginAdmin(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.success) {
        throw new Error(payload.message || "Login failed");
    }

    return payload.data || {};
}

async function synchronizeAdminSession() {
    const token = getAdminAuthToken();

    if (!token) {
        clearAdminAuthSession();
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: buildAdminRequestHeaders(false)
        });

        if (!response.ok) {
            clearAdminAuthSession();
            return null;
        }

        const payload = await response.json();
        const user = payload.data || null;
        setAdminAuthUser(user);
        return user;
    } catch (error) {
        return getAdminAuthUser();
    }
}

async function fetchModerationComments(status, queryText, page, pageSize) {
    ensureAdminCredentialAvailable();

    const params = new URLSearchParams({
        status,
        q: queryText,
        page: String(page),
        pageSize: String(pageSize)
    });

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments?${params.toString()}`, {
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to load moderation comments");
    }

    const payload = await response.json();
    return {
        data: payload.data || [],
        meta: payload.meta || { page: 1, pageSize, totalItems: 0, totalPages: 1, hasPrev: false, hasNext: false }
    };
}

function buildModerationCommentKey(itemType, itemId, commentId) {
    return `${itemType}::${itemId}::${commentId}`;
}

function parseModerationCommentKey(key) {
    const [itemType, itemId, commentId] = String(key).split("::");
    return { itemType, itemId, commentId };
}

function getSelectedModerationItems() {
    return Array.from(moderationState.selected).map(parseModerationCommentKey);
}

function updateSelectionUiState(commentsInView) {
    const selectedCountNode = document.getElementById("selectedCommentsCount");
    const selectAll = document.getElementById("selectAllComments");
    const bulkApplyButton = document.getElementById("applyBulkAction");

    if (selectedCountNode) {
        selectedCountNode.textContent = `${moderationState.selected.size} selected`;
    }

    if (bulkApplyButton) {
        bulkApplyButton.disabled = moderationState.selected.size === 0;
    }

    if (selectAll) {
        if (!commentsInView.length) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
            return;
        }

        const keys = commentsInView.map((comment) => buildModerationCommentKey(comment.itemType, comment.itemId, comment.id));
        const selectedInView = keys.filter((key) => moderationState.selected.has(key)).length;
        selectAll.checked = selectedInView === keys.length;
        selectAll.indeterminate = selectedInView > 0 && selectedInView < keys.length;
    }
}

async function exportModerationCommentsCsv() {
    ensureAdminCredentialAvailable();

    const params = new URLSearchParams({
        status: moderationState.status,
        q: moderationState.query
    });

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments/export.csv?${params.toString()}`, {
        headers: buildAdminRequestHeaders(false)
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to export CSV");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const fileName = `comments_export_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

async function bulkModerateComments(action, items) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments/bulk`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify({ action, items })
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Bulk action failed");
    }

    return response.json();
}

async function moderateComment(itemType, itemId, commentId, action) {
    ensureAdminCredentialAvailable();

    const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}/comments/${commentId}`, {
        method: "PATCH",
        headers: buildAdminRequestHeaders(true),
        body: JSON.stringify({ action })
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Moderation action failed");
    }
}

function renderModerationRows(comments) {
    if (!comments.length) {
        return `
<tr>
    <td colspan="9">No comments found for selected filter.</td>
</tr>
`;
    }

    return comments.map((comment) => `
<tr>
    <td><input type="checkbox" class="moderation-row-select" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}" ${moderationState.selected.has(buildModerationCommentKey(comment.itemType, comment.itemId, comment.id)) ? "checked" : ""}></td>
    <td>${escapeHtml(comment.itemType)}</td>
    <td>${escapeHtml(comment.itemId)}</td>
    <td>${escapeHtml(comment.name)}</td>
    <td>${escapeHtml(comment.message)}</td>
    <td>${new Date(comment.createdAt).toLocaleString()}</td>
    <td>${comment.archived ? "Archived" : (comment.hidden ? "Hidden" : "Visible")}</td>
    <td>
        <button type="button" data-action="hide" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Hide</button>
        <button type="button" data-action="unhide" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Unhide</button>
        <button type="button" data-action="archive" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Archive</button>
        <button type="button" data-action="unarchive" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Unarchive</button>
        <button type="button" data-action="delete" data-item-type="${escapeHtml(comment.itemType)}" data-item-id="${escapeHtml(comment.itemId)}" data-comment-id="${escapeHtml(comment.id)}">Delete</button>
    </td>
</tr>
`).join("");
}

async function loadModerationComments() {
    const tableBody = document.getElementById("commentsModerationTable");
    const filter = document.getElementById("commentStatusFilter");
    const pageInfo = document.getElementById("moderationPageInfo");
    const prevButton = document.getElementById("moderationPrev");
    const nextButton = document.getElementById("moderationNext");

    moderationState.status = filter ? filter.value : moderationState.status;

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
<tr>
    <td colspan="9">Loading comments...</td>
</tr>
`;

    try {
        const result = await fetchModerationComments(
            moderationState.status,
            moderationState.query,
            moderationState.page,
            moderationState.pageSize
        );

        moderationState.page = result.meta.page;
        moderationState.totalPages = result.meta.totalPages;
        moderationState.selected.clear();
        tableBody.innerHTML = renderModerationRows(result.data);
        updateSelectionUiState(result.data);

        if (pageInfo) {
            pageInfo.textContent = `Page ${result.meta.page} of ${result.meta.totalPages} (${result.meta.totalItems} comments)`;
        }

        if (prevButton) {
            prevButton.disabled = !result.meta.hasPrev;
        }

        if (nextButton) {
            nextButton.disabled = !result.meta.hasNext;
        }
    } catch (error) {
        tableBody.innerHTML = `
<tr>
    <td colspan="9">${escapeHtml(error.message)}</td>
</tr>
`;
        moderationState.selected.clear();
        updateSelectionUiState([]);

        if (pageInfo) {
            pageInfo.textContent = "Unable to load comments";
        }

        if (prevButton) {
            prevButton.disabled = true;
        }

        if (nextButton) {
            nextButton.disabled = true;
        }
    }
}

function bindModerationActions() {
    const moderationTable = document.getElementById("commentsModerationTable");

    if (!moderationTable) {
        return;
    }

    moderationTable.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const action = button.getAttribute("data-action");
        const itemType = button.getAttribute("data-item-type");
        const itemId = button.getAttribute("data-item-id");
        const commentId = button.getAttribute("data-comment-id");

        try {
            await moderateComment(itemType, itemId, commentId, action);
            await loadModerationComments();
        } catch (error) {
            alert(error.message);
        }
    });

    moderationTable.addEventListener("change", (event) => {
        const checkbox = event.target.closest(".moderation-row-select");

        if (!checkbox) {
            return;
        }

        const key = buildModerationCommentKey(
            checkbox.getAttribute("data-item-type"),
            checkbox.getAttribute("data-item-id"),
            checkbox.getAttribute("data-comment-id")
        );

        if (checkbox.checked) {
            moderationState.selected.add(key);
        } else {
            moderationState.selected.delete(key);
        }

        const rowsInView = Array.from(document.querySelectorAll(".moderation-row-select")).map((input) => ({
            itemType: input.getAttribute("data-item-type"),
            itemId: input.getAttribute("data-item-id"),
            id: input.getAttribute("data-comment-id")
        }));

        updateSelectionUiState(rowsInView);
    });
}

function initializeModerationPage() {
    const apiKeyInput = document.getElementById("adminApiKey");
    const saveApiKeyButton = document.getElementById("saveAdminApiKey");
    const logoutButton = document.getElementById("logoutAdminSession");
    const refreshButton = document.getElementById("refreshComments");
    const clearFiltersButton = document.getElementById("clearCommentsFilters");
    const statusFilter = document.getElementById("commentStatusFilter");
    const searchInput = document.getElementById("commentSearch");
    const searchButton = document.getElementById("searchComments");
    const pageSizeSelect = document.getElementById("commentPageSize");
    const prevButton = document.getElementById("moderationPrev");
    const nextButton = document.getElementById("moderationNext");
    const exportButton = document.getElementById("exportCommentsCsv");
    const selectAllCheckbox = document.getElementById("selectAllComments");
    const bulkActionSelect = document.getElementById("bulkAction");
    const bulkApplyButton = document.getElementById("applyBulkAction");

    if (!apiKeyInput || !saveApiKeyButton || !refreshButton || !statusFilter) {
        return;
    }

    apiKeyInput.value = getAdminApiKey();
    synchronizeAdminSession().finally(() => {
        renderAdminAuthStatus();
    });

    saveApiKeyButton.addEventListener("click", () => {
        setAdminApiKey(apiKeyInput.value.trim());
        renderAdminAuthStatus();
        moderationState.page = 1;
        loadModerationComments();
    });

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            clearAdminAuthSession();
            renderAdminAuthStatus();
            redirectToAdminLogin("You have been logged out.");
        });
    }

    refreshButton.addEventListener("click", loadModerationComments);

    const applyModerationSearch = () => {
        moderationState.query = searchInput ? searchInput.value.trim() : "";
        moderationState.page = 1;
        loadModerationComments();
    };

    const debouncedModerationSearch = createDebouncedFunction(applyModerationSearch, 300);

    statusFilter.addEventListener("change", () => {
        moderationState.page = 1;
        loadModerationComments();
    });

    if (searchInput && searchButton) {
        searchButton.addEventListener("click", () => {
            applyModerationSearch();
        });

        searchInput.addEventListener("input", () => {
            debouncedModerationSearch();
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                applyModerationSearch();
            }
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            moderationState.query = "";
            moderationState.status = "all";
            moderationState.page = 1;
            moderationState.pageSize = 25;

            if (searchInput) {
                searchInput.value = "";
            }

            if (statusFilter) {
                statusFilter.value = "all";
            }

            if (pageSizeSelect) {
                pageSizeSelect.value = "25";
            }

            loadModerationComments();
        });
    }

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener("change", () => {
            moderationState.pageSize = Number(pageSizeSelect.value || 25);
            moderationState.page = 1;
            loadModerationComments();
        });
    }

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            moderationState.page = Math.max(moderationState.page - 1, 1);
            loadModerationComments();
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            moderationState.page = Math.min(moderationState.page + 1, moderationState.totalPages);
            loadModerationComments();
        });
    }

    if (exportButton) {
        exportButton.addEventListener("click", async () => {
            try {
                await exportModerationCommentsCsv();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", () => {
            const rowCheckboxes = Array.from(document.querySelectorAll(".moderation-row-select"));

            rowCheckboxes.forEach((checkbox) => {
                const key = buildModerationCommentKey(
                    checkbox.getAttribute("data-item-type"),
                    checkbox.getAttribute("data-item-id"),
                    checkbox.getAttribute("data-comment-id")
                );

                checkbox.checked = selectAllCheckbox.checked;

                if (selectAllCheckbox.checked) {
                    moderationState.selected.add(key);
                } else {
                    moderationState.selected.delete(key);
                }
            });

            const rowsInView = rowCheckboxes.map((input) => ({
                itemType: input.getAttribute("data-item-type"),
                itemId: input.getAttribute("data-item-id"),
                id: input.getAttribute("data-comment-id")
            }));

            updateSelectionUiState(rowsInView);
        });
    }

    if (bulkApplyButton && bulkActionSelect) {
        bulkApplyButton.addEventListener("click", async () => {
            const action = bulkActionSelect.value;
            const items = getSelectedModerationItems();

            if (!action) {
                alert("Choose a bulk action first.");
                return;
            }

            if (!items.length) {
                alert("Select at least one comment.");
                return;
            }

            try {
                const result = await bulkModerateComments(action, items);
                alert(`Bulk action complete. Updated: ${result.data?.updated ?? 0}`);
                moderationState.selected.clear();
                await loadModerationComments();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    bindModerationActions();
    updateSelectionUiState([]);
    loadModerationComments();
}

function initializeAdminLoginPage() {
    const form = document.getElementById("adminLoginForm");
    const emailInput = document.getElementById("adminLoginEmail");
    const passwordInput = document.getElementById("adminLoginPassword");
    const submitButton = document.getElementById("adminLoginSubmit");
    const statusNode = document.getElementById("adminLoginStatus");

    if (!form || !emailInput || !passwordInput || !submitButton || !statusNode) {
        return;
    }

    const loginMessage = sessionStorage.getItem("m62AdminLoginMessage");
    if (loginMessage) {
        statusNode.textContent = loginMessage;
        statusNode.className = "status error";
        sessionStorage.removeItem("m62AdminLoginMessage");
    }

    synchronizeAdminSession().then((existingUser) => {
        if (existingUser && existingUser.email) {
            statusNode.textContent = `Already logged in as ${existingUser.email}`;
            statusNode.className = "status success";
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = String(emailInput.value || "").trim().toLowerCase();
        const password = String(passwordInput.value || "");

        if (!email || !password) {
            statusNode.textContent = "Email and password are required.";
            statusNode.className = "status error";
            return;
        }

        submitButton.disabled = true;
        statusNode.textContent = "Signing in...";
        statusNode.className = "status";

        try {
            const data = await loginAdmin(email, password);
            setAdminAuthToken(String(data.token || ""));
            setAdminAuthUser(data.user || null);
            statusNode.textContent = "Login successful. You can now open moderation.";
            statusNode.className = "status success";
            passwordInput.value = "";
        } catch (error) {
            statusNode.textContent = error.message || "Login failed.";
            statusNode.className = "status error";
        } finally {
            submitButton.disabled = false;
        }
    });
}

function initializeNewsManagementPage() {
    const refreshButton = document.getElementById("refreshNewsList");
    const newsTableBody = document.getElementById("adminNewsTableBody");
    const searchInput = document.getElementById("adminNewsSearch");
    const statusFilter = document.getElementById("adminNewsStatusFilter");
    const uploadButton = document.getElementById("uploadNewsImage");
    const fileInput = document.getElementById("newsImageFile");
    const imageUrlInput = document.getElementById("newsCoverImage");
    const uploadStatus = document.getElementById("newsImageUploadStatus");

    if (!newsTableBody) {
        return;
    }

    if (!enforceAdminAccessOnLoad()) {
        return;
    }

    const cancelEditButton = document.getElementById("cancelNewsEditButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            loadAdminNewsTable();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderAdminNewsTableFromState();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            renderAdminNewsTableFromState();
        });
    }

    if (uploadButton && fileInput && imageUrlInput && uploadStatus) {
        uploadButton.addEventListener("click", async () => {
            const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

            if (!file) {
                uploadStatus.textContent = "Choose an image before uploading.";
                return;
            }

            uploadButton.disabled = true;
            uploadStatus.textContent = "Uploading image...";

            try {
                const uploaded = await uploadNewsImageFile(file);
                imageUrlInput.value = String(uploaded.url || "");
                uploadStatus.textContent = "Upload successful. Cover image URL has been filled.";
            } catch (error) {
                uploadStatus.textContent = error.message || "Image upload failed.";
            } finally {
                uploadButton.disabled = false;
            }
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", () => {
            resetNewsEditor();
        });
    }

    newsTableBody.addEventListener("click", async (event) => {
        const editButton = event.target.closest("button[data-news-edit-id]");

        if (editButton) {
            beginNewsEdit(editButton.getAttribute("data-news-edit-id"));
            return;
        }

        const button = event.target.closest("button[data-news-delete-id]");

        if (!button) {
            return;
        }

        const newsId = button.getAttribute("data-news-delete-id");

        if (!newsId) {
            return;
        }

        const confirmed = window.confirm("Delete this news item?");
        if (!confirmed) {
            return;
        }

        try {
            await deleteNewsItem(newsId);
            await loadAdminNewsTable();
            await loadNews();
            alert("News item deleted.");
        } catch (error) {
            alert(error.message || "Delete failed");
        }
    });

    loadAdminNewsTable();
}

function initializeVideosManagementPage() {
    const refreshButton = document.getElementById("refreshVideosList");
    const tableBody = document.getElementById("videoTable");
    const searchInput = document.getElementById("adminVideoSearch");
    const statusFilter = document.getElementById("adminVideoStatusFilter");
    const uploadVideoButton = document.getElementById("uploadVideoFile");
    const videoFileInput = document.getElementById("videoFile");
    const videoUrlInput = document.getElementById("videoLink");
    const videoUploadStatus = document.getElementById("videoUploadStatus");
    const uploadThumbnailButton = document.getElementById("uploadVideoThumbnail");
    const thumbnailFileInput = document.getElementById("videoThumbnailFile");
    const thumbnailUrlInput = document.getElementById("videoThumbnailUrl");
    const thumbnailUploadStatus = document.getElementById("videoThumbnailUploadStatus");

    if (!tableBody) {
        return;
    }

    if (!enforceAdminAccessOnLoad()) {
        return;
    }

    const cancelEditButton = document.getElementById("cancelVideoEditButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            loadVideos();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderAdminVideosTableFromState();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            renderAdminVideosTableFromState();
        });
    }

    if (uploadVideoButton && videoFileInput && videoUrlInput && videoUploadStatus) {
        uploadVideoButton.addEventListener("click", async () => {
            const file = videoFileInput.files && videoFileInput.files[0] ? videoFileInput.files[0] : null;

            if (!file) {
                videoUploadStatus.textContent = "Choose a video file first.";
                return;
            }

            uploadVideoButton.disabled = true;
            videoUploadStatus.textContent = "Uploading video...";

            try {
                const uploaded = await uploadVideoFile(file);
                videoUrlInput.value = String(uploaded.url || "");
                videoUploadStatus.textContent = "Video uploaded successfully.";
            } catch (error) {
                videoUploadStatus.textContent = error.message || "Video upload failed.";
            } finally {
                uploadVideoButton.disabled = false;
            }
        });
    }

    if (uploadThumbnailButton && thumbnailFileInput && thumbnailUrlInput && thumbnailUploadStatus) {
        uploadThumbnailButton.addEventListener("click", async () => {
            const file = thumbnailFileInput.files && thumbnailFileInput.files[0] ? thumbnailFileInput.files[0] : null;

            if (!file) {
                thumbnailUploadStatus.textContent = "Choose a thumbnail image first.";
                return;
            }

            uploadThumbnailButton.disabled = true;
            thumbnailUploadStatus.textContent = "Uploading thumbnail...";

            try {
                const uploaded = await uploadNewsImageFile(file);
                thumbnailUrlInput.value = String(uploaded.url || "");
                thumbnailUploadStatus.textContent = "Thumbnail uploaded successfully.";
            } catch (error) {
                thumbnailUploadStatus.textContent = error.message || "Thumbnail upload failed.";
            } finally {
                uploadThumbnailButton.disabled = false;
            }
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", () => {
            resetVideoEditor();
        });
    }

    tableBody.addEventListener("click", async (event) => {
        const editButton = event.target.closest("button[data-video-edit-id]");

        if (editButton) {
            beginVideoEdit(editButton.getAttribute("data-video-edit-id"));
            return;
        }

        const button = event.target.closest("button[data-video-delete-id]");

        if (!button) {
            return;
        }

        const videoId = button.getAttribute("data-video-delete-id");
        if (!videoId) {
            return;
        }

        const confirmed = window.confirm("Delete this video item?");
        if (!confirmed) {
            return;
        }

        try {
            await deleteVideoItem(videoId);
            await loadVideos();
            await renderHomeVideos();
            alert("Video item deleted.");
        } catch (error) {
            alert(error.message || "Delete failed");
        }
    });

    loadVideos();
}

function initializeUsersManagementPage() {
    const tableBody = document.getElementById("usersTableBody");
    const refreshButton = document.getElementById("refreshUsersBtn");
    const clearFiltersButton = document.getElementById("clearUsersFiltersBtn");
    const searchInput = document.getElementById("usersSearch");
    const roleFilter = document.getElementById("usersRoleFilter");
    const statusFilter = document.getElementById("usersStatusFilter");
    const createButton = document.getElementById("createUserBtn");
    const newUserName = document.getElementById("newUserName");
    const newUserEmail = document.getElementById("newUserEmail");
    const newUserRole = document.getElementById("newUserRole");
    const newUserPassword = document.getElementById("newUserPassword");

    if (!tableBody) {
        return;
    }

    if (!enforceAdminAccessOnLoad()) {
        return;
    }

    const loadUsersTable = async () => {
        tableBody.innerHTML = "<tr><td colspan=\"6\">Loading users...</td></tr>";

        try {
            const users = await fetchUsersList({
                q: searchInput ? searchInput.value.trim() : "",
                role: roleFilter ? roleFilter.value : "",
                status: statusFilter ? statusFilter.value : "",
                pageSize: 100
            });
            tableBody.innerHTML = renderUsersRows(users);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan=\"6\">${escapeHtml(error.message || "Failed to load users")}</td></tr>`;
        }
    };

    const debouncedLoadUsersTable = createDebouncedFunction(() => {
        loadUsersTable();
    }, 300);

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            loadUsersTable();
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            debouncedLoadUsersTable();
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                loadUsersTable();
            }
        });
    }

    if (roleFilter) {
        roleFilter.addEventListener("change", () => {
            loadUsersTable();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            loadUsersTable();
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
            }

            if (roleFilter) {
                roleFilter.value = "";
            }

            if (statusFilter) {
                statusFilter.value = "";
            }

            loadUsersTable();
        });
    }

    if (createButton && newUserName && newUserEmail && newUserRole && newUserPassword) {
        createButton.addEventListener("click", async () => {
            const payload = {
                name: String(newUserName.value || "").trim(),
                email: String(newUserEmail.value || "").trim().toLowerCase(),
                role: String(newUserRole.value || "editor").trim(),
                password: String(newUserPassword.value || "")
            };

            if (!payload.name || !payload.email || !payload.password) {
                alert("Name, email, and password are required.");
                return;
            }

            try {
                await createUserAccount(payload);
                alert("User created successfully.");
                newUserName.value = "";
                newUserEmail.value = "";
                newUserPassword.value = "";
                await loadUsersTable();
            } catch (error) {
                alert(error.message || "Failed to create user");
            }
        });
    }

    tableBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-user-action]");

        if (!button) {
            return;
        }

        const action = button.getAttribute("data-user-action");
        const userId = button.getAttribute("data-user-id");

        if (!action || !userId) {
            return;
        }

        try {
            if (action === "toggle-status") {
                const active = button.getAttribute("data-user-active") === "1";
                await updateUserAccount(userId, { isActive: !active });
                await loadUsersTable();
                return;
            }

            if (action === "promote-admin") {
                await updateUserAccount(userId, { role: "admin" });
                await loadUsersTable();
                return;
            }

            if (action === "set-editor") {
                await updateUserAccount(userId, { role: "editor" });
                await loadUsersTable();
                return;
            }

            if (action === "reset-password") {
                const newPassword = window.prompt("Enter new password (min 8 chars):", "");
                if (!newPassword) {
                    return;
                }
                await resetUserPassword(userId, newPassword);
                alert("Password reset successful.");
            }
        } catch (error) {
            alert(error.message || "User action failed");
        }
    });

    loadUsersTable();
}

async function refreshEngagementWidgets() {
    const widgets = document.querySelectorAll(".engagement-widget");

    for (const widget of widgets) {
        const itemType = widget.getAttribute("data-item-type");
        const itemId = widget.getAttribute("data-item-id");
        const summaryNode = widget.querySelector(".engagement-summary");
        const commentsNode = widget.querySelector(".engagement-comments");

        const data = await getEngagement(itemType, itemId);
        summaryNode.innerText = `Average rating: ${data.summary.averageRating}/5 (${data.summary.ratingsCount} ratings) • ${data.summary.commentsCount} comments`;
        commentsNode.innerHTML = formatComments(data.comments.slice(0, 5));
    }
}

function bindEngagementForms() {
    document.addEventListener("submit", async (event) => {
        const form = event.target.closest(".engagement-form");

        if (!form) {
            return;
        }

        event.preventDefault();

        const itemType = form.getAttribute("data-item-type");
        const itemId = form.getAttribute("data-item-id");
        const formData = new FormData(form);
        const name = String(formData.get("name") || "").trim();
        const message = String(formData.get("message") || "").trim();
        const ratingRaw = String(formData.get("rating") || "").trim();
        const submitButton = form.querySelector("button[type='submit']");

        if (submitButton) {
            submitButton.disabled = true;
        }

        setEngagementFeedback(form, "", "");

        if (!message && !ratingRaw) {
            alert("Add a comment or choose a rating before sending.");
            if (submitButton) {
                submitButton.disabled = false;
            }
            return;
        }

        let usedFallback = false;

        try {
            if (message) {
                const result = await createComment(itemType, itemId, name, message);
                usedFallback = usedFallback || result.source === "fallback";
            }

            if (ratingRaw) {
                const result = await createRating(itemType, itemId, Number(ratingRaw));
                usedFallback = usedFallback || result.source === "fallback";
            }
        } catch (error) {
            if (error instanceof ApiError && error.status === 429 && error.retryAfterSeconds > 0) {
                setEngagementFeedback(form, `Too many requests. Please wait ${error.retryAfterSeconds} seconds.`, "warning");
            } else {
                setEngagementFeedback(form, error.message || "Unable to send your feedback right now.", "error");
            }

            if (submitButton) {
                submitButton.disabled = false;
            }
            return;
        }

        form.reset();
        await refreshEngagementWidgets();

        if (usedFallback) {
            setEngagementFeedback(form, "Saved locally because backend is offline. Start backend to sync live data.", "warning");
        } else {
            setEngagementFeedback(form, "Thanks. Your feedback was submitted.", "success");
        }

        if (submitButton) {
            submitButton.disabled = false;
        }
    });
}

async function initializeHomePage() {
    ensureContentIds();
    await Promise.all([
        renderFeaturedCarousel(),
        renderHomeNews(),
        renderFeaturedNews(),
        renderHomeVideos(),
        renderHomeGallery()
    ]);
    initializeFeaturedCarouselControls();
    initializeHomeSearch();
    await refreshEngagementWidgets();
}

function initializePublicContactForms() {
    const contactForm = document.getElementById("contactForm");
    const contactFeedback = document.getElementById("contactFormFeedback");
    const contactSubmitBtn = document.getElementById("contactSubmitBtn");

    if (contactForm) {
        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = String(document.getElementById("contactName")?.value || "").trim();
            const email = String(document.getElementById("contactEmail")?.value || "").trim();
            const subject = String(document.getElementById("contactSubject")?.value || "").trim();
            const message = String(document.getElementById("contactMessage")?.value || "").trim();

            if (!name || !email || !subject || !message) {
                if (contactFeedback) {
                    contactFeedback.textContent = "Da fatan a cika dukkan filaye.";
                    contactFeedback.className = "form-feedback error";
                }
                return;
            }

            if (contactSubmitBtn) {
                contactSubmitBtn.disabled = true;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/contact`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(payload.message || "Akwai matsala wajen tura sako.");
                }

                contactForm.reset();

                if (contactFeedback) {
                    contactFeedback.textContent = payload.message || "An aika sakonka cikin nasara.";
                    contactFeedback.className = "form-feedback";
                }
            } catch (error) {
                if (contactFeedback) {
                    contactFeedback.textContent = error.message || "An kasa aika sako yanzu.";
                    contactFeedback.className = "form-feedback error";
                }
            } finally {
                if (contactSubmitBtn) {
                    contactSubmitBtn.disabled = false;
                }
            }
        });
    }

    const newsletterForm = document.getElementById("newsletterForm");
    const newsletterInput = document.getElementById("newsletterEmail");
    const newsletterFeedback = document.getElementById("newsletterFeedback");

    if (newsletterForm && newsletterInput) {
        newsletterForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = String(newsletterInput.value || "").trim().toLowerCase();

            if (!email || !email.includes("@")) {
                if (newsletterFeedback) {
                    newsletterFeedback.textContent = "Shigar da ingantaccen imel.";
                    newsletterFeedback.className = "form-feedback error";
                }
                return;
            }

            const subscribers = readStore("newsletterSubscribers", []);
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                writeStore("newsletterSubscribers", subscribers);
            }

            newsletterForm.reset();
            if (newsletterFeedback) {
                newsletterFeedback.textContent = "Nagode. An yi rijista cikin nasara.";
                newsletterFeedback.className = "form-feedback";
            }
        });
    }
}

function initializeAdminRouteProtection() {
    enforceAdminAccessOnLoad({
        allowLegacyKey: String(window.location.pathname || "").toLowerCase().endsWith("comments.html")
    });
}

window.addEventListener("load", initializeAdminRouteProtection);
window.addEventListener("load", loadNews);
window.addEventListener("load", loadVideos);
window.addEventListener("load", loadLiveTV);
window.addEventListener("load", loadHomeLiveTV);
window.addEventListener("load", incrementVisitorCounterIfPublicPage);
window.addEventListener("load", updateDashboardStats);
window.addEventListener("load", initializeHomePage);
window.addEventListener("load", initializePublicContactForms);
window.addEventListener("load", initializeModerationPage);
window.addEventListener("load", initializeAdminLoginPage);
window.addEventListener("load", initializeNewsManagementPage);
window.addEventListener("load", initializeVideosManagementPage);
window.addEventListener("load", initializeUsersManagementPage);

bindEngagementForms();