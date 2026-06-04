/**
 * Admin Dashboard - KindHeart Platform
 * Modularized Logic for Editorial Moderation & System Management
 */

// Global Datastores for SPA caching and filtering
let campaignsCache = [];
let donorsCache = [];
let campaignPage = 1;
let campaignLimit = 8;
let campaignTotal = 0;

let donorPage = 1;
let donorLimit = 10;
let donorTotal = 0;

let campaignToModerateId = null;

// ================= SWITCH TAB ROUTER =================
function switchTab(tabName) {
    // Toggle Sidebar Link Classes
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.getElementById(`nav-${tabName}`);
    if (activeLink) activeLink.classList.add('active');

    // Toggle Content Sections
    document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(`tab-${tabName}`);
    if (activeSection) activeSection.classList.add('active');

    // Update Headers & Load corresponding View Data
    const pageHeaderTitle = document.getElementById('pageHeaderTitle');
    const subtitle = document.getElementById('headerSubtitle');

    if (tabName === 'overview') {
        const displayName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Admin';
        pageHeaderTitle.innerHTML = `Welcome, <span id="username" class="theme-accent">${displayName}</span>`;
        subtitle.innerText = "Curating the narratives that drive change. Manage your editorial queue and monitor the heartbeat of collective empathy.";
        loadUser(); // Load dynamic profile details
        loadStats(); // Load overall dashboard overview cards
        loadCampaignsOverview(); // Load the overview campaign cards queue
    } else if (tabName === 'campaigns') {
        pageHeaderTitle.innerText = `Campaign Database`;
        subtitle.innerText = "Search, filter, edit, and moderate all stories published across the KindHeart platform.";
        campaignPage = 1;
        loadAdminCampaigns();
    } else if (tabName === 'users') {
        pageHeaderTitle.innerText = `User Management Suite`;
        subtitle.innerText = "Monitor registered accounts, audit user profiles, promote roles, and toggle access suspension.";
        donorPage = 1;
        loadAdminUsers();
    } else if (tabName === 'reports') {
        pageHeaderTitle.innerText = `Financial & Impact Analytics`;
        subtitle.innerText = "Audit transaction processing queues, allocation dispersals, and crowdfunding performance.";
        loadImpactReports();
    } else if (tabName === 'verifications') {
        pageHeaderTitle.innerText = `Verification Panel`;
        subtitle.innerText = "Approve or reject pending campaign pitches to ensure high editorial excellence and platform safety.";
        loadVerificationQueue();
    }
}

// ================= LOAD USER =================
async function loadUser() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role !== 'ADMIN') {
        window.location.href = "user-dashboard.html#campaigns";
        return;
    }

    try {
        const res = await fetch(API.ME, {
            headers: getAuthHeaders()
        });

        const result = await res.json();
        const data = result.data || result; // Dynamic fallback

        if (!result.success && !data.id) throw new Error();

        const displayName = data.name || data.username || "Admin";
        
        const usernameEl = document.getElementById("username");
        if (usernameEl) usernameEl.innerText = displayName;
        
        const username2El = document.getElementById("username2");
        if (username2El) username2El.innerText = displayName;

        // Profile photo fallback
        const profilePhoto = data.photo || data.profileImage || data.avatar;
        const avatarEl = document.getElementById("avatarImg");
        if (avatarEl) {
            if (profilePhoto) {
                avatarEl.src = profilePhoto;
            } else {
                avatarEl.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100";
            }
            avatarEl.onerror = () => {
                avatarEl.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100";
            };
        }

    } catch (err) {
        console.error("Dashboard auth error:", err);
        const userLocal = JSON.parse(localStorage.getItem('user'));
        if (userLocal) {
            const usernameEl = document.getElementById("username");
            if (usernameEl) usernameEl.innerText = userLocal.name;
            const username2El = document.getElementById("username2");
            if (username2El) username2El.innerText = userLocal.name;
        } else {
            logout();
        }
    }
}

// ================= LOAD STATS =================
async function loadStats() {
    try {
        const res = await fetch(API.ADMIN_STATS, {
            headers: getAuthHeaders()
        });
        const result = await res.json();
        const data = result.data || result;

        document.getElementById("donations").innerText = formatCurrency(data.totalAmountDonated || data.donations || 0);
        document.getElementById("campaigns").innerText = data.totalCampaigns || data.campaigns || 0;
        document.getElementById("users").innerText = data.totalUsers || data.users || 0;
        
        const donorCountEl = document.getElementById("donorCount");
        if (donorCountEl && data.totalUsers) {
            donorCountEl.innerText = `+${Math.max(1, Math.floor(data.totalUsers * 0.8))}`;
        }

        // Sync dynamic "Verification Queue" stat badge count
        const verificationRes = await fetch(`${API.ADMIN_CAMPAIGNS}?page=1&limit=100`, {
            headers: getAuthHeaders()
        });
        const verificationResult = await verificationRes.json();
        const allCampaigns = verificationResult.data || [];
        const pendingCount = allCampaigns.filter(c => c.campaignStatus === 'PENDING').length;
        
        const vStatEl = document.getElementById("verificationQueueStat");
        if (vStatEl) vStatEl.innerText = pendingCount;
        
        const vBadgeEl = document.getElementById("verificationQueueStatBadge");
        if (vBadgeEl) {
            if (pendingCount > 0) {
                vBadgeEl.innerText = "Requires Attention";
                vBadgeEl.style.backgroundColor = "var(--secondary-container)";
                vBadgeEl.style.color = "var(--on-secondary-container)";
            } else {
                vBadgeEl.innerText = "Queue Clear";
                vBadgeEl.style.backgroundColor = "var(--primary-container)";
                vBadgeEl.style.color = "var(--primary)";
            }
        }

    } catch (err) {
        console.log("Stats API loading error:", err);
    }
}

// ================= LOAD CAMPAIGNS (OVERVIEW RE-QUEUE LIST) =================
async function loadCampaignsOverview() {
    try {
        const res = await fetch(`${API.ADMIN_CAMPAIGNS}?page=1&limit=100`, {
            headers: getAuthHeaders()
        });
        const result = await res.json();
        const data = result.data || [];
        
        let tbody = document.getElementById("campaignList");
        
        // Limit to Pending Campaigns for the review dashboard queue
        const pendingCampaigns = data.filter(c => c.campaignStatus === 'PENDING');

        if (pendingCampaigns.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="table-empty-state">
                        <span class="material-symbols-outlined" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: var(--gray-light);">verified</span>
                        Verification queue clear! All active pitches have been edited.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = "";
        // Show up to 5 elements on quick overview dashboard
        pendingCampaigns.slice(0, 5).forEach(c => {
            const coverImg = c.imageUrl || c.image || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200';
            const categoryName = c.category || "Environment";
            
            let categoryClass = "category-default";
            const catLower = categoryName.toLowerCase();
            if (catLower.includes("env") || catLower.includes("nature") || catLower.includes("green")) {
                categoryClass = "category-environment";
            } else if (catLower.includes("edu") || catLower.includes("school") || catLower.includes("kid")) {
                categoryClass = "category-education";
            } else if (catLower.includes("med") || catLower.includes("health") || catLower.includes("clinic")) {
                categoryClass = "category-medical";
            }

            tbody.innerHTML += `
                <tr class="group">
                    <td>
                        <div class="campaign-cell-wrap">
                            <div class="campaign-thumb-wrap">
                                <img class="campaign-thumb" src="${coverImg}" alt="${c.title}" onerror="this.src='https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200'">
                            </div>
                            <div>
                                <div class="campaign-meta-title">${c.title}</div>
                                <div class="campaign-meta-info">By ${c.creator || 'Campaign Creator'} • ${formatDate(c.createdAt || new Date())}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="category-badge ${categoryClass}">${categoryName}</span>
                    </td>
                    <td>
                        <div class="goal-value">${formatCurrency(c.goalAmount || c.goal || 0)}</div>
                    </td>
                    <td style="text-align: right;">
                        <button class="btn-review" onclick="switchTab('verifications')">Review</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Overview load queue failure:", err);
        document.getElementById("campaignList").innerHTML = `
            <tr>
                <td colspan="4" class="table-empty-state">
                    <span class="material-symbols-outlined" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: var(--danger);">error</span>
                    Could not connect to database review queues.
                </td>
            </tr>
        `;
    }
}

// ================= LOAD CAMPAIGNS TAB DATABASE =================
async function loadAdminCampaigns() {
    try {
        const tableBody = document.getElementById("campaignsTabTableBody");
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-loading">
                    <i class="fa fa-spinner"></i> Querying campaigns database...
                </td>
            </tr>
        `;

        const url = new URL(API.ADMIN_CAMPAIGNS);
        url.searchParams.append('page', campaignPage);
        url.searchParams.append('limit', campaignLimit);

        const res = await fetch(url, {
            headers: getAuthHeaders()
        });
        const result = await res.json();
        
        campaignsCache = result.data || [];
        campaignTotal = result.total || campaignsCache.length;
        const totalPages = result.totalPages || Math.ceil(campaignTotal / campaignLimit);

        filterCampaignsList(); // Applies filters and searches on client sides
        
        // Sync page button visibility
        document.getElementById("campaignPageInfo").innerText = `Page ${campaignPage} of ${Math.max(1, totalPages)}`;
        document.getElementById("campaignPrevBtn").disabled = campaignPage <= 1;
        document.getElementById("campaignNextBtn").disabled = campaignPage >= totalPages;

    } catch (err) {
        console.error("Load Admin campaigns failed:", err);
        document.getElementById("campaignsTabTableBody").innerHTML = `
            <tr>
                <td colspan="6" class="table-empty-state">
                    <span class="material-symbols-outlined" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: var(--danger);">error</span>
                    Could not synchronize with platform campaigns.
                </td>
            </tr>
        `;
    }
}

// Client filtering for real-time campaign searches
function filterCampaignsList() {
    const searchQuery = document.getElementById("campaignSearch").value.toLowerCase();
    const selectedCategory = document.getElementById("campaignCategorySelect").value;
    const selectedStatus = document.getElementById("campaignStatusSelect").value;

    const tableBody = document.getElementById("campaignsTabTableBody");
    
    let filtered = campaignsCache;

    // Apply filters
    if (searchQuery) {
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(searchQuery) || 
            (c.creator && c.creator.toLowerCase().includes(searchQuery))
        );
    }

    if (selectedCategory) {
        filtered = filtered.filter(c => c.category === selectedCategory);
    }

    if (selectedStatus) {
        filtered = filtered.filter(c => c.campaignStatus === selectedStatus);
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty-state">
                    <span class="material-symbols-outlined" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; color: var(--gray-light);">search_off</span>
                    No matching campaign records found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = "";
    filtered.forEach(c => {
        const coverImg = c.imageUrl || c.image || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200';
        const categoryName = c.category || "Environment";

        let categoryClass = "category-default";
        const catLower = categoryName.toLowerCase();
        if (catLower.includes("env") || catLower.includes("nature") || catLower.includes("green")) {
            categoryClass = "category-environment";
        } else if (catLower.includes("edu") || catLower.includes("school") || catLower.includes("kid")) {
            categoryClass = "category-education";
        } else if (catLower.includes("med") || catLower.includes("health") || catLower.includes("clinic")) {
            categoryClass = "category-medical";
        }
        
        // Format status badge
        let statusColor = "color: var(--gray); background-color: var(--gray-lightest);";
        if (c.campaignStatus === 'APPROVED') {
            statusColor = "color: var(--primary); background-color: var(--primary-container);";
        } else if (c.campaignStatus === 'REJECTED') {
            statusColor = "color: var(--danger); background-color: rgba(239, 68, 68, 0.08);";
        } else if (c.campaignStatus === 'PENDING') {
            statusColor = "color: var(--secondary); background-color: var(--secondary-container);";
        }

        tableBody.innerHTML += `
            <tr class="group">
                <td>
                    <div class="campaign-cell-wrap">
                        <div class="campaign-thumb-wrap">
                            <img class="campaign-thumb" src="${coverImg}" alt="${c.title}" onerror="this.src='https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200'">
                        </div>
                        <div>
                            <div class="campaign-meta-title">${c.title}</div>
                            <div class="campaign-meta-info">By ${c.creator || 'Campaign Creator'} • ${formatDate(c.createdAt || new Date())}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="category-badge ${categoryClass}" style="font-weight:700;">${categoryName}</span>
                </td>
                <td>
                    <div class="goal-value">${formatCurrency(c.goalAmount || 0)}</div>
                </td>
                <td>
                    <div class="goal-value" style="color: var(--primary);">${formatCurrency(c.amountRaised || 0)}</div>
                </td>
                <td>
                    <span class="category-badge" style="${statusColor} font-weight:800;">${c.campaignStatus}</span>
                </td>
                <td style="text-align: right;">
                    <a href="campaign-details.html?id=${c.id}" class="btn-review" style="padding: 0.4rem 0.8rem;">View</a>
                </td>
            </tr>
        `;
    });
}

function changeCampaignPage(direction) {
    campaignPage += direction;
    loadAdminCampaigns();
}

// ================= LOAD ADMIN USERS TAB =================
async function loadAdminUsers() {
    try {
        const tableBody = document.getElementById("usersTabTableBody");
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-loading">
                    <i class="fa fa-spinner"></i> Querying system user records...
                </td>
            </tr>
        `;

        const res = await fetch(API.ADMIN_USERS + "?limit=1000", {
            headers: getAuthHeaders()
        });
        const result = await res.json();

        donorsCache = result.data || [];
        donorTotal = donorsCache.length;

        // Compute metrics
        const total = donorTotal;
        const verified = donorsCache.filter(u => u.isVerified).length;
        const unverified = total - verified;

        document.getElementById("userStatsTotal").innerText = total;
        document.getElementById("userStatsVerified").innerText = verified;
        document.getElementById("userStatsUnverified").innerText = unverified;

        filterUsersList();

    } catch (err) {
        console.error("Load users directory failed:", err);
        document.getElementById("usersTabTableBody").innerHTML = `
            <tr>
                <td colspan="6" class="table-empty-state">
                    <span class="material-symbols-outlined" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: var(--danger);">error</span>
                    Could not synchronize platform registration profiles.
                </td>
            </tr>
        `;
    }
}

function filterUsersList() {
    const searchQuery = document.getElementById("userSearch").value.toLowerCase();
    const selectedRole = document.getElementById("userRoleSelect").value;
    const selectedVerification = document.getElementById("userVerificationSelect").value;

    const tableBody = document.getElementById("usersTabTableBody");

    let filtered = donorsCache;

    if (searchQuery) {
        filtered = filtered.filter(u => 
            (u.name && u.name.toLowerCase().includes(searchQuery)) || 
            (u.email && u.email.toLowerCase().includes(searchQuery))
        );
    }

    if (selectedRole) {
        filtered = filtered.filter(u => u.role === selectedRole);
    }

    if (selectedVerification) {
        const isVer = selectedVerification === "VERIFIED";
        filtered = filtered.filter(u => u.isVerified === isVer);
    }

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / donorLimit);

    // Clamp page
    donorPage = Math.max(1, Math.min(donorPage, totalPages || 1));

    // Slice for pagination
    const start = (donorPage - 1) * donorLimit;
    const paginated = filtered.slice(start, start + donorLimit);

    document.getElementById("userPageInfo").innerText = `Page ${donorPage} of ${Math.max(1, totalPages)}`;
    document.getElementById("userPrevBtn").disabled = donorPage <= 1;
    document.getElementById("userNextBtn").disabled = donorPage >= totalPages;

    if (paginated.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty-state">
                    <span class="material-symbols-outlined" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; color: var(--gray-light);">search_off</span>
                    No matching user records found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = "";
    paginated.forEach(u => {
        let roleBadge = "color: var(--gray); background-color: var(--gray-lightest);";
        if (u.role === 'ADMIN') {
            roleBadge = "color: var(--on-secondary-container); background-color: var(--secondary-container);";
        } else if (u.role === 'USER') {
            roleBadge = "color: var(--on-primary-container); background-color: var(--primary-container);";
        }

        const verificationBadge = u.isVerified 
            ? `<span class="category-badge" style="color: var(--primary); background-color: var(--primary-container); font-weight:800;">VERIFIED</span>`
            : `<span class="category-badge" style="color: var(--danger); background-color: rgba(239, 68, 68, 0.08); font-weight:800;">SUSPENDED</span>`;

        const verificationActionText = u.isVerified ? "Suspend" : "Activate";
        const verificationActionIcon = u.isVerified ? "block" : "verified";
        const verificationActionClass = u.isVerified ? "btn-reject" : "btn-approve";

        // Avoid self-demotion or self-suspension
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const isSelf = currentUser && (currentUser.id === u.id || currentUser.email === u.email);

        const roleActionText = u.role === 'ADMIN' ? "Demote" : "Promote";
        const roleActionIcon = u.role === 'ADMIN' ? "arrow_downward" : "arrow_upward";
        const roleActionClass = "btn-review";

        let actionsHtml = "";
        if (isSelf) {
            actionsHtml = `<span style="font-size:0.72rem; color:var(--gray); font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Current Admin</span>`;
        } else {
            actionsHtml = `
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="${verificationActionClass}" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; font-weight:700;" onclick="toggleUserVerification('${u.id}', ${u.isVerified})">
                        <span class="material-symbols-outlined" style="font-size: 0.875rem;">${verificationActionIcon}</span>
                        <span>${verificationActionText}</span>
                    </button>
                    <button class="${roleActionClass}" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; font-weight:700; background-color: var(--stone-800); color: var(--white);" onclick="toggleUserRole('${u.id}', '${u.role}', '${u.name}')">
                        <span class="material-symbols-outlined" style="font-size: 0.875rem;">${roleActionIcon}</span>
                        <span>${roleActionText}</span>
                    </button>
                </div>
            `;
        }

        tableBody.innerHTML += `
            <tr class="group">
                <td><strong>${u.name || 'Anonymous User'}</strong></td>
                <td>${u.email}</td>
                <td>
                    <span class="category-badge" style="${roleBadge} font-weight:800;">${u.role}</span>
                </td>
                <td>${verificationBadge}</td>
                <td>${formatDate(u.createdAt || new Date())}</td>
                <td style="text-align: right;">
                    ${actionsHtml}
                </td>
            </tr>
        `;
    });
}

async function toggleUserVerification(id, currentStatus) {
    const nextStatus = !currentStatus;
    const actionName = nextStatus ? "activate" : "suspend";
    if (!confirm(`Are you absolutely sure you want to ${actionName} this user account?`)) return;

    try {
        const res = await fetch(`${API.ADMIN_USERS}/${id}/verification`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isVerified: nextStatus })
        });
        const result = await res.json();

        if (result.success) {
            showToast(`User account successfully ${nextStatus ? 'activated' : 'suspended'}.`, "success");
            loadAdminUsers();
            loadStats();
        } else {
            showToast(result.message || "Failed to toggle verification status.", "error");
        }
    } catch (err) {
        console.error("Verification toggle failed:", err);
        showToast("Network error. User status was not updated.", "error");
    }
}

async function toggleUserRole(id, currentRole, name) {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionName = nextRole === 'ADMIN' ? "PROMOTE to System Administrator" : "DEMOTE to Standard User";
    if (!confirm(`Are you absolutely sure you want to ${actionName} ${name}?`)) return;

    try {
        const res = await fetch(`${API.ADMIN_USERS}/${id}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role: nextRole })
        });
        const result = await res.json();

        if (result.success) {
            showToast(`User successfully updated to ${nextRole} role.`, "success");
            loadAdminUsers();
        } else {
            showToast(result.message || "Failed to update user role.", "error");
        }
    } catch (err) {
        console.error("Role toggle failed:", err);
        showToast("Network error. User role was not modified.", "error");
    }
}

function changeUserPage(direction) {
    donorPage += direction;
    filterUsersList();
}

// ================= LOAD IMPACT REPORTS TAB =================
async function loadImpactReports() {
    try {
        const res = await fetch(API.ADMIN_STATS, {
            headers: getAuthHeaders()
        });
        const result = await res.json();
        const data = result.data || result;

        document.getElementById("reportSuccessfulDonations").innerText = formatCurrency(data.totalAmountDonated || data.donations || 0);
        document.getElementById("reportGrantDisbursements").innerText = formatCurrency(data.totalAmountRaised || 0);
        document.getElementById("reportCampaignCount").innerText = data.totalCampaigns || data.campaigns || 0;

    } catch (err) {
        console.error("Impact Reports metrics fetch failed:", err);
    }
}

// ================= LOAD VERIFICATION MODERATION QUEUE =================
async function loadVerificationQueue() {
    try {
        const container = document.getElementById("verificationCardsGrid");
        container.innerHTML = `
            <div class="table-loading" style="grid-column: 1 / -1;">
                <i class="fa fa-spinner"></i> Querying pending campaigns verification queue...
            </div>
        `;

        const res = await fetch(`${API.ADMIN_CAMPAIGNS}?page=1&limit=100`, {
            headers: getAuthHeaders()
        });
        const result = await res.json();
        const data = result.data || [];

        // Display ONLY campaigns awaiting verification (PENDING status)
        const pendingList = data.filter(c => c.campaignStatus === 'PENDING');

        if (pendingList.length === 0) {
            container.innerHTML = `
                <div class="table-empty-state" style="grid-column: 1 / -1; padding: 4rem;">
                    <span class="material-symbols-outlined" style="font-size: 3.5rem; display: block; margin-bottom: 1rem; color: var(--primary);">verified</span>
                    <h3>All pitches cleared!</h3>
                    <p style="color: var(--gray); margin-top: 0.5rem;">There are no campaigns waiting in verification queue. Excellent editorial moderation!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = "";
        pendingList.forEach(c => {
            const coverImg = c.imageUrl || c.image || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=300';
            
            container.innerHTML += `
                <div class="verification-card">
                    <div class="verification-card-hero">
                        <img src="${coverImg}" alt="${c.title}" onerror="this.src='https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=300'">
                        <span class="verification-card-badge">${c.category || 'Environment'}</span>
                    </div>
                    <div class="verification-card-body">
                        <div>
                            <h4 class="verification-card-title">${c.title}</h4>
                            <div class="verification-card-creator">
                                <span class="material-symbols-outlined" style="font-size: 0.875rem;">person</span>
                                <span>By ${c.creator || 'Campaign Pitcher'}</span>
                            </div>
                        </div>
                        <p class="verification-card-desc">This editorial campaign pitch requires oversight review. Verify documents and description narrative copy before approval.</p>
                        <div class="verification-card-meta">
                            <div class="meta-item">
                                <strong>${formatCurrency(c.goalAmount || 0)}</strong>
                                Goal Amount
                            </div>
                            <div class="meta-item" style="text-align: right;">
                                <strong>${formatDate(c.createdAt || new Date())}</strong>
                                Pitch Date
                            </div>
                        </div>
                        <div class="verification-card-actions">
                            <button class="btn-approve" onclick="moderateCampaign('${c.id}', 'APPROVED')">
                                <span class="material-symbols-outlined" style="font-size: 0.875rem;">check_circle</span>
                                <span>Approve</span>
                            </button>
                            <button class="btn-reject" onclick="moderateCampaign('${c.id}', 'REJECTED')">
                                <span class="material-symbols-outlined" style="font-size: 0.875rem;">cancel</span>
                                <span>Reject</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Verification queue loading error:", err);
        document.getElementById("verificationCardsGrid").innerHTML = `
            <div class="table-empty-state" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined" style="font-size: 3rem; display: block; margin-bottom: 0.5rem; color: var(--danger);">error</span>
                Could not synchronize platforms verification queues.
            </div>
        `;
    }
}

// ================= MODERATE CAMPAIGN STATUSES =================
async function moderateCampaign(id, action) {
    if (action === 'APPROVED') {
        if (!confirm("Are you absolutely sure you want to APPROVE this campaign pitch to go live?")) return;
        
        try {
            const res = await fetch(`${API.ADMIN_CAMPAIGNS}/${id}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: 'APPROVED' })
            });
            
            const result = await res.json();
            if (result.success) {
                showToast("Campaign approved and published successfully!", "success");
                // Reload tab contents
                loadVerificationQueue();
                loadStats();
            } else {
                showToast(result.message || "Failed to update campaign status.", "error");
            }
        } catch (err) {
            console.error("Campaign approval moderation failed:", err);
            showToast("Network error. Campaign status was not updated.", "error");
        }
    } else if (action === 'REJECTED') {
        // Open custom modal for rejection reasoning input
        campaignToModerateId = id;
        document.getElementById("rejectionReasonInput").value = "";
        document.getElementById("rejectionModal").classList.add("open");
    }
}

function closeRejectionModal() {
    document.getElementById("rejectionModal").classList.remove("open");
    campaignToModerateId = null;
}

async function submitRejection() {
    const reason = document.getElementById("rejectionReasonInput").value.trim();
    if (!reason) {
        showToast("Please provide an editorial reason explaining the rejection.", "warning");
        return;
    }

    try {
        const res = await fetch(`${API.ADMIN_CAMPAIGNS}/${campaignToModerateId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                status: 'REJECTED',
                rejectionReason: reason
            })
        });

        const result = await res.json();
        if (result.success) {
            showToast("Campaign pitch successfully rejected.", "success");
            closeRejectionModal();
            loadVerificationQueue();
            loadStats();
        } else {
            showToast(result.message || "Failed to moderate campaign.", "error");
        }
    } catch (err) {
        console.error("Campaign rejection failed:", err);
        showToast("Network error. Campaign was not moderated.", "error");
    }
}

// Override config.js alerts to inject beautifully animated custom toasts
function showToast(message, type = 'info') {
    const toastId = 'toast_' + Math.random().toString(36).substr(2, 9);
    const toastDiv = document.createElement('div');
    toastDiv.id = toastId;
    
    let color = '#3b82f6'; // info default blue
    let icon = 'info';
    if (type === 'success') { color = '#10b981'; icon = 'check_circle'; }
    else if (type === 'error') { color = '#ef4444'; icon = 'error'; }
    else if (type === 'warning') { color = '#f59e0b'; icon = 'warning'; }

    toastDiv.setAttribute('style', `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background-color: #ffffff;
        color: #1e293b;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border-left: 4px solid ${color};
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 200;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        font-weight: 700;
    `);

    toastDiv.innerHTML = `
        <span class="material-symbols-outlined" style="color: ${color}; font-variation-settings: 'FILL' 1;">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toastDiv);

    // Fade in
    setTimeout(() => {
        toastDiv.style.transform = 'translateY(0)';
        toastDiv.style.opacity = '1';
    }, 50);

    // Auto destroy after 4 seconds
    setTimeout(() => {
        toastDiv.style.transform = 'translateY(100px)';
        toastDiv.style.opacity = '0';
        setTimeout(() => {
            toastDiv.remove();
        }, 300);
    }, 4000);
}

// Override window.alert globally to use our custom toast
window.alert = function(msg) {
    showToast(msg, 'info');
};

// Fetches data from existing collections and synthesizes an activity timeline
async function loadRecentActivity() {
    const activityFeedContainer = document.querySelector('.activity-feed');
    if (!activityFeedContainer) return;

    // Save the "Show More History" button reference if it exists
    const showMoreBtn = activityFeedContainer.querySelector('.btn-history');

    try {
        // 1. Fetch from available endpoints concurrently
        // Note: authFetch is your helper from config.js
        const [donationsRes, campaignsRes, usersRes] = await Promise.all([
            authFetch(`${API.DONATIONS}?limit=5&sort=createdAt:desc`),
            authFetch(`${API.ADMIN_CAMPAIGNS}?status=PENDING&limit=5`),
            authFetch(`${API.ADMIN_USERS}?limit=5&sort=createdAt:desc`)
        ]);

        // Safely parse JSON or default to empty arrays if an endpoint fails
        const donations = donationsRes.ok ? (await donationsRes.json()).data || [] : [];
        const campaigns = campaignsRes.ok ? (await campaignsRes.json()).data || [] : [];
        const users = usersRes.ok ? (await usersRes.json()).data || [] : [];

        let synthesizedActivities = [];

        // 2. Transform Donations into Activity Objects
        donations.forEach(d => {
            synthesizedActivities.push({
                id: `donation-${d.id}`,
                type: 'secondary', // Matches your CSS 'activity-secondary'
                avatar: d.User?.avatarUrl || d.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100',
                title: `${getDisplayName(d.User || d)} <span class="activity-normal">donated</span> ${formatCurrency(d.amount)}`,
                subtitle: d.Campaign?.title || 'Crowdfunding Campaign',
                timestamp: new Date(d.createdAt),
                timeFriendly: timeAgo(d.createdAt)
            });
        });
        console.log(donations)

        // 3. Transform Pending/New Campaigns into Activity Objects
        campaigns.forEach(c => {
            synthesizedActivities.push({
                id: `campaign-${c.id}`,
                type: 'tertiary', // Matches 'activity-tertiary'
                icon: 'verified', // Uses Material Symbol icon
                title: `New Campaign <span class="activity-normal">Awaiting Review</span>`,
                subtitle: `${c.title} by ${c.creator} is ${c.status === 'PENDING' ? 'pending' : 'awaiting'} approval.`,
                timestamp: new Date(c.createdAt),
                timeFriendly: timeAgo(c.createdAt)
            });
        });

        // 4. Transform New Users into Activity Objects
        users.forEach(u => {
            synthesizedActivities.push({
                id: `user-${u.id}`,
                type: 'neutral', // Matches 'activity-neutral'
                avatar: u.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100',
                title: `${getDisplayName(u)} <span class="activity-normal">joined</span> KindHeart`,
                subtitle: `Registered as a platform ${String(u.role || 'user').toLowerCase()}.`,
                timestamp: new Date(u.createdAt),
                timeFriendly: timeAgo(u.createdAt)
            });
        });

        // 5. Sort everything by absolute time (Newest first)
        synthesizedActivities.sort((a, b) => b.timestamp - a.timestamp);

        // Take the top 4 most recent events
        const displayActivities = synthesizedActivities.slice(0, 4);

        // 6. Render elements to DOM
        // Clear old hardcoded feed items but preserve the container layout
        activityFeedContainer.innerHTML = '';

        if (displayActivities.length === 0) {
            activityFeedContainer.innerHTML = '<p class="table-loading">No recent platform activity found.</p>';
            return;
        }

        displayActivities.forEach(act => {
            const card = document.createElement('div');
            card.className = `activity-card activity-${act.type}`;

            // Build structural components depending on whether it uses an image or an icon symbol
            const mediaSource = act.icon 
                ? `<div class="activity-icon-wrap"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${act.icon}</span></div>`
                : `<img class="activity-avatar" src="${act.avatar}" alt="Avatar">`;

            card.innerHTML = `
                <div class="activity-flex">
                    ${mediaSource}
                    <div class="activity-content">
                        <p>${act.title}</p>
                        <div class="activity-campaign-title" style="color: var(--stone-800);">${sanitizeInput(act.subtitle)}</div>
                        <div class="activity-time-stamp">${act.timeFriendly}</div>
                    </div>
                </div>
            `;
            activityFeedContainer.appendChild(card);
        });

        // Re-append the layout button back if it existed originally
        if (showMoreBtn) activityFeedContainer.appendChild(showMoreBtn);

    } catch (err) {
        console.error('Failed to compile synthesized dashboard activity feed:', err);
    }
}

// Utility helper to output relative time differences (e.g. "3 Minutes Ago")
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just Now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} Minute${minutes > 1 ? 's' : ''} Ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} Hour${hours > 1 ? 's' : ''} Ago`;
    const days = Math.floor(hours / 24);
    return `${days} Day${days > 1 ? 's' : ''} Ago`;
}

// ================= INIT CORE =================
document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    loadStats();
    loadCampaignsOverview();
    loadRecentActivity();
});
