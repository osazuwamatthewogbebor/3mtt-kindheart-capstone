/**
 * USER DASHBOARD - KindHeart Platform
 * Handles dashboard data loading, statistics, campaigns, and donations
 * Properly integrates with API endpoints and displays user profile data
 */

let currentUser = null;
let activeCampaigns = [];
let recentDonations = [];

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

        // Load dashboard data
        await Promise.all([
            loadDashboardStats(),
            loadActiveCampaigns(),
            loadRecentDonations()
        ]);

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showErrorNotification('Failed to load dashboard. Please refresh the page.');
    }
}

/**
 * Load User Profile
 */
async function loadUserProfile() {
    try {
        const response = await fetch(API.ME, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                redirectToLogin();
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
        // Try to use local user data as fallback
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

    const displayName = user.name || user.username || 'User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '2024';

    // Update sidebar profile
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
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
        // Fetch user's campaigns and donations to calculate stats
        const [campaignsRes, donationsRes] = await Promise.all([
            fetch(API.MY_CAMPAIGNS, { headers: getAuthHeaders() }),
            fetch(API.MY_DONATIONS, { headers: getAuthHeaders() })
        ]);

        let campaigns = [];
        let donations = [];

        if (campaignsRes.ok) {
            const campaignsData = await campaignsRes.json();
            campaigns = Array.isArray(campaignsData.data) ? campaignsData.data : (campaignsData.data?.campaigns || []);
        }

        if (donationsRes.ok) {
            const donationsData = await donationsRes.json();
            donations = Array.isArray(donationsData.data) ? donationsData.data : (donationsData.data?.donations || []);
        }

        // Calculate statistics
        const totalRaised = campaigns.reduce((sum, campaign) => sum + (campaign.amountRaised || 0), 0);
        const totalCampaigns = campaigns.length;
        const totalDonated = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);

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
 * Load Active Campaigns
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
        const active = activeCampaigns.filter(c => c.status !== 'COMPLETED').slice(0, 2);

        renderActiveCampaigns(active);

    } catch (error) {
        console.error('Error loading active campaigns:', error);
        renderEmptyActiveCampaigns();
    }
}

/**
 * Render Active Campaigns
 */
function renderActiveCampaigns(campaigns) {
    const container = document.getElementById('activeCampaignsContainer');
    if (!container) return;

    if (campaigns.length === 0) {
        renderEmptyActiveCampaigns();
        return;
    }

    container.innerHTML = campaigns.map(campaign => `
        <div class="campaign-card-mini">
            <div class="campaign-card-img-container">
                <img src="${campaign.image || '../assets/image/Relief for Flood Victims.jfif'}" alt="${campaign.title}" class="campaign-card-img">
                <span class="campaign-card-badge">${campaign.category || 'General'}</span>
            </div>
            <div class="campaign-card-content">
                <h3 class="campaign-card-title">${escapeHtml(campaign.title)}</h3>
                <p class="campaign-card-description">${escapeHtml(campaign.description).substring(0, 80)}...</p>
                
                <div class="campaign-card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${calculateProgress(campaign)}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${formatCurrency(campaign.amountRaised)}</span>
                        <span class="goal-text">of ${formatCurrency(campaign.goal)}</span>
                    </div>
                </div>

                <div class="campaign-card-stats">
                    <span><i class="fas fa-heart"></i> ${campaign.donors || 0} donors</span>
                    <span class="campaign-status-badge ${campaign.status.toLowerCase()}">${campaign.status}</span>
                </div>

                <div class="campaign-card-actions">
                    <a href="campaign-details.html?id=${campaign.id}" class="btn btn-sm btn-outline">View</a>
                    <a href="edit-campaign.html?id=${campaign.id}" class="btn btn-sm btn-primary">Edit</a>
                </div>
            </div>
        </div>
    `).join('');
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
            <a href="create-campaign.html" class="btn btn-primary btn-sm">Create Campaign</a>
        </div>
    `;
}

/**
 * Load Recent Donations
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
 * Render Recent Donations
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

        return `
            <tr>
                <td class="campaign-name-cell">
                    <span>${escapeHtml(donation.campaignTitle || 'Campaign')}</span>
                </td>
                <td>${formattedDate}</td>
                <td class="amount-cell">${formatCurrency(donation.amount)}</td>
                <td>
                    <span class="status-badge ${donation.status.toLowerCase()}">
                        ${donation.status}
                    </span>
                </td>
                <td class="action-cell">
                    <a href="campaign-details.html?id=${donation.campaignId}" class="action-link">
                        <i class="fas fa-eye"></i> View Campaign
                    </a>
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
    if (!campaign.goal || campaign.goal === 0) return 0;
    const percentage = (campaign.amountRaised / campaign.goal) * 100;
    return Math.min(percentage, 100);
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
 * MODAL FUNCTIONS
 */

/**
 * Open Campaigns Modal
 */
function openCampaignsModal() {
    const modal = document.getElementById('campaignsModal');
    if (modal) {
        modal.classList.add('show');
        renderAllCampaigns();
    }
}

/**
 * Close Campaigns Modal
 */
function closeCampaignsModal() {
    const modal = document.getElementById('campaignsModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Open Donations Modal
 */
function openDonationsModal() {
    const modal = document.getElementById('donationsModal');
    if (modal) {
        modal.classList.add('show');
        renderAllDonations();
    }
}

/**
 * Close Donations Modal
 */
function closeDonationsModal() {
    const modal = document.getElementById('donationsModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Render All Campaigns in Modal
 */
function renderAllCampaigns() {
    const container = document.getElementById('allCampaignsContainer');
    if (!container) return;

    if (activeCampaigns.length === 0) {
        container.innerHTML = `
            <div class="empty-dashboard-state" style="grid-column: 1 / -1;">
                <i class="fas fa-bullhorn"></i>
                <h4>No campaigns found</h4>
                <p>Get started by creating a fundraising campaign for a worthy cause.</p>
                <a href="create-campaign.html" class="btn btn-primary btn-sm">Create Campaign</a>
            </div>
        `;
        return;
    }

    container.innerHTML = activeCampaigns.map(campaign => `
        <div class="modal-campaign-card">
            <img src="${campaign.image || '../assets/image/Relief for Flood Victims.jfif'}" alt="${campaign.title}" class="modal-campaign-img">
            <div class="modal-campaign-info">
                <h3 class="modal-campaign-title">${escapeHtml(campaign.title)}</h3>
                <p class="modal-campaign-desc">${escapeHtml(campaign.description).substring(0, 100)}...</p>
                
                <div class="modal-campaign-stats">
                    <div class="modal-campaign-stat">
                        <span class="modal-campaign-stat-value">${formatCurrency(campaign.amountRaised)}</span>
                        <div class="modal-campaign-stat">of ${formatCurrency(campaign.goal)}</div>
                    </div>
                    <span class="campaign-status-badge ${campaign.status.toLowerCase()}">${campaign.status}</span>
                </div>

                <div class="modal-campaign-actions">
                    <a href="campaign-details.html?id=${campaign.id}" class="btn btn-sm btn-outline">View</a>
                    <a href="edit-campaign.html?id=${campaign.id}" class="btn btn-sm btn-primary">Edit</a>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Render All Donations in Modal
 */
function renderAllDonations() {
    const container = document.getElementById('allDonationsContainer');
    if (!container) return;

    if (recentDonations.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem 0;">
                    <div class="empty-dashboard-state">
                        <i class="fas fa-hand-holding-heart"></i>
                        <h4>No donations made yet</h4>
                        <p>Explore existing campaigns and contribute to make a difference.</p>
                        <a href="campaigns.html" class="btn btn-primary btn-sm">Explore Campaigns</a>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = recentDonations.map(donation => {
        const date = new Date(donation.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        return `
            <tr>
                <td class="campaign-name-cell">
                    <span>${escapeHtml(donation.campaignTitle || 'Campaign')}</span>
                </td>
                <td>${formattedDate}</td>
                <td class="amount-cell">${formatCurrency(donation.amount)}</td>
                <td>
                    <span class="status-badge ${donation.status.toLowerCase()}">
                        ${donation.status}
                    </span>
                </td>
                <td class="action-cell">
                    <a href="campaign-details.html?id=${donation.campaignId}" class="action-link">
                        <i class="fas fa-eye"></i> View
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Close modals when clicking outside
 */
window.addEventListener('click', function(e) {
    const campaignsModal = document.getElementById('campaignsModal');
    const donationsModal = document.getElementById('donationsModal');

    if (campaignsModal && e.target === campaignsModal) {
        closeCampaignsModal();
    }
    if (donationsModal && e.target === donationsModal) {
        closeDonationsModal();
    }
});

/**
 * Close modals with Escape key
 */
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCampaignsModal();
        closeDonationsModal();
    }
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);
