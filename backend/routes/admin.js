const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get certificate counts by type and status
    const [certificateStats] = await pool.execute(`
      SELECT 
        'student' as type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
      FROM student_certificates
      UNION ALL
      SELECT 
        'trainer' as type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
      FROM trainer_certificates
      UNION ALL
      SELECT 
        'trainee' as type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
      FROM trainee_certificates
    `);

    // Get recent certificate submissions
    const [recentSubmissions] = await pool.execute(`
      (SELECT 'student' as type, certificate_id, full_name, email, created_at, status FROM student_certificates ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'trainer' as type, certificate_id, full_name, email, created_at, status FROM trainer_certificates ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'trainee' as type, certificate_id, full_name, email, created_at, status FROM trainee_certificates ORDER BY created_at DESC LIMIT 5)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get course statistics
    const [courseStats] = await pool.execute(`
      SELECT 
        c.course_name,
        c.course_code,
        COUNT(DISTINCT b.batch_id) as total_batches,
        (
          (SELECT COUNT(*) FROM student_certificates sc WHERE sc.course_id = c.course_id) +
          (SELECT COUNT(*) FROM trainer_certificates tc WHERE tc.course_id = c.course_id) +
          (SELECT COUNT(*) FROM trainee_certificates tr WHERE tr.course_id = c.course_id)
        ) as total_certificates
      FROM courses c
      LEFT JOIN batches b ON c.course_id = b.course_id
      GROUP BY c.course_id, c.course_name, c.course_code
      ORDER BY total_certificates DESC
    `);

    // Calculate totals
    const totals = certificateStats.reduce((acc, row) => {
      acc.total += row.total;
      acc.pending += row.pending;
      acc.generated += row.generated;
      acc.issued += row.issued;
      acc.revoked += row.revoked;
      return acc;
    }, { total: 0, pending: 0, generated: 0, issued: 0, revoked: 0 });

    res.json({
      overview: totals,
      certificatesByType: certificateStats,
      recentSubmissions,
      courseStatistics: courseStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const [courses] = await pool.execute(`
      SELECT c.*, 
        COUNT(DISTINCT b.batch_id) as total_batches,
        (
          (SELECT COUNT(*) FROM student_certificates sc WHERE sc.course_id = c.course_id) +
          (SELECT COUNT(*) FROM trainer_certificates tc WHERE tc.course_id = c.course_id) +
          (SELECT COUNT(*) FROM trainee_certificates tr WHERE tr.course_id = c.course_id)
        ) as total_certificates
      FROM courses c
      LEFT JOIN batches b ON c.course_id = b.course_id
      GROUP BY c.course_id
      ORDER BY c.course_name
    `);

    res.json(courses);
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get all batches
router.get('/batches', async (req, res) => {
  try {
    const [batches] = await pool.execute(`
      SELECT b.*, c.course_name,
        (
          (SELECT COUNT(*) FROM student_certificates sc WHERE sc.batch_id = b.batch_id) +
          (SELECT COUNT(*) FROM trainer_certificates tc WHERE tc.batch_id = b.batch_id) +
          (SELECT COUNT(*) FROM trainee_certificates tr WHERE tr.batch_id = b.batch_id)
        ) as total_certificates
      FROM batches b
      JOIN courses c ON b.course_id = c.course_id
      ORDER BY b.start_date DESC
    `);

    res.json(batches);
  } catch (error) {
    console.error('❌ Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const [templates] = await pool.execute(`
      SELECT ct.*,
        (
          (SELECT COUNT(*) FROM student_certificates sc WHERE sc.template_id = ct.template_id) +
          (SELECT COUNT(*) FROM trainer_certificates tc WHERE tc.template_id = ct.template_id) +
          (SELECT COUNT(*) FROM trainee_certificates tr WHERE tr.template_id = ct.template_id)
        ) as usage_count
      FROM certificate_templates ct
      ORDER BY ct.graduation_batch, ct.course_domain
    `);

    res.json(templates);
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Add new course
router.post('/courses', async (req, res) => {
  try {
    const { course_name, course_code, duration_months, description } = req.body;

    if (!course_name || !course_code || !duration_months) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      'INSERT INTO courses (course_name, course_code, duration_months, description) VALUES (?, ?, ?, ?)',
      [course_name, course_code, duration_months, description]
    );

    res.json({
      success: true,
      message: 'Course added successfully',
      courseId: result.insertId
    });

  } catch (error) {
    console.error('❌ Error adding course:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Course code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add course' });
    }
  }
});

// Add new batch
router.post('/batches', async (req, res) => {
  try {
    const { batch_name, batch_initials, start_date, end_date, course_id } = req.body;

    if (!batch_name || !batch_initials || !start_date || !end_date || !course_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      'INSERT INTO batches (batch_name, batch_initials, start_date, end_date, course_id) VALUES (?, ?, ?, ?, ?)',
      [batch_name, batch_initials, start_date, end_date, course_id]
    );

    res.json({
      success: true,
      message: 'Batch added successfully',
      batchId: result.insertId
    });

  } catch (error) {
    console.error('❌ Error adding batch:', error);
    res.status(500).json({ error: 'Failed to add batch' });
  }
});

// Add new template
router.post('/templates', async (req, res) => {
  try {
    const { template_name, template_file_path, course_domain, graduation_batch } = req.body;

    if (!template_name || !template_file_path || !course_domain || !graduation_batch) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      'INSERT INTO certificate_templates (template_name, template_file_path, course_domain, graduation_batch) VALUES (?, ?, ?, ?)',
      [template_name, template_file_path, course_domain, graduation_batch]
    );

    res.json({
      success: true,
      message: 'Template added successfully',
      templateId: result.insertId
    });

  } catch (error) {
    console.error('❌ Error adding template:', error);
    res.status(500).json({ error: 'Failed to add template' });
  }
});

// Update course
router.put('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { course_name, course_code, duration_months, description } = req.body;

    const [result] = await pool.execute(
      'UPDATE courses SET course_name = ?, course_code = ?, duration_months = ?, description = ? WHERE course_id = ?',
      [course_name, course_code, duration_months, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course (only if no certificates exist)
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course has certificates
    const [certCheck] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM student_certificates WHERE course_id = ?) +
        (SELECT COUNT(*) FROM trainer_certificates WHERE course_id = ?) +
        (SELECT COUNT(*) FROM trainee_certificates WHERE course_id = ?) as total
    `, [id, id, id]);

    if (certCheck[0].total > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete course with existing certificates',
        certificateCount: certCheck[0].total
      });
    }

    const [result] = await pool.execute('DELETE FROM courses WHERE course_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Export data
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    let query;
    switch (type) {
      case 'student':
        query = `
          SELECT sc.*, c.course_name, b.batch_name, ct.template_name
          FROM student_certificates sc
          JOIN courses c ON sc.course_id = c.course_id
          JOIN batches b ON sc.batch_id = b.batch_id
          JOIN certificate_templates ct ON sc.template_id = ct.template_id
          ORDER BY sc.created_at DESC
        `;
        break;
      case 'trainer':
        query = `
          SELECT tc.*, c.course_name, b.batch_name, ct.template_name
          FROM trainer_certificates tc
          JOIN courses c ON tc.course_id = c.course_id
          JOIN batches b ON tc.batch_id = b.batch_id
          JOIN certificate_templates ct ON tc.template_id = ct.template_id
          ORDER BY tc.created_at DESC
        `;
        break;
      case 'trainee':
        query = `
          SELECT tc.*, c.course_name, b.batch_name, ct.template_name
          FROM trainee_certificates tc
          JOIN courses c ON tc.course_id = c.course_id
          JOIN batches b ON tc.batch_id = b.batch_id
          JOIN certificate_templates ct ON tc.template_id = ct.template_id
          ORDER BY tc.created_at DESC
        `;
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    const [data] = await pool.execute(query);

    res.json({
      type,
      data,
      count: data.length,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;
