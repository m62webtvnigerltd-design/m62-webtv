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
    return new ApiError(message, response.status, retryAfterSeconds);
}

function publishNews() {
    const title = document.getElementById("newsTitle").value;
    const date = document.getElementById("newsDate").value;
    const content = document.getElementById("newsContent").value;

    if (title === "" || date === "" || content === "") {
        alert("Please fill all fields");
        return;
    }

    const news = readStore("news", []);

    news.push({
        id: makeClientId("news"),
        title,
        date,
        content
    });

    writeStore("news", news);
    alert("News Published Successfully");
    window.location.href = "dashboard.html";
}

function loadNews() {
    const news = readStore("news", []);
    const totalNews = document.getElementById("totalNews");
    const table = document.getElementById("latestNews");

    if (totalNews) {
        totalNews.innerText = news.length;
    }

    if (!table) {
        return;
    }

    table.innerHTML = "";

    news.forEach((item) => {
        table.innerHTML += `
<tr>
<td>${item.title}</td>
<td>${item.date}</td>
<td>Published</td>
</tr>
`;
    });
}

function publishVideo() {
    const title = document.getElementById("videoTitle").value;
    const link = document.getElementById("videoLink").value;

    if (title === "" || link === "") {
        alert("Please fill all video fields");
        return;
    }

    const videos = readStore("videos", []);

    videos.push({
        id: makeClientId("video"),
        title,
        link
    });

    writeStore("videos", videos);
    alert("Video Published Successfully");
    window.location.href = "videos.html";
}

function loadVideos() {
    const videos = readStore("videos", []);
    const table = document.getElementById("videoTable");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    videos.forEach((video) => {
        table.innerHTML += `
        <tr>
            <td>${video.title}</td>
            <td>${video.link}</td>
            <td>Published</td>
        </tr>
        `;
    });
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

function renderHomeNews() {
    const container = document.getElementById("homeNews");

    if (!container) {
        return;
    }

    const news = readStore("news", []);

    if (!news.length) {
        container.innerHTML = "<p>No news published yet.</p>";
        return;
    }

    container.innerHTML = news.map((item, index) => `
<article class="news-card">
    <h3>${escapeHtml(item.title)}</h3>
    <p><strong>Date:</strong> ${escapeHtml(item.date)}</p>
    <p>${escapeHtml(item.content)}</p>
    ${renderEngagementWidget("news", item.id || `news_${index + 1}`)}
</article>
`).join("");
}

function renderHomeVideos() {
    const container = document.getElementById("homeVideos");

    if (!container) {
        return;
    }

    const videos = readStore("videos", []);

    if (!videos.length) {
        container.innerHTML = "<p>No videos published yet.</p>";
        return;
    }

    container.innerHTML = videos.map((video, index) => `
<article class="video-card">
    <h3>${escapeHtml(video.title)}</h3>
    <p><a href="${escapeHtml(video.link)}" target="_blank" rel="noopener noreferrer">Watch video</a></p>
    ${renderEngagementWidget("video", video.id || `video_${index + 1}`)}
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

async function fetchModerationComments(status, queryText, page, pageSize) {
    const adminKey = getAdminApiKey();

    if (!adminKey) {
        throw new Error("Admin API key is required");
    }

    const params = new URLSearchParams({
        status,
        q: queryText,
        page: String(page),
        pageSize: String(pageSize)
    });

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments?${params.toString()}`, {
        headers: {
            "x-admin-key": adminKey
        }
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
    const adminKey = getAdminApiKey();

    if (!adminKey) {
        throw new Error("Admin API key is required");
    }

    const params = new URLSearchParams({
        status: moderationState.status,
        q: moderationState.query
    });

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments/export.csv?${params.toString()}`, {
        headers: {
            "x-admin-key": adminKey
        }
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
    const adminKey = getAdminApiKey();

    if (!adminKey) {
        throw new Error("Admin API key is required");
    }

    const response = await fetch(`${API_BASE_URL}/api/engagement/moderation/comments/bulk`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey
        },
        body: JSON.stringify({ action, items })
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Bulk action failed");
    }

    return response.json();
}

async function moderateComment(itemType, itemId, commentId, action) {
    const adminKey = getAdminApiKey();

    if (!adminKey) {
        throw new Error("Admin API key is required");
    }

    const response = await fetch(`${API_BASE_URL}/api/engagement/${itemType}/${itemId}/comments/${commentId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey
        },
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
    const refreshButton = document.getElementById("refreshComments");
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

    saveApiKeyButton.addEventListener("click", () => {
        setAdminApiKey(apiKeyInput.value.trim());
        moderationState.page = 1;
        loadModerationComments();
    });

    refreshButton.addEventListener("click", loadModerationComments);
    statusFilter.addEventListener("change", () => {
        moderationState.page = 1;
        loadModerationComments();
    });

    if (searchInput && searchButton) {
        searchButton.addEventListener("click", () => {
            moderationState.query = searchInput.value.trim();
            moderationState.page = 1;
            loadModerationComments();
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                moderationState.query = searchInput.value.trim();
                moderationState.page = 1;
                loadModerationComments();
            }
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
    renderHomeNews();
    renderHomeVideos();
    await refreshEngagementWidgets();
}

window.addEventListener("load", loadNews);
window.addEventListener("load", loadVideos);
window.addEventListener("load", loadLiveTV);
window.addEventListener("load", loadHomeLiveTV);
window.addEventListener("load", initializeHomePage);
window.addEventListener("load", initializeModerationPage);

bindEngagementForms();