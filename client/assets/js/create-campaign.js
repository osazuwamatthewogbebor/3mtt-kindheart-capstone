// Create Campaign Page - Main Script
// Handles campaign creation form and category loading

// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

let currentSection = 1;
const totalSections = 3;

// Load basics on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    initializeFormListeners();
    loadUserName();
    // Initialize hero parallax or subtle effects if any
    const hero = document.querySelector('.page-hero');
    if (hero) hero.style.opacity = '1';
});

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch(API.CATEGORIES);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Support different response shapes: { data: [] } or { categories: [] }
        const categories = data?.data || data?.categories || (Array.isArray(data) ? data : []);

        if (Array.isArray(categories) && categories.length > 0) {
            const select = document.getElementById('category');
            select.innerHTML = '<option value="">Select a category</option>';

            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        } else {
            const select = document.getElementById('category');
            select.innerHTML = '<option value="">No categories available</option>';
            showToast('No categories found', 'warning');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories. Please refresh the page.', 'error');
    }
}

// Initialize form listeners
function initializeFormListeners() {
    // Character counter for title
    const titleInput = document.getElementById('title');
    if (titleInput) {
        titleInput.addEventListener('input', () => {
            const tc = document.getElementById('titleCount'); if (tc) tc.textContent = titleInput.value.length;
        });
    }
    // Character counter for description
    const descInput = document.getElementById('description');
    if (descInput) {
        descInput.addEventListener('input', () => { const dc = document.getElementById('descCount'); if (dc) dc.textContent = descInput.value.length; });
    }

    // Image upload handling
    const imageUploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('image');
    if (imageUploadArea && fileInput) {
        // Drag and drop
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.classList.add('drag-over');
        });

        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.classList.remove('drag-over');
        });

        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                previewImage();
            }
        });

        // File input change
        fileInput.addEventListener('change', previewImage);

        // Click to upload
        imageUploadArea.addEventListener('click', () => { fileInput.click(); });
    }

    // Form submission
    const createForm = document.getElementById('createCampaignForm');
    if (createForm) createForm.addEventListener('submit', submitForm);
}

// Preview image
function previewImage() {
    const fileInput = document.getElementById('image');
    const file = fileInput.files[0];

    if (!file) {
        document.getElementById('imagePreview').classList.add('hidden');
        return;
    }

    // Validate image
    if (!isValidImageFile(file)) {
        showToast('Image must be JPG, PNG, GIF, or WebP format (max 5MB)', 'error');
        fileInput.value = '';
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = document.getElementById('previewImage');
        previewImg.src = e.target.result;
        
        // Show file info
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        document.getElementById('imageInfo').textContent = `${file.name} • ${fileSize}MB`;
        
        document.getElementById('imagePreview').classList.remove('hidden');
        document.getElementById('imageUploadArea').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// Remove image
function removeImage() {
    document.getElementById('image').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('imageUploadArea').classList.remove('hidden');
}

// Navigate between form sections
function nextSection() {
    if (currentSection < totalSections) {
        if (validateSection(currentSection)) {
            currentSection++;
            updateSection();
        }
    }
}

function previousSection() {
    if (currentSection > 1) {
        currentSection--;
        updateSection();
    }
}

function updateSection() {
    // Update section visibility
    document.querySelectorAll('.form-section').forEach((section, index) => {
        if (index + 1 === currentSection) {
            section.classList.add('active');
            section.style.animation = 'fadeIn 0.5s ease-out forwards';
        } else {
            section.classList.remove('active');
        }
    });

    // Update progress indicator
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 <= currentSection) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (currentSection === 1) {
        prevBtn.style.display = 'none';
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    } else if (currentSection === totalSections) {
        prevBtn.style.display = 'inline-block';
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        prevBtn.style.display = 'inline-block';
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate current section
function validateSection(section) {
    const form = document.getElementById('createCampaignForm');
    
    switch(section) {
        case 1: // Campaign Info
            const title = document.getElementById('title').value.trim();
            const category = document.getElementById('category').value;
            const goal = document.getElementById('goal').value;

            if (!title) {
                showToast('Please enter a campaign title', 'error');
                return false;
            }
            if (!isValidCampaignTitle(title)) {
                showToast('Campaign title must be 5-200 characters', 'error');
                return false;
            }
            if (!category) {
                showToast('Please select a category', 'error');
                return false;
            }
            if (!goal) {
                showToast('Please enter a goal amount', 'error');
                return false;
            }
            if (!isValidGoalAmount(goal)) {
                showToast('Goal amount must be between 1,000 and 1,000,000,000', 'error');
                return false;
            }
            return true;

        case 2: // Description
            const description = document.getElementById('description').value.trim();
            if (!description) {
                showToast('Please enter a campaign description', 'error');
                return false;
            }
            if (!isValidDescription(description)) {
                showToast('Description must be 20-5000 characters', 'error');
                return false;
            }
            return true;

        default:
            return true;
    }
}

// Handle form submission
async function submitForm(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const categoryId = document.getElementById('category').value;
    const goalAmount = document.getElementById('goal').value;
    const description = document.getElementById('description').value.trim();
    const imageFile = document.getElementById('image').files[0];
    
    // Validate all fields
    if (!isValidCampaignTitle(title)) {
        showToast('Campaign title must be 5-200 characters', 'error');
        return;
    }
    
    if (!categoryId) {
        showToast('Please select a category', 'error');
        return;
    }
    
    if (!isValidGoalAmount(goalAmount)) {
        showToast('Goal amount must be between 1,000 and 1,000,000,000', 'error');
        return;
    }
    
    if (!isValidDescription(description)) {
        showToast('Description must be 20-5000 characters', 'error');
        return;
    }
    
    if (imageFile && !isValidImageFile(imageFile)) {
        showToast('Image must be JPG, PNG, GIF, or WebP format (max 5MB)', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Campaign...';
        submitBtn.disabled = true;
    }
    let submissionSuccess = false;

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('categoryId', categoryId);
        formData.append('goalAmount', Number(goalAmount));
        formData.append('description', description);
        
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const response = await authFetch(API.CAMPAIGNS, {
            method: 'POST',
            // let authFetch merge auth headers; ensure FormData is preserved
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            submissionSuccess = true;
            // Show success modal with feedback
            const successMessage = data.message || 'Campaign created successfully!';
            showSuccessModal(successMessage);
        } else {
            showToast(data.message || 'Failed to create campaign', 'error');
            showFormFeedback(data.message || 'Failed to create campaign', 'error');
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
        if (!submissionSuccess && submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Inline form feedback (banner inside the form wrapper)
function showFormFeedback(message, type = 'info') {
    const el = document.getElementById('formFeedback');
    if (!el) return;
    el.textContent = message;
    el.className = 'form-feedback';
    el.classList.add(type === 'success' ? 'success' : type === 'error' ? 'error' : 'info');
    el.classList.remove('hidden');
    // Scroll to feedback so user sees it
    const top = el.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top, behavior: 'smooth' });
    if (type !== 'success') {
        setTimeout(() => {
            el.classList.add('hidden');
        }, 4500);
    }
}

// Show success modal with custom message
function showSuccessModal(message) {
    const modal = document.getElementById('successModal');
    const body = document.getElementById('successModalBody');
    if (!modal || !body) return;
    body.textContent = message;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

// Close success modal and redirect to My Campaigns
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
    // Redirect after closing modal
    window.location.href = 'user-dashboard.html#campaigns';
}

