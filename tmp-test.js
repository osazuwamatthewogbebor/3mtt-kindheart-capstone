function getCampaignId(campaign) {
    return campaign?.id || campaign?._id || campaign?.campaignId || campaign?.campaign?.id || campaign?.campaign?._id || '';
}

function getCampaignTitle(campaign) {
    return campaign?.title || campaign?.name || campaign?.campaign?.title || campaign?.campaign?.name || 'Campaign';
}

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
    `}).join('');
}
