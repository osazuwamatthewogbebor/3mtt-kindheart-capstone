if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const params = new URLSearchParams(window.location.search);
// Support both `id` (standard) and legacy `campaignId` query parameters
const campaignId = params.get('id') || params.get('campaignId');
const campaignCategory = document.getElementById('campaignCategory');
const campaignImage = document.getElementById('campaignImage');
const campaignEnds = document.getElementById('campaignEnds');
const campaignRaised = document.getElementById('campaignRaised');
const campaignGoal = document.getElementById('campaignGoal');
const campaignSummaryTitle = document.getElementById('campaignSummaryTitle');
const checkoutForm = document.getElementById('checkoutForm');
const amountInput = document.getElementById('donationAmount');

function updateAmountPreview() {
  const amount = Number(amountInput.value || 0);
  const preview = document.getElementById('amountPreview');
  if (preview) preview.textContent = amount ? formatCurrency(amount) : '₦0';
}


amountInput.addEventListener('input', updateAmountPreview);

async function loadCampaign() {
  if (!campaignId) {
    const container = document.querySelector('.checkout-form-container');
    if (container) {
      container.innerHTML = '<div class="empty-state"><h3>Campaign not selected</h3><p>Please choose a campaign to donate to.</p><a href="campaigns.html" class="btn btn-primary">Browse Campaigns</a></div>';
    }
    return;
  }

  try {
    // CacheUtils renders cached campaign data immediately, then refreshes in the background.
    await CacheUtils.cacheFirst({
      key: CacheUtils.getCampaignKey(campaignId),
      ttl: 2 * 60 * 1000,
      fetcher: async () => {
        const response = await fetch(`${API.CAMPAIGNS}/${campaignId}`);
        const data = await response.json();
        if (!response.ok || !data.campaign) {
          throw new Error(data.message || 'Campaign data not available');
        }
        return data.campaign;
      },
      renderCached: (cached) => renderCampaignSummary(cached),
      renderFresh: (fresh) => renderCampaignSummary(fresh),
      onError: () => {
        const container = document.querySelector('.checkout-form-container');
        if (container) {
          container.innerHTML = '<div class="empty-state"><h3>Unable to load campaign</h3><p>Please try again later or browse other campaigns.</p><a href="campaigns.html" class="btn btn-primary">Browse Campaigns</a></div>';
        }
      }
    });
  } catch (error) {
    console.error(error);
    const container = document.querySelector('.checkout-form-container');
    if (container) {
      container.innerHTML = '<div class="empty-state"><h3>Unable to load campaign</h3><p>Please try again later or browse other campaigns.</p><a href="campaigns.html" class="btn btn-primary">Browse Campaigns</a></div>';
    }
  }
}

function renderCampaignSummary(campaign) {
  if (!campaign) return;
  campaignSummaryTitle.textContent = campaign.title;
  campaignCategory.textContent = campaign.category?.name || 'General';
  campaignEnds.textContent = campaign.endDate ? `${new Date(campaign.endDate).toLocaleDateString()} • Open` : 'Open';
  campaignRaised.value = formatCurrency(campaign.amountRaised || 0);
  campaignGoal.value = formatCurrency(campaign.goalAmount || 0);
  campaignImage.src = campaign.imageUrl || campaign.image || 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80';
  campaignImage.alt = campaign.title;
}

checkoutForm.addEventListener('submit', async event => {
  event.preventDefault();
  const amount = Number(amountInput.value);
  if (!amount || amount < 1000) {
    showToast('Please enter at least ₦1,000 to continue.', 'error');
    return;
  }

  try {
    const response = await fetch(API.DONATIONS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ campaignId, amount }),
    });
    const data = await response.json();
    if (!response.ok || !data.authorization_url) {
      throw new Error(data.message || 'Unable to initialize payment session.');
    }

    // Invalidate caches after a donation write so the next view reflects backend updates.
    CacheUtils.clearDonationCaches(campaignId);

    // Show redirect modal before navigating to payment gateway
    const redirectModal = document.getElementById('redirectModal');
    if (redirectModal) {
      redirectModal.style.display = 'flex';
      redirectModal.setAttribute('aria-hidden', 'false');
    }
    // Delay to allow user to see modal, then redirect
    setTimeout(() => {
      window.location.href = data.authorization_url;
    }, 1500);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Unable to process payment. Please try again later.', 'error');
  }
});

updateAmountPreview();
loadCampaign();
