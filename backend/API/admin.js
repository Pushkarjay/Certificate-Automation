const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');

// Admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get certificate counts by type and status from form_submissions
    const submissionStats = await dbService.query(`
      SELECT 
        certificate_type as type,
        COUNT(*)::int as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int as pending,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END)::int as generated,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::int as approved,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END)::int as issued,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::int as rejected
      FROM form_submissions
      GROUP BY certificate_type
    `);

    // Get recent form submissions
    const recentSubmissions = await dbService.query(`
      SELECT 
        submission_id,
        certificate_type as type,
        full_name,
        email_address as email,
        course_name,
        status,
        created_at
      FROM form_submissions
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get course statistics
    const courseStats = await dbService.query(`
      SELECT 
        course_name,
        certificate_type,
        COUNT(*)::int as total_submissions,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END)::int as generated_certificates,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int as pending_approvals
      FROM form_submissions
      WHERE course_name IS NOT NULL
      GROUP BY course_name, certificate_type
      ORDER BY total_submissions DESC
      LIMIT 20
    `);

    // Get certificate generation statistics
    const generationStats = await dbService.query(`
      SELECT 
        DATE(cg.generated_at) as date,
        COUNT(*)::int as certificates_generated
      FROM certificate_generations cg
      WHERE cg.generated_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(cg.generated_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Calculate totals
    const totals = submissionStats.rows.reduce((acc, row) => {
      acc.total += parseInt(row.total) || 0;
      acc.pending += parseInt(row.pending) || 0;
      acc.generated += parseInt(row.generated) || 0;
      acc.approved += parseInt(row.approved) || 0;
      acc.issued += parseInt(row.issued) || 0;
      acc.rejected += parseInt(row.rejected) || 0;
      return acc;
    }, { total: 0, pending: 0, generated: 0, approved: 0, issued: 0, rejected: 0 });

    res.json({
      overview: totals,
      submissionsByType: submissionStats.rows,
      recentSubmissions: recentSubmissions.rows,
      courseStatistics: courseStats.rows,
      generationStats: generationStats.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all form submissions (for admin management)
router.get('/submissions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const certificateType = req.query.type;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (certificateType) {
      whereClause += whereClause ? ` AND certificate_type = $${paramIndex}` : ` WHERE certificate_type = $${paramIndex}`;
      params.push(certificateType);
      paramIndex++;
    }

    if (search) {
      const searchClause = ` ${whereClause ? 'AND' : 'WHERE'} (full_name ILIKE $${paramIndex} OR email_address ILIKE $${paramIndex} OR course_name ILIKE $${paramIndex})`;
      whereClause += searchClause;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        fs.submission_id,
        fs.full_name,
        fs.email_address,
        fs.phone,
        fs.course_name,
        fs.batch_initials,
        fs.certificate_type,
        fs.status,
        fs.gpa,
        fs.attendance_percentage,
        fs.qualification,
        fs.organization,
        fs.created_at,
        fs.updated_at,
        cg.certificate_ref_no,
        cg.generated_at as certificate_generated_at
      FROM form_submissions fs
      LEFT JOIN certificate_generations cg ON fs.submission_id = cg.submission_id
      ${whereClause}
      ORDER BY fs.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const countQuery = `SELECT COUNT(*) as total FROM form_submissions fs ${whereClause}`;
    const countParams = params.slice(0, -2); // Remove limit and offset

    const [submissions, countResult] = await Promise.all([
      dbService.query(query, params),
      dbService.query(countQuery, countParams)
    ]);

    res.json({
      submissions: submissions.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Approve/reject form submission
router.patch('/submissions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'generated', 'issued'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const query = `
      UPDATE form_submissions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE submission_id = $2
      RETURNING *
    `;
    
    const result = await dbService.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form submission not found' });
    }

    // Log the status change
    console.log(`📝 Status updated for submission ${id}: ${result.rows[0].status} -> ${status}`);

    res.json({
      success: true,
      message: 'Status updated successfully',
      submission: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await dbService.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT b.batch_id) as total_batches,
        (
          SELECT COUNT(*) 
          FROM form_submissions fs 
          WHERE fs.course_name = c.course_name
        ) as total_submissions
      FROM courses c
      LEFT JOIN batches b ON c.course_id = b.course_id
      GROUP BY c.course_id, c.course_name, c.course_code, c.description, c.duration_hours, c.created_at, c.updated_at
      ORDER BY c.course_name
    `);

    res.json(courses.rows);

  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get all batches
router.get('/batches', async (req, res) => {
  try {
    const batches = await dbService.query(`
      SELECT 
        b.*,
        c.course_name,
        (
          SELECT COUNT(*) 
          FROM form_submissions fs 
          WHERE fs.batch_initials = b.batch_initials
        ) as total_submissions
      FROM batches b
      LEFT JOIN courses c ON b.course_id = c.course_id
      ORDER BY b.start_date DESC
    `);

    res.json(batches.rows);

  } catch (error) {
    console.error('❌ Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await dbService.query(`
      SELECT 
        t.*,
        (
          SELECT COUNT(*) 
          FROM certificate_generations cg 
          WHERE cg.template_id = t.template_id
        ) as usage_count
      FROM certificate_templates t
      ORDER BY t.template_type, t.template_name
    `);

    res.json(templates.rows);

  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Add new course
router.post('/courses', async (req, res) => {
  try {
    const { course_name, course_code, description, duration_hours } = req.body;
    
    if (!course_name) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    const query = `
      INSERT INTO courses (course_name, course_code, description, duration_hours)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await dbService.query(query, [course_name, course_code, description, duration_hours]);
    
    res.json({
      success: true,
      message: 'Course added successfully',
      course: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error adding course:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Course code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add course' });
    }
  }
});

// Add new batch
router.post('/batches', async (req, res) => {
  try {
    const { batch_name, batch_initials, course_id, start_date, end_date } = req.body;
    
    if (!batch_name || !course_id) {
      return res.status(400).json({ error: 'Batch name and course ID are required' });
    }

    const query = `
      INSERT INTO batches (batch_name, batch_initials, course_id, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await dbService.query(query, [batch_name, batch_initials, course_id, start_date, end_date]);
    
    res.json({
      success: true,
      message: 'Batch added successfully',
      batch: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error adding batch:', error);
    res.status(500).json({ error: 'Failed to add batch' });
  }
});

// Add new template
router.post('/templates', async (req, res) => {
  try {
    const { template_name, template_path, template_type } = req.body;
    
    if (!template_name || !template_type) {
      return res.status(400).json({ error: 'Template name and type are required' });
    }

    const query = `
      INSERT INTO certificate_templates (template_name, template_path, template_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await dbService.query(query, [template_name, template_path, template_type]);
    
    res.json({
      success: true,
      message: 'Template added successfully',
      template: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error adding template:', error);
    res.status(500).json({ error: 'Failed to add template' });
  }
});

// Export submissions data
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const format = req.query.format || 'json';
    
    let query = '';
    
    switch (type) {
      case 'submissions':
        query = `
          SELECT 
            fs.*,
            cg.certificate_ref_no,
            cg.generated_at as certificate_generated_at
          FROM form_submissions fs
          LEFT JOIN certificate_generations cg ON fs.submission_id = cg.submission_id
          ORDER BY fs.created_at DESC
        `;
        break;
      case 'certificates':
        query = `
          SELECT 
            cg.*,
            fs.full_name,
            fs.email_address,
            fs.course_name,
            fs.certificate_type
          FROM certificate_generations cg
          JOIN form_submissions fs ON cg.submission_id = fs.submission_id
          ORDER BY cg.generated_at DESC
        `;
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }
    
    const result = await dbService.query(query);
    
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);
      res.send(csv);
    } else {
      res.json({
        type: type,
        count: result.rows.length,
        data: result.rows,
        exported_at: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;
