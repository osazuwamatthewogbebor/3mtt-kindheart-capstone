// Example: Pagination Implementation for Campaign Details Donations
// This file shows how to integrate pagination into the existing donations loading

// Configuration
const DONATIONS_PER_PAGE = 10;
let allDonationsData = [];
let currentDonationPage = 1;

// Enhanced donations loading function with pagination
async function loadDonationsWithPagination() {
    try {
        const response = await fetch(`${API.CAMPAIGNS}/${campaignId}/donations`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const donationsCount = data.count || data.data.length || 0;
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

        // Store all donations for pagination
        allDonationsData = data.data || [];
        currentDonationPage = 1;

        // Display first page
        displayDonationPage(currentDonationPage);

    } catch (error) {
        console.error('Error loading donations:', error);
        if (error.message.includes('HTTP error')) {
            showToast('Server error. Please try again later.', 'error');
        } else if (error instanceof TypeError) {
            showToast('Network error. Please check your connection.', 'error');
        } else {
            showToast('Error loading donations. Please try again.', 'error');
        }
    }
}

// Display a specific page of donations
function displayDonationPage(pageNumber) {
    const paginationResult = paginate(allDonationsData, DONATIONS_PER_PAGE, pageNumber);
    const container = document.getElementById('donationsList');
    
    // Clear container
    container.innerHTML = '';
    
    // Render donations for current page
    paginationResult.items.forEach(donation => {
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
    
    // Add pagination controls
    if (paginationResult.totalPages > 1) {
        addPaginationControls(container, paginationResult);
    }
}

// Add pagination navigation controls
function addPaginationControls(container, paginationResult) {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--gray-lightest);
    `;
    
    // Previous button
    if (paginationResult.hasPrevPage) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline pagination-btn';
        prevBtn.textContent = '← Previous';
        prevBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.875rem;';
        prevBtn.addEventListener('click', () => {
            currentDonationPage = paginationResult.pageNumber - 1;
            displayDonationPage(currentDonationPage);
            // Scroll to donations section
            document.getElementById('donationsTab').scrollIntoView({ behavior: 'smooth' });
        });
        paginationDiv.appendChild(prevBtn);
    }
    
    // Page indicator
    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = `
        padding: 0.5rem 1rem;
        color: var(--gray);
        font-size: 0.9375rem;
    `;
    pageInfo.textContent = `Page ${paginationResult.pageNumber} of ${paginationResult.totalPages}`;
    paginationDiv.appendChild(pageInfo);
    
    // Next button
    if (paginationResult.hasNextPage) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline pagination-btn';
        nextBtn.textContent = 'Next →';
        nextBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.875rem;';
        nextBtn.addEventListener('click', () => {
            currentDonationPage = paginationResult.pageNumber + 1;
            displayDonationPage(currentDonationPage);
            // Scroll to donations section
            document.getElementById('donationsTab').scrollIntoView({ behavior: 'smooth' });
        });
        paginationDiv.appendChild(nextBtn);
    }
    
    container.appendChild(paginationDiv);
}

// Enhanced donations tab button - use pagination
document.getElementById('donationsTab-btn').addEventListener('click', debounce(() => {
    const donationsTab = document.getElementById('donationsTab');
    const donationsList = document.getElementById('donationsList');
    
    // Only load if not already loaded
    if (donationsList.innerHTML.includes('loading-state') || 
        donationsList.innerHTML === '') {
        loadDonationsWithPagination();
    }
}, 200));

// Alternative: Lazy-load donations when tab becomes visible
const donationsTabObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && allDonationsData.length === 0) {
            loadDonationsWithPagination();
        }
    });
}, { threshold: 0.1 });

if (document.getElementById('donationsTab')) {
    donationsTabObserver.observe(document.getElementById('donationsTab'));
}

// Memory optimization: Clear old data when switching tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Clear donations data when leaving donations tab
        if (tabName !== 'donations' && allDonationsData.length > 0) {
            allDonationsData = [];
            // Optionally: clear from DOM to save memory
        }
    });
});
