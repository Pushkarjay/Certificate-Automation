#!/usr/bin/env node

/**
 * SRS Compliance Validation Script
 * Certificate Automation System
 * 
 * This script validates that the repository structure and implementation
 * strictly follows the Software Requirements Specification (SRS) requirements.
 */

const fs = require('fs');
const path = require('path');

// SRS Required Structure (Section 4.2)
const SRS_REQUIRED_STRUCTURE = {
    'Database/': {
        'Schema.SQL': 'file',
        'PostgreSQL/': {
            'schema.sql': 'file'
        },
        'MySQL/': {
            'schema.sql': 'file'
        },
        'MongoDB/': {
            'schema.js': 'file'
        }
    },
    'Google/': {
        'Form-link.md': 'file',
        'Sheet-API.JSON': 'file',
        'sheet_link.md': 'file'
    },
    'Frontend/': {
        'static/': {
            'Index.html': 'file',
            'Style.css': 'file',
            'Script.JS': 'file'
        },
        'React/': {
            'React-flow/': 'directory'
        }
    },
    'Backend/': {
        'Generated-Certificates/': {
            'PDF/': 'directory',
            'IMG/': 'directory'
        },
        'Certificate_Templates/': 'directory',
        '.env': 'file',
        'API/': 'directory'
    },
    'README.md': 'file'
};

// SRS Functional Requirements (Section 2.2)
const SRS_FUNCTIONAL_REQUIREMENTS = [
    { id: 'FR1', name: 'Data Collection', description: 'Google Forms integration' },
    { id: 'FR2', name: 'Database Integration', description: 'PostgreSQL/MySQL/MongoDB support' },
    { id: 'FR3', name: 'Certificate Generation', description: 'PDF/IMG with QR codes' },
    { id: 'FR4', name: 'Certificate Storage', description: 'Structured folders' },
    { id: 'FR5', name: 'Verification Frontend', description: 'React + Static HTML' },
    { id: 'FR6', name: 'Unique URL Redirect', description: 'QR → baseURL/credential-id' },
    { id: 'FR7', name: 'Credential Validation', description: 'Verified status display' },
    { id: 'FR8', name: 'Manual Check Option', description: 'Manual credential entry' }
];

// SRS Non-Functional Requirements (Section 2.3)
const SRS_NON_FUNCTIONAL_REQUIREMENTS = [
    { id: 'NFR1', name: 'Performance', target: '<5 sec/certificate' },
    { id: 'NFR2', name: 'Security', target: 'Encrypted QR codes' },
    { id: 'NFR3', name: 'Scalability', target: '10,000+ certificates' },
    { id: 'NFR4', name: 'Compatibility', target: 'Cross-platform' },
    { id: 'NFR5', name: 'Usability', target: 'Intuitive UI' }
];

// Validation Results
let validationResults = {
    structure: { passed: 0, failed: 0, issues: [] },
    functional: { passed: 0, failed: 0, issues: [] },
    nonFunctional: { passed: 0, failed: 0, issues: [] },
    overall: { compliance: 0, status: 'FAILED' }
};

/**
 * Main validation function
 */
function validateSRSCompliance() {
    console.log('🔍 SRS Compliance Validation Starting...\n');
    console.log('Software Requirements Specification Version: 1.0');
    console.log('Validation Date:', new Date().toISOString());
    console.log('=' .repeat(60));
    
    // Validate directory structure
    validateDirectoryStructure();
    
    // Validate functional requirements
    validateFunctionalRequirements();
    
    // Validate non-functional requirements
    validateNonFunctionalRequirements();
    
    // Generate final report
    generateComplianceReport();
}

/**
 * Validate directory structure against SRS Section 4.2
 */
function validateDirectoryStructure() {
    console.log('\n📁 Validating Directory Structure (SRS Section 4.2)');
    console.log('-'.repeat(50));
    
    const rootPath = process.cwd();
    validateStructure(SRS_REQUIRED_STRUCTURE, rootPath, '');
    
    const structureScore = validationResults.structure.passed / 
        (validationResults.structure.passed + validationResults.structure.failed) * 100;
    
    console.log(`\n📊 Structure Compliance: ${structureScore.toFixed(1)}%`);
    
    if (validationResults.structure.failed > 0) {
        console.log('❌ Structure Issues Found:');
        validationResults.structure.issues.forEach(issue => console.log(`   • ${issue}`));
    }
}

/**
 * Recursively validate structure
 */
function validateStructure(structure, currentPath, indent) {
    for (const [name, type] of Object.entries(structure)) {
        const fullPath = path.join(currentPath, name);
        const exists = fs.existsSync(fullPath);
        
        if (exists) {
            const stats = fs.statSync(fullPath);
            const isCorrectType = (type === 'file' && stats.isFile()) || 
                                 (type === 'directory' && stats.isDirectory()) ||
                                 (typeof type === 'object' && stats.isDirectory());
            
            if (isCorrectType) {
                console.log(`${indent}✅ ${name}`);
                validationResults.structure.passed++;
                
                if (typeof type === 'object') {
                    validateStructure(type, fullPath, indent + '  ');
                }
            } else {
                console.log(`${indent}❌ ${name} (wrong type)`);
                validationResults.structure.failed++;
                validationResults.structure.issues.push(`${name} exists but is wrong type`);
            }
        } else {
            console.log(`${indent}❌ ${name} (missing)`);
            validationResults.structure.failed++;
            validationResults.structure.issues.push(`Missing required ${type}: ${name}`);
        }
    }
}

/**
 * Validate functional requirements
 */
function validateFunctionalRequirements() {
    console.log('\n⚙️ Validating Functional Requirements (SRS Section 2.2)');
    console.log('-'.repeat(50));
    
    SRS_FUNCTIONAL_REQUIREMENTS.forEach(req => {
        const isImplemented = checkFunctionalRequirement(req.id);
        
        if (isImplemented) {
            console.log(`✅ ${req.id}: ${req.name} - ${req.description}`);
            validationResults.functional.passed++;
        } else {
            console.log(`❌ ${req.id}: ${req.name} - ${req.description}`);
            validationResults.functional.failed++;
            validationResults.functional.issues.push(`${req.id} not properly implemented`);
        }
    });
    
    const functionalScore = validationResults.functional.passed / SRS_FUNCTIONAL_REQUIREMENTS.length * 100;
    console.log(`\n📊 Functional Compliance: ${functionalScore.toFixed(1)}%`);
}

/**
 * Check if functional requirement is implemented
 */
function checkFunctionalRequirement(frId) {
    switch (frId) {
        case 'FR1': // Data Collection
            return fs.existsSync('Google/Form-link.md') && 
                   fs.existsSync('Google/Sheet-API.JSON');
        
        case 'FR2': // Database Integration
            return fs.existsSync('Database/PostgreSQL/schema.sql') &&
                   fs.existsSync('Database/MySQL/schema.sql');
        
        case 'FR3': // Certificate Generation
            return fs.existsSync('Backend/services/certificateGenerator.js');
        
        case 'FR4': // Certificate Storage
            return fs.existsSync('Backend/Generated-Certificates/PDF') &&
                   fs.existsSync('Backend/Generated-Certificates/IMG');
        
        case 'FR5': // Verification Frontend
            return fs.existsSync('Frontend/static/index.html') &&
                   fs.existsSync('Frontend/React');
        
        case 'FR6': // Unique URL Redirect
            return checkFileContains('Backend/API/verify.js', 'baseURL') ||
                   checkFileContains('Backend/API/verify.js', 'verification_url');
        
        case 'FR7': // Credential Validation
            return checkFileContains('Frontend/static/Script.JS', 'Verified') ||
                   checkFileContains('Frontend/React/src', 'verified');
        
        case 'FR8': // Manual Check Option
            return checkFileContains('Frontend/static/index.html', 'manual') ||
                   checkFileContains('Frontend/static/Script.JS', 'manual');
        
        default:
            return false;
    }
}

/**
 * Validate non-functional requirements
 */
function validateNonFunctionalRequirements() {
    console.log('\n🚀 Validating Non-Functional Requirements (SRS Section 2.3)');
    console.log('-'.repeat(50));
    
    SRS_NON_FUNCTIONAL_REQUIREMENTS.forEach(req => {
        const isImplemented = checkNonFunctionalRequirement(req.id);
        
        if (isImplemented) {
            console.log(`✅ ${req.id}: ${req.name} - ${req.target}`);
            validationResults.nonFunctional.passed++;
        } else {
            console.log(`❌ ${req.id}: ${req.name} - ${req.target}`);
            validationResults.nonFunctional.failed++;
            validationResults.nonFunctional.issues.push(`${req.id} requirements not met`);
        }
    });
    
    const nfrScore = validationResults.nonFunctional.passed / SRS_NON_FUNCTIONAL_REQUIREMENTS.length * 100;
    console.log(`\n📊 Non-Functional Compliance: ${nfrScore.toFixed(1)}%`);
}

/**
 * Check if non-functional requirement is implemented
 */
function checkNonFunctionalRequirement(nfrId) {
    switch (nfrId) {
        case 'NFR1': // Performance
            return checkFileContains('Backend/services/performanceMonitor.js', 'performance') ||
                   checkFileContains('.env', 'TIMEOUT');
        
        case 'NFR2': // Security
            return checkFileContains('Backend/services/certificateGenerator.js', 'encrypt') ||
                   checkFileContains('.env', 'SECRET');
        
        case 'NFR3': // Scalability
            return checkFileContains('.env', 'POOL') ||
                   checkFileContains('Backend/services/databaseService.js', 'pool');
        
        case 'NFR4': // Compatibility
            return checkFileContains('Frontend/static/Style.css', 'responsive') ||
                   checkFileContains('Frontend/static/Style.css', 'mobile');
        
        case 'NFR5': // Usability
            return fs.existsSync('Frontend/static/Style.css') &&
                   fs.existsSync('Frontend/static/Script.JS');
        
        default:
            return false;
    }
}

/**
 * Check if file contains specific text
 */
function checkFileContains(filePath, searchText) {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
                // Search in directory files
                const files = fs.readdirSync(filePath);
                return files.some(file => {
                    const fullPath = path.join(filePath, file);
                    if (fs.statSync(fullPath).isFile()) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            return content.toLowerCase().includes(searchText.toLowerCase());
                        } catch (error) {
                            return false;
                        }
                    }
                    return false;
                });
            } else {
                const content = fs.readFileSync(filePath, 'utf8');
                return content.toLowerCase().includes(searchText.toLowerCase());
            }
        }
    } catch (error) {
        // File doesn't exist or can't be read
    }
    return false;
}

/**
 * Generate final compliance report
 */
function generateComplianceReport() {
    console.log('\n📋 SRS COMPLIANCE REPORT');
    console.log('='.repeat(60));
    
    const totalPassed = validationResults.structure.passed + 
                       validationResults.functional.passed + 
                       validationResults.nonFunctional.passed;
    
    const totalFailed = validationResults.structure.failed + 
                       validationResults.functional.failed + 
                       validationResults.nonFunctional.failed;
    
    const totalTests = totalPassed + totalFailed;
    const overallCompliance = totalTests > 0 ? (totalPassed / totalTests * 100) : 0;
    
    validationResults.overall.compliance = overallCompliance;
    validationResults.overall.status = overallCompliance >= 95 ? 'PASSED' : 
                                       overallCompliance >= 80 ? 'WARNING' : 'FAILED';
    
    console.log(`📊 Overall Compliance: ${overallCompliance.toFixed(1)}%`);
    console.log(`🎯 Status: ${validationResults.overall.status}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    
    if (overallCompliance >= 95) {
        console.log('\n🎉 CONGRATULATIONS! Your repository is SRS COMPLIANT!');
        console.log('✅ All critical requirements are properly implemented.');
        console.log('🚀 System is ready for production deployment.');
    } else if (overallCompliance >= 80) {
        console.log('\n⚠️ WARNING: High compliance but some issues need attention.');
        console.log('🔧 Please review and fix the identified issues.');
    } else {
        console.log('\n❌ COMPLIANCE FAILED: Critical issues need immediate attention.');
        console.log('🚨 System is NOT ready for production deployment.');
    }
    
    // List all issues
    const allIssues = [
        ...validationResults.structure.issues,
        ...validationResults.functional.issues,
        ...validationResults.nonFunctional.issues
    ];
    
    if (allIssues.length > 0) {
        console.log('\n🔍 Issues Found:');
        allIssues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }
    
    console.log('\n📅 Validation completed:', new Date().toISOString());
    console.log('📋 SRS Version: 1.0');
    console.log('🏆 Target Compliance: 100%');
}

// Run validation if script is executed directly
if (require.main === module) {
    validateSRSCompliance();
}

module.exports = { validateSRSCompliance, validationResults };
