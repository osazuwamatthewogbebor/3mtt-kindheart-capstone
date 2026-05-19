// Campaign Details Page - Main Script
// Handles campaign loading, donations, sharing, and tab switching

const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get('id');
const paymentReference = urlParams.get('reference')
    || urlParams.get('trxref')
    || urlParams.get('transaction_reference')
    || urlParams.get('paymentReference')
    || urlParams.get('payment_reference');
const paymentStatus = (urlParams.get('status') || urlParams.get('payment_status') || '').toLowerCase();

if (!campaignId) {
    showToast('Campaign not found', 'error');
    window.location.href = 'campaigns.html';
}

// Update nav based on login
function updateNav() {
    const navActions = document.getElementById('navActions');
    if (isLoggedIn()) {
        const user = JSON.parse(localStorage.getItem('user'));
        navActions.innerHTML = `
            <a href="my-campaigns.html" class="btn-link">My Campaigns</a>
            <a href="create-campaign.html" class="btn btn-primary">Create Campaign</a>
        `;
    }
}

// Load campaign details
async function loadCampaign() {
    try {
        const response = await fetch(`${API.CAMPAIGNS}/${campaignId}`);
        const result = await response.json();

        const campaign = result.data?.campaign || result.campaign;

        if (!result.success || !campaign) {
            showToast('Campaign not found', 'error');
            window.location.href = 'campaigns.html';
            return;
        }

        const progress = calculateProgress(campaign.amountRaised, campaign.goalAmount);

        // Update page
        document.getElementById('campaignTitle').textContent = campaign.title;
        document.getElementById('campaignCategory').textContent = campaign?.category?.name || campaign?.categoryName || 'General';
        document.getElementById('creatorName').textContent = campaign?.user?.name || campaign?.creatorName || 'Creator';
        document.getElementById('creatorNameFull').textContent = campaign?.user?.name || campaign?.creatorName || 'Creator';
        document.getElementById('createdDate').textContent = formatDate(campaign.createdAt || campaign.created_at);
        document.getElementById('campaignImage').src = campaign.imageUrl || campaign.image || 'https://via.placeholder.com/800x500';
        document.getElementById('amountRaised').textContent = formatCurrency(campaign.amountRaised || campaign.raised_amount || 0);
        document.getElementById('goalAmount').textContent = formatCurrency(campaign.goalAmount || campaign.goal_amount || 0);
        document.getElementById('progressBar').style.width = progress + '%';
        // Sanitize campaign description - use textContent instead of innerHTML
        const descElement = document.getElementById('campaignDescription');
        descElement.textContent = campaign.description;
        descElement.style.whiteSpace = 'pre-wrap';
        
        // Creator avatar
        const creatorNameStr = campaign?.user?.name || campaign?.creatorName || 'Creator';
        const initials = creatorNameStr.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('creatorAvatar').textContent = initials;

        // Load donations
        loadDonations();

    } catch (error) {
        console.error('Error:', error);
        showToast('Error loading campaign', 'error');
    }
}

// Load donations
async function loadDonations() {
    try {
        const response = await fetch(`${API.DONATIONS}/campaign/${campaignId}`);
        const data = await response.json();

        const donationsCount = data.count || 0;
        document.getElementById('donorsCount').textContent = donationsCount;
        document.getElementById('donationsCount').textContent = donationsCount;

        const container = document.getElementById('donationsList');

        if (donationsCount === 0) {
            container.innerHTML = `
                <div class="empty-state-centered">
                    <i class="fas fa-heart empty-state-icon"></i>
                    <p>No donations yet. Be the first to donate!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        data.data.forEach(donation => {
            const item = document.createElement('div');
            item.className = 'donation-item';
            
            const header = document.createElement('div');
            header.className = 'donation-header';
            
            const donorSpan = document.createElement('span');
            donorSpan.className = 'donor-name';
            donorSpan.textContent = donation.donorName || donation.donor_name || 'Anonymous';
            
            const amountSpan = document.createElement('span');
            amountSpan.className = 'donation-amount';
            amountSpan.textContent = formatCurrency(donation.amount);
            
            header.appendChild(donorSpan);
            header.appendChild(amountSpan);
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'donation-time';
            timeDiv.textContent = formatDate(donation.createdAt || donation.created_at);
            
            item.appendChild(header);
            item.appendChild(timeDiv);
            container.appendChild(item);
        });

    } catch (error) {
        console.error('Error loading donations:', error);
    }
}

function cleanPaymentQueryParams() {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('reference');
    nextUrl.searchParams.delete('trxref');
    nextUrl.searchParams.delete('transaction_reference');
    nextUrl.searchParams.delete('paymentReference');
    nextUrl.searchParams.delete('payment_reference');
    nextUrl.searchParams.delete('status');
    nextUrl.searchParams.delete('payment_status');
    window.history.replaceState({}, document.title, nextUrl.toString());
}

async function handleDonationReturn() {
    if (!paymentReference) return false;

    try {
        showToast('Verifying your donation...', 'info');

        const response = await fetch(API.VERIFY_DONATION, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                reference: paymentReference,
                paymentReference,
                status: paymentStatus || undefined,
                campaignId
            })
        });

        const result = await response.json();

        if (response.ok && result.success !== false) {
            showToast(result.message || 'Donation verified successfully!', 'success');
            cleanPaymentQueryParams();
            return true;
        }

        showToast(result.message || 'Unable to verify donation right now.', 'warning');
        return false;
    } catch (error) {
        console.error('Donation verification error:', error);
        showToast('Unable to verify donation right now.', 'warning');
        return false;
    }
}

// Switch tabs (updated to work without event parameter)
function switchTab(tabName) {
    // Remove active from all tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    // Add active to clicked tab
    const selectedBtn = document.getElementById(tabName + 'Tab-btn');
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    const selectedContent = document.getElementById(tabName + 'Tab');
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
}

// Setup event listeners (replaces inline onclick handlers)
function setupEventListeners() {
    // Donate button
    const donateBtn = document.getElementById('donateButton');
    if (donateBtn) {
        donateBtn.addEventListener('click', donate);
    }

    // Share buttons
    const shareFacebook = document.getElementById('shareFacebook');
    if (shareFacebook) {
        shareFacebook.addEventListener('click', shareOnFacebook);
    }

    const shareTwitter = document.getElementById('shareTwitter');
    if (shareTwitter) {
        shareTwitter.addEventListener('click', shareOnTwitter);
    }

    const shareWhatsapp = document.getElementById('shareWhatsapp');
    if (shareWhatsapp) {
        shareWhatsapp.addEventListener('click', shareOnWhatsApp);
    }

    const shareCopyBtn = document.getElementById('shareCopy');
    if (shareCopyBtn) {
        shareCopyBtn.addEventListener('click', copyLink);
    }

    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab[data-tab]');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

// Donate function
async function donate() {
    if (!isLoggedIn()) {
        showToast('Please login to donate', 'warning');
        window.location.href = 'login.html';
        return;
    }
    
    // Use safer input method instead of prompt()
    const amount = prompt('Enter donation amount (₦): [Minimum ₦100]');
    if (!amount || amount.trim() === '') return;

    // Sanitize and validate input
    const sanitizedAmount = amount.trim().replace(/[^0-9.]/g, '');
    const parsedAmount = Number(sanitizedAmount);
    
    if (isNaN(parsedAmount) || parsedAmount < 100) {
        showToast('Please enter a valid amount (minimum ₦100)', 'warning');
        return;
    }
    
    if (!Number.isFinite(parsedAmount)) {
        showToast('Amount must be a valid number', 'warning');
        return;
    }

    const donateBtn = document.querySelector('.donate-btn');
    const originalBtnText = donateBtn ? donateBtn.innerHTML : '';

    if (donateBtn) {
        donateBtn.disabled = true;
        donateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    try {
        const response = await fetch(API.DONATIONS, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                campaignId,
                campaign_id: campaignId,
                amount: parsedAmount
            })
        });

        const result = await response.json();
        const payload = result.data || result;

        if (!response.ok || !result.success) {
            showToast(result.message || 'Unable to start donation. Please try again.', 'error');
            return;
        }

        const checkoutUrl = payload.authorization_url || payload.authorizationUrl || payload.checkoutUrl || payload.checkout_url || payload.paymentUrl || payload.payment_url || payload.url;

        if (checkoutUrl) {
            let parsedCheckoutUrl;
            try {
                parsedCheckoutUrl = new URL(checkoutUrl, window.location.origin);
            } catch {
                showToast('Invalid payment link received. Please try again.', 'error');
                return;
            }

            if (!['https:', 'http:'].includes(parsedCheckoutUrl.protocol)) {
                showToast('Unsafe payment link blocked.', 'error');
                return;
            }

            showToast('Redirecting to secure payment...', 'info');
            window.setTimeout(() => {
                window.location.href = parsedCheckoutUrl.toString()
            }, 250);
            return;
        }

        showToast('Donation initiated successfully.', 'success');
        loadDonations();
        loadCampaign();

    } catch (error) {
        console.error('Donation error:', error);
        showToast('Error starting donation. Please try again.', 'error');
    } finally {
        if (donateBtn) {
            donateBtn.disabled = false;
            donateBtn.innerHTML = originalBtnText;
        }
    }
}

// Share functions
function shareOnFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank');
}

function shareOnTwitter() {
    const text = document.getElementById('campaignTitle').textContent;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${window.location.href}`, '_blank');
}

function shareOnWhatsApp() {
    const text = document.getElementById('campaignTitle').textContent;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.href)}`, '_blank');
}

async function copyLink() {
    try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
    } catch (error) {
        showToast('Unable to copy link. Please copy it manually from the address bar.', 'warning');
    }
}

// Initialize
(async () => {
    setupEventListeners();
    updateNav();
    await handleDonationReturn();
    await loadCampaign();
})();
