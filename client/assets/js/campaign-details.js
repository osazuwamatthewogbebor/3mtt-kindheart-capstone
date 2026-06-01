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
            <a href="user-dashboard.html#campaigns" class="btn-link">My Campaigns</a>
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

            // Render updates if present on campaign object, else try to fetch updates
            if (Array.isArray(campaign.updates) && campaign.updates.length > 0) {
                window.__campaignHasUpdates = true;
                renderUpdates(campaign.updates);
            } else {
                window.__campaignHasUpdates = false;
                // Try to fetch updates from dedicated endpoint (public)
                try {
                    const updatesResp = await fetch(`${API.CAMPAIGNS}/${campaignId}/updates`);
                    let updates = [];
                    if (updatesResp.ok) {
                        const ct = updatesResp.headers.get('content-type') || '';
                        if (ct.includes('application/json')) {
                            try {
                                const updatesBody = await updatesResp.json();
                                updates = updatesBody.data || updatesBody.updates || [];
                            } catch (e) {
                                console.warn('Failed to parse updates JSON', e);
                                updates = [];
                            }
                        } else {
                            const txt = await updatesResp.text();
                            console.warn('Non-JSON updates response:', txt);
                            updates = [];
                        }
                    }
                    renderUpdates(Array.isArray(updates) ? updates : []);
                } catch (e) {
                    renderUpdates([]);
                }
            }

    } catch (error) {
        console.error('Error:', error);
        showToast('Error loading campaign', 'error');
        // Show inline error state
        const titleEl = document.getElementById('campaignTitle');
        if (titleEl) titleEl.textContent = 'Campaign not available';
        const descEl = document.getElementById('campaignDescription');
        if (descEl) descEl.textContent = 'Sorry, we could not load this campaign right now. Please try again later.';
        const imageEl = document.getElementById('campaignImage');
        if (imageEl) imageEl.src = 'https://via.placeholder.com/800x500?text=Unavailable';
    }
}

function renderUpdates(updates) {
    const container = document.getElementById('updatesTab');
    if (!container) return;

    // Find inner content area (replace loading state)
    const content = container.querySelector('.loading-state') || container;
    if (!updates || updates.length === 0) {
        content.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-bell opacity-30 icon-lg"></i>
                <p>No updates yet</p>
            </div>
        `;
        return;
    }

    // Build updates list
    const listHtml = updates.map(u => {
        const title = u.title || u.summary || 'Update';
        const body = u.body || u.content || u.message || '';
        const date = formatDate(u.createdAt || u.created_at || u.date || new Date());
        return `
            <div class="update-item">
                <div class="update-header">
                    <strong>${escapeHtml(title)}</strong>
                    <span class="muted">${date}</span>
                </div>
                <div class="update-body">${escapeHtml(body)}</div>
            </div>
        `;
    }).join('');

    content.innerHTML = `<div class="updates-list">${listHtml}</div>`;
}

// Load donations
async function loadDonations() {
    try {
        const response = await fetch(`${API.DONATIONS}/campaign/${campaignId}`);
        let data;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                console.warn('Failed to parse JSON donations response', e);
                data = { count: 0, data: [] };
            }
        } else {
            const text = await response.text();
            console.warn('Non-JSON donations response:', text);
            data = { count: 0, data: [] };
        }

        const donationsCount = data.count || 0;
        const donorsHeroEl = document.getElementById('donorsCountHero');
        const donorsSmallEl = document.getElementById('donorsCountSmall');
        const donationsCountEl = document.getElementById('donationsCount');
        if (donorsHeroEl) donorsHeroEl.textContent = donationsCount;
        if (donorsSmallEl) donorsSmallEl.textContent = donationsCount;
        if (donationsCountEl) donationsCountEl.textContent = donationsCount;

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

        (data.data || []).forEach(donation => {
            const donorName = donation.donorName || donation.donor_name || 'Anonymous';
            const amount = donation.amount || donation.amount_donated || 0;
            const date = donation.createdAt || donation.created_at || donation.date;

            const item = document.createElement('div');
            item.className = 'donation-item';

            const left = document.createElement('div');
            left.className = 'donation-left';
            const avatar = document.createElement('div');
            avatar.className = 'donor-avatar';
            const initials = String(donorName).split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
            avatar.textContent = initials || 'A';
            left.appendChild(avatar);

            const body = document.createElement('div');
            body.className = 'donation-body';
            const nameEl = document.createElement('div');
            nameEl.className = 'donor-name';
            nameEl.textContent = donorName;
            const metaEl = document.createElement('div');
            metaEl.className = 'donation-meta';
            metaEl.textContent = formatDate(date);
            body.appendChild(nameEl);
            body.appendChild(metaEl);

            const amountEl = document.createElement('div');
            amountEl.className = 'donation-amount';
            amountEl.textContent = formatCurrency(amount);

            item.appendChild(left);
            item.appendChild(body);
            item.appendChild(amountEl);

            container.appendChild(item);
        });

        // If there are donations but no formal campaign updates, surface donations as updates
        try {
            const updatesTabEl = document.getElementById('updatesTab');
            const hasFormalUpdates = !!(window.__campaignHasUpdates);
            if (!hasFormalUpdates) {
                const donationUpdates = (data.data || []).slice(0, 5).map(d => ({
                    title: (d.donorName || d.donor_name || d.donor?.name || 'Supporter') + ' donated',
                    body: `${formatCurrency(d.amount || d.amount_donated || 0)} was contributed${d.anonymous ? ' (anonymous)' : ''}`,
                    createdAt: d.createdAt || d.created_at || d.date
                }));
                if (donationUpdates.length > 0) renderUpdates(donationUpdates);
            }
        } catch (e) {
            // ignore
        }

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

        const response = await authFetch(API.VERIFY_DONATION, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reference: paymentReference,
                paymentReference,
                status: paymentStatus || undefined,
                campaignId
            })
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.status === 'success') {
            showToast(result.message || 'Donation verified successfully!', 'success');
            cleanPaymentQueryParams();
            // Refresh donations and campaign data
            loadDonations();
            loadCampaign();
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
    // Donate button (opens modal)
    const donateBtn = document.getElementById('donateButton');
    if (donateBtn) {
        donateBtn.addEventListener('click', openDonateModal);
    }

    // CTA donate button
    const ctaDonate = document.getElementById('ctaDonateBtn');
    if (ctaDonate) ctaDonate.addEventListener('click', openDonateModal);

    // Modal controls
    const donateClose = document.getElementById('donateCloseBtn');
    const donateCancel = document.getElementById('donateCancel');
    const donateBackdrop = document.getElementById('donateBackdrop');
    const donateForm = document.getElementById('donateForm');

    if (donateClose) donateClose.addEventListener('click', closeDonateModal);
    if (donateCancel) donateCancel.addEventListener('click', closeDonateModal);
    if (donateBackdrop) donateBackdrop.addEventListener('click', closeDonateModal);
    if (donateForm) donateForm.addEventListener('submit', handleDonateFormSubmit);

    // Payment method buttons
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

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

// Open donation modal
function openDonateModal() {
    if (!isLoggedIn()) {
        showToast('Please login to donate', 'warning');
        window.location.href = 'login.html';
        return;
    }
    const modal = document.getElementById('donateModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    const amountInput = document.getElementById('donateAmount');
    if (amountInput) {
        amountInput.value = '';
        amountInput.focus();
    }
}

// Close donation modal
function closeDonateModal() {
    const modal = document.getElementById('donateModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
}

// Handle donate form submit
async function handleDonateFormSubmit(e) {
    e.preventDefault();

    const amountEl = document.getElementById('donateAmount');
    const anonymousEl = document.getElementById('donateAnonymous');
    const submitBtn = document.getElementById('donateSubmit');

    if (!amountEl) return;
    const raw = amountEl.value;
    const parsedAmount = Number(String(raw).trim().replace(/[^0-9.]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount < 100) {
        showToast('Please enter a valid amount (minimum ₦100)', 'warning');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
    }

    try {
        const response = await authFetch(API.DONATIONS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId,
                campaign_id: campaignId,
                amount: parsedAmount,
                anonymous: anonymousEl ? !!anonymousEl.checked : false
            })
        });

        const result = await response.json().catch(() => ({}));
        const payload = result.data || result;

        if (!response.ok || result.status === 'error' || result.success === false) {
            const msg = result.message || result.error || 'Unable to start donation. Please try again.';
            showToast(msg, 'error');
            return;
        }

        const checkoutUrl = payload.authorization_url || payload.authorizationUrl || payload.checkoutUrl || payload.checkout_url || payload.paymentUrl || payload.payment_url || payload.url;

        if (checkoutUrl) {
            // Open payment provider in a new tab so modal remains available
            window.open(checkoutUrl, '_blank');
            showToast('Payment page opened in a new tab. Complete payment there to verify.', 'info');
            // Keep modal open so user can return; refresh donations after a short delay
            setTimeout(() => {
                loadDonations();
                loadCampaign();
            }, 3000);
            return;
        }

        showToast('Donation initiated successfully.', 'success');
        closeDonateModal();
        loadDonations();
        loadCampaign();

    } catch (error) {
        console.error('Donation error:', error);
        showToast('Error starting donation. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Donate';
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
