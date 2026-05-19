// My Donations Page - Script
// Handles user's donations list and statistics

// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

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

document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// Load donations
async function loadDonations() {
    try {
        const response = await fetch(API.MY_DONATIONS, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const container = document.getElementById('donationsList');
        
        if (!data.success || data.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <h3>No Donations Yet</h3>
                    <p>Start supporting campaigns and make a difference today!</p>
                    <a href="campaigns.html" class="btn btn-primary btn-lg">
                        <i class="fas fa-search"></i> Browse Campaigns
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        // Calculate stats
        let totalAmount = 0;
        let successfulDonations = 0;
        const uniqueCampaigns = new Set();

        data.data.forEach(donation => {
            const status = donation.paymentStatus || donation.payment_status;
            if (status === 'SUCCESS') {
                totalAmount += parseFloat(donation.amount);
                successfulDonations++;
            }
            uniqueCampaigns.add(donation.campaignId || donation.campaign_id);

            const statusClass = status === 'SUCCESS' ? 'success' : 
                              status === 'PENDING' ? 'pending' : 'failed';
            
            const row = document.createElement('div');
            row.className = 'donation-row';
            row.innerHTML = `
                <div class="campaign-info">
                    <h4>${donation.campaignTitle || donation.campaign_title}</h4>
                    <p>Reference: ${donation.paymentReference || donation.payment_reference}</p>
                </div>
                <div class="donation-amount">${formatCurrency(donation.amount)}</div>
                <div class="donation-date">${formatDate(donation.createdAt || donation.created_at)}</div>
                <div>
                    <span class="status-badge ${statusClass}">
                        <i class="fas ${statusClass === 'success' ? 'fa-check-circle' : 
                                       statusClass === 'pending' ? 'fa-clock' : 'fa-times-circle'}"></i>
                        ${status}
                    </span>
                </div>
            `;
            
            container.appendChild(row);
        });

        // Update stats
        document.getElementById('totalDonations').textContent = successfulDonations;
        document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
        document.getElementById('campaignsSupported').textContent = uniqueCampaigns.size;
        
    } catch (error) {
        console.error('Error loading donations:', error);
        document.getElementById('donationsList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Donations</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// Initialize
loadDonations();
