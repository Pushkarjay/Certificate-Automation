const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs').promises;

// Register fonts
try {
  registerFont(path.join(__dirname, '../../confidential-templates/fonts/times.ttf'), { family: 'Times' });
  registerFont(path.join(__dirname, '../../confidential-templates/fonts/EBGaramond-Regular.ttf'), { family: 'EBGaramond' });
} catch (error) {
  console.warn('⚠️ Font files not found. Using default fonts.');
}

/**
 * Generate certificate based on template and data
 */
async function generateCertificate(certificateData, certificateType) {
  try {
    const templatePath = path.join(__dirname, '../../confidential-templates', certificateData.template_file_path);
    
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
    
    // Generate filename
    const filename = generateFilename(certificateData, certificateType);
    const outputPath = path.join(__dirname, '../certificates', filename);
    
    // Ensure certificates directory exists
    await ensureDirectoryExists(path.dirname(outputPath));
    
    // Save certificate
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    
    console.log(`✅ Certificate generated: ${filename}`);
    return filename;
    
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
 * Format date to readable format
 */
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${months[date.getMonth()]}-${date.getFullYear().toString().substr(2)}`;
}

/**
 * Generate filename for certificate
 */
function generateFilename(certificateData, certificateType) {
  const safeName = certificateData.full_name.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${certificateType}_${safeName}_${certificateData.batch_initials}_${timestamp}.png`;
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

module.exports = {
  generateCertificate
};
