const failureRef = new URLSearchParams(window.location.search).get('ref');
const failureHeadline = document.getElementById('failureHeadline');
const failureAdvice = document.getElementById('failureAdvice');
const failureCampaignTitle = document.getElementById('failureCampaignTitle');
const retryButton = document.getElementById('retryButton');

function renderGeneric() {
  failureHeadline.textContent = 'Donation failed';
  failureAdvice.textContent = 'There was an issue processing your donation. Please try again or contact support.';
  failureCampaignTitle.textContent = 'Unable to identify the campaign at this time.';
}

async function loadFailureInfo() {
  if (!failureRef || !isLoggedIn()) {
    renderGeneric();
    return;
  }

  try {
    const response = await fetch(API.MY_DONATIONS, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();

    if (!response.ok || !data.status || !Array.isArray(data.data)) {
      renderGeneric();
      return;
    }

    const donation = data.data.find((item) => (item.reference || item.payment_reference) === failureRef);
    if (!donation) {
      renderGeneric();
      return;
    }

    failureCampaignTitle.textContent = donation.campaign?.title || 'your campaign';
    failureHeadline.textContent = `Your donation to could not be completed.`;
    failureAdvice.textContent = 'Payment was declined or interrupted. Please retry with the same campaign to complete your support.';

    const campaignId = donation.campaignId || donation.campaign?.id;
    if (campaignId && retryButton) {
      retryButton.href = `donation-checkout.html?campaignId=${campaignId}`;
    }
  } catch (error) {
    console.error(error);
    renderGeneric();
  }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Calling loadFailureInfo now...");
    loadFailureInfo();
});
