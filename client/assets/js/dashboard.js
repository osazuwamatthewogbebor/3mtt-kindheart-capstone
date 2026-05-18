// Dashboard Page - Admin Panel Script
// Handles admin dashboard stats, campaigns, and user management

// ================= SIDEBAR =================
function toggleSidebar() {
  let sidebar = document.getElementById("sidebar");
  let main = document.getElementById("main");

  sidebar.classList.toggle("collapsed");
  main.classList.toggle("full");
}

// ================= LOAD USER =================
async function loadUser() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role !== 'ADMIN') {
    window.location.href = "my-campaigns.html";
    return;
  }

  try {
    const res = await fetch(API.ME, {
      headers: getAuthHeaders()
    });

    const result = await res.json();
    const data = result.data || result; // Fallback to result if data is missing

    if (!result.success && !data.id) throw new Error();

    const displayName = data.name || data.username || "Admin";
    document.getElementById("username").innerText = displayName;
    document.getElementById("username2").innerText = displayName;

  } catch (err) {
    console.error("Dashboard auth error:", err);
    // Only logout if it's a 401/auth issue, otherwise show fallback
    const userLocal = JSON.parse(localStorage.getItem('user'));
    if (userLocal) {
        document.getElementById("username").innerText = userLocal.name;
        document.getElementById("username2").innerText = userLocal.name;
    } else {
        logout();
    }
  }
}

// ================= LOAD STATS =================
async function loadStats() {
  try {
    const res = await fetch(API.ADMIN_STATS);
    const result = await res.json();
    const data = result.data || result; // Support both structures

    document.getElementById("donations").innerText = formatCurrency(data.donations || data.totalDonations || 0);
    document.getElementById("campaigns").innerText = data.campaigns || data.totalCampaigns || 0;
    document.getElementById("users").innerText = data.users || data.totalUsers || 0;
    document.getElementById("withdrawals").innerText = formatCurrency(data.withdrawals || data.totalWithdrawals || 0);

  } catch (err) {
    console.log("Stats API error:", err);
  }
}

// ================= LOAD CAMPAIGNS =================
/**
 * SECURITY FIX #1: XSS Prevention
 * Changed from innerHTML with template strings to safe DOM manipulation.
 * User-controlled data (like campaign titles) are now set via textContent.
 */
async function loadCampaigns() {
  try {
    const res = await fetch(API.CAMPAIGNS);
    const result = await res.json();
    const data = result.data || result.campaigns;

    let box = document.getElementById("campaignList");
    box.innerHTML = "";

    data.forEach(c => {
      const percentage = calculateProgress(c.amountRaised || c.raised, c.goalAmount || c.goal);
      
      // Safe DOM creation - prevents XSS attacks
      const campaignItem = document.createElement('div');
      campaignItem.className = 'campaign-item';
      
      const titleDiv = document.createElement('div');
      titleDiv.className = 'campaign-title';
      titleDiv.textContent = c.title; // Safe: prevents XSS
      
      const progressDiv = document.createElement('div');
      progressDiv.className = 'campaign-progress';
      
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = percentage + '%';
      progressBar.appendChild(progressFill);
      
      const amountDiv = document.createElement('div');
      amountDiv.className = 'campaign-amount';
      
      const raisedSpan = document.createElement('span');
      raisedSpan.className = 'amount-raised';
      raisedSpan.textContent = formatCurrency(c.amountRaised || c.raised) + ' raised';
      
      const goalSpan = document.createElement('span');
      goalSpan.className = 'amount-goal';
      goalSpan.textContent = 'of ' + formatCurrency(c.goalAmount || c.goal);
      
      amountDiv.appendChild(raisedSpan);
      amountDiv.appendChild(goalSpan);
      
      progressDiv.appendChild(progressBar);
      progressDiv.appendChild(amountDiv);
      
      campaignItem.appendChild(titleDiv);
      campaignItem.appendChild(progressDiv);
      box.appendChild(campaignItem);
    });

  } catch (err) {
    document.getElementById("campaignList").innerHTML = `
      <div class="empty-state">
        <i class="fa fa-inbox"></i>
        No campaigns found
      </div>
    `;
  }
}

// ================= INIT =================
loadUser();
loadStats();
loadCampaigns();
