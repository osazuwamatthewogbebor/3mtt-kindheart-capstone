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
                    ${user.role === 'ADMIN' ? '<a href="admin-dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>' : ''}
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

// Filter state management
let filters = {
    search: '',
    categories: [],
    goalRange: 50000,
    status: [],
    sortBy: 'recent',
    page: 1
};

const LIMIT = 12;

// Get selected categories
function getSelectedCategories() {
    const checkboxes = document.querySelectorAll('.categoryCheck:checked');
    return Array.from(checkboxes).map(cb => cb.getAttribute('data-category')).filter(Boolean);
}

// Get selected statuses
function getSelectedStatuses() {
    const checkboxes = document.querySelectorAll('.statusCheck:checked');
    return Array.from(checkboxes).map(cb => cb.getAttribute('data-status')).filter(Boolean);
}

// Update goal range display
function updateGoalRangeDisplay() {
    const rangeInput = document.getElementById('goalRange');
    const rangeValue = document.getElementById('goalValue');
    if (rangeInput && rangeValue) {
        filters.goalRange = parseInt(rangeInput.value);
        rangeValue.textContent = filters.goalRange.toLocaleString();
    }
}

// Sort campaigns list
function sortCampaignList(campaigns, sortBy) {
    const sorted = [...campaigns];

    if (sortBy === 'popular') {
        sorted.sort((a, b) => {
            const raisedA = Number(a.amountRaised || a.raised_amount || 0);
            const raisedB = Number(b.amountRaised || b.raised_amount || 0);
            return raisedB - raisedA;
        });
    } else if (sortBy === 'ending') {
        sorted.sort((a, b) => {
            const rawA = new Date(a.endDate || a.end_date || Number.MAX_SAFE_INTEGER).getTime();
            const rawB = new Date(b.endDate || b.end_date || Number.MAX_SAFE_INTEGER).getTime();
            const endA = Number.isFinite(rawA) ? rawA : Number.MAX_SAFE_INTEGER;
            const endB = Number.isFinite(rawB) ? rawB : Number.MAX_SAFE_INTEGER;
            return endA - endB;
        });
    } else {
        // Default: recent
        sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
            const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
            return dateB - dateA;
        });
    }

    return sorted;
}

// Client-side filter campaigns
function filterCampaigns(campaigns) {
    return campaigns.filter(campaign => {
        const raised = Number(campaign.amountRaised || campaign.raised_amount || 0);
        const goal = Number(campaign.goalAmount || campaign.goal_amount || 0);
        const categoryName = campaign.categoryName || campaign.category?.name || 'General';

        // Category filter
        if (filters.categories.length > 0 && !filters.categories.includes(categoryName)) {
            return false;
        }

        // Goal range filter
        if (goal > filters.goalRange) {
            return false;
        }

        // Status filter
        if (filters.status.length > 0) {
            const isActive = new Date(campaign.endDate || campaign.end_date) > new Date();
            const isFunded = raised >= goal;
            let matches = false;
            
            for (let status of filters.status) {
                if (status === 'active' && isActive && !isFunded) {
                    matches = true;
                    break;
                }
                if (status === 'near_goal' && !isFunded && raised >= goal * 0.8) {
                    matches = true;
                    break;
                }
            }
            
            if (!matches) return false;
        }

        return true;
    });
}

// Load and render campaigns
async function loadCampaigns() {
    try {
        const container = document.getElementById('campaignsGrid');
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading campaigns...</p>
            </div>
        `;

        // Build API URL with search parameter
        let url = `${API.CAMPAIGNS}?limit=100&page=1`;
        if (filters.search) {
            url += `&search=${encodeURIComponent(filters.search)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch campaigns');
        
        const result = await response.json();
        
        // Parse campaigns from response
        let allCampaigns = [];
        if (result.campaigns && Array.isArray(result.campaigns)) {
            allCampaigns = result.campaigns;
        } else if (result.data && Array.isArray(result.data)) {
            allCampaigns = result.data;
        } else if (Array.isArray(result)) {
            allCampaigns = result;
        }

        // Apply client-side filters
        let filtered = filterCampaigns(allCampaigns);
        let sorted = sortCampaignList(filtered, filters.sortBy);

        // Paginate
        const totalItems = sorted.length;
        const totalPages = Math.ceil(totalItems / LIMIT);
        const startIdx = (filters.page - 1) * LIMIT;
        const paginatedCampaigns = sorted.slice(startIdx, startIdx + LIMIT);

        if (paginatedCampaigns.length === 0) {
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

        paginatedCampaigns.forEach(campaign => {
            const raised = Number(campaign.amountRaised || campaign.raised_amount || 0);
            const goal = Number(campaign.goalAmount || campaign.goal_amount || 0);
            const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
            const categoryName = campaign.categoryName || campaign.category?.name || 'General';

            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.innerHTML = `
                <img src="${campaign.imageUrl || campaign.image || 'https://via.placeholder.com/400x200?text=Campaign+Image'}" 
                     alt="${campaign.title}" 
                     class="campaign-image"
                     onerror="this.src='https://via.placeholder.com/400x200?text=Campaign+Image'">
                <div class="campaign-content">
                    <span class="campaign-category">${categoryName}</span>
                    <h3 class="campaign-title">${campaign.title}</h3>
                    <p class="campaign-description">${(campaign.description || '').substring(0, 100)}${(campaign.description || '').length > 100 ? '...' : ''}</p>
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
                    <div class="campaign-actions">
                        <a href="campaign-details.html?id=${campaign.id || campaign._id}" class="btn btn-outline btn-sm" style="flex: 1;">
                            <i class="fas fa-eye"></i> View Details
                        </a>
                        <a href="campaign-details.html?id=${campaign.id || campaign._id}" class="btn btn-primary btn-sm" style="flex: 1;">
                            <i class="fas fa-heart"></i> Donate
                        </a>
                    </div>
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
        <button class="page-btn" ${filters.page === 1 ? 'disabled' : ''} onclick="changePage(${filters.page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= filters.page - 2 && i <= filters.page + 2)) {
            html += `
                <button class="page-btn ${i === filters.page ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === filters.page - 3 || i === filters.page + 3) {
            html += `<span class="page-dots">...</span>`;
        }
    }

    // Next button
    html += `
        <button class="page-btn" ${filters.page === totalPages ? 'disabled' : ''} onclick="changePage(${filters.page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = html;
}

function changePage(page) {
    filters.page = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCampaigns();
}

// Setup event listeners
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            filters.search = e.target.value;
            filters.page = 1;
            searchTimeout = setTimeout(() => {
                loadCampaigns();
            }, 500);
        });
    }

    // Category checkboxes
    const catAllCheckbox = document.getElementById('catAll');
    const categoryChecks = document.querySelectorAll('.categoryCheck');

    if (catAllCheckbox) {
        catAllCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                categoryChecks.forEach(cb => cb.checked = false);
                filters.categories = [];
            }
            filters.page = 1;
            loadCampaigns();
        });
    }

    categoryChecks.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (document.querySelector('.categoryCheck:checked')) {
                if (catAllCheckbox) catAllCheckbox.checked = false;
            }
            filters.categories = getSelectedCategories();
            filters.page = 1;
            loadCampaigns();
        });
    });

    // Goal range
    const goalRange = document.getElementById('goalRange');
    if (goalRange) {
        goalRange.addEventListener('input', () => {
            updateGoalRangeDisplay();
            filters.page = 1;
            loadCampaigns();
        });
        updateGoalRangeDisplay();
    }

    // Status checkboxes
    const statusChecks = document.querySelectorAll('.statusCheck');
    statusChecks.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            filters.status = getSelectedStatuses();
            filters.page = 1;
            loadCampaigns();
        });
    });

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            filters.sortBy = e.target.value;
            filters.page = 1;
            loadCampaigns();
        });
    }

    // Reset filters button
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            filters = {
                search: '',
                categories: [],
                goalRange: 50000,
                status: [],
                sortBy: 'recent',
                page: 1
            };

            if (catAllCheckbox) catAllCheckbox.checked = true;
            categoryChecks.forEach(cb => cb.checked = false);
            statusChecks.forEach(cb => cb.checked = false);
            if (goalRange) {
                goalRange.value = 50000;
                updateGoalRangeDisplay();
            }
            if (searchInput) searchInput.value = '';
            if (sortFilter) sortFilter.value = 'recent';

            loadCampaigns();
        });
    }

    // Handle URL category parameter
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        const checkbox = document.querySelector(`.categoryCheck[data-category="${categoryParam}"]`);
        if (checkbox) {
            if (catAllCheckbox) catAllCheckbox.checked = false;
            checkbox.checked = true;
            filters.categories = [categoryParam];
            filters.page = 1;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavActions();
    setupEventListeners();
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
