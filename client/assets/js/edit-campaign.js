// Edit Campaign Page - Main Script
// Handles campaign editing form and category loading

// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

let campaignId = null;

// Global state for categories
let categories = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    loadUserName();
    initializeDragAndDrop();

    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    if (idFromUrl) {
        campaignId = idFromUrl;
        await initializePage();
    }
});

window.openEditCampaign = async function(id) {
    if (!id) return;
    campaignId = id;

    const editForm = document.getElementById('editCampaignForm');
    const noSelection = document.getElementById('editCampaignNoSelection');
    if (editForm) editForm.classList.remove('hidden');
    if (noSelection) noSelection.classList.add('hidden');

    await initializePage();
};

async function initializePage() {
    const updateBtn = document.getElementById('updateBtn');
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing...';

    try {
        // Load categories first
        await loadCategories();
        // Then load campaign data
        await loadCampaign();
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Error initializing page. Some data may be missing.', 'error');
    } finally {
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch(API.CATEGORIES);
        if (!response.ok) throw new Error('Failed to load categories');
        
        const data = await response.json();
        categories = data?.data || data?.categories || (Array.isArray(data) ? data : []);

        if (Array.isArray(categories)) {
            const select = document.getElementById('category');
            select.innerHTML = '<option value="">Select a category</option>';
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        throw error;
    }
}

// Load campaign data
async function loadCampaign() {
    try {
        const response = await fetch(`${API.CAMPAIGNS}/${campaignId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to fetch campaign details');
        
        const data = await response.json();
        if (!data.success) {
            showToast('Campaign not found', 'error');
                    window.location.href = 'user-dashboard.html#campaigns';
            return;
        }

        const campaign = data.data || data.campaign;

        // Populate fields
        document.getElementById('title').value = campaign.title;
        document.getElementById('description').value = campaign.description;
        document.getElementById('goal').value = campaign.goalAmount || campaign.goal_amount;
        document.getElementById('status').value = campaign.status || 'ACTIVE';
        
        // Match category
        const categoryId = campaign.categoryId || campaign.category_id;
        if (categoryId) {
            document.getElementById('category').value = categoryId;
        }

        // Preview current image
        if (campaign.imageUrl || campaign.image) {
            const previewContainer = document.getElementById('currentImageDisplay');
            previewContainer.innerHTML = `
                <div class="mt-1" style="opacity: 0.8;">
                    <p class="text-small mb-1">Current Image:</p>
                    <img src="${campaign.imageUrl || campaign.image}" alt="Current" class="img-preview" style="max-height: 180px; border: 2px solid var(--gray-lighter);">
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading campaign:', error);
        throw error;
    }
}

// Drag and drop for image update
function initializeDragAndDrop() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('image');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.background = 'rgba(16, 185, 129, 0.05)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--gray-lighter)';
        uploadArea.style.background = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--gray-lighter)';
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleImagePreview(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImagePreview(e.target.files[0]);
        }
    });
}

function handleImagePreview(file) {
    if (!isValidImageFile(file)) {
        showToast('Invalid image. Please use JPG, PNG, or WebP (max 5MB).', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewContainer = document.getElementById('currentImageDisplay');
        previewContainer.innerHTML = `
            <div class="mt-1">
                <p class="text-small mb-1" style="color: var(--primary); font-weight: 600;">New Image Selected:</p>
                <img src="${e.target.result}" alt="New Preview" class="img-preview" style="max-height: 180px; border: 2px solid var(--primary);">
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

// Handle form submission
const editFormElement = document.getElementById('editCampaignForm');
if (editFormElement) {
    editFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const categoryId = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();
    const imageFile = document.getElementById('image').files[0];
    
    // Validation
    if (!isValidCampaignTitle(title)) {
        showToast('Title must be between 5-200 characters', 'error');
        return;
    }
    if (!categoryId) {
        showToast('Please select a category', 'error');
        return;
    }
    if (!isValidDescription(description)) {
        showToast('Description must be between 20-5000 characters', 'error');
        return;
    }

    const btn = document.getElementById('updateBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving Changes...';
    btn.disabled = true;

    try {
        // 1. Update basic information
        const response = await fetch(`${API.CAMPAIGNS}/${campaignId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, categoryId, description })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Update failed');

        // 2. Update image if selected
        if (imageFile) {
            const imageFormData = new FormData();
            imageFormData.append('image', imageFile);
            
            const imageResponse = await fetch(`${API_URL}/campaigns/${campaignId}/image`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'X-CSRF-Token': getCSRFToken() || ''
                },
                body: imageFormData
            });
            
            if (!imageResponse.ok) {
                showToast('Campaign info updated, but image upload failed.', 'warning');
            }
        }

        showToast('🎉 Campaign updated successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'user-dashboard.html#campaigns';
        }, 1500);

    } catch (error) {
        console.error('Update error:', error);
        showToast(error.message || 'An error occurred during update', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
})};
