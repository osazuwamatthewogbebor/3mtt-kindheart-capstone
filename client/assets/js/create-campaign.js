// Create Campaign Page - Main Script
// Handles campaign creation form and category loading

// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(API.CATEGORIES);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('category');
            select.innerHTML = '<option value="">Select a category</option>';
            
            data.data.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        } else {
            showToast('Failed to load categories', 'error');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories. Please refresh the page.', 'error');
    }
}

// Handle form submission
document.getElementById('createCampaignForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const categoryId = document.getElementById('category').value;
    const goalAmount = document.getElementById('goal').value;
    const description = document.getElementById('description').value.trim();
    const imageFile = document.getElementById('image').files[0];
    
    // Validate campaign title
    if (!isValidCampaignTitle(title)) {
        showToast('Campaign title must be 5-200 characters', 'error');
        return;
    }
    
    // Validate category
    if (!categoryId) {
        showToast('Please select a category', 'error');
        return;
    }
    
    // Validate goal amount
    if (!isValidGoalAmount(goalAmount)) {
        showToast('Goal amount must be between 1,000 and 1,000,000,000', 'error');
        return;
    }
    
    // Validate description
    if (!isValidDescription(description)) {
        showToast('Description must be 20-5000 characters', 'error');
        return;
    }
    
    // Validate image if provided
    if (imageFile && !isValidImageFile(imageFile)) {
        showToast('Image must be JPG, PNG, GIF, or WebP format (max 5MB)', 'error');
        return;
    }
    
    const btn = document.getElementById('createBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('categoryId', categoryId);
        formData.append('goalAmount', Number(goalAmount));
        formData.append('description', description);
        
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const response = await fetch(API.CAMPAIGNS, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'X-CSRF-Token': getCSRFToken() || ''
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            showToast('Campaign created successfully!', 'success');
            window.location.href = 'my-campaigns.html';
        } else {
            showToast(data.message || 'Failed to create campaign', 'error');
        }
    } catch (error) {
        console.error('Error creating campaign:', error);
        if (error.message.includes('HTTP error')) {
            showToast('Server error. Please try again later.', 'error');
        } else if (error instanceof TypeError) {
            showToast('Network error. Please check your connection.', 'error');
        } else {
            showToast('Error creating campaign. Please try again.', 'error');
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// Initialize
loadCategories();
