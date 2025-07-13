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
        
        <!-- Action Buttons (React-style features) -->
        <div class="action-buttons" style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
            <button onclick="viewCertificate('${certData.referenceNumber}')" class="action-btn view-btn" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                👁️ View Certificate
            </button>
            <button onclick="downloadCertificate('${certData.referenceNumber}')" class="action-btn download-btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                📥 Download
            </button>
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

/**
 * View certificate (React-style feature added to static)
 */
function viewCertificate(referenceNumber) {
    // Create a modal to display certificate information
    const modal = document.createElement('div');
    modal.id = 'certificateModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>Certificate Preview</h3>
                <button onclick="closeCertificateModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">✕</button>
            </div>
            <div style="text-align: center; padding: 2rem; border: 2px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #667eea; margin-bottom: 1rem;">🎓 SURE Trust Certificate</h2>
                <p><strong>Reference:</strong> ${referenceNumber}</p>
                <p style="margin-top: 1rem; color: #666;">Certificate preview will be enhanced with actual certificate image in full implementation.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Close certificate modal
 */
function closeCertificateModal() {
    const modal = document.getElementById('certificateModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

/**
 * Download certificate PDF from database
 */
async function downloadCertificate(referenceNumber) {
    try {
        showMessage('Preparing PDF download...', 'info');
        
        // Download the actual PDF certificate from our database API
        const pdfUrl = `${CONFIG.API_BASE_URL}/certificate-files/${referenceNumber}/pdf`;
        
        // First check if the certificate exists
        const infoResponse = await fetch(`${CONFIG.API_BASE_URL}/certificate-files/${referenceNumber}/info`);
        const infoData = await infoResponse.json();
        
        if (infoData.files && infoData.files.pdf && infoData.files.pdf.available) {
            // Create a temporary link to download the PDF
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = `${referenceNumber}.pdf`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showMessage('Certificate PDF downloaded successfully!', 'success');
        } else {
            // If PDF not available, try to verify and show message
            const verifyResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.VERIFICATION_ENDPOINT}/${referenceNumber}`);
            const verifyData = await verifyResponse.json();
            
            if (verifyData.valid) {
                showMessage('Certificate verified but PDF file not available. Please contact support.', 'warning');
            } else {
                showMessage('Certificate not found or invalid reference number.', 'error');
            }
        }
    } catch (error) {
        console.error('Download error:', error);
        showMessage('Failed to download certificate. Please try again.', 'error');
    }
}

/**
 * Show message notification (like React toast)
 */
function showMessage(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : ''}
        ${type === 'error' ? 'background: #ef4444;' : ''}
        ${type === 'warning' ? 'background: #f59e0b;' : ''}
        ${type === 'info' ? 'background: #3b82f6;' : ''}
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        verifyCertificate,
        formatDate,
        generateResultHTML
    };
}
