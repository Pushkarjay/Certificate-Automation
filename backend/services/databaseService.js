const { Pool } = require('pg');
const mysql = require('mysql2/promise');

class DatabaseService {
  constructor() {
    this.dbType = process.env.DB_TYPE || 'mysql';
    this.pool = null;
    this.init();
  }

  init() {
    if (this.dbType === 'postgresql') {
      this.initPostgreSQL();
    } else {
      this.initMySQL();
    }
  }

  initPostgreSQL() {
    const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('✅ PostgreSQL pool initialized');
  }

  initMySQL() {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'certificate_automation',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    this.pool = mysql.createPool(dbConfig);
    console.log('✅ MySQL pool initialized');
  }

  async testConnection() {
    try {
      if (this.dbType === 'postgresql') {
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ PostgreSQL database connected successfully');
      } else {
        const connection = await this.pool.getConnection();
        connection.release();
        console.log('✅ MySQL database connected successfully');
      }
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async query(text, params = []) {
    try {
      if (this.dbType === 'postgresql') {
        const client = await this.pool.connect();
        try {
          const result = await client.query(text, params);
          return result;
        } finally {
          client.release();
        }
      } else {
        const [rows] = await this.pool.execute(text, params);
        return { rows };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async transaction(callback) {
    if (this.dbType === 'postgresql') {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
  }

  // Method to get database-specific SQL queries
  getQuery(queryName, params = {}) {
    const queries = {
      postgresql: {
        insertStudentCertificate: `
          INSERT INTO student_certificates (
            title, full_name, email, course_name, batch_initials,
            start_date, end_date, gpa, template_file_path
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING certificate_id, reference_number
        `,
        insertTrainerCertificate: `
          INSERT INTO trainer_certificates (
            title, full_name, email, employee_id, qualification, specialization,
            course_name, batch_initials, training_hours, training_start_date,
            training_end_date, performance_rating, template_file_path
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING certificate_id, reference_number
        `,
        insertTraineeCertificate: `
          INSERT INTO trainee_certificates (
            title, full_name, email, phone, organization, position,
            course_name, batch_initials, training_type, training_start_date,
            training_end_date, training_duration_hours, attendance_percentage,
            assessment_score, template_file_path
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING certificate_id, reference_number
        `,
        findCertificateByRefNo: `
          SELECT 'student' as type, certificate_id, title, full_name, email, course_name, 
                 batch_initials, start_date, end_date, reference_number, verification_url,
                 status, certificate_file_path, gpa as additional_info
          FROM student_certificates WHERE reference_number = $1
          UNION ALL
          SELECT 'trainer' as type, certificate_id, title, full_name, email, course_name,
                 batch_initials, training_start_date, training_end_date, reference_number, 
                 verification_url, status, certificate_file_path, 
                 CONCAT('Hours: ', training_hours) as additional_info
          FROM trainer_certificates WHERE reference_number = $1
          UNION ALL
          SELECT 'trainee' as type, certificate_id, title, full_name, email, course_name,
                 batch_initials, training_start_date, training_end_date, reference_number, 
                 verification_url, status, certificate_file_path,
                 CONCAT('Type: ', training_type) as additional_info
          FROM trainee_certificates WHERE reference_number = $1
        `
      },
      mysql: {
        insertStudentCertificate: `
          INSERT INTO student_certificates (
            title, full_name, email, course_name, batch_initials,
            start_date, end_date, gpa, template_file_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        insertTrainerCertificate: `
          INSERT INTO trainer_certificates (
            title, full_name, email, employee_id, qualification, specialization,
            course_name, batch_initials, training_hours, training_start_date,
            training_end_date, performance_rating, template_file_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        insertTraineeCertificate: `
          INSERT INTO trainee_certificates (
            title, full_name, email, phone, organization, position,
            course_name, batch_initials, training_type, training_start_date,
            training_end_date, training_duration_hours, attendance_percentage,
            assessment_score, template_file_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        findCertificateByRefNo: `
          SELECT 'student' as type, certificate_id, title, full_name, email, course_name, 
                 batch_initials, start_date, end_date, reference_number, verification_url,
                 status, certificate_file_path, gpa as additional_info
          FROM student_certificates WHERE reference_number = ?
          UNION ALL
          SELECT 'trainer' as type, certificate_id, title, full_name, email, course_name,
                 batch_initials, training_start_date, training_end_date, reference_number, 
                 verification_url, status, certificate_file_path, 
                 CONCAT('Hours: ', training_hours) as additional_info
          FROM trainer_certificates WHERE reference_number = ?
          UNION ALL
          SELECT 'trainee' as type, certificate_id, title, full_name, email, course_name,
                 batch_initials, training_start_date, training_end_date, reference_number, 
                 verification_url, status, certificate_file_path,
                 CONCAT('Type: ', training_type) as additional_info
          FROM trainee_certificates WHERE reference_number = ?
        `
      }
    };

    return queries[this.dbType][queryName];
  }

  async close() {
    if (this.pool) {
      if (this.dbType === 'postgresql') {
        await this.pool.end();
      } else {
        await this.pool.end();
      }
      console.log('📴 Database connection closed');
    }
  }
}

module.exports = new DatabaseService();
