const { executeQuery, executeQueryOne, executeStoredProcedure } = require('../config/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class CertificateMySQL {
  
  // Generate unique DOF number
  static async generateDofNo() {
    let isUnique = false;
    let dofNo;
    
    while (!isUnique) {
      dofNo = `DOF-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
      const result = await executeQueryOne(
        'SELECT COUNT(*) as count FROM certificates WHERE dof_no = ?',
        [dofNo]
      );
      
      if (result.success && result.data.count === 0) {
        isUnique = true;
      }
    }
    
    return dofNo;
  }

  // Create new certificate
  static async create(certificateData) {
    try {
      const {
        name, program, refNo, issueDate, certificateType = 'student',
        trainingDuration, subjectCourse, startDate, endDate, gpa,
        specialization, experienceYears, userId, recipientEmail,
        issuedBy, issuerName
      } = certificateData;

      // Generate unique DOF number
      const dofNo = await this.generateDofNo();
      
      // Create verification URL
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${dofNo}`;
      
      // Generate QR Code
      const qrCodeData = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      const query = `
        INSERT INTO certificates (
          ref_no, dof_no, name, program, certificate_type, issue_date,
          training_duration, subject_course, start_date, end_date, gpa,
          specialization, experience_years, qr_code_data, verification_url,
          user_id, recipient_email, issued_by, issuer_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        refNo, dofNo, name, program, certificateType, issueDate,
        trainingDuration, subjectCourse, startDate, endDate, gpa,
        specialization, experienceYears, qrCodeData, verificationUrl,
        userId, recipientEmail, issuedBy, issuerName
      ];

      const result = await executeQuery(query, params);
      
      if (result.success) {
        return await this.findById(result.data.insertId);
      }
      
      throw new Error(result.error);
    } catch (error) {
      throw error;
    }
  }

  // Find certificate by ID
  static async findById(id) {
    const result = await executeQueryOne(
      'SELECT * FROM certificates WHERE id = ?',
      [id]
    );
    
    if (result.success) {
      return this.formatCertificate(result.data);
    }
    
    throw new Error(result.error);
  }

  // Find certificate by DOF number
  static async findByDofNo(dofNo) {
    const result = await executeQueryOne(
      'SELECT * FROM certificates WHERE dof_no = ? AND is_active = TRUE',
      [dofNo]
    );
    
    if (result.success) {
      return this.formatCertificate(result.data);
    }
    
    return null;
  }

  // Find certificate by reference number
  static async findByRefNo(refNo) {
    const result = await executeQueryOne(
      'SELECT * FROM certificates WHERE ref_no = ?',
      [refNo]
    );
    
    if (result.success) {
      return this.formatCertificate(result.data);
    }
    
    return null;
  }

  // Get all certificates with pagination
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    // Get certificates
    const certificatesResult = await executeQuery(
      `SELECT * FROM certificates WHERE is_active = TRUE 
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // Get total count
    const countResult = await executeQueryOne(
      'SELECT COUNT(*) as total FROM certificates WHERE is_active = TRUE'
    );
    
    if (certificatesResult.success && countResult.success) {
      const certificates = certificatesResult.data.map(cert => this.formatCertificate(cert));
      const total = countResult.data.total;
      
      return {
        data: certificates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    }
    
    throw new Error('Failed to fetch certificates');
  }

  // Verify certificate and log attempt
  static async verify(dofNo, ipAddress = null, userAgent = null) {
    try {
      const certificate = await this.findByDofNo(dofNo);
      
      if (certificate) {
        // Update verification count
        await executeQuery(
          `UPDATE certificates 
           SET verification_count = verification_count + 1, 
               last_verified = CURRENT_TIMESTAMP 
           WHERE dof_no = ?`,
          [dofNo]
        );
        
        // Log verification attempt
        await executeQuery(
          `INSERT INTO verification_logs 
           (certificate_id, dof_no, ip_address, user_agent, verification_status) 
           VALUES (?, ?, ?, ?, 'success')`,
          [certificate.id, dofNo, ipAddress, userAgent]
        );
        
        // Get updated certificate
        const updatedCert = await this.findByDofNo(dofNo);
        
        return {
          success: true,
          verified: true,
          message: 'Certificate verified successfully',
          data: updatedCert
        };
      } else {
        // Log failed attempt
        await executeQuery(
          `INSERT INTO verification_logs 
           (certificate_id, dof_no, ip_address, user_agent, verification_status) 
           VALUES (NULL, ?, ?, ?, 'not_found')`,
          [dofNo, ipAddress, userAgent]
        );
        
        return {
          success: false,
          verified: false,
          message: 'Certificate not found or inactive'
        };
      }
    } catch (error) {
      throw error;
    }
  }

  // Deactivate certificate
  static async deactivate(id) {
    const result = await executeQuery(
      'UPDATE certificates SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    if (result.success) {
      return { success: true, message: 'Certificate deactivated successfully' };
    }
    
    throw new Error(result.error);
  }

  // Format certificate data for consistent output
  static formatCertificate(cert) {
    if (!cert) return null;
    
    return {
      id: cert.id,
      refNo: cert.ref_no,
      dofNo: cert.dof_no,
      name: cert.name,
      program: cert.program,
      certificateType: cert.certificate_type,
      issueDate: cert.issue_date,
      trainingDuration: cert.training_duration,
      subjectCourse: cert.subject_course,
      startDate: cert.start_date,
      endDate: cert.end_date,
      gpa: cert.gpa,
      specialization: cert.specialization,
      experienceYears: cert.experience_years,
      qrCodeUrl: cert.qr_code_data,
      verificationUrl: cert.verification_url,
      isActive: cert.is_active,
      metadata: {
        generatedBy: cert.generated_by,
        generatedAt: cert.created_at,
        lastVerified: cert.last_verified,
        verificationCount: cert.verification_count
      },
      createdAt: cert.created_at,
      updatedAt: cert.updated_at
    };
  }

  // Get verification statistics
  static async getVerificationStats(dofNo) {
    const result = await executeQueryOne(
      `SELECT * FROM verification_stats WHERE dof_no = ?`,
      [dofNo]
    );
    
    if (result.success) {
      return result.data;
    }
    
    return null;
  }

  // Search certificates
  static async search(searchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;
    
    const query = `
      SELECT * FROM certificates 
      WHERE is_active = TRUE AND (
        name LIKE ? OR 
        program LIKE ? OR 
        ref_no LIKE ? OR 
        dof_no LIKE ?
      )
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM certificates 
      WHERE is_active = TRUE AND (
        name LIKE ? OR 
        program LIKE ? OR 
        ref_no LIKE ? OR 
        dof_no LIKE ?
      )
    `;
    
    const searchParams = [searchPattern, searchPattern, searchPattern, searchPattern];
    
    const certificatesResult = await executeQuery(query, [...searchParams, limit, offset]);
    const countResult = await executeQueryOne(countQuery, searchParams);
    
    if (certificatesResult.success && countResult.success) {
      const certificates = certificatesResult.data.map(cert => this.formatCertificate(cert));
      const total = countResult.data.total;
      
      return {
        data: certificates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    }
    
    throw new Error('Search failed');
  }

  // Find certificates by user ID
  static async findByUser(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    try {
      // Get certificates for specific user
      const result = await executeQuery(
        `SELECT c.*, u.first_name, u.last_name, u.email,
                o.name as organization_name
         FROM certificates c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN organizations o ON c.organization_id = o.id
         WHERE c.user_id = ? AND c.is_active = TRUE
         ORDER BY c.issue_date DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      if (result.success) {
        // Get total count
        const countResult = await executeQueryOne(
          'SELECT COUNT(*) as total FROM certificates WHERE user_id = ? AND is_active = TRUE',
          [userId]
        );
        
        const total = countResult.success ? countResult.data.total : 0;
        const totalPages = Math.ceil(total / limit);
        
        return {
          data: result.data.map(cert => this.formatCertificate(cert)),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        };
      }
    } catch (error) {
      console.error('Error in findByUser:', error);
    }
    
    throw new Error('Failed to fetch user certificates');
  }

  // Search certificates by user ID
  static async searchByUser(userId, searchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;
    
    try {
      const result = await executeQuery(
        `SELECT c.*, u.first_name, u.last_name, u.email,
                o.name as organization_name
         FROM certificates c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN organizations o ON c.organization_id = o.id
         WHERE c.user_id = ? AND c.is_active = TRUE
         AND (c.name LIKE ? OR c.program LIKE ? OR c.ref_no LIKE ? OR c.dof_no LIKE ?)
         ORDER BY c.issue_date DESC
         LIMIT ? OFFSET ?`,
        [userId, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]
      );
      
      if (result.success) {
        // Get total count for search
        const countResult = await executeQueryOne(
          `SELECT COUNT(*) as total FROM certificates 
           WHERE user_id = ? AND is_active = TRUE
           AND (name LIKE ? OR program LIKE ? OR ref_no LIKE ? OR dof_no LIKE ?)`,
          [userId, searchPattern, searchPattern, searchPattern, searchPattern]
        );
        
        const total = countResult.success ? countResult.data.total : 0;
        const totalPages = Math.ceil(total / limit);
        
        return {
          data: result.data.map(cert => this.formatCertificate(cert)),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          searchTerm
        };
      }
    } catch (error) {
      console.error('Error in searchByUser:', error);
    }
    
    throw new Error('Failed to search user certificates');
  }

  // Get certificate claim information for unregistered users
  static async getClaimInfo(dofNo) {
    const result = await executeQueryOne(
      `SELECT c.id, c.dof_no, c.name, c.program, c.recipient_email, c.user_id,
              c.issue_date, c.issuer_name
       FROM certificates c
       WHERE c.dof_no = ? AND c.is_active = TRUE`,
      [dofNo]
    );
    
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          id: result.data.id,
          dofNo: result.data.dof_no,
          recipientName: result.data.name,
          program: result.data.program,
          recipientEmail: result.data.recipient_email,
          isClaimed: !!result.data.user_id,
          issueDate: result.data.issue_date,
          issuerName: result.data.issuer_name
        }
      };
    }
    
    return { success: false, message: 'Certificate not found' };
  }

  // Claim certificate by user
  static async claimByUser(dofNo, userId) {
    try {
      // Check if certificate exists and is not claimed
      const cert = await this.getClaimInfo(dofNo);
      
      if (!cert.success) {
        return { success: false, message: 'Certificate not found' };
      }
      
      if (cert.data.isClaimed) {
        return { success: false, message: 'Certificate already claimed' };
      }
      
      // Update certificate with user ID
      const result = await executeQuery(
        'UPDATE certificates SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE dof_no = ?',
        [userId, dofNo]
      );
      
      if (result.success) {
        return { 
          success: true, 
          message: 'Certificate claimed successfully',
          data: await this.findById(cert.data.id)
        };
      }
      
      throw new Error(result.error);
    } catch (error) {
      console.error('Error in claimByUser:', error);
      throw new Error('Failed to claim certificate');
    }
  }
}

module.exports = CertificateMySQL;
