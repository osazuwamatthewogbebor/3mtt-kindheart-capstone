// Update nav actions based on login status
function updateNavActions() {
    const navActions = document.getElementById('navActions');
    if (!navActions) return;
    
    if (isLoggedIn()) {
        const user = JSON.parse(localStorage.getItem('user'));
        navActions.innerHTML = `
            <a href="my-campaigns.html" class="btn-link">My Campaigns</a>
            <a href="create-campaign.html" class="btn btn-primary">Create Campaign</a>
            <div class="user-menu">
                <button class="user-btn" onclick="toggleUserMenu()">
                    <i class="fas fa-user-circle"></i> ${user.name}
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
                    <a href="my-donations.html"><i class="fas fa-heart"></i> My Donations</a>
                    ${user.role === 'ADMIN' ? '<a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>' : ''}
                    <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        `;
    } else {
        navActions.innerHTML = `
            <a href="login.html" class="btn-link">Login</a>
            <a href="register.html" class="btn btn-primary">Get Started</a>
        `;
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// Load campaigns
let currentPage = 1;
const limit = 12;

async function loadCampaigns() {
    try {
        const searchQuery = document.getElementById('searchInput')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const sort = document.getElementById('sortFilter')?.value || '';
        
        let url = `${API.CAMPAIGNS}?status=ACTIVE&limit=${limit}&page=${currentPage}`;
        
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        
        const response = await fetch(url);
        const data = await response.json();

        
        const container = document.getElementById('campaignsGrid');
        
        if (!data.success || data.campaigns.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-inbox"></i>
                    <p>No campaigns found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        data.campaigns.forEach(campaign => {
            const progress = calculateProgress(campaign.amountRaised, campaign.goalAmount);
            
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.innerHTML = `
                <img src="${campaign.imageUrl || 'https://via.placeholder.com/400x200?text=Campaign+Image'}" 
                     alt="${campaign.title}" 
                     class="campaign-image"
                     onerror="this.src='https://via.placeholder.com/400x200?text=Campaign+Image'">
                <div class="campaign-content">
                    <span class="campaign-category">${campaign.name || 'General'}</span>
                    <h3 class="campaign-title">${campaign.title}</h3>
                    <p class="campaign-description">${campaign.description}</p>
                    <div class="campaign-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="campaign-stats">
                            <div class="stat">
                                <span class="stat-value">${formatCurrency(campaign.amountRaised)}</span>
                                <span class="stat-label">Raised of ${formatCurrency(campaign.goalAmount)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${progress}%</span>
                                <span class="stat-label">Funded</span>
                            </div>
                        </div>
                    </div>
                    <a href="campaign-details.html?id=${campaign.id}" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                        <i class="fas fa-heart"></i> Support This Campaign
                    </a>
                </div>
            `;
            
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        document.getElementById('campaignsGrid').innerHTML = `
            <div class="loading-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading campaigns. Please try again later.</p>
            </div>
        `;
    }
}

// Search and filter handlers
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');

if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadCampaigns();
        }, 500);
    });
}

if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
        currentPage = 1;
        loadCampaigns();
    });
}

if (sortFilter) {
    sortFilter.addEventListener('change', () => {
        currentPage = 1;
        loadCampaigns();
    });
}

// Get category from URL params
const urlParams = new URLSearchParams(window.location.search);
const categoryParam = urlParams.get('category');
if (categoryParam && categoryFilter) {
    categoryFilter.value = categoryParam;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateNavActions();
    loadCampaigns();
});

// Mobile menu
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}
