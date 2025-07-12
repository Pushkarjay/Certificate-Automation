const EventEmitter = require('events');

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      certificateGeneration: {
        totalGenerated: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity,
        failures: 0,
        timeouts: 0
      },
      verificationRequests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0
      },
      systemHealth: {
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0
      }
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Monitor certificate generation performance (SRS NFR1: <5 sec)
   */
  async monitorCertificateGeneration(generationFunction, ...args) {
    const startTime = process.hrtime.bigint();
    const timeout = parseInt(process.env.CERTIFICATE_GENERATION_TIMEOUT || '5000');
    
    try {
      // Set timeout for generation
      const result = await Promise.race([
        generationFunction(...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Certificate generation timeout')), timeout)
        )
      ]);
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
      
      this.recordGenerationMetrics(duration, true);
      
      if (duration > timeout) {
        console.warn(`⚠️ Certificate generation exceeded target time: ${duration}ms`);
      }
      
      return result;
      
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6;
      
      if (error.message.includes('timeout')) {
        this.metrics.certificateGeneration.timeouts++;
        console.error(`❌ Certificate generation timed out after ${timeout}ms`);
      } else {
        this.metrics.certificateGeneration.failures++;
      }
      
      this.recordGenerationMetrics(duration, false);
      throw error;
    }
  }

  /**
   * Monitor verification request performance
   */
  async monitorVerificationRequest(verificationFunction, ...args) {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await verificationFunction(...args);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6;
      
      this.recordVerificationMetrics(duration, true);
      return result;
      
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6;
      
      this.recordVerificationMetrics(duration, false);
      throw error;
    }
  }

  /**
   * Record generation performance metrics
   */
  recordGenerationMetrics(duration, success) {
    const metrics = this.metrics.certificateGeneration;
    
    if (success) {
      metrics.totalGenerated++;
      
      // Update average time
      metrics.averageTime = ((metrics.averageTime * (metrics.totalGenerated - 1)) + duration) / metrics.totalGenerated;
      
      // Update min/max times
      metrics.maxTime = Math.max(metrics.maxTime, duration);
      metrics.minTime = Math.min(metrics.minTime, duration);
    }
    
    // Emit performance alert if generation is slow
    if (duration > 5000) {
      this.emit('performanceAlert', {
        type: 'slow_generation',
        duration,
        threshold: 5000,
        message: `Certificate generation took ${duration}ms (exceeds 5s target)`
      });
    }
  }

  /**
   * Record verification performance metrics
   */
  recordVerificationMetrics(duration, success) {
    const metrics = this.metrics.verificationRequests;
    
    metrics.total++;
    
    if (success) {
      metrics.successful++;
    } else {
      metrics.failed++;
    }
    
    // Update average response time
    metrics.averageResponseTime = ((metrics.averageResponseTime * (metrics.total - 1)) + duration) / metrics.total;
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      systemHealth: this.getSystemHealth()
    };
  }

  /**
   * Get system health metrics
   */
  getSystemHealth() {
    const memUsage = process.memoryUsage();
    
    return {
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      uptime: Math.round(process.uptime()), // seconds
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  /**
   * Start background monitoring
   */
  startMonitoring() {
    // Monitor system health every 30 seconds
    setInterval(() => {
      const health = this.getSystemHealth();
      
      // Alert if memory usage is high
      if (health.memoryUsage.heapUsed > 500) { // 500MB threshold
        this.emit('performanceAlert', {
          type: 'high_memory',
          usage: health.memoryUsage.heapUsed,
          threshold: 500,
          message: `High memory usage detected: ${health.memoryUsage.heapUsed}MB`
        });
      }
      
    }, 30000);
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      certificateGeneration: {
        totalGenerated: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity,
        failures: 0,
        timeouts: 0
      },
      verificationRequests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0
      },
      systemHealth: {
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0
      }
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const genMetrics = metrics.certificateGeneration;
    const verMetrics = metrics.verificationRequests;
    
    return {
      summary: {
        certificatesGenerated: genMetrics.totalGenerated,
        averageGenerationTime: `${Math.round(genMetrics.averageTime)}ms`,
        verificationRequests: verMetrics.total,
        successRate: verMetrics.total > 0 ? `${Math.round((verMetrics.successful / verMetrics.total) * 100)}%` : '0%',
        slaCompliance: genMetrics.totalGenerated > 0 ? 
          `${Math.round(((genMetrics.totalGenerated - genMetrics.timeouts) / genMetrics.totalGenerated) * 100)}%` : '0%'
      },
      details: metrics,
      alerts: {
        slowGenerations: genMetrics.timeouts,
        failedGenerations: genMetrics.failures,
        maxGenerationTime: `${Math.round(genMetrics.maxTime)}ms`,
        minGenerationTime: genMetrics.minTime !== Infinity ? `${Math.round(genMetrics.minTime)}ms` : 'N/A'
      }
    };
  }
}

module.exports = new PerformanceMonitor();
