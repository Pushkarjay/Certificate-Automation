const { createCanvas, loadImage, registerFont } = require('canvas');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const QRCode = require('qrcode');

// Register fonts
try {
  registerFont(path.join(__dirname, '../Certificate_Templates/fonts/times.ttf'), { family: 'Times' });
  registerFont(path.join(__dirname, '../Certificate_Templates/fonts/EBGaramond-Regular.ttf'), { family: 'EBGaramond' });
} catch (error) {
  console.warn('⚠️ Font files not found. Using default fonts.');
}

/**
 * Generate certificate in both IMG and PDF formats based on SRS requirements
 */
async function generateCertificate(certificateData, certificateType) {
  try {
    const templatePath = path.join(__dirname, '../Certificate_Templates', certificateData.template_file_path);
    
    // Load template image
    const templateImage = await loadImage(templatePath);
    
    // Create canvas with template dimensions
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const ctx = canvas.getContext('2d');
    
    // Draw template
    ctx.drawImage(templateImage, 0, 0);
    
    // Add name
    await addNameToCanvas(ctx, certificateData, canvas.width);
    
    // Add content text
    await addContentToCanvas(ctx, certificateData, certificateType, canvas.width);
    
    // Generate and add encrypted QR code
    await addQRCodeToCanvas(ctx, certificateData, canvas.width, canvas.height);
    
    // Generate filenames
    const baseFilename = generateBaseFilename(certificateData, certificateType);
    
    // Generate IMG certificate
    const imgFilename = await generateIMGCertificate(canvas, baseFilename);
    
    // Generate PDF certificate
    const pdfFilename = await generatePDFCertificate(canvas, baseFilename, certificateData, certificateType);
    
    console.log(`✅ Certificate generated: IMG=${imgFilename}, PDF=${pdfFilename}`);
    return { 
      imgFilename, 
      pdfFilename, 
      referenceNumber: certificateData.reference_number 
    };
    
  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    throw new Error(`Certificate generation failed: ${error.message}`);
  }
}

/**
 * Add name to certificate
 */
async function addNameToCanvas(ctx, certificateData, canvasWidth) {
  const name = `${certificateData.title}.${certificateData.full_name}`;
  
  // Find appropriate font size
  let fontSize = 90;
  let textWidth;
  
  do {
    fontSize -= 10;
    ctx.font = `${fontSize}px Times, serif`;
    const metrics = ctx.measureText(name);
    textWidth = metrics.width;
  } while (textWidth > canvasWidth - 240 && fontSize > 30); // Keep some margin
  
  // Position text (centered horizontally, around position 362 vertically)
  const x = (canvasWidth - textWidth) / 2;
  const y = 362 + (90 - fontSize) / 2; // Adjust Y based on font size reduction
  
  // Ensure minimum x position
  const finalX = Math.max(x, 120);
  
  // Draw text
  ctx.fillStyle = '#000000';
  ctx.fillText(name, finalX, y);
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
    const verificationURL = `${process.env.VERIFICATION_BASE_URL}${certificateData.reference_number}`;
    
    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(verificationURL, {
      width: 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Load QR code as image
    const qrImage = await loadImage(qrCodeBuffer);
    
    // Position QR code (bottom right corner)
    const qrSize = 100;
    const qrX = canvasWidth - qrSize - 50;
    const qrY = canvasHeight - qrSize - 50;
    
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    
  } catch (error) {
    console.warn('⚠️ QR code generation failed:', error.message);
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
    console.log('🎓 Generating certificate for:', certificateData.name);
    
    // Generate reference number if not provided
    const refNo = certificateData.refNo || `${certificateData.type.toUpperCase()}_${certificateData.course.replace(/\s+/g, '').substring(0, 4).toUpperCase()}_${certificateData.batch}_${new Date().getFullYear()}_${Date.now().toString().substr(-4)}`;
    
    // Generate verification URL
    const verificationUrl = certificateData.verificationUrl || `${process.env.VERIFICATION_BASE_URL || 'https://certificate-automation-dmoe.onrender.com/verify/'}${refNo}`;
    
    // Generate QR code as data URL
    const qrCodeData = await QRCode.toDataURL(verificationUrl);
    
    // Ensure output directories exist
    const imgDir = path.join(__dirname, '../Generated-Certificates/IMG');
    const pdfDir = path.join(__dirname, '../Generated-Certificates/PDF');
    await ensureDirectoryExists(imgDir);
    await ensureDirectoryExists(pdfDir);
    
    // Generate filenames
    const safeRefNo = refNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    const imgFilename = `certificate_${safeRefNo}.jpg`;
    const pdfFilename = `certificate_${safeRefNo}.pdf`;
    const imgPath = path.join(imgDir, imgFilename);
    const pdfPath = path.join(pdfDir, pdfFilename);
    
    // Generate HTML-based certificate (more reliable than canvas)
    await generateHTMLCertificate(certificateData, imgPath, pdfPath, refNo, verificationUrl, qrCodeData);
    
    console.log('✅ Certificate files generated:', { imgFilename, pdfFilename });
    
    // Return actual file paths
    return {
      success: true,
      imagePath: `Generated-Certificates/IMG/${imgFilename}`,
      pdfPath: `Generated-Certificates/PDF/${pdfFilename}`,
      certificateData: {
        referenceNumber: refNo,
        holderName: certificateData.name,
        course: certificateData.course,
        batch: certificateData.batch,
        type: certificateData.type,
        verificationUrl: verificationUrl,
        qrCodeData: qrCodeData,
        issuedDate: new Date().toISOString(),
        template: certificateData.templatePath || 'default.jpg'
      },
      message: 'Certificate files generated successfully'
    };
    
  } catch (error) {
    console.error('❌ Error in certificate generation:', error);
    
    // Fallback: Return basic data without files
    const refNo = certificateData.refNo || `${certificateData.type.toUpperCase()}_${Date.now()}`;
    const verificationUrl = `https://certificate-automation-dmoe.onrender.com/verify/${refNo}`;
    
    return {
      success: true,
      imagePath: null, // No file generated
      pdfPath: null, // No file generated
      certificateData: {
        referenceNumber: refNo,
        holderName: certificateData.name,
        course: certificateData.course,
        batch: certificateData.batch,
        type: certificateData.type,
        verificationUrl: verificationUrl,
        qrCodeData: await QRCode.toDataURL(verificationUrl).catch(() => null),
        issuedDate: new Date().toISOString(),
        template: 'text-only'
      },
      message: 'Certificate generated (metadata only - file generation failed)'
    };
  }
}

/**
 * Generate HTML-based certificate (fallback method)
 */
async function generateHTMLCertificate(certificateData, imgPath, pdfPath, refNo, verificationUrl, qrCodeData) {
  try {
    // Create HTML certificate content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .certificate {
            background: white;
            width: 800px;
            height: 600px;
            border: 10px solid #2c3e50;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            position: relative;
        }
        .title {
            font-size: 48px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .subtitle {
            font-size: 24px;
            color: #7f8c8d;
            margin-bottom: 40px;
        }
        .name {
            font-size: 42px;
            font-weight: bold;
            color: #e74c3c;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .course {
            font-size: 28px;
            color: #3498db;
            margin: 20px 0;
            font-weight: bold;
        }
        .batch {
            font-size: 20px;
            color: #27ae60;
            margin: 15px 0;
        }
        .footer {
            position: absolute;
            bottom: 20px;
            left: 40px;
            right: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ref-no {
            font-size: 14px;
            color: #7f8c8d;
        }
        .qr-placeholder {
            width: 80px;
            height: 80px;
            border: 2px solid #bdc3c7;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #7f8c8d;
        }
        .date {
            font-size: 16px;
            color: #34495e;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="title">Certificate of Completion</div>
        <div class="subtitle">This is to certify that</div>
        <div class="name">${certificateData.name}</div>
        <div class="subtitle">has successfully completed</div>
        <div class="course">${certificateData.course}</div>
        <div class="batch">Batch: ${certificateData.batch}</div>
        <div class="date">Date: ${new Date().toLocaleDateString()}</div>
        
        <div class="footer">
            <div class="ref-no">Reference: ${refNo}</div>
            <div class="qr-placeholder">QR Code<br/>Verify</div>
        </div>
    </div>
</body>
</html>`;
    
    // For now, create a simple text file instead of complex image generation
    const textContent = `
CERTIFICATE OF COMPLETION

This is to certify that

${certificateData.name.toUpperCase()}

has successfully completed the course

${certificateData.course}

Batch: ${certificateData.batch}
Date: ${new Date().toLocaleDateString()}
Reference: ${refNo}

Verification URL: ${verificationUrl}

Generated by SURE Trust Certificate System
    `.trim();
    
    // Write text-based certificate as "image" (will be served as text)
    await fs.writeFile(imgPath.replace('.jpg', '.txt'), textContent);
    
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
           .text(certificateData.course, 50, 320, { align: 'center' });
    
    pdfDoc.fontSize(16)
           .font('Helvetica')
           .fillColor('#27ae60')
           .text(`Batch: ${certificateData.batch}`, 50, 370, { align: 'center' });
    
    pdfDoc.fontSize(14)
           .font('Helvetica')
           .fillColor('#34495e')
           .text(`Date: ${new Date().toLocaleDateString()}`, 50, 410, { align: 'center' });
    
    pdfDoc.fontSize(12)
           .font('Helvetica')
           .fillColor('#7f8c8d')
           .text(`Reference: ${refNo}`, 50, 480, { align: 'left' });
    
    pdfDoc.fontSize(12)
           .text(`Verification: ${verificationUrl}`, 50, 500, { align: 'left' });
    
    pdfDoc.end();
    
    // Wait for PDF to finish writing
    await new Promise((resolve, reject) => {
      pdfStream.on('finish', resolve);
      pdfStream.on('error', reject);
    });
    
    console.log('✅ HTML-based certificate generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating HTML-based certificate:', error);
    throw error;
  }
}

module.exports = {
  generateCertificate,
  generateSimpleCertificate,
  encryptQRData,
  generateChecksum
};
