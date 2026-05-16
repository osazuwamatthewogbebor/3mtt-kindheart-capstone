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

function getCampaignDate(campaign) {
    return new Date(campaign.createdAt || campaign.created_at || campaign.updatedAt || campaign.updated_at || 0).getTime();
}

function sortCampaignList(campaigns, sort) {
    const sorted = [...campaigns];

    if (sort === 'popular') {
        sorted.sort((a, b) => {
            const raisedA = Number(a.amountRaised || a.raised_amount || 0);
            const raisedB = Number(b.amountRaised || b.raised_amount || 0);
            return raisedB - raisedA;
        });
        return sorted;
    }

    if (sort === 'ending') {
        sorted.sort((a, b) => {
            const endA = new Date(a.endDate || a.end_date || Number.MAX_SAFE_INTEGER).getTime();
            const endB = new Date(b.endDate || b.end_date || Number.MAX_SAFE_INTEGER).getTime();
            return endA - endB;
        });
        return sorted;
    }

    // Default: recent
    sorted.sort((a, b) => getCampaignDate(b) - getCampaignDate(a));
    return sorted;
}

async function loadCampaigns() {
    try {
        const searchQuery = document.getElementById('searchInput')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const sort = document.getElementById('sortFilter')?.value || '';
        
        let url = `${API.CAMPAIGNS}?status=ACTIVE&limit=${limit}&page=${currentPage}`;
        
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        // Defensive data parsing - handles both direct and nested data structures
        const data = result.data || result;
        const campaigns = Array.isArray(data.campaigns) ? data.campaigns : (Array.isArray(data) ? data : []);
        const sortedCampaigns = sortCampaignList(campaigns, sort);
        const totalItems = data.total || campaigns.length;
        const totalPages = data.totalPages || Math.ceil(totalItems / limit);
        const container = document.getElementById('campaignsGrid');
        
        if (!sortedCampaigns || sortedCampaigns.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-inbox"></i>
                    <p>No campaigns found</p>
                </div>
            `;
            updatePagination(0);
            return;
        }
        
        container.innerHTML = '';
        
        sortedCampaigns.forEach(campaign => {
            const raised = campaign.amountRaised || campaign.raised_amount || 0;
            const goal = campaign.goalAmount || campaign.goal_amount || 0;
            const progress = calculateProgress(raised, goal);
            
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.innerHTML = `
                <img src="${campaign.imageUrl || 'https://via.placeholder.com/400x200?text=Campaign+Image'}" 
                     alt="${campaign.title}" 
                     class="campaign-image"
                     onerror="this.src='https://via.placeholder.com/400x200?text=Campaign+Image'">
                <div class="campaign-content">
                    <span class="campaign-category">${campaign.categoryName || campaign.category?.name || 'General'}</span>
                    <h3 class="campaign-title">${campaign.title}</h3>
                    <p class="campaign-description">${campaign.description?.substring(0, 100)}...</p>
                    <div class="campaign-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="campaign-stats">
                            <div class="stat">
                                <span class="stat-value">${formatCurrency(raised)}</span>
                                <span class="stat-label">Raised of ${formatCurrency(goal)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${progress}%</span>
                                <span class="stat-label">Funded</span>
                            </div>
                        </div>
                    </div>
                    <a href="campaign-details.html?id=${campaign.id || campaign._id}" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                        <i class="fas fa-heart"></i> Support This Campaign
                    </a>
                </div>
            `;
            
            container.appendChild(card);
        });
        
        updatePagination(totalPages);
        
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

function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    // Next button
    html += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCampaigns();
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
