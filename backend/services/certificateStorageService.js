const fs = require('fs').promises;
const path = require('path');
const dbService = require('./databaseService');

/**
 * Certificate File Storage Service
 * Handles storing and retrieving certificate files from PostgreSQL database
 */
class CertificateStorageService {
  
  /**
   * Store certificate files in database
   * @param {string} certificateRefNo - Certificate reference number
   * @param {Object} files - Object containing file data
   * @param {Buffer} files.pdfData - PDF file data
   * @param {Buffer} files.imageData - Image file data (optional)
   * @param {string} files.svgData - SVG file data (optional)
   * @returns {Promise<boolean>} Success status
   */
  async storeCertificateFiles(certificateRefNo, files) {
    try {
      console.log(`📁 Storing certificate files for ${certificateRefNo}`);
      
      const { pdfData, imageData, svgData } = files;
      
      // Determine primary file type and content type
      let fileType = 'pdf';
      let contentType = 'application/pdf';
      let fileSizeBytes = 0;
      
      if (pdfData) {
        fileSizeBytes = pdfData.length;
      } else if (imageData) {
        fileType = 'png';
        contentType = 'image/png';
        fileSizeBytes = imageData.length;
      } else if (svgData) {
        fileType = 'svg';
        contentType = 'image/svg+xml';
        fileSizeBytes = Buffer.from(svgData).length;
      }
      
      const query = `
        UPDATE certificate_generations 
        SET 
          certificate_pdf_data = $1,
          certificate_image_data = $2,
          certificate_svg_data = $3,
          file_type = $4,
          content_type = $5,
          file_size_bytes = $6
        WHERE certificate_ref_no = $7
      `;
      
      const params = [
        pdfData || null,
        imageData || null,
        svgData || null,
        fileType,
        contentType,
        fileSizeBytes,
        certificateRefNo
      ];
      
      const result = await dbService.query(query, params);
      
      if (result.rowCount > 0) {
        console.log(`✅ Certificate files stored successfully for ${certificateRefNo}`);
        console.log(`📊 File size: ${fileSizeBytes} bytes, Type: ${fileType}`);
        return true;
      } else {
        console.warn(`⚠️ No certificate record found for ${certificateRefNo}`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error storing certificate files:', error);
      return false;
    }
  }
  
  /**
   * Retrieve certificate file from database
   * @param {string} certificateRefNo - Certificate reference number
   * @param {string} fileType - Type of file to retrieve (pdf, png, svg)
   * @returns {Promise<Object|null>} File data object or null
   */
  async getCertificateFile(certificateRefNo, fileType = 'pdf') {
    try {
      console.log(`📂 Retrieving ${fileType} file for ${certificateRefNo}`);
      
      let dataColumn;
      let defaultContentType;
      
      switch (fileType.toLowerCase()) {
        case 'pdf':
          dataColumn = 'certificate_pdf_data';
          defaultContentType = 'application/pdf';
          break;
        case 'png':
        case 'img':
        case 'image':
          dataColumn = 'certificate_image_data';
          defaultContentType = 'image/png';
          break;
        case 'svg':
          dataColumn = 'certificate_svg_data';
          defaultContentType = 'image/svg+xml';
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      const query = `
        SELECT 
          ${dataColumn} as file_data,
          content_type,
          file_size_bytes,
          generated_at
        FROM certificate_generations 
        WHERE certificate_ref_no = $1
      `;
      
      const result = await dbService.query(query, [certificateRefNo]);
      
      if (result.rows.length === 0) {
        console.warn(`⚠️ No certificate found for ${certificateRefNo}`);
        return null;
      }
      
      const row = result.rows[0];
      const fileData = row.file_data;
      
      if (!fileData) {
        console.warn(`⚠️ No ${fileType} file data found for ${certificateRefNo}`);
        return null;
      }
      
      console.log(`✅ Retrieved ${fileType} file for ${certificateRefNo} (${row.file_size_bytes} bytes)`);
      
      return {
        data: fileData,
        contentType: row.content_type || defaultContentType,
        size: row.file_size_bytes,
        generatedAt: row.generated_at,
        filename: `${certificateRefNo}.${fileType}`
      };
      
    } catch (error) {
      console.error(`❌ Error retrieving certificate file:`, error);
      return null;
    }
  }
  
  /**
   * Store certificate from file paths (for backward compatibility)
   * @param {string} certificateRefNo - Certificate reference number
   * @param {string} pdfPath - Path to PDF file
   * @param {string} imagePath - Path to image file (optional)
   * @returns {Promise<boolean>} Success status
   */
  async storeCertificateFromFiles(certificateRefNo, pdfPath, imagePath = null) {
    try {
      console.log(`📁 Loading certificate files from disk for ${certificateRefNo}`);
      
      const files = {};
      
      // Read PDF file
      if (pdfPath && await this.fileExists(pdfPath)) {
        files.pdfData = await fs.readFile(pdfPath);
        console.log(`📄 Loaded PDF: ${files.pdfData.length} bytes`);
      }
      
      // Read image file
      if (imagePath && await this.fileExists(imagePath)) {
        files.imageData = await fs.readFile(imagePath);
        console.log(`🖼️ Loaded image: ${files.imageData.length} bytes`);
      }
      
      // If no files found, create SVG placeholder
      if (!files.pdfData && !files.imageData) {
        files.svgData = this.createSVGPlaceholder(certificateRefNo);
        console.log(`🎨 Created SVG placeholder: ${files.svgData.length} characters`);
      }
      
      return await this.storeCertificateFiles(certificateRefNo, files);
      
    } catch (error) {
      console.error('❌ Error storing certificate from files:', error);
      return false;
    }
  }
  
  /**
   * Create SVG placeholder for certificates
   * @param {string} certificateRefNo - Certificate reference number
   * @returns {string} SVG content
   */
  createSVGPlaceholder(certificateRefNo) {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<svg width="1122" height="794" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E3F2FD;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#BBDEFB;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="100%" height="100%" fill="url(#grad1)" stroke="#1976D2" stroke-width="4"/>
  
  <text x="561" y="120" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#1976D2">
    CERTIFICATE OF COMPLETION
  </text>
  
  <text x="561" y="250" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#1565C0">
    Certificate Generated
  </text>
  
  <text x="561" y="380" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#424242">
    Reference: ${certificateRefNo}
  </text>
  
  <text x="561" y="430" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#666666">
    Certificate stored in database
  </text>
  
  <text x="561" y="580" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#1976D2">
    SURE Trust
  </text>
</svg>`.trim();
  }
  
  /**
   * Check if file exists
   * @param {string} filePath - File path
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get certificate statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_certificates,
          COUNT(certificate_pdf_data) as pdf_count,
          COUNT(certificate_image_data) as image_count,
          COUNT(certificate_svg_data) as svg_count,
          SUM(file_size_bytes) as total_size_bytes,
          AVG(file_size_bytes) as avg_size_bytes
        FROM certificate_generations
      `;
      
      const result = await dbService.query(query);
      const stats = result.rows[0];
      
      return {
        totalCertificates: parseInt(stats.total_certificates),
        pdfCount: parseInt(stats.pdf_count),
        imageCount: parseInt(stats.image_count),
        svgCount: parseInt(stats.svg_count),
        totalSizeBytes: parseInt(stats.total_size_bytes || 0),
        avgSizeBytes: parseInt(stats.avg_size_bytes || 0),
        totalSizeMB: Math.round((stats.total_size_bytes || 0) / 1024 / 1024 * 100) / 100
      };
      
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return null;
    }
  }
}

module.exports = new CertificateStorageService();
