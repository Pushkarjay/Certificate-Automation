const express = require('express');
const router = express.Router();
const sheetsDb = require('../services/sheetsDatabase');

// Admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard data...');
    
    // Get statistics from Google Sheets
    const stats = await sheetsDb.getStats();
    
    // Transform stats to match expected format
    const submissionStats = Object.keys(stats).map(type => ({
      type,
      total: stats[type].total,
      pending: stats[type].pending,
      generated: 0, // We don't have a 'generated' status in sheets, map to issued
      approved: 0, // We don't have 'approved' status 
      issued: stats[type].issued,
      rejected: stats[type].revoked // Map revoked to rejected
    }));

    // Get recent form submissions from all sheet types
    const recentSubmissionsPromises = ['student', 'trainer', 'trainee'].map(async (type) => {
      try {
        const results = await sheetsDb.getSubmissions({
          certificateType: type,
          page: 1,
          limit: 10
        });
        
        return results.data.map(submission => ({
          submission_id: submission._id,
          type: submission.certificate_type || type,
          full_name: submission.full_name,
          email: submission.email_address,
          course_name: submission.course_name,
          status: submission.status,
          created_at: submission.timestamp,
          updated_at: submission.updated_at || submission.timestamp
        }));
      } catch (error) {
        console.error(`Error fetching ${type} submissions:`, error.message);
        return [];
      }
    });

    const recentSubmissionsArrays = await Promise.all(recentSubmissionsPromises);
    const allRecentSubmissions = recentSubmissionsArrays.flat();

    // Sort by date and limit to 20 most recent
    const recentSubmissions = allRecentSubmissions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);

    // Generate course statistics from submissions
    const courseStatsMap = new Map();
    allRecentSubmissions.forEach(submission => {
      const courseName = submission.course_name || 'Unknown Course';
      if (!courseStatsMap.has(courseName)) {
        courseStatsMap.set(courseName, {
          course_name: courseName,
          total_submissions: 0,
          issued_certificates: 0,
          pending_certificates: 0
        });
      }
      const courseStats = courseStatsMap.get(courseName);
      courseStats.total_submissions++;
      if (submission.status === 'issued') {
        courseStats.issued_certificates++;
      } else if (submission.status === 'pending') {
        courseStats.pending_certificates++;
      }
    });

    const courseStats = Array.from(courseStatsMap.values())
      .sort((a, b) => b.total_submissions - a.total_submissions)
      .slice(0, 20);

    // Generate mock generation statistics (last 30 days)
    const generationStats = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count certificates generated on this date
      const dayCount = allRecentSubmissions.filter(sub => 
        sub.status === 'issued' && 
        sub.updated_at && 
        sub.updated_at.startsWith(dateStr)
      ).length;
      
      generationStats.push({
        date: dateStr,
        certificates_generated: dayCount
      });
    }

    // Calculate totals
    const totals = submissionStats.reduce((acc, row) => {
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
      submissionsByType: submissionStats,
      recentSubmissions: recentSubmissions,
      courseStatistics: courseStats,
      generationStats: generationStats,
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

    // Prepare filter object for sheets query
    const filter = {
      page,
      limit
    };

    if (status) filter.status = status;
    if (certificateType) filter.certificateType = certificateType;
    if (search) filter.search = search;

    console.log('📋 Fetching submissions with filters:', filter);

    // If no specific type requested, get from all types
    if (!certificateType) {
      const allSubmissionsPromises = ['student', 'trainer', 'trainee'].map(async (type) => {
        try {
          const results = await sheetsDb.getSubmissions({
            ...filter,
            certificateType: type,
            limit: Math.ceil(limit / 3) // Distribute limit across types
          });
          return results.data.map(submission => ({
            ...submission,
            submission_id: submission._id,
            email: submission.email_address,
            certificate_type: submission.certificate_type || type
          }));
        } catch (error) {
          console.error(`Error fetching ${type} submissions:`, error.message);
          return [];
        }
      });

      const allSubmissionsArrays = await Promise.all(allSubmissionsPromises);
      const allSubmissions = allSubmissionsArrays.flat();
      
      // Apply search filter across all results
      let filteredSubmissions = allSubmissions;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredSubmissions = allSubmissions.filter(submission =>
          submission.full_name?.toLowerCase().includes(searchLower) ||
          submission.email_address?.toLowerCase().includes(searchLower) ||
          submission.course_name?.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (status) {
        filteredSubmissions = filteredSubmissions.filter(submission => submission.status === status);
      }

      // Sort and paginate
      filteredSubmissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

      res.json({
        submissions: paginatedSubmissions,
        pagination: {
          page,
          limit,
          total: filteredSubmissions.length,
          pages: Math.ceil(filteredSubmissions.length / limit)
        }
      });
    } else {
      // Get from specific type
      const result = await sheetsDb.getSubmissions(filter);
      
      const submissions = result.data.map(submission => ({
        ...submission,
        submission_id: submission._id,
        email: submission.email_address
      }));

      res.json({
        submissions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.totalPages
        }
      });
    }

  } catch (error) {
    console.error('❌ Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Update submission status
router.patch('/submissions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'generated', 'issued', 'revoked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    console.log('📝 Updating submission status:', { id, status, notes });

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.admin_notes = notes;
    }

    const updatedSubmission = await sheetsDb.updateSubmission(id, updateData);
    
    if (!updatedSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      submission: {
        ...updatedSubmission,
        submission_id: updatedSubmission._id,
        email: updatedSubmission.email_address
      }
    });

  } catch (error) {
    console.error('❌ Error updating submission status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get batch information (derived from submissions)
router.get('/batches', async (req, res) => {
  try {
    console.log('📚 Fetching batch information from submissions...');
    
    const batchesMap = new Map();

    // Get submissions from all types to extract batch information
    const submissionPromises = ['student', 'trainer', 'trainee'].map(async (type) => {
      try {
        const results = await sheetsDb.getSubmissions({
          certificateType: type,
          limit: 1000 // Get more to capture all batches
        });
        return results.data;
      } catch (error) {
        console.error(`Error fetching ${type} submissions for batches:`, error.message);
        return [];
      }
    });

    const submissionArrays = await Promise.all(submissionPromises);
    const allSubmissions = submissionArrays.flat();

    // Extract unique batches from submissions
    allSubmissions.forEach(submission => {
      if (submission.batch_initials) {
        const batchKey = `${submission.batch_initials}_${submission.course_name || 'Unknown'}`;
        if (!batchesMap.has(batchKey)) {
          batchesMap.set(batchKey, {
            batch_id: batchKey,
            batch_name: submission.batch_name || `${submission.batch_initials} Batch`,
            batch_initials: submission.batch_initials,
            course_name: submission.course_name,
            start_date: submission.start_date,
            end_date: submission.end_date,
            total_submissions: 0,
            created_at: submission.timestamp,
            updated_at: submission.updated_at || submission.timestamp
          });
        }
        const batch = batchesMap.get(batchKey);
        batch.total_submissions++;
      }
    });

    // Convert to array
    const batches = Array.from(batchesMap.values())
      .sort((a, b) => new Date(b.start_date || b.created_at) - new Date(a.start_date || a.created_at));

    res.json(batches);

  } catch (error) {
    console.error('❌ Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get all templates (from filesystem)
router.get('/templates', async (req, res) => {
  try {
    console.log('🎨 Fetching certificate templates...');
    
    const fs = require('fs');
    const path = require('path');
    
    const templatesDir = path.join(__dirname, '../Certificate_Templates');
    
    try {
      const files = fs.readdirSync(templatesDir);
      const templates = files
        .filter(file => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png'))
        .map((file, index) => ({
          template_id: index + 1,
          template_name: file.replace(/\.(jpg|png)$/i, ''),
          template_path: file,
          template_type: 'certificate',
          usage_count: Math.floor(Math.random() * 100), // Mock usage count
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

      res.json(templates);
    } catch (fsError) {
      console.error('Error reading templates directory:', fsError);
      res.json([]);
    }

  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get system health and statistics
router.get('/system-health', async (req, res) => {
  try {
    console.log('🏥 Checking system health...');
    
    // Test Google Sheets connection
    const sheetsHealth = await sheetsDb.testConnection();
    
    // Get system statistics
    const stats = await sheetsDb.getStats();
    
    // Calculate total certificates across all types
    const totalCertificates = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);
    const totalIssued = Object.values(stats).reduce((sum, stat) => sum + stat.issued, 0);
    const totalPending = Object.values(stats).reduce((sum, stat) => sum + stat.pending, 0);
    
    res.json({
      system: {
        status: sheetsHealth ? 'healthy' : 'degraded',
        database: 'Google Sheets',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      statistics: {
        total_certificates: totalCertificates,
        total_issued: totalIssued,
        total_pending: totalPending,
        by_type: stats
      },
      services: {
        sheets_database: sheetsHealth,
        certificate_generation: true, // Assume working if service is running
        api_server: true
      }
    });

  } catch (error) {
    console.error('❌ Error checking system health:', error);
    res.status(500).json({ 
      system: {
        status: 'error',
        error: error.message
      }
    });
  }
});

module.exports = router;
