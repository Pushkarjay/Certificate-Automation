const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');
const certificateStorage = require('./certificateStorageService');

/**
 * Production Certificate Generator - PDF Only
 * Generates high-quality PDF certificates with QR codes
 */

/**
 * Generate certificate for production use (PDF only)
 */
async function generateProductionCertificate(certificateData) {
  try {
    console.log('🚀 Starting production certificate generation (PDF only)...');
    
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
    const result = await generatePDFCertificate(
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
      console.log('✅ Certificate PDF stored in database successfully');
    } else {
      console.warn('⚠️ Failed to store certificate PDF in database');
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
  if (!data) {
    throw new Error('Certificate data is required');
  }
  
  return {
    name: data.name || data.fullName || data.full_name || 'Unknown Name',
    course: data.course || data.courseName || data.course_name || 'Unknown Course',
    batch: data.batch || data.batchName || data.batch_name || 'Unknown Batch',
    organization: data.organization || 'SURE Trust',
    position: data.position || 'Student',
    type: data.type || 'completion',
    gpa: data.gpa || null,
    attendance: data.attendance || data.attendancePercentage || null,
    performance: data.performance || data.performanceRating || null
  };
}

/**
 * Generate production-quality reference number
 */
function generateProductionReferenceNumber(data) {
  const typeMap = {
    completion: 'COMPLETION',
    attendance: 'ATTENDANCE', 
    performance: 'PERFORMANCE',
    participation: 'PARTICIPATION'
  };
  
  const type = typeMap[data.type] || 'COMPLETION';
  const org = 'SURE';
  const batch = (data.batch || '').replace(/[^A-Z0-9]/g, '').substring(0, 6) || 'BATCH';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${type}_${org}_${batch}_${year}_${month}${day}_${random}`;
}

/**
 * Generate verification URL
 */
function generateVerificationUrl(refNo) {
  const baseUrl = process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/';
  return `${baseUrl}${refNo}`;
}

/**
 * Identify template for production
 */
function identifyTemplateForProduction(course) {
  const templateMap = {
    'G30': 'G30.jpg',
    'G28': 'G28 Python.jpg',
    'G16': 'G16 VLSI.jpg',
    'G15': 'G15 VLSI.jpg',
    'G14': 'G14 VLSI.jpg',
    'G13 JAVA': 'G13 JAVA.jpg',
    'G13 VLSI': 'G13 VLSI.jpg',
    'G12 Java': 'G12 Java.jpg',
    'G12 SQL': 'G12 SQL.jpg',
    'G10 VLSI': 'G10 VLSI.jpg',
    'G8 DS': 'G8 DS.jpg',
    'G7 ES': 'G7 ES.jpg',
    'G7 Autocad': 'G7 Autocad.jpg',
    'G6 CS': 'G6 CS.jpg',
    'G6 AUTOCAD': 'G6 AUTOCAD.jpg',
    'AUTOCAD': 'Autocad.jpg',
    'ROBOTICS': 'ROBOTICS.jpg',
    'SAP FICO': 'SAP FICO.jpg',
    'CC': 'CC.jpg',
    'DSA': 'DSA.jpg',
    'AAD': 'AAD.jpg',
    'ST&T': 'ST&T.jpg'
  };
  
  const courseKey = course?.toUpperCase() || '';
  let templateFilename = templateMap[courseKey] || 'G30.jpg';
  
  // Try partial matches
  if (!templateMap[courseKey]) {
    for (const [key, template] of Object.entries(templateMap)) {
      if (courseKey.includes(key) || key.includes(courseKey)) {
        templateFilename = template;
        break;
      }
    }
  }
  
  return {
    filename: templateFilename,
    path: path.join(__dirname, '../Certificate_Templates/', templateFilename)
  };
}

/**
 * Ensure production directories exist
 */
async function ensureProductionDirectories() {
  const dirs = [
    path.join(__dirname, '../Generated-Certificates/PDF')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.warn(`⚠️ Could not create directory ${dir}:`, error.message);
      }
    }
  }
}

/**
 * Generate PDF certificate
 */
async function generatePDFCertificate(data, templateInfo, refNo, verificationUrl) {
  // Check if template exists
  let templateExists = false;
  try {
    await fs.access(templateInfo.path);
    templateExists = true;
    console.log('✅ Template found:', templateInfo.filename);
  } catch {
    console.warn('⚠️ Template not found:', templateInfo.filename);
  }
  
  // Generate filename for PDF
  const baseFilename = `${refNo.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const pdfPath = path.join(__dirname, '../Generated-Certificates/PDF', `${baseFilename}.pdf`);
  
  // Generate PDF certificate
  await generatePDFWithTemplate(data, templateInfo, refNo, verificationUrl, pdfPath, templateExists);
  
  return {
    success: true,
    pdfPath: `Generated-Certificates/PDF/${baseFilename}.pdf`,
    certificateData: {
      referenceNumber: refNo,
      holderName: data.name,
      course: data.course,
      batch: data.batch,
      verificationUrl: verificationUrl,
      type: data.type,
      organization: data.organization,
      position: data.position
    }
  };
}

/**
 * Generate PDF with template
 */
async function generatePDFWithTemplate(data, templateInfo, refNo, verificationUrl, pdfPath, templateExists) {
  try {
    console.log('📄 Generating PDF certificate...');
    
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
      // Add fallback design
      await addFallbackDesignToPDF(doc, templateInfo.filename);
    }
    
    // Add certificate content
    await addContentToPDF(doc, data, refNo);
    
    // Add QR code
    await addQRCodeToPDF(doc, verificationUrl);
    
    // Finalize PDF
    doc.end();
    
    // Wait for the PDF to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    console.log('✅ PDF certificate generated successfully');
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  }
}

/**
 * Add fallback design to PDF
 */
async function addFallbackDesignToPDF(doc, templateName) {
  // Blue gradient background
  doc.rect(0, 0, 841.89, 595.28)
     .fillAndStroke('#E3F2FD', '#1976D2');
  
  // Title
  doc.fontSize(36)
     .fillColor('#1976D2')
     .text('CERTIFICATE OF COMPLETION', 50, 100, {
       align: 'center',
       width: 741.89
     });
     
  // Subtitle
  doc.fontSize(18)
     .fillColor('#424242')
     .text('SURE Trust', 50, 150, {
       align: 'center',
       width: 741.89
     });
     
  // Template info
  doc.fontSize(12)
     .fillColor('#666666')
     .text(`Template: ${templateName}`, 50, 550, {
       align: 'right',
       width: 741.89
     });
}

/**
 * Add content to PDF
 */
async function addContentToPDF(doc, data, refNo) {
  try {
    // Student name
    doc.fontSize(24)
       .fillColor('#000000')
       .text(data.name, 50, 250, {
         align: 'center',
         width: 741.89
       });
    
    // Course information
    doc.fontSize(16)
       .text(`Course: ${data.course}`, 50, 300, {
         align: 'center',
         width: 741.89
       });
    
    // Batch information
    if (data.batch) {
      doc.fontSize(14)
         .text(`Batch: ${data.batch}`, 50, 330, {
           align: 'center',
           width: 741.89
         });
    }
    
    // Reference number
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Reference: ${refNo}`, 50, 500, {
         align: 'left',
         width: 400
       });
    
    console.log('✅ Content added to PDF');
    
  } catch (error) {
    console.error('❌ Error adding content to PDF:', error);
    throw error;
  }
}

/**
 * Add QR code to PDF
 */
async function addQRCodeToPDF(doc, verificationUrl) {
  try {
    console.log('🔲 Adding QR code to PDF...');
    
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Position QR code at bottom right
    doc.image(qrBuffer, 700, 450, {
      width: 100,
      height: 100
    });
    
    console.log('✅ QR code added to PDF');
    
  } catch (error) {
    console.error('❌ Error adding QR code to PDF:', error);
    // Continue without QR code rather than failing
  }
}

module.exports = {
  generateProductionCertificate
};
