// Mobile menu toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Load dashboard stats
async function loadStats() {
    try {
        const response = await fetch(API.ADMIN_STATS);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalDonations').textContent = formatCurrency(data.data.donations);
            document.getElementById('totalCampaigns').textContent = data.data.campaigns;
            document.getElementById('totalUsers').textContent = data.data.users;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load featured campaigns
async function loadFeaturedCampaigns() {
    try {
        const response = await fetch(`${API.CAMPAIGNS}?status=ACTIVE&limit=6`);
        const data = await response.json();
        
        const container = document.getElementById('featuredCampaigns');
        
        if (!data.success || data.data.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-inbox"></i>
                    <p>No campaigns available yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        data.data.forEach(campaign => {
            const progress = calculateProgress(campaign.raised_amount, campaign.goal_amount);
            
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.innerHTML = `
                <img src="${campaign.image ? `http://localhost:5000${campaign.image}` : 'https://via.placeholder.com/400x200?text=Campaign+Image'}"
     alt="${campaign.title}"
     class="campaign-image">
                <div class="campaign-content">
                    <span class="campaign-category">${campaign.category_name || 'General'}</span>
                    <h3 class="campaign-title">${campaign.title}</h3>
                    <p class="campaign-description">${campaign.description}</p>
                    <div class="campaign-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="campaign-stats">
                            <div class="stat">
                                <span class="stat-value">${formatCurrency(campaign.raised_amount)}</span>
                                <span class="stat-label">Raised</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${progress}%</span>
                                <span class="stat-label">Funded</span>
                            </div>
                        </div>
                    </div>
                    <a href="pages/campaign-details.html?id=${campaign.id}" class="btn btn-outline" style="width: 100%; justify-content: center; margin-top: 1rem;">
                        <i class="fas fa-heart"></i> Support This
                    </a>
                </div>
            `;
            
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        document.getElementById('featuredCampaigns').innerHTML = `
            <div class="loading-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading campaigns. Please try again later.</p>
            </div>
        `;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadFeaturedCampaigns();
});
