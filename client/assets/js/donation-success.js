const successRef = new URLSearchParams(window.location.search).get('ref');
const statusMessage = document.getElementById('successStatusMessage');
const donationAmountEl = document.getElementById('donationAmountValue');
const donationCampaignEl = document.getElementById('donationCampaign');
const donationDateEl = document.getElementById('donationDate');
const donationStatusEl = document.getElementById('donationStatus');
const donationImpactText = document.getElementById('donationImpactText');

function renderFallback() {
  statusMessage.textContent = 'Your gift has been received successfully and is now being validated.';
  donationCampaignEl.textContent = 'the campaign you supported';
  donationAmountEl.textContent = '₦0';
  donationDateEl.textContent = new Date().toLocaleDateString();
  donationStatusEl.textContent = 'Success';
  donationImpactText.textContent = 'Thank you for supporting a campaign through KindHeart.';
}


async function loadDonationDetails() {
  
  if (!successRef || !isLoggedIn()) {
    renderFallback();
    return;
  }

  try {
    const response = await fetch(API.MY_DONATIONS, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok || !data.status || !Array.isArray(data.data)) {
      renderFallback();
      return;
    }

    const donation = data.data.find((item) => (item.reference) === successRef);
    if (!donation) {
      renderFallback();
      return;
    }


    donationAmountEl.textContent = formatCurrency(donation.amount || 0);
    donationCampaignEl.textContent = donation.campaign?.title || 'Campaign supported';
    donationDateEl.textContent = new Date(donation.createdAt || donation.created_at || Date.now()).toLocaleDateString();
    donationStatusEl.textContent = donation.status || 'Success';
    donationImpactText.textContent = `Your gift helps ${donation.campaign?.title || 'this campaign'} move closer to its goal.`;
    statusMessage.textContent = `Thank you! Your donation to ${donation.campaign?.title || 'this campaign'} has been received.`;
  } catch (error) {
    console.error(error);
    renderFallback();
  }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Calling loadDonationDetails now...");
    loadDonationDetails();
});