const fs = require('fs').promises;
const path = require('path');
const dbService = require('./databaseService');

/**
 * Certificate File Storage Service
 * Handles storing and retrieving certificate files from PostgreSQL database
 */
class CertificateStorageService {
  
  /**
   * Store certificate PDF file in database
   * @param {string} certificateRefNo - Certificate reference number
   * @param {Buffer} pdfData - PDF file data
   * @returns {Promise<boolean>} Success status
   */
  async storeCertificateFiles(certificateRefNo, pdfData) {
    try {
      console.log(`📁 Storing certificate PDF for ${certificateRefNo}`);
      
      if (!pdfData) {
        console.error('❌ No PDF data provided');
        return false;
      }
      
      const fileSizeBytes = pdfData.length;
      
      const query = `
        UPDATE certificate_generations 
        SET 
          certificate_pdf_data = $1,
          file_type = 'pdf',
          content_type = 'application/pdf',
          file_size_bytes = $2
        WHERE certificate_ref_no = $3
      `;
      
      const params = [pdfData, fileSizeBytes, certificateRefNo];
      
      const result = await dbService.query(query, params);
      
      if (result.rowCount > 0) {
        console.log(`✅ Certificate PDF stored successfully for ${certificateRefNo}`);
        console.log(`📊 File size: ${fileSizeBytes} bytes`);
        return true;
      } else {
        console.warn(`⚠️ No certificate record found for ${certificateRefNo}`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error storing certificate PDF:', error);
      return false;
    }
  }
  
  /**
   * Retrieve certificate PDF file from database
   * @param {string} certificateRefNo - Certificate reference number
   * @returns {Promise<Object|null>} File data object or null
   */
  async getCertificateFile(certificateRefNo) {
    try {
      console.log(`📂 Retrieving PDF file for ${certificateRefNo}`);
      
      const query = `
        SELECT 
          certificate_pdf_data as file_data,
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
        console.warn(`⚠️ No PDF file data found for ${certificateRefNo}`);
        return null;
      }
      
      console.log(`✅ Retrieved PDF file for ${certificateRefNo} (${row.file_size_bytes} bytes)`);
      
      return {
        data: fileData,
        contentType: row.content_type || 'application/pdf',
        size: row.file_size_bytes,
        generatedAt: row.generated_at,
        filename: `${certificateRefNo}.pdf`
      };
      
    } catch (error) {
      console.error(`❌ Error retrieving certificate PDF:`, error);
      return null;
    }
  }
  
  /**
   * Store certificate from PDF file path
   * @param {string} certificateRefNo - Certificate reference number
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<boolean>} Success status
   */
  async storeCertificateFromFiles(certificateRefNo, pdfPath) {
    try {
      console.log(`📁 Loading certificate PDF from disk for ${certificateRefNo}`);
      
      // Read PDF file
      if (pdfPath && await this.fileExists(pdfPath)) {
        const pdfData = await fs.readFile(pdfPath);
        console.log(`📄 Loaded PDF: ${pdfData.length} bytes`);
        return await this.storeCertificateFiles(certificateRefNo, pdfData);
      } else {
        console.error(`❌ PDF file not found: ${pdfPath}`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error storing certificate from file:', error);
      return false;
    }
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
          SUM(file_size_bytes) as total_size_bytes,
          AVG(file_size_bytes) as avg_size_bytes
        FROM certificate_generations
      `;
      
      const result = await dbService.query(query);
      const stats = result.rows[0];
      
      return {
        totalCertificates: parseInt(stats.total_certificates),
        pdfCount: parseInt(stats.pdf_count),
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
