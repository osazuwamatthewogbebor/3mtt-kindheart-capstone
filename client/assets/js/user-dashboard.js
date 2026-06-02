/**
 * USER DASHBOARD - KindHeart Platform
 * Handles dashboard data loading, statistics, campaigns, and donations
 * Properly integrates with API endpoints and displays user profile data
 */

let currentUser = null;
let activeCampaigns = [];
let recentDonations = [];
let campaignToDelete = null;

/**
 * Initialize Dashboard
 */
async function initDashboard() {
    try {
        // Check authentication
        if (!isLoggedIn()) {
            redirectToLogin();
            return;
        }

        // Load user profile
        await loadUserProfile();

        // Load initial dashboard data (Overview)
        await Promise.all([
            loadDashboardStats(),
            loadActiveCampaigns(),
            loadRecentDonations()
        ]);

        // Check if there's a tab in the URL (e.g., #campaigns)
        const hash = window.location.hash.substring(1);
        if (hash && ['overview', 'campaigns', 'create', 'edit', 'donations', 'profile'].includes(hash)) {
            switchTab(hash);
        }

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showErrorNotification('Failed to load dashboard. Please refresh the page.');
    }
}

// React to hash changes so links like user-dashboard.html#profile work without full reload
window.addEventListener('hashchange', () => {
    const h = window.location.hash.substring(1);
    if (h) switchTab(h);
});

/**
 * Switch Dashboard Tabs
 */
function switchTab(tabName) {
    // Update URL hash
    window.location.hash = tabName;

    // Update active tab visibility
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Update sidebar navigation active state
    const navItems = document.querySelectorAll('#userDashboardNav .quick-nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Load data specific to the tab if needed
    if (tabName === 'campaigns') {
        loadFullCampaigns();
    } else if (tabName === 'donations') {
        loadFullDonations();
    } else if (tabName === 'profile') {
        loadUserProfile();
    } else if (tabName === 'create') {
        // Create campaign form is embedded directly in the dashboard tab
    } else if (tabName === 'edit') {
        loadEditCampaigns();
    } else if (tabName === 'overview') {
        loadDashboardStats();
        loadActiveCampaigns();
        loadRecentDonations();
    }
}

/**
 * Load User Profile
 */
async function loadUserProfile() {
    try {
        const response = await authFetch(API.ME, {
            method: 'GET'
        });


        if (!response.ok) {
            if (response.status === 401) {
                // Try to refresh token using refresh cookie, then retry once
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    // retry
                    const retry = await fetch(API.ME, { headers: getAuthHeaders() });
                    if (retry.ok) {
                        const data2 = await retry.json();
                        currentUser = data2.data || data2;
                        updateProfileDisplay(currentUser);
                        updateAdminLink();
                        return;
                    }
                }

                // If refresh failed or retry failed - force logout
                if (typeof SessionManager !== 'undefined') SessionManager.logout();
                else logout();
                return;
            }
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        currentUser = data.data || data;

        // Update profile display
        updateProfileDisplay(currentUser);

        // Check admin status
        updateAdminLink();

    } catch (error) {
        console.error('Error loading user profile:', error);
        // If user is not logged in or auth failed, redirect to login
        if (!isLoggedIn()) {
            redirectToLogin();
            return;
        }

        // Fallback: use local user data if present and token appears valid
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (localUser) {
            currentUser = localUser;
            updateProfileDisplay(currentUser);
            updateAdminLink();
        }
    }
}

/**
 * Update Profile Display
 */
function updateProfileDisplay(user) {
    if (!user) return;

    const displayName = getDisplayName(user);
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : new Date().getFullYear();

    // Update sidebar profile
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        if (user.profileImage || user.avatarUrl || user.imageUrl) {
            const imgUrl = user.profileImage || user.avatarUrl || user.imageUrl;
            sidebarAvatar.innerHTML = `<img src="${imgUrl}" alt="${escapeHtml(displayName)}" class="profile-avatar-img" onerror="this.onerror=null;this.src='../assets/images/default-avatar.png'">`;
            sidebarAvatar.classList.remove('profile-avatar-placeholder');
        } else {
            sidebarAvatar.textContent = initials;
            sidebarAvatar.classList.add('profile-avatar-placeholder');
        }
    }

    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) {
        sidebarName.textContent = displayName;
    }

    const sidebarMemberSince = document.getElementById('sidebarMemberSince');
    if (sidebarMemberSince) {
        sidebarMemberSince.textContent = `Member since ${joinDate}`;
    }

    // Update navbar user name
    const navUserName = document.getElementById('userName');
    if (navUserName) {
        navUserName.textContent = displayName;
    }

    // Update dashboard welcome
    const dashboardUserName = document.getElementById('dashboardUserName');
    const dashboardWelcome = document.getElementById('dashboardWelcome');
    if (dashboardUserName) dashboardUserName.textContent = displayName;
    if (dashboardWelcome) dashboardWelcome.style.display = 'block';

    // Update verified badge visibility
    if (user.emailVerified) {
        const verifiedBadge = document.getElementById('verifiedBadge');
        if (verifiedBadge) {
            verifiedBadge.style.display = 'flex';
        }
    }
}

/**
 * Update Admin Link Visibility
 */
function updateAdminLink() {
    if (!currentUser) return;

    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        if (currentUser.role === 'ADMIN') {
            adminLink.classList.remove('hidden');
        } else {
            adminLink.classList.add('hidden');
        }
    }
}

/**
 * Load Dashboard Statistics
 */
async function loadDashboardStats() {
    try {
        // Fetch user's campaigns and donations to calculate stats (use authFetch to auto-refresh)
        const [campaignsRes, donationsRes] = await Promise.all([
            authFetch(API.MY_CAMPAIGNS, { method: 'GET' }),
            authFetch(API.MY_DONATIONS, { method: 'GET' })
        ]);

        let campaigns = [];
        let donations = [];

        if (campaignsRes.ok) {
            const campaignsData = await campaignsRes.json();
            campaigns = Array.isArray(campaignsData.data) ? campaignsData.data : (campaignsData.data?.campaigns || []);
            console.log('Loaded campaigns for stats:', campaigns);
        }

        if (donationsRes.ok) {
            const donationsData = await donationsRes.json();
            donations = Array.isArray(donationsData.data) ? donationsData.data : (donationsData.data?.donations || []);
            console.log('Loaded donations for stats:', donations);
        }

        // Calculate statistics
        const totalRaised = campaigns.reduce((sum, campaign) => sum + Number(campaign.amountRaised || 0), 0);
        console.log('Total raised calculated:', totalRaised);
        const totalCampaigns = campaigns.length;
        const totalDonated = donations.reduce((sum, donation) => {
            const status = donation.donationStatus || donation.status || '';
            if (status === 'SUCCESS') {
                return sum + Number(donation.amount || 0);
            }
            return sum;
        }, 0);
        console.log('Total donated calculated:', totalDonated);

        // Update UI
        updateStatistic('statsTotalRaised', formatCurrency(totalRaised));
        updateStatistic('statsTotalCampaigns', totalCampaigns);
        updateStatistic('statsTotalDonated', formatCurrency(totalDonated));

    } catch (error) {
        console.error('Error loading dashboard statistics:', error);
        // Set default values
        updateStatistic('statsTotalRaised', formatCurrency(0));
        updateStatistic('statsTotalCampaigns', 0);
        updateStatistic('statsTotalDonated', formatCurrency(0));
    }
}

/**
 * Load Active Campaigns (Overview Tab)
 */
async function loadActiveCampaigns() {
    try {
        const response = await fetch(API.MY_CAMPAIGNS, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch campaigns');
        }

        const data = await response.json();
        activeCampaigns = Array.isArray(data.data) ? data.data : (data.data?.campaigns || []);

        // Filter active campaigns (not completed)
        const active = activeCampaigns.filter(c => (c.campaignStatus || c.status) !== 'COMPLETED').slice(0, 2);

        renderActiveCampaigns(active);

    } catch (error) {
        console.error('Error loading active campaigns:', error);
        renderEmptyActiveCampaigns();
    }
}

function getCampaignId(campaign) {
    return campaign?.id || campaign?._id || campaign?.campaignId || campaign?.campaign?.id || campaign?.campaign?._id || '';
}

function getCampaignTitle(campaign) {
    return campaign?.title || campaign?.name || campaign?.campaign?.title || campaign?.campaign?.name || 'Campaign';
}

/**
 * Render Active Campaigns (Overview Preview)
 */
function renderActiveCampaigns(campaigns) {
    const container = document.getElementById('activeCampaignsContainer');
    if (!container) return;

    if (campaigns.length === 0) {
        renderEmptyActiveCampaigns();
        return;
    }

    container.innerHTML = campaigns.map(campaign => {
        const campaignId = getCampaignId(campaign);
        const campaignTitle = getCampaignTitle(campaign);
        const campaignImg = campaign.imageUrl || campaign.image || '../assets/images/placeholder-campaign.jpg';
        const categoryName = (typeof campaign.category === 'object') ? campaign.category.name : (campaign.category || 'General');
        const campaignStatus = campaign.campaignStatus || campaign.status || 'PENDING';
        const progress = calculateProgress(campaign);

        return `
            <div class="campaign-card-mini">
                <div class="campaign-card-img-container">
                    <img src="${campaignImg}" alt="${campaignTitle}" class="campaign-card-img" onerror="this.src='../assets/images/placeholder-campaign.jpg'">
                    <span class="campaign-card-badge">${categoryName}</span>
                </div>
                <div class="campaign-card-content">
                    <h3 class="campaign-card-title">${escapeHtml(campaignTitle)}</h3>
                    <p class="campaign-card-description">${escapeHtml(campaign.description || '').substring(0, 80)}...</p>

                    <div class="campaign-card-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>${formatCurrency(campaign.amountRaised)}</span>
                            <span class="goal-text">of ${formatCurrency(campaign.goalAmount || campaign.goal)}</span>
                        </div>
                    </div>

                    <div class="campaign-card-stats">
                        <span><i class="fas fa-heart"></i> ${campaign.donors || 0} donors</span>
                        <span class="campaign-status-badge ${campaignStatus.toLowerCase()}">${campaignStatus}</span>
                    </div>

                    <div class="campaign-card-actions">
                        <a href="campaign-details.html?id=${campaignId}" class="btn btn-sm btn-outline">View</a>
                        <button type="button" class="btn btn-sm btn-primary" onclick="openEditCampaign('${campaignId}')">Edit</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render Empty Active Campaigns
 */
function renderEmptyActiveCampaigns() {
    const container = document.getElementById('activeCampaignsContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="empty-dashboard-state w-full">
            <i class="fas fa-bullhorn"></i>
            <h4>No active campaigns found</h4>
            <p>Get started by creating a fundraising campaign for a worthy cause.</p>
            <a href="#create" class="btn btn-primary btn-sm" onclick="switchTab('create')">Create Campaign</a>
        </div>
    `;
}

/**
 * Load Full Campaigns List (Campaigns Tab)
 */
async function loadFullCampaigns() {
    const container = document.getElementById('fullCampaignsGrid');
    if (container) container.innerHTML = '<div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;"><i class="fas fa-spinner fa-spin"></i><p>Loading campaigns...</p></div>';

    try {
        const response = await fetch(API.MY_CAMPAIGNS, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch campaigns');

        const data = await response.json();
        const campaigns = Array.isArray(data.data) ? data.data : (data.data?.campaigns || []);
        
        renderFullCampaigns(campaigns);

    } catch (error) {
        console.error('Error loading full campaigns:', error);
        if (container) container.innerHTML = '<p class="error-msg">Failed to load campaigns. Please try again.</p>';
    }
}

async function loadEditCampaigns() {
    const container = document.getElementById('editCampaignsGrid');
    if (container) container.innerHTML = '<div class="loading-state" style="padding: 3rem; text-align: center;"><i class="fas fa-spinner fa-spin"></i><p>Loading campaigns for editing...</p></div>';

    try {
        const response = await fetch(API.MY_CAMPAIGNS, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch campaigns');

        const data = await response.json();
        const campaigns = Array.isArray(data.data) ? data.data : (data.data?.campaigns || []);
        renderEditCampaigns(campaigns);
    } catch (error) {
        console.error('Error loading edit campaigns:', error);
        if (container) container.innerHTML = '<p class="error-msg">Failed to load your campaigns. Please refresh the page.</p>';
    }
}

function renderEditCampaigns(campaigns) {
    const container = document.getElementById('editCampaignsGrid');
    if (!container) return;

    if (campaigns.length === 0) {
        container.innerHTML = `
            <div class="empty-dashboard-state">
                <i class="fas fa-bullhorn"></i>
                <h4>No campaigns to edit</h4>
                <p>Once you've created a campaign, it will appear here for editing.</p>
                <a href="#create" class="btn btn-primary" onclick="switchTab('create')">Create Campaign</a>
            </div>
        `;
        return;
    }

    container.innerHTML = campaigns.map(campaign => {
        const campaignId = getCampaignId(campaign);
        const campaignTitle = getCampaignTitle(campaign);
        const campaignStatus = campaign.campaignStatus || campaign.status || 'PENDING';
        return `
            <div class="campaign-card-mini">
                <div class="campaign-card-content">
                    <span class="campaign-status-badge ${campaignStatus.toLowerCase()}">${campaignStatus}</span>
                    <h3 class="campaign-card-title">${escapeHtml(campaignTitle)}</h3>
                    <p class="campaign-card-description">${escapeHtml(campaign.description || '').substring(0, 100)}...</p>
                    <div class="campaign-card-actions">
                        <button type="button" class="btn btn-sm btn-primary" style="flex: 1;" onclick="openEditCampaign('${campaignId}')"><i class="fas fa-edit"></i> Edit</button>
                        <a href="campaign-details.html?id=${campaignId}" class="btn btn-sm btn-outline"><i class="fas fa-eye"></i> View</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render Full Campaigns List
 */
function renderFullCampaigns(campaigns) {
    const container = document.getElementById('fullCampaignsGrid');
    if (!container) return;

    if (campaigns.length === 0) {
        container.innerHTML = `
            <div class="empty-dashboard-state" style="grid-column: 1 / -1;">
                <i class="fas fa-bullhorn"></i>
                <h4>No campaigns yet</h4>
                <p>You haven't created any campaigns. Start one today!</p>
                <a href="#create" class="btn btn-primary" onclick="switchTab('create')">Create Campaign</a>
            </div>
        `;
        return;
    }

    container.innerHTML = campaigns.map(campaign => {
        const campaignId = getCampaignId(campaign);
        const campaignTitle = getCampaignTitle(campaign);
        const campaignImg = campaign.imageUrl || campaign.image || '../assets/images/placeholder-campaign.jpg';
        const categoryName = (typeof campaign.category === 'object') ? campaign.category.name : (campaign.category || 'General');
        const campaignStatus = campaign.campaignStatus || campaign.status || 'PENDING';
        const progress = calculateProgress(campaign);

        return `
        <div class="campaign-card-mini">
            <div class="campaign-card-img-container" style="height: 200px;">
                <img src="${campaignImg}" alt="${campaignTitle}" class="campaign-card-img" onerror="this.src='../assets/images/placeholder-campaign.jpg'">
                <span class="campaign-card-badge">${categoryName}</span>
            </div>
            <div class="campaign-card-content">
                <span class="campaign-status-badge ${campaignStatus.toLowerCase()}" style="align-self: flex-start; margin-bottom: 0.75rem;">${campaignStatus}</span>
                <h3 class="campaign-card-title" style="white-space: normal; -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical;">${escapeHtml(campaignTitle)}</h3>
                
                <div class="campaign-card-progress" style="margin-top: 1rem;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${formatCurrency(campaign.amountRaised)}</span>
                        <span>${progress}% funded</span>
                    </div>
                </div>

                <div class="campaign-card-stats">
                    <span><i class="fas fa-heart"></i> ${campaign.donors || 0} donors</span>
                    <span>Goal: ${formatCurrency(campaign.goalAmount || campaign.goal)}</span>
                </div>

                <div class="campaign-card-actions">
                    <a href="campaign-details.html?id=${campaignId}" class="btn btn-sm btn-outline"><i class="fas fa-eye"></i></a>
                    <button type="button" class="btn btn-sm btn-primary" style="flex: 1;" onclick="openEditCampaign('${campaignId}')"><i class="fas fa-edit"></i> Edit</button>
                    <button type="button" onclick="openDeleteModal('${campaignId}')" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `}).join('');
}

/**
 * Load Recent Donations (Overview Tab)
 */
async function loadRecentDonations() {
    try {
        const response = await fetch(API.MY_DONATIONS, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch donations');
        }

        const data = await response.json();
        recentDonations = Array.isArray(data.data) ? data.data : (data.data?.donations || []);

        // Get recent 5 donations
        const recent = recentDonations.slice(0, 5);

        renderRecentDonations(recent);

    } catch (error) {
        console.error('Error loading recent donations:', error);
        renderEmptyDonations();
    }
}

/**
 * Render Recent Donations (Overview Table)
 */
function renderRecentDonations(donations) {
    const container = document.getElementById('recentDonationsContainer');
    if (!container) return;

    if (donations.length === 0) {
        renderEmptyDonations();
        return;
    }

    container.innerHTML = donations.map(donation => {
        const date = new Date(donation.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const campaignId = donation.campaignId || donation.campaign?.id || donation.campaign?._id || '';
        const campaignTitle = donation.campaignTitle || donation.campaign?.title || donation.campaign?.name || 'Campaign';
        const donationStatus = donation.donationStatus || donation.status || 'SUCCESS';

        return `
            <tr>
                <td class="campaign-name-cell">
                    <span>${escapeHtml(campaignTitle)}</span>
                </td>
                <td>${formattedDate}</td>
                <td class="amount-cell">${formatCurrency(donation.amount)}</td>
                <td>
                    <span class="status-badge ${donationStatus.toLowerCase()}">
                        ${donationStatus}
                    </span>
                </td>
                <td class="action-cell">
                    <a href="campaign-details.html?id=${campaignId}" class="action-link">
                        <i class="fas fa-eye"></i> View
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Load Full Donation History (Donations Tab)
 */
async function loadFullDonations() {
    const container = document.getElementById('fullDonationsContainer');
    if (container) container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 3rem;"><i class="fas fa-spinner fa-spin"></i><p>Loading donation history...</p></td></tr>';

    try {
        const response = await fetch(API.MY_DONATIONS, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch donations');

        const data = await response.json();
        const donations = Array.isArray(data.data) ? data.data : (data.data?.donations || []);
        
        renderFullDonations(donations);

    } catch (error) {
        console.error('Error loading full donations:', error);
        if (container) container.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Failed to load donation records.</td></tr>';
    }
}

/**
 * Render Full Donation History
 */
function renderFullDonations(donations) {
    const container = document.getElementById('fullDonationsContainer');
    if (!container) return;

    if (donations.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 4rem 2rem;">
                    <div class="empty-dashboard-state">
                        <i class="fas fa-hand-holding-heart"></i>
                        <h4>No donations yet</h4>
                        <p>Explore campaigns and start making an impact today.</p>
                        <a href="campaigns.html" class="btn btn-primary btn-sm">Explore Campaigns</a>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = donations.map(donation => {
        const date = new Date(donation.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const reference = donation.paymentReference || donation.payment_reference || 'N/A';
        const campaignTitle = donation.campaignTitle || donation.campaign?.title || donation.campaign?.name || 'Campaign';
        const donationStatus = donation.donationStatus || donation.status || 'SUCCESS';

        return `
            <tr>
                <td class="campaign-name-cell">
                    <div class="support-campaign-title">${escapeHtml(campaignTitle)}</div>
                </td>
                <td style="font-family: monospace; font-size: 0.75rem; color: #6b7280;">${reference}</td>
                <td>${formattedDate}</td>
                <td class="amount-cell">${formatCurrency(donation.amount)}</td>
                <td>
                    <span class="status-badge ${donationStatus.toLowerCase()}">
                        <i class="fas ${donationStatus.toLowerCase() === 'success' || donationStatus.toLowerCase() === 'completed' ? 'fa-check-circle' : 'fa-clock'}"></i>
                        ${donationStatus}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render Empty Donations
 */
function renderEmptyDonations() {
    const container = document.getElementById('recentDonationsContainer');
    if (!container) return;

    container.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 3rem 0; color: var(--gray);">
                <div class="empty-dashboard-state">
                    <i class="fas fa-hand-holding-heart"></i>
                    <h4>No donations made yet</h4>
                    <p>Explore existing campaigns and contribute to make a difference.</p>
                    <a href="campaigns.html" class="btn btn-primary btn-sm">Explore Campaigns</a>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Campaign Deletion Logic
 */
function openDeleteModal(campaignId) {
    campaignToDelete = campaignId;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('show');
}

function closeDeleteModal() {
    campaignToDelete = null;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('show');
}

async function confirmDelete() {
    if (!campaignToDelete) return;

    try {
        const response = await fetch(`${API.CAMPAIGNS}/${campaignToDelete}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            // Updated feedback system if available, else alert
            if (typeof showToast === 'function') {
                showToast('Campaign deleted successfully', 'success');
            } else {
                alert('Campaign deleted successfully');
            }
            
            closeDeleteModal();
            // Refresh campaigns tab
            loadFullCampaigns();
            // Also refresh overview stats
            loadDashboardStats();
        } else {
            console.error('Delete failed:', data.message);
            alert('Failed to delete campaign: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('An error occurred while deleting the campaign.');
    }
}

/**
 * Helper: Update Statistic Display
 */
function updateStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Helper: Calculate Progress Percentage
 */
function calculateProgress(campaign) {
    const goal = campaign.goalAmount || campaign.goal;
    if (!goal || goal === 0) return 0;
    const percentage = ((campaign.amountRaised || 0) / goal) * 100;
    return Math.min(Math.round(percentage), 100);
}

/**
 * Helper: Format Currency
 */
function formatCurrency(amount) {
    if (!amount) return '₦0';
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Helper: Show Error Notification
 */
function showErrorNotification(message) {
    console.error(message);
    // Optionally display toast notification
}

/**
 * Helper: Redirect to Login
 */
function redirectToLogin() {
    window.location.href = 'login.html';
}

/**
 * Event Listeners
 */

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Handle hash changes for tab navigation
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1);
    const activeTab = document.querySelector('.tab-content.active');
    const activeTabId = activeTab ? activeTab.id.replace('tab-', '') : null;
    
    if (hash && hash !== activeTabId && ['overview', 'campaigns', 'donations'].includes(hash)) {
        switchTab(hash);
    }
});

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal && e.target === deleteModal) {
        closeDeleteModal();
    }
});

// Close modals with Escape key
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDeleteModal();
    }
});
