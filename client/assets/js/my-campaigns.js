// My Campaigns Page - Script
// Handles user's campaigns display, editing, and deletion

let campaignToDelete = null;

// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

// Update user info
const user = JSON.parse(localStorage.getItem('user'));
if (user) {
    document.getElementById('userName').textContent = user.name;
    if (user.role === 'ADMIN') {
        document.getElementById('adminLink').style.display = 'flex';
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

// Load user's campaigns
async function loadMyCampaigns() {
    try {
        const response = await fetch(API.MY_CAMPAIGNS, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        
        const container = document.getElementById('campaignsGrid');
        
        if (!data.success || data.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <h3>No Campaigns Yet</h3>
                    <p>Start your fundraising journey by creating your first campaign!</p>
                    <a href="create-campaign.html" class="btn btn-primary btn-lg">
                        <i class="fas fa-plus"></i> Create Your First Campaign
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        // Calculate stats
        let totalRaised = 0;
        let activeCampaigns = 0;

        data.data.forEach(campaign => {
            totalRaised += parseFloat(campaign.amountRaised || campaign.raised_amount || 0);
            if (campaign.status === 'ACTIVE') activeCampaigns++;

            const progress = calculateProgress(campaign.amountRaised || campaign.raised_amount, campaign.goalAmount || campaign.goal_amount);
            
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.innerHTML = `
                <img src="${campaign.imageUrl || campaign.image || 'https://via.placeholder.com/400x200?text=Campaign+Image'}" 
                     alt="${campaign.title}" 
                     class="campaign-image"
                     onerror="this.src='https://via.placeholder.com/400x200?text=Campaign+Image'">
                <div class="campaign-content">
                    <span class="campaign-category">${campaign.categoryName || campaign.category_name || 'General'}</span>
                    <h3 class="campaign-title">${campaign.title}</h3>
                    <p class="campaign-description">${campaign.description}</p>
                    <div class="campaign-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="campaign-stats">
                            <div class="stat">
                                <span class="stat-value">${formatCurrency(campaign.amountRaised || campaign.raised_amount)}</span>
                                <span class="stat-label">Raised of ${formatCurrency(campaign.goalAmount || campaign.goal_amount)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${progress}%</span>
                                <span class="stat-label">Funded</span>
                            </div>
                        </div>
                    </div>
                    <div class="campaign-actions">
                        <a href="campaign-details.html?id=${campaign.id}" class="btn btn-outline btn-sm" style="flex: 1;">
                            <i class="fas fa-eye"></i> View
                        </a>
                        <a href="edit-campaign.html?id=${campaign.id}" class="btn btn-primary btn-sm" style="flex: 1;">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                        <button onclick="openDeleteModal('${campaign.id}')" class="btn btn-danger btn-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });

        // Update stats
        document.getElementById('totalCampaigns').textContent = data.data.length;
        document.getElementById('activeCampaigns').textContent = activeCampaigns;
        document.getElementById('totalRaised').textContent = formatCurrency(totalRaised);
        
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

function openDeleteModal(campaignId) {
    campaignToDelete = campaignId;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    campaignToDelete = null;
    document.getElementById('deleteModal').classList.remove('show');
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
            showToast('Campaign deleted successfully!', 'success');
            closeDeleteModal();
            loadMyCampaigns();
        } else {
            showToast(data.message || 'Failed to delete campaign', 'error');
        }
    } catch (error) {
        console.error('Error deleting campaign:', error);
        showToast('Error deleting campaign. Please try again.', 'error');
    }
}

// Initialize
loadMyCampaigns();
