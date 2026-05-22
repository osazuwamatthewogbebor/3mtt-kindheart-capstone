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
        const response = await fetch(API.PUBLIC_STATS);
        const result = await response.json();
        const data = result.data || result;
        
        if (result.success || data.donations !== undefined) {
            document.getElementById('totalDonations').textContent = formatCurrency(data.donations || data.totalDonations || 0);
            document.getElementById('totalCampaigns').textContent = data.campaigns || data.totalCampaigns || 0;
            document.getElementById('totalUsers').textContent = data.users || data.totalUsers || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load featured campaigns
async function loadFeaturedCampaigns() {
    try {
        const response = await fetch(`${API.CAMPAIGNS}?limit=6`);
        const result = await response.json();
        const data = result.data || result.campaigns || result;
        
        const container = document.getElementById('featuredCampaigns');
        
        const campaigns = Array.isArray(data) ? data : (data.campaigns || []);
        
        if (campaigns.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-inbox"></i>
                    <p>No campaigns available yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        campaigns.forEach(campaign => {
            const progress = calculateProgress(campaign.amountRaised || campaign.raised_amount, campaign.goalAmount || campaign.goal_amount);
            
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.innerHTML = `
                <img src="${campaign.imageUrl || 'https://via.placeholder.com/400x200?text=Campaign+Image'}"
     alt="${campaign.title}"
     class="campaign-image">
                <div class="campaign-content">
                    <span class="campaign-category">${campaign.categoryName || 'General'}</span>
                    <h3 class="campaign-title">${campaign.title}</h3>
                    <p class="campaign-description">${campaign.description}</p>
                    <div class="campaign-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="campaign-stats">
                            <div class="stat">
                                <span class="stat-value">${formatCurrency(campaign.amountRaised)}</span>
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
