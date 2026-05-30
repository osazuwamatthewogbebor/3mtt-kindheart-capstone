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
        if (hash && ['overview', 'campaigns', 'donations'].includes(hash)) {
            switchTab(hash);
        }

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showErrorNotification('Failed to load dashboard. Please refresh the page.');
    }
}

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
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : new Date().getFullYear();

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
        const totalDonated = donations.reduce((sum, donation) => {
            const status = donation.donationStatus || donation.status || '';
            if (status === 'SUCCESS' || status === 'COMPLETED' || status === '') {
                return sum + (donation.amount || 0);
            }
            return sum;
        }, 0);

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
                        <div class="progress-fill" style="width: ${calculateProgress(campaign)}%"></div>
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
                    <a href="edit-campaign.html?id=${campaignId}" class="btn btn-sm btn-primary">Edit</a>
                </div>
            </div>
        </div>
    `).join('');
}

/**
