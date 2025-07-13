// Try to load canvas, but continue without it if it fails
let createCanvas, loadImage, registerFont;
try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
  registerFont = canvas.registerFont;
  
  // Register fonts
  try {
    registerFont(path.join(__dirname, '../Certificate_Templates/fonts/times.ttf'), { family: 'Times' });
    registerFont(path.join(__dirname, '../Certificate_Templates/fonts/EBGaramond-Regular.ttf'), { family: 'EBGaramond' });
  } catch (error) {
    console.warn('⚠️ Font files not found. Using default fonts.');
  }
} catch (error) {
  console.warn('⚠️ Canvas module not available. Using fallback generation methods.');
}

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const QRCode = require('qrcode');

// Log QRCode library info
console.log('📦 QRCode library loaded:', typeof QRCode);
console.log('📦 QRCode methods available:', Object.keys(QRCode));

/**
 * Generate certificate with template background in A4 landscape PDF
 */
async function generateComplexCertificate(certificateData, certificateType) {
  try {
    console.log('🎨 Starting certificate generation...');
    
    // Generate reference number if not provided
    const refNo = certificateData.reference_number || generateReferenceNumber();
    const verificationUrl = `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;
    
    // Generate filenames
    const baseFilename = generateBaseFilename(certificateData, certificateType, refNo);
    
    // Create directories
    const pdfDir = path.join(__dirname, '../Generated-Certificates/PDF');
    const imgDir = path.join(__dirname, '../Generated-Certificates/IMG');
    await ensureDirectoryExists(pdfDir);
    await ensureDirectoryExists(imgDir);
    
    // Generate PDF certificate with template background
    const pdfFilename = await generatePDFWithTemplate(certificateData, certificateType, refNo, verificationUrl, baseFilename);
    
    // Generate IMG version if canvas is available
    let imgFilename = null;
    try {
      if (createCanvas && loadImage) {
        imgFilename = await generateIMGWithTemplate(certificateData, certificateType, refNo, verificationUrl, baseFilename);
      }
    } catch (imgError) {
      console.warn('⚠️ IMG generation failed, continuing with PDF only:', imgError.message);
    }
    
    console.log(`✅ Certificate generated: PDF=${pdfFilename}${imgFilename ? `, IMG=${imgFilename}` : ''}`);
    return { 
      imgFilename, 
      pdfFilename, 
      referenceNumber: refNo,
      verificationUrl: verificationUrl
    };
  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    throw new Error(`Certificate generation failed: ${error.message}`);
  }
}

/**
 * Main certificate generation function - Production Optimized for Render
 */
async function generateCertificate(certificateData) {
  try {
    // Try production-optimized generation first (best for Render deployment)
    const { generateProductionCertificate } = require('./productionCertificateGenerator');
    console.log('🚀 Using production-optimized certificate generation...');
    return await generateProductionCertificate(certificateData);
  } catch (productionError) {
    console.warn('⚠️ Production generation failed, trying enhanced generation:', productionError.message);
    
    // Fallback to enhanced generation
    try {
      const { generateEnhancedCertificate } = require('./enhancedCertificateGenerator');
      console.log('🔄 Using enhanced certificate generation...');
      return await generateEnhancedCertificate(certificateData);
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced generation failed, falling back to simple generation:', enhancedError.message);
      // Final fallback to existing simple generation
      return await generateSimpleCertificate(certificateData);
    }
  }
}

async function generateSimplePNGCertificate(certificateData, imgPath, refNo, verificationUrl) {
  try {
    // Try canvas-based generation first (similar to Python PIL approach)
    const canvas = await generateCanvasCertificate(certificateData, refNo, verificationUrl);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(imgPath, buffer);
    console.log('✅ Canvas-based PNG certificate generated');
    return;
  } catch (canvasError) {
    console.error('❌ PNG certificate generation failed:', canvasError.message);
    throw new Error('PNG certificate generation failed: ' + canvasError.message);
  }
}

/**
 * Add content text to certificate
 */
async function addContentToCanvas(ctx, certificateData, certificateType, canvasWidth) {
  let contentText = '';
  
  // Generate content based on certificate type
  switch (certificateType) {
    case 'student':
      contentText = `For successful completion of four months training in "${certificateData.course_name}" from ${formatDate(certificateData.start_date)} to ${formatDate(certificateData.end_date)} securing ${certificateData.gpa} GPA, attending the mandatory "Life Skills Training" sessions, and completing the services to community launched by SURE Trust`;
      break;
      
    case 'trainer':
      contentText = `For excellent training delivery in "${certificateData.course_name}" for ${certificateData.training_hours} hours from ${formatDate(certificateData.training_start_date)} to ${formatDate(certificateData.training_end_date)}, demonstrating exceptional teaching skills and commitment to excellence in education at SURE Trust`;
      break;
      
    case 'trainee':
      contentText = `For successful participation in ${certificateData.training_type} on "${certificateData.course_name}" for ${certificateData.training_duration_hours} hours from ${formatDate(certificateData.training_start_date)} to ${formatDate(certificateData.training_end_date)}, showing dedication to continuous learning and professional development at SURE Trust`;
      break;
  }
  
  // Set font for content
  ctx.font = '30px EBGaramond, serif';
  ctx.fillStyle = '#000000';
  
  // Word wrap and draw text
  const startX = 181;
  let currentY = 497;
  const maxWidth = canvasWidth - startX - 100; // Leave margin on right
  const lineHeight = 41; // 30px font + 11px spacing
  
  const words = contentText.split(' ');
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      // Draw current line and start new one
      ctx.fillText(currentLine.trim(), startX, currentY);
      currentLine = word + ' ';
      currentY += lineHeight;
    } else {
      currentLine = testLine;
    }
  }
  
  // Draw the last line
  if (currentLine.trim() !== '') {
    ctx.fillText(currentLine.trim(), startX, currentY);
  }
}

/**
 * Generate unique reference number for certificate
 */
function generateReferenceNumber() {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 9000) + 1000;
  const year = new Date().getFullYear();
  return `CERT_${year}_${timestamp}_${random}`;
}

/**
 * Generate base filename for certificate files
 */
function generateBaseFilename(certificateData, certificateType, refNo) {
  const safeRefNo = refNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const type = (certificateType || 'COMPLETION').toUpperCase();
  const course = (certificateData.course || certificateData.course_name || 'GENERAL').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const batch = (certificateData.batch || certificateData.batch_initials || 'GEN').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const year = new Date().getFullYear();
  
  return `${type}_${course}_${batch}_${year}_${safeRefNo}`;
}

/**
 * Ensure directory exists, create if it doesn't
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log('📁 Created directory:', dirPath);
  }
}

/**
 * Format date for certificate display
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
  } catch {
    return dateString;
  }
}

/**
 * Generate encrypted QR code and add to canvas (SRS NFR2: Encrypted QR codes)
 */
async function addQRCodeToCanvas(ctx, certificateData, canvasWidth, canvasHeight) {
  try {
    // Create encrypted QR data
    const qrData = {
      refNo: certificateData.reference_number,
      timestamp: new Date().toISOString(),
      checksum: generateChecksum(certificateData)
    };
    
    const encryptedData = encryptQRData(JSON.stringify(qrData));
    const verificationURL = `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${certificateData.reference_number}`;
    
    // Generate QR code - with enhanced settings for better visibility
    const qrCodeBuffer = await QRCode.toBuffer(verificationURL, {
      width: 200,  // Larger size for better generation
      margin: 2,   // Better margin for scanning
      color: {
        dark: '#000000',    // Pure black
        light: '#FFFFFF'    // Pure white
      },
      errorCorrectionLevel: 'H',  // High error correction
      scale: 10,  // Higher scale for crisp rendering
      type: 'png'
    });
    
    // Check if loadImage is available
    if (!loadImage) {
      console.warn('⚠️ loadImage not available, skipping QR code overlay');
      return;
    }
    
    // Load QR code as image
    const qrImage = await loadImage(qrCodeBuffer);
    
    // Position QR code (bottom right corner) with enhanced styling
    const qrSize = 120;  // Increased size for better visibility
    const qrX = canvasWidth - qrSize - 40;
    const qrY = canvasHeight - qrSize - 40;
    
    // Add white background with padding for QR code
    const padding = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2));
    
    // Add double border for better visibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2));
    
    // Add inner border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);
    
    // Draw the QR code
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    
    // Add verification text below QR code
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO VERIFY', qrX + qrSize/2, qrY + qrSize + 20);
    
    ctx.font = '8px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('Certificate Authenticity', qrX + qrSize/2, qrY + qrSize + 35);
    
    console.log('✅ QR code successfully added to certificate');
    
  } catch (error) {
    console.warn('⚠️ QR code generation failed:', error.message);
    // Add enhanced fallback QR placeholder
    try {
      const qrSize = 120;  // Match the enhanced size
      const qrX = canvasWidth - qrSize - 40;
      const qrY = canvasHeight - qrSize - 40;
      
      // Draw QR placeholder with better design
      const padding = 8;
      ctx.fillStyle = '#F8F8F8';
      ctx.fillRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2));
      
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2));
      
      // Create a grid pattern for QR placeholder
      ctx.fillStyle = '#DDDDDD';
      const cellSize = 8;
      for (let i = 0; i < qrSize; i += cellSize) {
        for (let j = 0; j < qrSize; j += cellSize) {
          if ((Math.floor(i/cellSize) + Math.floor(j/cellSize)) % 2 === 0) {
            ctx.fillRect(qrX + i, qrY + j, cellSize, cellSize);
          }
        }
      }
      
      // Add "QR" text in center
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR', qrX + qrSize/2, qrY + qrSize/2 + 8);
      
      // Add verification text
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.fillStyle = '#999999';
      ctx.fillText('VERIFICATION CODE', qrX + qrSize/2, qrY + qrSize + 20);
      
      ctx.font = '8px Arial, sans-serif';
      ctx.fillText('Not Available', qrX + qrSize/2, qrY + qrSize + 35);
      
      console.log('⚠️ Enhanced QR placeholder added instead');
    } catch (placeholderError) {
      console.error('❌ Even enhanced QR placeholder failed:', placeholderError.message);
    }
  }
}

/**
 * Generate IMG certificate file
 */
async function generateIMGCertificate(canvas, baseFilename) {
  const imgFilename = `${baseFilename}.png`;
  const imgPath = path.join(__dirname, '../Generated-Certificates/IMG', imgFilename);
  
  // Ensure directory exists
  await ensureDirectoryExists(path.dirname(imgPath));
  
  // Save IMG file
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(imgPath, buffer);
  
  return imgFilename;
}

/**
 * Generate PDF certificate file (SRS FR3: PDF/IMG formats)
 */
async function generatePDFCertificate(canvas, baseFilename, certificateData, certificateType) {
  const pdfFilename = `${baseFilename}.pdf`;
  const pdfPath = path.join(__dirname, '../Generated-Certificates/PDF', pdfFilename);
  
  // Ensure directory exists
  await ensureDirectoryExists(path.dirname(pdfPath));
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [canvas.width * 0.75, canvas.height * 0.75], // Convert pixels to points
        margin: 0
      });
      
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);
      
      // Add certificate image to PDF
      const imgBuffer = canvas.toBuffer('image/png');
      doc.image(imgBuffer, 0, 0, {
        width: canvas.width * 0.75,
        height: canvas.height * 0.75
      });
      
      // Add metadata
      doc.info.Title = `Certificate - ${certificateData.full_name}`;
      doc.info.Subject = `${certificateType.toUpperCase()} Certificate`;
      doc.info.Author = 'SURE Trust Certificate System';
      doc.info.Keywords = `certificate,${certificateType},${certificateData.course_name}`;
      doc.info.Creator = 'Certificate Automation System v1.0';
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(pdfFilename);
      });
      
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Encrypt QR code data for security (SRS NFR2)
 */
function encryptQRData(data) {
  try {
    const algorithm = process.env.QR_ENCRYPTION_ALGORITHM || 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.QR_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.warn('⚠️ QR encryption failed, using plain data:', error.message);
    return data;
  }
}

/**
 * Generate checksum for certificate data validation
 */
function generateChecksum(certificateData) {
  const dataString = `${certificateData.full_name}${certificateData.course_name}${certificateData.batch_initials}`;
  return crypto.createHash('sha256').update(dataString).digest('hex').substring(0, 8);
}

/**
 * Generate base filename for certificates
 */
function generateBaseFilename(certificateData, certificateType) {
  const safeName = certificateData.full_name.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${certificateType}_${safeName}_${certificateData.batch_initials}_${timestamp}`;
}

/**
 * Ensure directory exists
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Simplified certificate generation for cloud deployment
 * Creates actual certificate files without requiring native canvas dependencies
 */
async function generateSimpleCertificate(certificateData) {
  try {
    console.log('🔄 Starting simple certificate generation...');
    console.log('📝 Certificate data received:', {
      name: certificateData.name || certificateData.full_name,
      course: certificateData.course || certificateData.course_name,
      batch: certificateData.batch || certificateData.batch_initials
    });
    
    // Clean production logic: ensure name, reference number, and output paths
    let name = certificateData.name || certificateData.full_name || '';
    if (!name) name = 'Certificate Holder';
    
    const refNo = certificateData.refNo || certificateData.reference_number || `${certificateData.type ? certificateData.type.toUpperCase() : 'CERT'}_${(certificateData.course || '').replace(/\s+/g, '').substring(0, 4).toUpperCase()}_${certificateData.batch || 'GEN'}_${new Date().getFullYear()}_${Date.now().toString().slice(-4)}`;
    
    const verificationUrl = certificateData.verificationUrl || `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;
    
    console.log('🔗 Generated verification URL:', verificationUrl);
    console.log('📋 Reference number:', refNo);
    
    // Generate QR code data URL with better error handling
    let qrCodeData = null;
    try {
      console.log('🔄 Attempting QR code generation...');
      qrCodeData = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      console.log('✅ QR code generated successfully');
      console.log('📊 QR code data length:', qrCodeData ? qrCodeData.length : 0);
    } catch (qrError) {
      console.error('❌ QR code generation failed:', qrError.message);
      console.error('❌ QR error stack:', qrError.stack);
      qrCodeData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent PNG
    }
    
    const imgDir = path.join(__dirname, '../Generated-Certificates/IMG');
    const pdfDir = path.join(__dirname, '../Generated-Certificates/PDF');
    await ensureDirectoryExists(imgDir);
    await ensureDirectoryExists(pdfDir);
    
    const safeRefNo = refNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    const imgFilename = `${safeRefNo}.png`;
    const pdfFilename = `${safeRefNo}.pdf`;
    const imgPath = path.join(imgDir, imgFilename);
    const pdfPath = path.join(pdfDir, pdfFilename);
    
    certificateData.name = name;
    certificateData.reference_number = refNo;
    
    // Try canvas-based generation first, fallback if not available
    try {
      if (createCanvas && loadImage) {
        await generateSimplePNGCertificate(certificateData, imgPath, refNo, verificationUrl);
        console.log('✅ PNG certificate generated using canvas');
      } else {
        throw new Error('Canvas not available');
      }
    } catch (canvasError) {
      console.warn('⚠️ Canvas generation failed, using PDFKit fallback:', canvasError.message);
      await generateFallbackCertificate(certificateData, pdfPath, refNo, verificationUrl);
    }
    
    return {
      success: true,
      imagePath: `Generated-Certificates/IMG/${imgFilename}`,
      pdfPath: `Generated-Certificates/PDF/${pdfFilename}`,
      certificateData: {
        referenceNumber: refNo,
        holderName: name,
        course: certificateData.course || certificateData.course_name,
        batch: certificateData.batch || certificateData.batch_initials,
        type: certificateData.type || certificateData.certificate_type,
        verificationUrl: verificationUrl,
        qrCodeData: qrCodeData,
        issuedDate: new Date().toISOString(),
        template: certificateData.templatePath || 'default.jpg'
      },
      message: 'Certificate files generated successfully'
    };
  } catch (error) {
    console.error('❌ Error in certificate generation:', error);
    throw new Error('Certificate generation failed: ' + error.message);
  }
}

/**
 * Generate HTML-based certificate (fallback method)
 */
async function generateHTMLCertificate(certificateData, imgPath, pdfPath, refNo, verificationUrl, qrCodeData) {
  throw new Error('HTML/SVG/text fallback is disabled. Only PNG/JPG generation is allowed.');
}

/**
 * Generate certificate using Canvas with actual template backgrounds
 */
async function generateCanvasCertificate(certificateData, refNo, verificationUrl) {
  if (!createCanvas || !loadImage) {
    throw new Error('Canvas not available');
  }

  // Enhanced template mapping based on course/domain
  const templateFile = findTemplateForCourse(certificateData.course || certificateData.course_name);
  const templatePath = path.join(__dirname, '../Certificate_Templates', templateFile);
  console.log('🎨 Using certificate template:', templateFile);
  
  try {
    // Check if template exists
    await fs.access(templatePath);
    
    // Load template image as background
    const templateImage = await loadImage(templatePath);
    
    // Create A4 landscape canvas (842 x 595 points at 72 DPI)
    const canvas = createCanvas(1191, 842); // A4 landscape at 300 DPI for high quality
    const ctx = canvas.getContext('2d');
    
    // Draw template background to fill entire A4 canvas
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
    
    // Overlay certificate content
    await overlayStudentName(ctx, certificateData.name || certificateData.full_name, canvas.width, canvas.height);
    await overlayCertificateContent(ctx, certificateData, canvas.width, canvas.height);
    await addQRCodeBottomCenter(ctx, refNo, verificationUrl, canvas.width, canvas.height);
    await addReferenceAndURL(ctx, refNo, verificationUrl, canvas.width, canvas.height);
    
    console.log('✅ Certificate generated with template background in A4 landscape');
    return canvas;
    
  } catch (templateError) {
    console.warn('⚠️ Template not found, creating certificate with "TEMPLATE MISSING" watermark');
    return await generateTemplateWatermarkCertificate(certificateData, refNo, verificationUrl, templateFile);
  }
}

/**
 * Find appropriate template based on course/domain name
 */
function findTemplateForCourse(courseName) {
  if (!courseName) return 'CC.jpg'; // default
  
  const courseUpper = courseName.toUpperCase();
  
  // Comprehensive template mapping
  const templateMap = {
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
  
  // Check for exact matches first
  for (const [keyword, template] of Object.entries(templateMap)) {
    if (courseUpper.includes(keyword)) {
      return template;
    }
  }
  
  // Default template if no match found
  return 'CC.jpg';
}

/**
 * Generate certificate with "TEMPLATE MISSING" watermark when template not found
 */
async function generateTemplateWatermarkCertificate(certificateData, refNo, verificationUrl, missingTemplate) {
  // Create A4 landscape canvas
  const canvas = createCanvas(1191, 842);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  
  // Add "TEMPLATE MISSING" watermark
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6); // 30 degrees
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TEMPLATE MISSING', 0, 0);
  ctx.font = 'bold 40px Arial';
  ctx.fillText(`(${missingTemplate})`, 0, 60);
  ctx.restore();
  
  // Add certificate content over watermark
  await overlayStudentName(ctx, certificateData.name, canvas.width, canvas.height);
  await overlayCertificateContent(ctx, certificateData, canvas.width, canvas.height);
  await addQRCodeBottomCenter(ctx, refNo, verificationUrl, canvas.width, canvas.height);
  await addReferenceAndURL(ctx, refNo, verificationUrl, canvas.width, canvas.height);
  
  console.log('✅ Certificate generated with TEMPLATE MISSING watermark');
  return canvas;
}

/**
 * Insert name on template (overlaying on existing background)
 */
async function insertNameOnTemplate(ctx, fullName, canvasWidth, canvasHeight) {
  const name = fullName;
  
  // Set text styling for overlay on template
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Find appropriate font size for template overlay
  let fontSize = 60;
  let textWidth;
  
  do {
    fontSize -= 5;
    ctx.font = `bold ${fontSize}px Times, serif`;
    const metrics = ctx.measureText(name);
    textWidth = metrics.width;
  } while (textWidth > canvasWidth * 0.7 && fontSize > 20);
  
  // Position text in typical certificate name area (adjust based on template)
  const x = canvasWidth / 2;
  const y = canvasHeight * 0.45; // Usually around 45% down the certificate
  
  // Add text shadow for better visibility on template background
  ctx.shadowColor = 'rgba(255,255,255,0.8)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  // Draw the name
  ctx.fillText(name, x, y);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Insert course details on template (overlaying on existing background)
 */
async function insertCourseDetailsOnTemplate(ctx, certificateData, canvasWidth, canvasHeight) {
  // Generate content text
  const text = `For successful completion of four months training in "${certificateData.course}" from ${formatDate(certificateData.startDate)} to ${formatDate(certificateData.endDate)} securing ${certificateData.gpa || '8.5'} GPA, attending the mandatory "Life Skills Training" sessions, and completing the services to community launched by SURE Trust`;
  
  // Set font for content overlay
  ctx.font = '18px Times, serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Add text shadow for better visibility on template
  ctx.shadowColor = 'rgba(255,255,255,0.7)';
  ctx.shadowBlur = 1;
  ctx.shadowOffsetX = 0.5;
  ctx.shadowOffsetY = 0.5;
  
  // Position for content area (typically below name)
  const startX = canvasWidth * 0.1; // 10% from left
  const startY = canvasHeight * 0.55; // 55% down from top
  const maxWidth = canvasWidth * 0.8; // 80% of canvas width
  const lineHeight = 25;
  
  // Word wrap and draw text
  const words = text.split(' ');
  let currentLine = '';
  let y = startY;
  
  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      // Draw current line and start new one
      ctx.fillText(currentLine.trim(), startX, y);
      currentLine = word + ' ';
      y += lineHeight;
    } else {
      currentLine = testLine;
    }
  }
  
  // Draw the last line
  if (currentLine.trim() !== '') {
    ctx.fillText(currentLine.trim(), startX, y);
  }
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Create SVG certificate (fallback method) - SURE Trust Template
 */
function createCertificateSVG(certificateData, refNo, verificationUrl, qrCodeData = null) {
  return `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .cert-text { font-family: 'Times New Roman', serif; }
      .bold { font-weight: bold; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="600" fill="white"/>
  
  <!-- Border -->
  <rect x="10" y="10" width="780" height="580" fill="none" stroke="black" stroke-width="3"/>
  
  <!-- Alphabet Header -->
  <text x="400" y="40" font-family="Times New Roman, serif" font-size="12" text-anchor="middle" fill="black" letter-spacing="2px">ABCDEFGHIJKLMNOPQRSTUVWXYZ</text>
  <text x="400" y="55" font-family="Times New Roman, serif" font-size="12" text-anchor="middle" fill="black" letter-spacing="2px">abcdefghijklmnopqrstuvwxyz</text>
  
  <!-- SURE Trust Header -->
  <text x="400" y="110" font-family="Times New Roman, serif" font-size="32" font-weight="bold" text-anchor="middle" fill="black">SURE Trust</text>
  <text x="400" y="130" font-family="Times New Roman, serif" font-size="14" text-anchor="middle" fill="#666">(Skill Upgradation for Rural - Youth Empowerment)</text>
  
  <!-- Certificate Title -->
  <text x="400" y="160" font-family="Times New Roman, serif" font-size="18" text-anchor="middle" fill="black">This Certificate is issued to</text>
  
  <!-- Recipient Name -->
  <text x="400" y="210" font-family="Times New Roman, serif" font-size="28" font-weight="bold" text-anchor="middle" fill="black" text-decoration="underline">${certificateData.name}</text>
  
  <!-- Certificate Content -->
  <text x="50" y="260" font-family="Times New Roman, serif" font-size="14" fill="black">For successful completion of four months training in "${certificateData.course}"</text>
  <text x="50" y="280" font-family="Times New Roman, serif" font-size="14" fill="black">from ${formatDate(certificateData.startDate)} to ${formatDate(certificateData.endDate)} securing ${certificateData.gpa || '8.6'} GPA,</text>
  <text x="50" y="300" font-family="Times New Roman, serif" font-size="14" fill="black">attending the mandatory "Life Skills Training" sessions, and completing</text>
  <text x="50" y="320" font-family="Times New Roman, serif" font-size="14" fill="black">the services to community launched by SURE Trust.</text>
  
  <!-- Signature Blocks -->
  <!-- Founder & Executive Director -->
  <line x1="80" y1="420" x2="230" y2="420" stroke="black" stroke-width="1"/>
  <text x="155" y="440" font-family="Times New Roman, serif" font-size="12" font-weight="bold" text-anchor="middle" fill="black">Founder &</text>
  <text x="155" y="455" font-family="Times New Roman, serif" font-size="12" font-weight="bold" text-anchor="middle" fill="black">Executive Director</text>
  <text x="155" y="470" font-family="Times New Roman, serif" font-size="10" text-anchor="middle" fill="#666">- SURE Trust</text>
  
  <!-- Trainer 1 -->
  <line x1="280" y1="420" x2="430" y2="420" stroke="black" stroke-width="1"/>
  <text x="355" y="440" font-family="Times New Roman, serif" font-size="12" font-weight="bold" text-anchor="middle" fill="black">Trainer 1</text>
  <text x="355" y="455" font-family="Times New Roman, serif" font-size="10" text-anchor="middle" fill="#666">Designation,</text>
  <text x="355" y="470" font-family="Times New Roman, serif" font-size="10" text-anchor="middle" fill="#666">Company</text>
  
  <!-- Trainer 2 -->
  <line x1="480" y1="420" x2="630" y2="420" stroke="black" stroke-width="1"/>
  <text x="555" y="440" font-family="Times New Roman, serif" font-size="12" font-weight="bold" text-anchor="middle" fill="black">Trainer 2</text>
  <text x="555" y="455" font-family="Times New Roman, serif" font-size="10" text-anchor="middle" fill="#666">Designation,</text>
  <text x="555" y="470" font-family="Times New Roman, serif" font-size="10" text-anchor="middle" fill="#666">Company</text>
  
  <!-- QR Code -->
  ${qrCodeData ? 
    `<image x="700" y="500" width="80" height="80" href="${qrCodeData}" style="border: 1px solid #ccc;"/>` :
    `<rect x="700" y="500" width="80" height="80" fill="none" stroke="#ccc" stroke-width="1"/>
     <text x="740" y="545" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#666">QR Code</text>`
  }
  
  <!-- Reference Number -->
  <text x="50" y="580" font-family="Times New Roman, serif" font-size="10" fill="#666">Reference: ${refNo}</text>
</svg>`;
}

/**
 * Format date helper function
 */
function formatDate(dateString) {
  if (!dateString) return new Date().toLocaleDateString();
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

/**
 * Add QR code to template (positioned properly over background)
 */
async function addQRCodeToTemplate(ctx, refNo, verificationUrl, canvasWidth, canvasHeight) {
  try {
    console.log('🔄 Generating QR code for template...');
    console.log('🔗 URL for QR:', verificationUrl);
    console.log('📋 Reference:', refNo);
    console.log('📐 Canvas dimensions:', canvasWidth, 'x', canvasHeight);
    
    // Generate QR code as buffer with improved settings
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      type: 'png'
    });
    
    console.log('✅ QR code buffer generated, size:', qrCodeBuffer.length, 'bytes');
    
    // Check if loadImage is available
    if (!loadImage) {
      console.warn('⚠️ loadImage not available, using fallback QR placeholder');
      throw new Error('loadImage not available');
    }
    
    console.log('🖼️ Loading QR code as image...');
    // Load QR code as image
    const qrImage = await loadImage(qrCodeBuffer);
    console.log('✅ QR image loaded successfully');
    
    // Position QR code in bottom-right corner with proper margin
    const qrSize = 100;
    const margin = 30;
    const qrX = canvasWidth - qrSize - margin;
    const qrY = canvasHeight - qrSize - margin;
    
    console.log('📍 QR position:', { x: qrX, y: qrY, size: qrSize });
    
    // Add white background behind QR code for better visibility
    ctx.fillStyle = 'white';
    ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
    
    // Add thin border around QR code
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
    
    // Draw QR code
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    
    // Add reference number below QR code
    ctx.fillStyle = '#000000';
    ctx.font = '12px Times, serif';
    ctx.textAlign = 'center';
    ctx.fillText(refNo, qrX + qrSize/2, qrY + qrSize + 15);
    
    console.log('✅ QR code successfully added to certificate template');
  } catch (error) {
    console.error('❌ QR code generation failed:', error.message);
    console.error('❌ QR error stack:', error.stack);
    // Fallback: Draw placeholder QR area
    const qrSize = 100;
    const margin = 30;
    const qrX = canvasWidth - qrSize - margin;
    const qrY = canvasHeight - qrSize - margin;
    
    console.log('🔄 Drawing QR placeholder at:', { x: qrX, y: qrY, size: qrSize });
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    
    // Add "QR" text
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR', qrX + qrSize/2, qrY + qrSize/2);
    
    // Add reference number
    ctx.font = '12px Times, serif';
    ctx.fillText(refNo, qrX + qrSize/2, qrY + qrSize + 15);
    
    console.log('⚠️ QR placeholder added instead of actual QR code');
  }
}

// Fallback certificate generation using PDFKit only (when canvas isn't available)
async function generateFallbackCertificate(certificateData, pdfPath, refNo, verificationUrl) {
  try {
    console.log('🔄 Generating fallback certificate using PDFKit...');
    
    // Generate QR code as buffer first with enhanced settings
    let qrCodeBuffer = null;
    try {
      console.log('🔄 Generating QR code buffer for fallback PDF...');
      console.log('🔗 QR URL:', verificationUrl);
      qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
        width: 150,  // Increased size for better visibility
        margin: 2,   // More margin for better scanning
        color: {
          dark: '#000000',    // Pure black for contrast
          light: '#FFFFFF'    // Pure white background
        },
        errorCorrectionLevel: 'H',  // High error correction for better scanning
        type: 'png',
        scale: 8  // Higher scale for crisp rendering
      });
      console.log('✅ Enhanced QR code buffer generated for PDF, size:', qrCodeBuffer.length, 'bytes');
    } catch (qrError) {
      console.error('❌ QR code generation failed for PDF:', qrError.message);
      console.error('❌ QR error details:', qrError.stack);
    }
    
    // Create a simple PDF using PDFKit without canvas dependency
    const PDFDocument = require('pdfkit');
    const pdfDoc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const pdfStream = require('fs').createWriteStream(pdfPath);
    pdfDoc.pipe(pdfStream);
    
    // Add content to PDF
    pdfDoc.fontSize(32)
           .font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('CERTIFICATE OF COMPLETION', 50, 100, { align: 'center' });
    
    pdfDoc.fontSize(16)
           .font('Helvetica')
           .fillColor('#7f8c8d')
           .text('This is to certify that', 50, 180, { align: 'center' });
    
    pdfDoc.fontSize(28)
           .font('Helvetica-Bold')
           .fillColor('#e74c3c')
           .text(certificateData.name.toUpperCase(), 50, 220, { align: 'center' });
    
    pdfDoc.fontSize(16)
           .font('Helvetica')
           .fillColor('#7f8c8d')
           .text('has successfully completed', 50, 280, { align: 'center' });
    
    pdfDoc.fontSize(22)
           .font('Helvetica-Bold')
           .fillColor('#3498db')
           .text(certificateData.course || certificateData.course_name || 'Course', 50, 320, { align: 'center' });
    
    pdfDoc.fontSize(16)
           .font('Helvetica')
           .fillColor('#27ae60')
           .text(`Batch: ${certificateData.batch || certificateData.batch_initials || 'General'}`, 50, 370, { align: 'center' });
    
    pdfDoc.fontSize(14)
           .font('Helvetica')
           .fillColor('#34495e')
           .text(`Date: ${new Date().toLocaleDateString()}`, 50, 410, { align: 'center' });
    
    // Add QR code to PDF if available with enhanced visibility
    if (qrCodeBuffer) {
      try {
        // Position QR code in bottom right with better spacing
        const qrSize = 100;  // Optimal size for scanning
        const pageWidth = pdfDoc.page.width;
        const pageHeight = pdfDoc.page.height;
        const qrX = pageWidth - qrSize - 60;
        const qrY = pageHeight - qrSize - 60;
        
        // Add white background rectangle for QR code
        pdfDoc.rect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
               .fillColor('#FFFFFF')
               .fill()
               .stroke('#000000');
        
        // Add the QR code image
        pdfDoc.image(qrCodeBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        
        // Add verification text with better formatting
        pdfDoc.fontSize(9)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('SCAN TO VERIFY', qrX - 15, qrY + qrSize + 15, { width: qrSize + 30, align: 'center' });
        
        pdfDoc.fontSize(8)
               .font('Helvetica')
               .fillColor('#7f8c8d')
               .text('Certificate Authenticity', qrX - 15, qrY + qrSize + 30, { width: qrSize + 30, align: 'center' });
        
        console.log('✅ Enhanced QR code added to PDF certificate');
      } catch (qrAddError) {
        console.warn('⚠️ Failed to add QR code to PDF:', qrAddError.message);
        
        // Add fallback QR placeholder with better design
        const qrSize = 100;
        const pageWidth = pdfDoc.page.width;
        const pageHeight = pdfDoc.page.height;
        const qrX = pageWidth - qrSize - 60;
        const qrY = pageHeight - qrSize - 60;
        
        pdfDoc.rect(qrX, qrY, qrSize, qrSize)
               .fillColor('#F5F5F5')
               .fill()
               .stroke('#000000');
               
        pdfDoc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#666666')
               .text('QR CODE', qrX + 25, qrY + 35, { align: 'center' });
               
        pdfDoc.fontSize(8)
               .text('Not Available', qrX + 25, qrY + 55, { align: 'center' });
      }
    } else {
      // Better fallback when QR buffer is not available
      const qrSize = 100;
      const pageWidth = pdfDoc.page.width;
      const pageHeight = pdfDoc.page.height;
      const qrX = pageWidth - qrSize - 60;
      const qrY = pageHeight - qrSize - 60;
      
      pdfDoc.rect(qrX, qrY, qrSize, qrSize)
             .fillColor('#F9F9F9')
             .fill()
             .stroke('#CCCCCC');
             
      pdfDoc.fontSize(14)
             .font('Helvetica-Bold')
             .fillColor('#999999')
             .text('QR', qrX + 35, qrY + 40, { align: 'center' });
             
      pdfDoc.fontSize(8)
             .font('Helvetica')
             .text('Verification Code', qrX + 10, qrY + 60, { align: 'center' });
    }
    
    pdfDoc.fontSize(12)
           .font('Helvetica')
           .fillColor('#7f8c8d')
           .text(`Reference: ${refNo}`, 50, 480, { align: 'left' });
    
    pdfDoc.fontSize(10)
           .text(`Verification: ${verificationUrl}`, 50, 500, { align: 'left', width: 400 });
    
    pdfDoc.end();
    
    // Wait for PDF to finish writing
    await new Promise((resolve, reject) => {
      pdfStream.on('finish', resolve);
      pdfStream.on('error', reject);
    });
    
    console.log('✅ Fallback PDF certificate generated successfully');
    
    // Also generate a simple IMG file using Sharp (if available) or SVG fallback
    await generateFallbackImage(certificateData, pdfPath, refNo, verificationUrl);
    
  } catch (error) {
    console.error('❌ Error generating fallback certificate:', error);
    throw error;
  }
}

// Generate fallback IMG file when canvas is not available
async function generateFallbackImage(certificateData, pdfPath, refNo, verificationUrl) {
  try {
    const imgPath = pdfPath.replace('.pdf', '.png');
    
    // Try using Sharp if available for image generation
    try {
      const sharp = require('sharp');
      
      // Create a simple certificate image using Sharp
      const width = 800;
      const height = 600;
      
      // Generate QR code first
      let qrCodeBuffer = null;
      try {
        qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
          width: 80,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
          type: 'png'
        });
      } catch (qrError) {
        console.warn('⚠️ QR generation failed for image:', qrError.message);
      }
      
      // Create SVG certificate content
      const svgContent = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="black" stroke-width="3"/>
          
          <text x="50%" y="80" text-anchor="middle" font-family="serif" font-size="28" font-weight="bold" fill="#2c3e50">CERTIFICATE OF COMPLETION</text>
          
          <text x="50%" y="140" text-anchor="middle" font-family="serif" font-size="16" fill="#7f8c8d">This is to certify that</text>
          
          <text x="50%" y="190" text-anchor="middle" font-family="serif" font-size="24" font-weight="bold" fill="#e74c3c">${certificateData.name.toUpperCase()}</text>
          
          <text x="50%" y="240" text-anchor="middle" font-family="serif" font-size="16" fill="#7f8c8d">has successfully completed</text>
          
          <text x="50%" y="290" text-anchor="middle" font-family="serif" font-size="20" font-weight="bold" fill="#3498db">${certificateData.course || certificateData.course_name || 'Course'}</text>
          
          <text x="50%" y="340" text-anchor="middle" font-family="serif" font-size="16" fill="#27ae60">Batch: ${certificateData.batch || certificateData.batch_initials || 'General'}</text>
          
          <text x="50%" y="390" text-anchor="middle" font-family="serif" font-size="14" fill="#34495e">Date: ${new Date().toLocaleDateString()}</text>
          
          <text x="60" y="520" font-family="serif" font-size="12" fill="#7f8c8d">Reference: ${refNo}</text>
          
          <text x="60" y="540" font-family="serif" font-size="10" fill="#7f8c8d">Verification: ${verificationUrl}</text>
          
          ${qrCodeBuffer ? `<rect x="${width-120}" y="${height-120}" width="80" height="80" fill="white" stroke="black" stroke-width="1"/>
          <text x="${width-80}" y="${height-75}" text-anchor="middle" font-family="serif" font-size="12" fill="black">QR Code</text>` : ''}
        </svg>
      `;
      
      // Convert SVG to PNG using Sharp
      const svgBuffer = Buffer.from(svgContent);
      await sharp(svgBuffer).png().toFile(imgPath);
      
      console.log('✅ Fallback IMG certificate generated using Sharp');
      
    } catch (sharpError) {
      console.warn('⚠️ Sharp not available, creating placeholder IMG file:', sharpError.message);
      
      // Create a minimal SVG file as fallback
      const placeholderSvg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          <rect x="20" y="20" width="760" height="560" fill="none" stroke="black" stroke-width="2"/>
          <text x="50%" y="50%" text-anchor="middle" font-family="serif" font-size="16" fill="black">Certificate for ${certificateData.name}</text>
          <text x="50%" y="60%" text-anchor="middle" font-family="serif" font-size="12" fill="gray">Reference: ${refNo}</text>
        </svg>
      `;
      
      // Save as SVG (browsers can display this)
      const svgPath = imgPath.replace('.png', '.svg');
      await fs.writeFile(svgPath, placeholderSvg);
      
      // Create a minimal text file as PNG placeholder
      await fs.writeFile(imgPath, `Certificate generated for ${certificateData.name}\nReference: ${refNo}\nVerify at: ${verificationUrl}`);
      
      console.log('✅ Placeholder files created (SVG and text)');
    }
    
  } catch (error) {
    console.warn('⚠️ Failed to generate fallback image:', error.message);
  }
}

/**
 * Add name to certificate canvas
 */
async function addNameToCanvas(ctx, certificateData, canvasWidth) {
  try {
    const name = certificateData.full_name || certificateData.name || 'Certificate Holder';
    
    // Set text styling for name
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Find appropriate font size
    let fontSize = 60;
    let textWidth;
    
    do {
      fontSize -= 5;
      ctx.font = `bold ${fontSize}px Times, serif`;
      const metrics = ctx.measureText(name);
      textWidth = metrics.width;
    } while (textWidth > canvasWidth * 0.7 && fontSize > 20);
    
    // Position name in center-upper area of certificate
    const x = canvasWidth / 2;
    const y = 350; // Adjust based on template
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Draw the name
    ctx.fillText(name, x, y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    console.log('✅ Name added to certificate:', name);
  } catch (error) {
    console.warn('⚠️ Error adding name to canvas:', error.message);
  }
}

/**
 * Generate PDF certificate with template background
 */
async function generatePDFWithTemplate(certificateData, certificateType, refNo, verificationUrl, baseFilename) {
  try {
    console.log('📄 Starting PDF generation with template background...');
    
    // Find template
    const templateFile = findTemplateForCourse(certificateData.course || certificateData.course_name);
    const templatePath = path.join(__dirname, '../Certificate_Templates', templateFile);
    
    const pdfDir = path.join(__dirname, '../Generated-Certificates/PDF');
    const pdfFilename = `${baseFilename}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFilename);
    
    let templateExists = false;
    try {
      await fs.access(templatePath);
      templateExists = true;
      console.log('✅ Template found:', templateFile);
    } catch {
      console.warn('⚠️ Template not found:', templateFile);
    }
    
    // Generate using canvas first, then convert to PDF
    let canvas;
    if (templateExists) {
      canvas = await generateCanvasCertificate(certificateData, refNo, verificationUrl);
    } else {
      canvas = await generateTemplateWatermarkCertificate(certificateData, refNo, verificationUrl, templateFile);
    }
    
    // Convert canvas to PDF
    const doc = new PDFDocument({
      size: [841.89, 595.28], // A4 landscape in points
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    
    const stream = fs.createWriteStream ? require('fs').createWriteStream(pdfPath) : null;
    if (stream) {
      doc.pipe(stream);
    }
    
    // Convert canvas to buffer and add to PDF
    const canvasBuffer = canvas.toBuffer('image/png');
    doc.image(canvasBuffer, 0, 0, {
      width: 841.89,
      height: 595.28,
      fit: [841.89, 595.28]
    });
    
    doc.end();
    
    // Wait for PDF to be written
    if (stream) {
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
    }
    
    console.log('✅ PDF certificate generated:', pdfFilename);
    return pdfFilename;
    
  } catch (error) {
    console.error('❌ Error generating PDF certificate:', error);
    throw error;
  }
}

/**
 * Generate IMG certificate with template background
 */
async function generateIMGWithTemplate(certificateData, certificateType, refNo, verificationUrl, baseFilename) {
  try {
    console.log('🖼️ Starting IMG generation with template background...');
    
    const imgDir = path.join(__dirname, '../Generated-Certificates/IMG');
    const imgFilename = `${baseFilename}.png`;
    const imgPath = path.join(imgDir, imgFilename);
    
    // Find template
    const templateFile = findTemplateForCourse(certificateData.course || certificateData.course_name);
    
    let canvas;
    try {
      canvas = await generateCanvasCertificate(certificateData, refNo, verificationUrl);
    } catch (error) {
      console.warn('⚠️ Template generation failed, using watermark version');
      canvas = await generateTemplateWatermarkCertificate(certificateData, refNo, verificationUrl, templateFile);
    }
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(imgPath, buffer);
    
    console.log('✅ IMG certificate generated:', imgFilename);
    return imgFilename;
    
  } catch (error) {
    console.error('❌ Error generating IMG certificate:', error);
    throw error;
  }
}

/**
 * Generate certificate with "TEMPLATE MISSING" watermark when template is not found
 */
async function generateTemplateWatermarkCertificate(certificateData, refNo, verificationUrl, missingTemplateName) {
  if (!createCanvas) {
    throw new Error('Canvas not available for watermark generation');
  }
  
  try {
    console.log('⚠️ Creating certificate with TEMPLATE MISSING watermark');
    
    // Create A4 landscape canvas (1191 x 842 at 300 DPI)
    const canvas = createCanvas(1191, 842);
    const ctx = canvas.getContext('2d');
    
    // Create white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Add "TEMPLATE MISSING" watermark
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6); // -30 degrees
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TEMPLATE MISSING', 0, 0);
    ctx.restore();
    
    // Add template filename info
    ctx.fillStyle = '#FF0000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Missing Template: ${missingTemplateName}`, canvas.width / 2, 50);
    
    // Add certificate header
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px Times, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SURE Trust', canvas.width / 2, 120);
    
    ctx.font = '14px Times, serif';
    ctx.fillText('(Skill Upgradation for Rural - Youth Empowerment)', canvas.width / 2, 150);
    
    ctx.font = '18px Times, serif';
    ctx.fillText('Certificate of Completion', canvas.width / 2, 180);
    
    // Overlay certificate content
    await overlayStudentName(ctx, certificateData.name || certificateData.full_name, canvas.width, canvas.height);
    await overlayCertificateContent(ctx, certificateData, canvas.width, canvas.height);
    await addQRCodeBottomCenter(ctx, refNo, verificationUrl, canvas.width, canvas.height);
    await addReferenceAndURL(ctx, refNo, verificationUrl, canvas.width, canvas.height);
    
    console.log('✅ Certificate with TEMPLATE MISSING watermark generated');
    return canvas;
    
  } catch (error) {
    console.error('❌ Error generating watermark certificate:', error);
    throw error;
  }
}

/**
 * Overlay student name on certificate template
 */
async function overlayStudentName(ctx, name, canvasWidth, canvasHeight) {
  try {
    if (!name) return;
    
    // Set text properties for student name
    ctx.fillStyle = '#000000'; // Black text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Find appropriate font size that fits within the canvas width
    let fontSize = 48;
    let textWidth;
    
    do {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px Times, serif`;
      const metrics = ctx.measureText(name);
      textWidth = metrics.width;
    } while (textWidth > canvasWidth * 0.6 && fontSize > 24);
    
    // Position name in the typical certificate name area
    const x = canvasWidth / 2;
    const y = canvasHeight * 0.45; // 45% down from top
    
    // Add subtle text shadow for better visibility on templates
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Draw the name
    ctx.fillText(name, x, y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    console.log('✅ Student name overlaid:', name);
  } catch (error) {
    console.warn('⚠️ Error overlaying student name:', error.message);
  }
}

/**
 * Overlay certificate content (course details, dates, etc.)
 */
async function overlayCertificateContent(ctx, certificateData, canvasWidth, canvasHeight) {
  try {
    // Generate content text based on available data
    let contentText = '';
    const courseName = certificateData.course || certificateData.course_name || 'Unknown Course';
    const startDate = certificateData.start_date || certificateData.startDate;
    const endDate = certificateData.end_date || certificateData.endDate;
    const gpa = certificateData.gpa || '8.5';
    
    // Create comprehensive certificate content
    if (startDate && endDate) {
      contentText = `For successful completion of four months training in "${courseName}" from ${formatDate(startDate)} to ${formatDate(endDate)} securing ${gpa} GPA, attending the mandatory "Life Skills Training" sessions, and completing the services to community launched by SURE Trust`;
    } else {
      contentText = `For successful completion of training in "${courseName}" demonstrating exceptional skills and commitment to excellence in learning at SURE Trust`;
    }
    
    // Set font for content text
    ctx.font = '18px Times, serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Add subtle shadow for better visibility
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;
    
    // Position content below the name
    const startX = canvasWidth * 0.1; // 10% from left margin
    const startY = canvasHeight * 0.55; // Start at 55% down
    const maxWidth = canvasWidth * 0.8; // Use 80% of canvas width
    const lineHeight = 24;
    
    // Word wrap and draw text
    const words = contentText.split(' ');
    let currentLine = '';
    let y = startY;
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        // Draw current line and start new one
        ctx.fillText(currentLine.trim(), startX, y);
        currentLine = word + ' ';
        y += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    
    // Draw the last line
    if (currentLine.trim() !== '') {
      ctx.fillText(currentLine.trim(), startX, y);
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    console.log('✅ Certificate content overlaid');
  } catch (error) {
    console.warn('⚠️ Error overlaying certificate content:', error.message);
  }
}

/**
 * Add QR code at bottom center of certificate
 */
async function addQRCodeBottomCenter(ctx, refNo, verificationUrl, canvasWidth, canvasHeight) {
  try {
    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 150,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H',
      scale: 8,
      type: 'png'
    });
    
    // Check if loadImage is available
    if (!loadImage) {
      console.warn('⚠️ loadImage not available, skipping QR code overlay');
      return;
    }
    
    // Load QR code as image
    const qrImage = await loadImage(qrCodeBuffer);
    
    // Position QR code at bottom center
    const qrSize = 100;
    const qrX = (canvasWidth - qrSize) / 2; // Center horizontally
    const qrY = canvasHeight - qrSize - 30; // 30px from bottom
    
    // Add white background for QR code with padding
    const padding = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2));
    
    // Add border around QR code
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2));
    
    // Draw QR code
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    
    console.log('✅ QR code added at bottom center');
  } catch (error) {
    console.warn('⚠️ Error adding QR code:', error.message);
    // Draw placeholder if QR generation fails
    const qrSize = 100;
    const qrX = (canvasWidth - qrSize) / 2;
    const qrY = canvasHeight - qrSize - 30;
    
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', qrX + qrSize/2, qrY + qrSize/2);
  }
}

/**
 * Add reference number and verification URL at bottom of certificate
 */
async function addReferenceAndURL(ctx, refNo, verificationUrl, canvasWidth, canvasHeight) {
  try {
    // Set font for reference info
    ctx.font = '12px Times, serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Position reference number and URL at bottom
    const bottomY = canvasHeight - 10; // 10px from bottom
    const centerX = canvasWidth / 2;
    
    // Add reference number
    ctx.fillText(`Reference No: ${refNo}`, centerX, bottomY - 15);
    
    // Add verification URL
    ctx.font = '10px Times, serif';
    ctx.fillText(`Verify at: ${verificationUrl}`, centerX, bottomY);
    
    console.log('✅ Reference number and URL added');
  } catch (error) {
    console.warn('⚠️ Error adding reference and URL:', error.message);
  }
}

module.exports = {
  generateCertificate,
  generateSimpleCertificate,
  encryptQRData,
  generateChecksum,
  generateFallbackCertificate,
  generateFallbackImage
};
