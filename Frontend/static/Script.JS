/**
 * Certificate Verification System - JavaScript
 * Frontend/static/Script.JS
 * SRS Compliant Static Frontend Implementation
 */

// Configuration
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://certificate-automation-dmoe.onrender.com/api',
    VERIFICATION_ENDPOINT: '/certificates/verify'
};

// DOM Elements
let verificationForm;
let manualVerificationForm;
let loadingIndicator;
let resultContainer;
let refNumberInput;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    checkURLParams();
});

/**
 * Initialize DOM elements
 */
function initializeElements() {
    verificationForm = document.getElementById('verificationForm');
    manualVerificationForm = document.getElementById('manualVerificationForm');
    loadingIndicator = document.getElementById('loadingIndicator');
    resultContainer = document.getElementById('resultContainer');
    refNumberInput = document.getElementById('refNumber');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (verificationForm) {
        verificationForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Manual verification form (SRS FR8)
    if (manualVerificationForm) {
        manualVerificationForm.addEventListener('submit', handleManualVerification);
    }
    
    // Enter key handler for input field
    if (refNumberInput) {
        refNumberInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleFormSubmit(e);
            }
        });
    }
}

/**
 * Check URL parameters for direct verification
 */
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const refNumber = urlParams.get('ref') || urlParams.get('refNumber');
    
    if (refNumber) {
        refNumberInput.value = refNumber;
        verifyCertificate(refNumber);
    }
}

/**
 * Handle form submission
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    const refNumber = refNumberInput.value.trim();
    
    if (!refNumber) {
        showError('Please enter a certificate reference number.');
        return;
    }
    
    // Validate reference number format (basic validation)
    if (refNumber.length < 5) {
        showError('Please enter a valid certificate reference number.');
        return;
    }
    
    verifyCertificate(refNumber);
}

/**
 * Verify certificate with backend API
 */
async function verifyCertificate(refNumber) {
    showLoading();
    hideResults();
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.VERIFICATION_ENDPOINT}/${refNumber}`);
        const data = await response.json();
        
        hideLoading();
        
        if (response.ok) {
            showVerificationResult(data);
        } else {
            showError(data.message || 'Certificate verification failed.');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Verification error:', error);
        showError('Unable to verify certificate. Please check your connection and try again.');
    }
}

/**
 * Show verification result
 */
function showVerificationResult(data) {
    const resultHTML = generateResultHTML(data);
    resultContainer.innerHTML = resultHTML;
    resultContainer.style.display = 'block';
    resultContainer.classList.add('fade-in');
    
    // Scroll to results
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Generate HTML for verification result
 */
function generateResultHTML(data) {
    if (!data.valid) {
        return `
            <div class="result-error">
                <h3>❌ Certificate Not Valid</h3>
                <p>${data.message || 'This certificate could not be verified.'}</p>
                ${data.certificateData ? generateBasicInfoHTML(data.certificateData) : ''}
            </div>
        `;
    }
    
    return `
        <div class="result-success">
            <h3>✅ Certificate Verified</h3>
            <p>${data.message || 'This certificate is valid and authentic.'}</p>
        </div>
        ${data.certificateData ? generateCertificateDetailsHTML(data.certificateData) : ''}
    `;
}

/**
 * Generate basic certificate info HTML
 */
function generateBasicInfoHTML(certData) {
    return `
        <div class="certificate-details">
            <h3>Certificate Information</h3>
            <div class="detail-item">
                <span class="detail-label">Reference Number:</span>
                <span class="detail-value">${certData.referenceNumber || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Holder Name:</span>
                <span class="detail-value">${certData.holderName || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Course:</span>
                <span class="detail-value">${certData.course || 'N/A'}</span>
            </div>
        </div>
    `;
}

/**
 * Generate detailed certificate information HTML
 */
function generateCertificateDetailsHTML(certData) {
    return `
        <div class="certificate-details">
            <h3>Certificate Details</h3>
            <div class="detail-item">
                <span class="detail-label">Reference Number:</span>
                <span class="detail-value">${certData.referenceNumber || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Certificate Holder:</span>
                <span class="detail-value">${certData.holderName || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${certData.email || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Course:</span>
                <span class="detail-value">${certData.course || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Batch:</span>
                <span class="detail-value">${certData.batch || 'N/A'}</span>
            </div>
            ${certData.startDate ? `
            <div class="detail-item">
                <span class="detail-label">Start Date:</span>
                <span class="detail-value">${formatDate(certData.startDate)}</span>
            </div>
            ` : ''}
            ${certData.endDate ? `
            <div class="detail-item">
                <span class="detail-label">End Date:</span>
                <span class="detail-value">${formatDate(certData.endDate)}</span>
            </div>
            ` : ''}
            ${certData.gpa ? `
            <div class="detail-item">
                <span class="detail-label">GPA:</span>
                <span class="detail-value">${certData.gpa}</span>
            </div>
            ` : ''}
            ${certData.performanceRating ? `
            <div class="detail-item">
                <span class="detail-label">Performance:</span>
                <span class="detail-value">${certData.performanceRating}</span>
            </div>
            ` : ''}
            <div class="detail-item">
                <span class="detail-label">Issued Date:</span>
                <span class="detail-value">${formatDate(certData.issuedDate)}</span>
            </div>
        </div>
    `;
}

/**
 * Format date string
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorHTML = `
        <div class="result-error">
            <h3>❌ Verification Error</h3>
            <p>${message}</p>
        </div>
    `;
    
    resultContainer.innerHTML = errorHTML;
    resultContainer.style.display = 'block';
    resultContainer.classList.add('fade-in');
}

/**
 * Hide results container
 */
function hideResults() {
    if (resultContainer) {
        resultContainer.style.display = 'none';
        resultContainer.classList.remove('fade-in');
    }
}

/**
 * Handle manual verification form submission (SRS FR8)
 */
function handleManualVerification(event) {
    event.preventDefault();
    
    const name = document.getElementById('manualName').value.trim();
    const course = document.getElementById('manualCourse').value.trim();
    const email = document.getElementById('manualEmail').value.trim();
    
    if (!name || !course || !email) {
        showError('Please fill in all fields for manual verification.');
        return;
    }
    
    verifyManualCertificate(name, course, email);
}

/**
 * Verify certificate using manual details (SRS FR8)
 */
async function verifyManualCertificate(name, course, email) {
    showLoading();
    hideResults();
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/verify/manual`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                holderName: name,
                course: course,
                email: email
            })
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (response.ok) {
            showVerificationResult(data);
        } else {
            showError(data.message || 'Manual verification failed.');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Manual verification error:', error);
        showError('Unable to perform manual verification. Please check your connection and try again.');
    }
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        verifyCertificate,
        formatDate,
        generateResultHTML
    };
}
