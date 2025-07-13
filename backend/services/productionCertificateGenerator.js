/**
 * Production-Ready Certificate Generator for Render Deployment
 * PDF-only generation for simplified and reliable certificate creation
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs').promises;
const QRCode = require('qrcode');
const certificateStorage = require('./certificateStorageService');

// Environment detection
let canvasAvailable = false;
let Canvas, loadImage, registerFont, createCanvas;

// Try to load Canvas for high-quality image generation
try {
  const canvas = require('canvas');
  Canvas = canvas.Canvas;
  loadImage = canvas.loadImage;
  registerFont = canvas.registerFont;
  createCanvas = canvas.createCanvas;
  canvasAvailable = true;
  
  try {
    const fontsDir = path.join(__dirname, '../Certificate_Templates/fonts');
    registerFont(path.join(fontsDir, 'times.ttf'), { family: 'Times' });
    registerFont(path.join(fontsDir, 'EBGaramond-Regular.ttf'), { family: 'EBGaramond' });
    console.log('✅ Fonts registered successfully');
  } catch (fontError) {
    console.warn('⚠️ Custom fonts not available, using system fonts:', fontError.message);
  }
} catch (canvasError) {
  console.warn('⚠️ Canvas not available in this environment, using PDF-only generation:', canvasError.message);
  canvasAvailable = false;
}

/**
 * Production Certificate Generation - Main Entry Point
 * Optimized for Render cloud deployment
 */
async function generateProductionCertificate(certificateData) {
  try {
    console.log('🚀 Starting production certificate generation...');
    console.log('🔧 Environment: Canvas available =', canvasAvailable);
    
    // Validate and prepare data
    const processedData = validateAndProcessCertificateData(certificateData);
    
    // Generate reference number
    const refNo = generateProductionReferenceNumber(processedData);
    const verificationUrl = generateVerificationUrl(refNo);
    
    // Identify template
    const templateInfo = identifyTemplateForProduction(processedData.course);
    console.log('📋 Template identified:', templateInfo);
    
    // Create output directories
    await ensureProductionDirectories();
    
    // Generate certificate
    const result = await generateCertificateWithTemplate(
      processedData, 
      templateInfo, 
      refNo, 
      verificationUrl
    );
    
    // Store certificate PDF in database
    console.log('💾 Storing certificate PDF in database...');
    const storageSuccess = await certificateStorage.storeCertificateFromFiles(
      refNo,
      result.pdfPath ? path.join(__dirname, '..', result.pdfPath) : null
    );
    
    if (storageSuccess) {
      console.log('✅ Certificate files stored in database successfully');
    } else {
      console.warn('⚠️ Failed to store certificate files in database');
    }
    
    console.log('✅ Production certificate generated successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Production certificate generation failed:', error);
    throw new Error(`Certificate generation failed: ${error.message}`);
  }
}

/**
 * Validate and process certificate data for production
 */
function validateAndProcessCertificateData(data) {
  const processed = {
    name: data.name || data.full_name || 'Certificate Holder',
    course: (data.course || data.course_name || 'General Course').toUpperCase().trim(),
    batch: (data.batch || data.batch_initials || 'GEN').toUpperCase().trim(),
    startDate: data.start_date || data.startDate,
    endDate: data.end_date || data.endDate,
    gpa: data.gpa || '8.5',
    type: (data.type || 'completion').toLowerCase()
  };
  
  console.log('📝 Processed certificate data:', processed);
  return processed;
}

/**
 * Generate production-ready reference number
 */
function generateProductionReferenceNumber(data) {
  const type = data.type.toUpperCase();
  const courseCode = data.course.replace(/[^A-Z0-9]/g, '').substring(0, 4);
  const batchCode = data.batch.replace(/[^A-Z0-9]/g, '');
  const year = new Date().getFullYear();
  const uniqueId = Date.now().toString().slice(-4);
  
  const refNo = `${type}_${courseCode}_${batchCode}_${year}_${uniqueId}`;
  console.log('🔗 Generated reference number:', refNo);
  return refNo;
}

/**
 * Generate verification URL
 */
function generateVerificationUrl(refNo) {
  const baseUrl = process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/';
  return `${baseUrl}${refNo}`;
}

/**
 * Identify template for production environment
 */
function identifyTemplateForProduction(courseName) {
  const templateMap = {
    // Programming Languages
    'PYTHON': 'G28 Python.jpg',
    'JAVA': 'G12 Java.jpg',
    'SQL': 'G12 SQL.jpg',
    
    // Technologies & Domains
    'CLOUD': 'CC.jpg',
    'COMPUTING': 'CC.jpg',
    'DATA': 'DSA.jpg',
    'STRUCTURES': 'DSA.jpg',
    'DSA': 'DSA.jpg',
    'ALGORITHMS': 'DSA.jpg',
    'ROBOTICS': 'ROBOTICS.jpg',
    'ANDROID': 'AAD.jpg',
    'AAD': 'AAD.jpg',
    'AUTOCAD': 'Autocad.jpg',
    'SAP': 'SAP FICO.jpg',
    'FICO': 'SAP FICO.jpg',
    'SOFTWARE': 'ST&T.jpg',
    'TESTING': 'ST&T.jpg',
    
    // VLSI variants
    'VLSI': 'G10 VLSI.jpg',
    'G10': 'G10 VLSI.jpg',
    'G13': 'G13 VLSI.jpg',
    'G14': 'G14 VLSI.jpg',
    'G15': 'G15 VLSI.jpg',
    'G16': 'G16 VLSI.jpg',
    
    // Computer Science & Engineering
    'CYBER': 'G6 CS.jpg',
    'SECURITY': 'G6 CS.jpg',
    'CS': 'G6 CS.jpg',
    'EMBEDDED': 'G7 ES.jpg',
    'ES': 'G7 ES.jpg',
    'SCIENCE': 'G8 DS.jpg',
    'DS': 'G8 DS.jpg'
  };
  
  // Find best match
  let selectedTemplate = 'CC.jpg'; // default
  let matchedKeyword = 'DEFAULT';
  
  for (const [keyword, template] of Object.entries(templateMap)) {
    if (courseName.includes(keyword)) {
      selectedTemplate = template;
      matchedKeyword = keyword;
      break;
    }
  }
  
  return {
    filename: selectedTemplate,
    keyword: matchedKeyword,
    path: path.join(__dirname, '../Certificate_Templates', selectedTemplate)
  };
}

/**
 * Ensure production directories exist
 */
async function ensureProductionDirectories() {
  const directories = [
    path.join(__dirname, '../Generated-Certificates'),
    path.join(__dirname, '../Generated-Certificates/PDF'),
    path.join(__dirname, '../Generated-Certificates/IMG')
  ];
  
  for (const dir of directories) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log('📁 Created directory:', dir);
    }
  }
}

/**
 * Generate certificate with template support
 */
async function generateCertificateWithTemplate(data, templateInfo, refNo, verificationUrl) {
  // Check if template exists
  let templateExists = false;
  try {
    await fs.access(templateInfo.path);
    templateExists = true;
    console.log('✅ Template found:', templateInfo.filename);
  } catch {
    console.warn('⚠️ Template not found:', templateInfo.filename);
  }
  
  // Generate filename for PDF only
  const baseFilename = `${refNo.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const pdfPath = path.join(__dirname, '../Generated-Certificates/PDF', `${baseFilename}.pdf`);
  
  // Generate PDF certificate only
  await generatePDFOnlyCertificate(data, templateInfo, refNo, verificationUrl, pdfPath, templateExists);
  
  return {
    success: true,
    pdfPath: `Generated-Certificates/PDF/${baseFilename}.pdf`,
    certificateData: {
      referenceNumber: refNo,
      holderName: data.name,
      course: data.course,
      batch: data.batch,
      verificationUrl: verificationUrl,
      template: templateInfo.filename,
      templateExists: templateExists,
      issuedDate: new Date().toISOString(),
      generationMethod: 'pdfkit'
    }
  };
}

/**
 * Generate certificate using Canvas (high quality)
 */
async function generateCanvasBasedCertificate(data, templateInfo, refNo, verificationUrl, pdfPath, imgPath) {
  try {
    console.log('🎨 Generating certificate using Canvas...');
    
    // Create A4 landscape canvas (1191 x 842 at 300 DPI for high quality)
    const canvas = createCanvas(1191, 842);
    const ctx = canvas.getContext('2d');
    
    // Load and draw template background
    const templateImage = await loadImage(templateInfo.path);
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
    console.log('✅ Template background applied');
    
    // Add certificate content
    await addStudentNameToCanvas(ctx, data.name, canvas.width, canvas.height);
    await addCertificateContentToCanvas(ctx, data, canvas.width, canvas.height);
    await addQRCodeToCanvasBottomCenter(ctx, verificationUrl, canvas.width, canvas.height);
    await addReferenceToCanvas(ctx, refNo, verificationUrl, canvas.width, canvas.height);
    
    // Save as PNG
    const pngBuffer = canvas.toBuffer('image/png');
    await fs.writeFile(imgPath, pngBuffer);
    console.log('✅ PNG certificate saved');
    
    // Convert to PDF
    await convertCanvasToPDF(canvas, pdfPath);
    console.log('✅ PDF certificate saved');
    
  } catch (error) {
    console.error('❌ Canvas generation failed:', error);
    // Fallback to PDF-only
    await generatePDFOnlyCertificate(data, templateInfo, refNo, verificationUrl, pdfPath, true);
  }
}

/**
 * Add student name to canvas
 */
async function addStudentNameToCanvas(ctx, name, canvasWidth, canvasHeight) {
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Auto-size font
  let fontSize = 48;
  do {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Times, serif`;
  } while (ctx.measureText(name).width > canvasWidth * 0.6 && fontSize > 24);
  
  // Position and draw
  const x = canvasWidth / 2;
  const y = canvasHeight * 0.45;
  
  // Add shadow for visibility
  ctx.shadowColor = 'rgba(255,255,255,0.7)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  ctx.fillText(name, x, y);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  console.log('✅ Name added to canvas');
}

/**
 * Add certificate content to canvas
 */
async function addCertificateContentToCanvas(ctx, data, canvasWidth, canvasHeight) {
  // Generate content text
  let contentText = '';
  if (data.startDate && data.endDate) {
    contentText = `For successful completion of four months training in "${data.course}" from ${formatProductionDate(data.startDate)} to ${formatProductionDate(data.endDate)} securing ${data.gpa} GPA, attending the mandatory "Life Skills Training" sessions, and completing the services to community launched by SURE Trust`;
  } else {
    contentText = `For successful completion of training in "${data.course}" demonstrating exceptional skills and commitment to excellence in learning at SURE Trust`;
  }
  
  // Set font and style
  ctx.font = '16px Times, serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Add shadow
  ctx.shadowColor = 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = 1;
  
  // Position and word wrap
  const startX = canvasWidth * 0.1;
  const startY = canvasHeight * 0.55;
  const maxWidth = canvasWidth * 0.8;
  const lineHeight = 24;
  
  const words = contentText.split(' ');
  let currentLine = '';
  let y = startY;
  
  for (const word of words) {
    const testLine = currentLine + word + ' ';
    if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
      ctx.fillText(currentLine.trim(), startX, y);
      currentLine = word + ' ';
      y += lineHeight;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.trim() !== '') {
    ctx.fillText(currentLine.trim(), startX, y);
  }
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  
  console.log('✅ Content added to canvas');
}

/**
 * Add QR code to canvas at bottom center
 */
async function addQRCodeToCanvasBottomCenter(ctx, verificationUrl, canvasWidth, canvasHeight) {
  try {
    // Generate QR code
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 120,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H'
    });
    
    // Load as image
    const qrImage = await loadImage(qrBuffer);
    
    // Position at bottom center
    const qrSize = 80;
    const qrX = (canvasWidth - qrSize) / 2;
    const qrY = canvasHeight - qrSize - 40;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
    
    // Draw QR code
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    
    console.log('✅ QR code added to canvas');
  } catch (error) {
    console.warn('⚠️ QR code generation failed:', error.message);
    // Add placeholder
    const qrSize = 80;
    const qrX = (canvasWidth - qrSize) / 2;
    const qrY = canvasHeight - qrSize - 40;
    
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = '#CCCCCC';
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', qrX + qrSize/2, qrY + qrSize/2);
  }
}

/**
 * Add reference information to canvas
 */
async function addReferenceToCanvas(ctx, refNo, verificationUrl, canvasWidth, canvasHeight) {
  ctx.font = '10px Times, serif';
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  
  const centerX = canvasWidth / 2;
  const bottomY = canvasHeight - 10;
  
  ctx.fillText(`Reference No: ${refNo}`, centerX, bottomY - 15);
  ctx.font = '8px Times, serif';
  ctx.fillText(`Verify at: ${verificationUrl}`, centerX, bottomY);
  
  console.log('✅ Reference added to canvas');
}

/**
 * Convert canvas to PDF
 */
async function convertCanvasToPDF(canvas, pdfPath) {
  const doc = new PDFDocument({
    size: [841.89, 595.28], // A4 landscape
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  
  const stream = require('fs').createWriteStream(pdfPath);
  doc.pipe(stream);
  
  const buffer = canvas.toBuffer('image/png');
  doc.image(buffer, 0, 0, {
    width: 841.89,
    height: 595.28
  });
  
  doc.end();
  
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Generate PDF-only certificate (fallback method)
 */
async function generatePDFOnlyCertificate(data, templateInfo, refNo, verificationUrl, pdfPath, templateExists) {
  try {
    console.log('📄 Generating PDF-only certificate...');
    
    const doc = new PDFDocument({
      size: [841.89, 595.28], // A4 landscape
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    
    const stream = require('fs').createWriteStream(pdfPath);
    doc.pipe(stream);
    
    if (templateExists) {
      // Add template as background
      try {
        doc.image(templateInfo.path, 0, 0, {
          width: 841.89,
          height: 595.28
        });
        console.log('✅ Template background added to PDF');
      } catch (templateError) {
        console.warn('⚠️ Template loading failed, using fallback design');
        await addFallbackDesignToPDF(doc, templateInfo.filename);
      }
    } else {
      // Add "Template Missing" design
      await addTemplateMissingDesignToPDF(doc, templateInfo.filename);
    }
    
    // Add content overlay
    await addContentOverlayToPDF(doc, data, refNo, verificationUrl);
    
    doc.end();
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    console.log('✅ PDF-only certificate generated');
    
    // Create placeholder IMG file
    await createPlaceholderIMG(data, refNo, pdfPath.replace('.pdf', '.png'));
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  }
}

/**
 * Add template missing design to PDF
 */
async function addTemplateMissingDesignToPDF(doc, templateName) {
  // White background
  doc.rect(0, 0, 841.89, 595.28).fill('#FFFFFF');
  
  // Border
  doc.rect(20, 20, 801.89, 555.28).stroke('#000000');
  
  // "Template Missing" watermark
  doc.save();
  doc.translate(421, 297.64);
  doc.rotate(-Math.PI / 6);
  doc.fontSize(48).fillColor('#FF0000', 0.15).font('Helvetica-Bold');
  doc.text('TEMPLATE MISSING', -150, -20, { align: 'center' });
  doc.restore();
  
  // Template info
  doc.fontSize(12).fillColor('#FF0000').font('Helvetica');
  doc.text(`Missing Template: ${templateName}`, 421, 50, { align: 'center' });
  
  // Header
  doc.fontSize(32).fillColor('#000000').font('Times-Bold');
  doc.text('SURE Trust', 421, 100, { align: 'center' });
  
  doc.fontSize(14).font('Times-Roman');
  doc.text('(Skill Upgradation for Rural - Youth Empowerment)', 421, 140, { align: 'center' });
  
  console.log('✅ Template missing design added');
}

/**
 * Add fallback design to PDF
 */
async function addFallbackDesignToPDF(doc, templateName) {
  // Similar to template missing but without the warning
  doc.rect(0, 0, 841.89, 595.28).fill('#FFFFFF');
  doc.rect(20, 20, 801.89, 555.28).stroke('#000000');
  
  doc.fontSize(32).fillColor('#000000').font('Times-Bold');
  doc.text('SURE Trust', 421, 100, { align: 'center' });
  
  doc.fontSize(14).font('Times-Roman');
  doc.text('(Skill Upgradation for Rural - Youth Empowerment)', 421, 140, { align: 'center' });
  
  console.log('✅ Fallback design added');
}

/**
 * Add content overlay to PDF
 */
async function addContentOverlayToPDF(doc, data, refNo, verificationUrl) {
  // Student name - Center it properly on the page
  doc.fontSize(28).fillColor('#000000').font('Times-Bold');
  
  // Calculate page center for better alignment
  const pageWidth = doc.page.width;  // Usually 841.89 for A4 landscape
  const pageHeight = doc.page.height; // Usually 595.28 for A4 landscape
  const centerX = pageWidth / 2;
  
  // Position student name in the center of the page
  doc.text(data.name, 50, 240, { 
    align: 'center', 
    width: pageWidth - 100, // Full width minus margins
    characterSpacing: 1
  });
  
  // Content
  let contentText = '';
  if (data.startDate && data.endDate) {
    contentText = `For successful completion of four months training in "${data.course}" from ${formatProductionDate(data.startDate)} to ${formatProductionDate(data.endDate)} securing ${data.gpa} GPA, attending the mandatory "Life Skills Training" sessions, and completing the services to community launched by SURE Trust`;
  } else {
    contentText = `For successful completion of training in "${data.course}" demonstrating exceptional skills and commitment to excellence in learning at SURE Trust`;
  }
  
  doc.fontSize(14).font('Times-Roman');
  doc.text(contentText, 80, 300, {
    width: 681.89,
    align: 'justify',
    lineGap: 4
  });
  
  // QR Code
  await addQRCodeToPDF(doc, verificationUrl);
  
  // Reference
  doc.fontSize(10).fillColor('#333333');
  doc.text(`Reference No: ${refNo}`, 421, 550, { align: 'center' });
  doc.fontSize(8);
  doc.text(`Verify at: ${verificationUrl}`, 421, 565, { align: 'center' });
  
  console.log('✅ Content overlay added to PDF');
}

/**
 * Add QR code to PDF
 */
async function addQRCodeToPDF(doc, verificationUrl) {
  try {
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 100,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H'
    });
    
    const qrSize = 70;
    const qrX = (841.89 - qrSize) / 2;
    const qrY = 595.28 - qrSize - 50;
    
    // White background
    doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10).fill('#FFFFFF').stroke('#CCCCCC');
    
    // Add QR image
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    
    console.log('✅ QR code added to PDF');
  } catch (error) {
    console.warn('⚠️ QR code failed, adding placeholder');
    const qrSize = 70;
    const qrX = (841.89 - qrSize) / 2;
    const qrY = 595.28 - qrSize - 50;
    
    doc.rect(qrX, qrY, qrSize, qrSize).fill('#F0F0F0').stroke('#CCCCCC');
    doc.fontSize(10).fillColor('#666666');
    doc.text('QR Code', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
  }
}

/**
 * Create placeholder IMG file
 * When Canvas is not available, create a simple SVG image as placeholder
 */
async function createPlaceholderIMG(data, refNo, imgPath) {
  try {
    // Create a simple SVG placeholder that browsers can display
    const svgContent = `
<?xml version="1.0" encoding="UTF-8"?>
<svg width="1122" height="794" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E3F2FD;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#BBDEFB;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#grad1)" stroke="#1976D2" stroke-width="4"/>
  
  <!-- Title -->
  <text x="561" y="120" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#1976D2">
    CERTIFICATE OF COMPLETION
  </text>
  
  <!-- Subtitle -->
  <text x="561" y="180" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#424242">
    This is to certify that
  </text>
  
  <!-- Student Name -->
  <text x="561" y="250" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#1565C0">
    ${data.name || 'Student Name'}
  </text>
  
  <!-- Course Info -->
  <text x="561" y="320" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#424242">
    has successfully completed the course
  </text>
  
  <!-- Course Name -->
  <text x="561" y="380" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#1565C0">
    ${data.course || 'Course Name'}
  </text>
  
  <!-- Batch Info -->
  <text x="561" y="430" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#424242">
    Batch: ${data.batch || 'N/A'} | GPA: ${data.gpa || 'N/A'}
  </text>
  
  <!-- Date -->
  <text x="561" y="480" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#424242">
    Completion Date: ${data.endDate ? new Date(data.endDate).toLocaleDateString() : 'N/A'}
  </text>
  
  <!-- Reference -->
  <text x="561" y="580" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#666666">
    Certificate Reference: ${refNo}
  </text>
  
  <!-- Note -->
  <text x="561" y="620" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#999999">
    Note: This is a placeholder image. The official certificate is in PDF format.
  </text>
  
  <!-- Footer -->
  <text x="561" y="720" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#1976D2">
    SURE Trust
  </text>
  <text x="561" y="750" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#666666">
    Skill Upgradation and Redesigning with Employability
  </text>
</svg>`.trim();

    // Change extension to .svg for proper MIME type
    const svgPath = imgPath.replace(/\.(png|jpg|jpeg)$/i, '.svg');
    await fs.writeFile(svgPath, svgContent);
    
    // Also create the original extension file pointing to PDF
    const redirectContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate Image</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f5f5f5; 
        }
        .container { 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            max-width: 600px; 
            margin: 0 auto; 
        }
        .icon { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #1976D2; margin-bottom: 20px; }
        p { color: #666; margin-bottom: 30px; }
        .btn { 
            background: #1976D2; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            display: inline-block; 
            margin: 0 10px; 
        }
        .btn:hover { background: #1565C0; }
        .info { 
            background: #f0f8ff; 
            padding: 20px; 
            border-radius: 4px; 
            margin: 20px 0; 
            border-left: 4px solid #1976D2; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📄</div>
        <h1>Certificate Available in PDF Format</h1>
        <p>High-quality certificate images are not available in this environment, but your official certificate is ready as a PDF document.</p>
        
        <div class="info">
            <strong>Certificate Details:</strong><br>
            Student: ${data.name || 'N/A'}<br>
            Course: ${data.course || 'N/A'}<br>
            Reference: ${refNo}<br>
            Generated: ${new Date().toLocaleString()}
        </div>
        
        <a href="/certificates/pdf/${refNo}.pdf" class="btn" target="_blank">📄 View PDF Certificate</a>
        <a href="/verify/${refNo}" class="btn" target="_blank">🔍 Verify Certificate</a>
    </div>
</body>
</html>`.trim();

    await fs.writeFile(imgPath, redirectContent);
    console.log('✅ Placeholder IMG created (SVG + HTML redirect)');
    
  } catch (error) {
    console.warn('⚠️ Could not create placeholder IMG:', error.message);
    // Fallback to simple text file
    const simpleText = `Certificate: ${data.name} - ${data.course} (${refNo})`;
    await fs.writeFile(imgPath, simpleText);
  }
}

/**
 * Format date for production
 */
function formatProductionDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

module.exports = {
  generateProductionCertificate,
  canvasAvailable
};
