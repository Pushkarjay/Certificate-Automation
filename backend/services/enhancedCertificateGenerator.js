/**
 * Enhanced Certificate Generation System
 * This module provides comprehensive certificate generation with template support
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs').promises;
const QRCode = require('qrcode');

/**
 * Generate certificate with comprehensive template support
 */
async function generateEnhancedCertificate(certificateData) {
  try {
    console.log('🎨 Starting enhanced certificate generation...');
    
    // 1. Generate reference number
    const refNo = generateReferenceNumber(certificateData);
    const verificationUrl = `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;
    
    // 2. Identify template based on course/domain
    const templateInfo = identifyTemplate(certificateData.course || certificateData.course_name);
    
    // 3. Create output directories
    const pdfDir = path.join(__dirname, '../Generated-Certificates/PDF');
    const imgDir = path.join(__dirname, '../Generated-Certificates/IMG');
    await ensureDirectoryExists(pdfDir);
    await ensureDirectoryExists(imgDir);
    
    // 4. Generate filenames
    const baseFilename = generateBaseFilename(certificateData, refNo);
    const pdfPath = path.join(pdfDir, `${baseFilename}.pdf`);
    const imgPath = path.join(imgDir, `${baseFilename}.png`);
    
    // 5. Generate certificate with template
    await generatePDFWithEnhancedTemplate(certificateData, templateInfo, refNo, verificationUrl, pdfPath);
    
    // 6. Return result
    return {
      success: true,
      imagePath: `Generated-Certificates/IMG/${baseFilename}.png`,
      pdfPath: `Generated-Certificates/PDF/${baseFilename}.pdf`,
      certificateData: {
        referenceNumber: refNo,
        holderName: certificateData.name || certificateData.full_name,
        course: certificateData.course || certificateData.course_name,
        batch: certificateData.batch || certificateData.batch_initials,
        verificationUrl: verificationUrl,
        issuedDate: new Date().toISOString(),
        template: templateInfo.filename,
        templateExists: templateInfo.exists
      },
      message: 'Enhanced certificate generated successfully'
    };
    
  } catch (error) {
    console.error('❌ Enhanced certificate generation failed:', error);
    throw error;
  }
}

/**
 * Generate reference number with proper database integration
 */
function generateReferenceNumber(certificateData) {
  const type = (certificateData.type || 'COMPLETION').toUpperCase();
  const course = (certificateData.course || certificateData.course_name || 'GEN')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase();
  const batch = (certificateData.batch || certificateData.batch_initials || 'GEN')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  const year = new Date().getFullYear();
  const uniqueId = Date.now().toString().slice(-4);
  
  return `${type}_${course}_${batch}_${year}_${uniqueId}`;
}

/**
 * Identify appropriate template based on course/domain
 */
function identifyTemplate(courseName) {
  const templateMapping = {
    // Programming Languages
    'PYTHON': 'G28 Python.jpg',
    'JAVA': 'G12 Java.jpg', 
    'SQL': 'G12 SQL.jpg',
    
    // Technologies & Domains
    'CLOUD COMPUTING': 'CC.jpg',
    'CC': 'CC.jpg',
    'DATA STRUCTURES': 'DSA.jpg',
    'DSA': 'DSA.jpg',
    'ALGORITHMS': 'DSA.jpg',
    'ROBOTICS': 'ROBOTICS.jpg',
    'ANDROID': 'AAD.jpg',
    'AAD': 'AAD.jpg',
    'AUTOCAD': 'Autocad.jpg',
    'SAP FICO': 'SAP FICO.jpg',
    'FICO': 'SAP FICO.jpg',
    'SOFTWARE TESTING': 'ST&T.jpg',
    'ST&T': 'ST&T.jpg',
    'TESTING': 'ST&T.jpg',
    
    // VLSI variants
    'VLSI': 'G10 VLSI.jpg',
    'G10': 'G10 VLSI.jpg',
    'G13': 'G13 VLSI.jpg',
    'G14': 'G14 VLSI.jpg',
    'G15': 'G15 VLSI.jpg',
    'G16': 'G16 VLSI.jpg',
    
    // Computer Science & Engineering
    'CYBER SECURITY': 'G6 CS.jpg',
    'CS': 'G6 CS.jpg',
    'COMPUTER SCIENCE': 'G6 CS.jpg',
    'EMBEDDED SYSTEMS': 'G7 ES.jpg',
    'ES': 'G7 ES.jpg',
    'EMBEDDED': 'G7 ES.jpg',
    'DATA SCIENCE': 'G8 DS.jpg',
    'DS': 'G8 DS.jpg',
    'DATA': 'G8 DS.jpg',
    
    // Batch-specific mappings
    'G6': 'G6 CS.jpg',
    'G7': 'G7 ES.jpg', 
    'G8': 'G8 DS.jpg',
    'G12': 'G12 Java.jpg',
    'G28': 'G28 Python.jpg'
  };
  
  if (!courseName) {
    return { filename: 'CC.jpg', exists: false, course: 'DEFAULT' };
  }
  
  const courseUpper = courseName.toUpperCase();
  
  // Find matching template
  for (const [keyword, template] of Object.entries(templateMapping)) {
    if (courseUpper.includes(keyword)) {
      return {
        filename: template,
        exists: false, // Will be checked later
        course: keyword
      };
    }
  }
  
  // Default template
  return { filename: 'CC.jpg', exists: false, course: 'DEFAULT' };
}

/**
 * Generate PDF certificate with enhanced template support
 */
async function generatePDFWithEnhancedTemplate(certificateData, templateInfo, refNo, verificationUrl, pdfPath) {
  try {
    console.log('📄 Generating PDF with enhanced template support...');
    
    // Check if template exists
    const templatePath = path.join(__dirname, '../Certificate_Templates', templateInfo.filename);
    try {
      await fs.access(templatePath);
      templateInfo.exists = true;
      console.log('✅ Template found:', templateInfo.filename);
    } catch {
      console.warn('⚠️ Template not found:', templateInfo.filename);
      templateInfo.exists = false;
    }
    
    // Create A4 landscape PDF (841.89 x 595.28 points)
    const doc = new PDFDocument({
      size: [841.89, 595.28], // A4 landscape
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    
    const stream = require('fs').createWriteStream(pdfPath);
    doc.pipe(stream);
    
    if (templateInfo.exists) {
      // Add template as background
      try {
        doc.image(templatePath, 0, 0, {
          width: 841.89,
          height: 595.28,
          fit: [841.89, 595.28]
        });
        console.log('✅ Template background applied');
      } catch (templateError) {
        console.warn('⚠️ Failed to apply template, using fallback');
        await createFallbackDesign(doc, templateInfo.filename, true);
      }
    } else {
      // Create "TEMPLATE MISSING" design
      await createFallbackDesign(doc, templateInfo.filename, false);
    }
    
    // Add certificate content overlay
    await addCertificateOverlay(doc, certificateData, refNo, verificationUrl, templateInfo.exists);
    
    doc.end();
    
    // Wait for completion
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    console.log('✅ Enhanced PDF certificate generated');
  } catch (error) {
    console.error('❌ Enhanced PDF generation failed:', error);
    throw error;
  }
}

/**
 * Create fallback design when template is missing or fails
 */
async function createFallbackDesign(doc, templateName, isTemplateFailed) {
  // White background
  doc.rect(0, 0, 841.89, 595.28).fill('#FFFFFF');
  
  // Border
  doc.rect(20, 20, 801.89, 555.28)
     .lineWidth(3)
     .stroke('#000000');
  
  if (!isTemplateFailed) {
    // "TEMPLATE MISSING" watermark
    doc.save();
    doc.translate(421, 297.64); // Center
    doc.rotate(-Math.PI / 6); // -30 degrees
    doc.fontSize(48)
       .fillColor('#FF0000', 0.15)
       .font('Helvetica-Bold')
       .text('TEMPLATE MISSING', -150, -20, { align: 'center' });
    doc.restore();
    
    // Template info
    doc.fontSize(12)
       .fillColor('#FF0000')
       .font('Helvetica')
       .text(`Missing Template: ${templateName}`, 421, 50, { align: 'center' });
  }
  
  // Certificate header
  doc.fontSize(32)
     .fillColor('#000000')
     .font('Times-Bold')
     .text('SURE Trust', 421, 100, { align: 'center' });
  
  doc.fontSize(14)
     .font('Times-Roman')
     .text('(Skill Upgradation for Rural - Youth Empowerment)', 421, 140, { align: 'center' });
  
  doc.fontSize(18)
     .text('Certificate of Completion', 421, 170, { align: 'center' });
  
  console.log('✅ Fallback design created');
}

/**
 * Add certificate content overlay
 */
async function addCertificateOverlay(doc, certificateData, refNo, verificationUrl, hasTemplate) {
  // Positioning based on template presence
  const nameY = hasTemplate ? 250 : 220;
  const contentY = hasTemplate ? 320 : 280;
  
  // Student name
  const studentName = certificateData.name || certificateData.full_name || 'Certificate Holder';
  doc.fontSize(32)
     .fillColor('#000000')
     .font('Times-Bold')
     .text(studentName, 421, nameY, { 
       align: 'center',
       width: 700,
       ellipsis: true
     });
  
  // Certificate content
  const courseName = certificateData.course || certificateData.course_name || 'Unknown Course';
  const startDate = certificateData.start_date || certificateData.startDate;
  const endDate = certificateData.end_date || certificateData.endDate;
  const gpa = certificateData.gpa || '8.5';
  
  let contentText = '';
  if (startDate && endDate) {
    contentText = `For successful completion of four months training in "${courseName}" from ${formatDate(startDate)} to ${formatDate(endDate)} securing ${gpa} GPA, attending the mandatory "Life Skills Training" sessions, and completing the services to community launched by SURE Trust`;
  } else {
    contentText = `For successful completion of training in "${courseName}" demonstrating exceptional skills and commitment to excellence in learning at SURE Trust`;
  }
  
  // Add content with proper word wrapping
  doc.fontSize(16)
     .font('Times-Roman')
     .text(contentText, 80, contentY, {
       width: 681.89,
       align: 'justify',
       lineGap: 6
     });
  
  // Generate and add QR code at bottom center
  await addQRCodeBottomCenter(doc, verificationUrl);
  
  // Add reference number and URL
  doc.fontSize(10)
     .fillColor('#333333')
     .text(`Reference No: ${refNo}`, 421, 560, { align: 'center' });
  
  doc.fontSize(8)
     .text(`Verify at: ${verificationUrl}`, 421, 575, { align: 'center' });
  
  console.log('✅ Certificate overlay completed');
}

/**
 * Add QR code at bottom center of certificate
 */
async function addQRCodeBottomCenter(doc, verificationUrl) {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 120,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H',
      scale: 8,
      type: 'png'
    });
    
    // Position at bottom center
    const qrSize = 80;
    const qrX = (841.89 - qrSize) / 2; // Center horizontally
    const qrY = 595.28 - qrSize - 50; // 50px from bottom
    
    // White background with border
    doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
       .fill('#FFFFFF')
       .stroke('#CCCCCC');
    
    // Add QR code
    doc.image(qrCodeBuffer, qrX, qrY, {
      width: qrSize,
      height: qrSize
    });
    
    console.log('✅ QR code added at bottom center');
  } catch (error) {
    console.warn('⚠️ QR code generation failed:', error.message);
    
    // Fallback placeholder
    const qrSize = 80;
    const qrX = (841.89 - qrSize) / 2;
    const qrY = 595.28 - qrSize - 50;
    
    doc.rect(qrX, qrY, qrSize, qrSize)
       .fill('#F0F0F0')
       .stroke('#CCCCCC');
    
    doc.fontSize(10)
       .fillColor('#666666')
       .text('QR Code', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
  }
}

/**
 * Helper functions
 */
function generateBaseFilename(certificateData, refNo) {
  const safeRefNo = refNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  return safeRefNo;
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log('📁 Directory created:', dirPath);
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
}

module.exports = {
  generateEnhancedCertificate,
  identifyTemplate,
  generateReferenceNumber
};
