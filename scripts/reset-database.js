#!/usr/bin/env node

/**
 * Database Reset Script
 * Completely clears all data and adds one sample test user
 */

const dbService = require('../backend/services/databaseService');

async function resetDatabaseWithSample() {
    try {
        console.log('🔄 Starting complete database reset...');
        
        // Test database connection first
        await dbService.testConnection();
        console.log('✅ Database connection successful');
        
        // Get current data counts
        const formSubmissionsResult = await dbService.query('SELECT COUNT(*) as count FROM form_submissions');
        const certificateGenerationsResult = await dbService.query('SELECT COUNT(*) as count FROM certificate_generations');
        
        const formCount = parseInt(formSubmissionsResult.rows[0].count);
        const certCount = parseInt(certificateGenerationsResult.rows[0].count);
        
        console.log(`📊 Current database state:`);
        console.log(`   - Form submissions: ${formCount}`);
        console.log(`   - Certificate generations: ${certCount}`);
        
        // Start transaction for safe cleanup and reset
        await dbService.transaction(async (client) => {
            
            // Step 1: Clear all existing data
            console.log('🧹 Clearing all existing data...');
            
            // Delete certificates first (due to foreign key constraints)
            const deleteCertResult = await client.query('DELETE FROM certificate_generations');
            console.log(`   🗑️  Deleted ${deleteCertResult.rowCount} certificate records`);
            
            // Delete form submissions
            const deleteFormResult = await client.query('DELETE FROM form_submissions');
            console.log(`   🗑️  Deleted ${deleteFormResult.rowCount} form submission records`);
            
            // Step 2: Insert 3 sample test users
            console.log('👤 Creating 3 sample test users...');
            
            const sampleUsers = [
                {
                    timestamp: new Date().toISOString(),
                    email_address: 'generated.user@example.com',
                    title: 'Mr.',
                    full_name: 'Alice Johnson (Generated)',
                    phone: '+1-555-0101',
                    date_of_birth: '1994-03-10',
                    gender: 'Female',
                    address_line1: '123 Generated Street',
                    city: 'Generated City',
                    state: 'Generated State',
                    country: 'Test Country',
                    postal_code: '12345',
                    qualification: 'Master of Computer Science',
                    institution: 'Test University',
                    course_name: 'Python & Machine Learning',
                    course_domain: 'Data Science',
                    batch_initials: 'G28',
                    batch_name: 'Python ML Batch G28',
                    start_date: '2024-01-15',
                    end_date: '2024-06-15',
                    gpa: '9.2',
                    attendance_percentage: '98',
                    certificate_type: 'student',
                    status: 'generated',
                    form_source: 'manual_test',
                    additional_data: JSON.stringify({
                        test_user: true,
                        created_by: 'reset_script',
                        notes: 'Sample user with GENERATED certificate'
                    })
                },
                {
                    timestamp: new Date().toISOString(),
                    email_address: 'pending.user@example.com',
                    title: 'Mr.',
                    full_name: 'Bob Smith (Pending)',
                    phone: '+1-555-0102',
                    date_of_birth: '1995-07-22',
                    gender: 'Male',
                    address_line1: '456 Pending Avenue',
                    city: 'Pending City',
                    state: 'Pending State',
                    country: 'Test Country',
                    postal_code: '12346',
                    qualification: 'Bachelor of Engineering',
                    institution: 'Test University',
                    course_name: 'Java Full Stack Development',
                    course_domain: 'Software Development',
                    batch_initials: 'G12',
                    batch_name: 'Java Full Stack Batch G12',
                    start_date: '2024-02-01',
                    end_date: '2024-07-01',
                    gpa: '8.7',
                    attendance_percentage: '92',
                    certificate_type: 'student',
                    status: 'pending',
                    form_source: 'manual_test',
                    additional_data: JSON.stringify({
                        test_user: true,
                        created_by: 'reset_script',
                        notes: 'Sample user with PENDING certificate'
                    })
                },
                {
                    timestamp: new Date().toISOString(),
                    email_address: 'revoked.user@example.com',
                    title: 'Ms.',
                    full_name: 'Carol Davis (Revoked)',
                    phone: '+1-555-0103',
                    date_of_birth: '1993-11-08',
                    gender: 'Female',
                    address_line1: '789 Revoked Boulevard',
                    city: 'Revoked City',
                    state: 'Revoked State',
                    country: 'Test Country',
                    postal_code: '12347',
                    qualification: 'Master of Data Science',
                    institution: 'Test University',
                    course_name: 'VLSI Design',
                    course_domain: 'Electronics',
                    batch_initials: 'G16',
                    batch_name: 'VLSI Design Batch G16',
                    start_date: '2024-03-01',
                    end_date: '2024-08-01',
                    gpa: '8.9',
                    attendance_percentage: '89',
                    certificate_type: 'student',
                    status: 'revoked',
                    form_source: 'manual_test',
                    additional_data: JSON.stringify({
                        test_user: true,
                        created_by: 'reset_script',
                        notes: 'Sample user with REVOKED certificate'
                    })
                }
            ];
            
            
            // Insert sample form submissions
            const insertQuery = `
                INSERT INTO form_submissions (
                    timestamp, email_address, title, full_name, phone, date_of_birth, gender,
                    address_line1, city, state, country, postal_code, qualification, institution,
                    course_name, course_domain, batch_initials, batch_name, start_date, end_date,
                    gpa, attendance_percentage, certificate_type, status, form_source, additional_data,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
                    $19, $20, $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                ) RETURNING submission_id
            `;
            
            const submissionIds = [];
            
            for (let i = 0; i < sampleUsers.length; i++) {
                const sampleData = sampleUsers[i];
                const insertResult = await client.query(insertQuery, [
                    sampleData.timestamp, sampleData.email_address, sampleData.title, sampleData.full_name,
                    sampleData.phone, sampleData.date_of_birth, sampleData.gender, sampleData.address_line1,
                    sampleData.city, sampleData.state, sampleData.country, sampleData.postal_code,
                    sampleData.qualification, sampleData.institution, sampleData.course_name, sampleData.course_domain,
                    sampleData.batch_initials, sampleData.batch_name, sampleData.start_date, sampleData.end_date,
                    sampleData.gpa, sampleData.attendance_percentage, sampleData.certificate_type, sampleData.status,
                    sampleData.form_source, sampleData.additional_data
                ]);
                
                const submissionId = insertResult.rows[0].submission_id;
                submissionIds.push({ id: submissionId, status: sampleData.status, name: sampleData.full_name });
                console.log(`   ✅ Created ${sampleData.status} user: ${sampleData.full_name} (ID: ${submissionId})`);
            }
            
            // Step 3: Create certificate generations for generated and revoked users
            console.log('📜 Creating certificate generation records...');
            
            const currentTime = new Date().toISOString();
            
            for (const submission of submissionIds) {
                if (submission.status === 'generated' || submission.status === 'revoked') {
                    const refNo = `TEST_${submission.status.toUpperCase()}_2025_${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
                    
                    const certQuery = `
                        INSERT INTO certificate_generations (
                            submission_id, certificate_ref_no, verification_url, qr_code_data, 
                            certificate_image_path, certificate_pdf_path, template_id, generated_at, 
                            generated_by, status, is_verified, created_at, updated_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        ) RETURNING certificate_id
                    `;
                    
                    const isRevoked = submission.status === 'revoked';
                    const certificateStatus = submission.status === 'revoked' ? 'revoked' : 'generated';
                    const verificationUrl = `https://certificates.suretrust.org/verify/${refNo}`;
                    const qrData = JSON.stringify({
                        certificate_ref_no: refNo,
                        verification_url: verificationUrl,
                        generated_at: currentTime
                    });
                    
                    const certResult = await client.query(certQuery, [
                        submission.id,                           // submission_id
                        refNo,                                   // certificate_ref_no
                        verificationUrl,                         // verification_url
                        qrData,                                  // qr_code_data
                        `/certificates/IMG/${refNo}.png`,       // certificate_image_path
                        `/certificates/PDF/${refNo}.pdf`,       // certificate_pdf_path
                        1,                                       // template_id (assuming template 1 exists)
                        currentTime,                             // generated_at
                        'admin',                                 // generated_by
                        certificateStatus,                       // status
                        !isRevoked,                              // is_verified (false if revoked)
                    ]);
                    
                    const certificateId = certResult.rows[0].certificate_id;
                    console.log(`   📜 Created ${submission.status} certificate: ${refNo} (Cert ID: ${certificateId})`);
                }
            }
            
            console.log('✅ Database reset completed successfully');
        });
        
        // Show final state
        const finalFormResult = await dbService.query('SELECT COUNT(*) as count FROM form_submissions');
        const finalCertResult = await dbService.query('SELECT COUNT(*) as count FROM certificate_generations');
        
        console.log(`📊 Final database state:`);
        console.log(`   - Form submissions: ${finalFormResult.rows[0].count}`);
        console.log(`   - Certificate generations: ${finalCertResult.rows[0].count}`);
        
        // Show the sample data that was created
        const sampleSubmissions = await dbService.query(`
            SELECT 
                fs.submission_id, fs.full_name, fs.email_address, fs.course_name, 
                fs.batch_initials, fs.status, fs.created_at,
                cg.certificate_ref_no, cg.status as cert_status
            FROM form_submissions fs
            LEFT JOIN certificate_generations cg ON fs.submission_id = cg.submission_id
            ORDER BY fs.created_at DESC 
            LIMIT 3
        `);
        
        if (sampleSubmissions.rows.length > 0) {
            console.log('\n📋 Sample test users created:');
            sampleSubmissions.rows.forEach((sample, index) => {
                console.log(`\n   ${index + 1}. ${sample.full_name}:`);
                console.log(`      ID: ${sample.submission_id}`);
                console.log(`      Email: ${sample.email_address}`);
                console.log(`      Course: ${sample.course_name} (${sample.batch_initials})`);
                console.log(`      Status: ${sample.status}`);
                if (sample.certificate_ref_no) {
                    console.log(`      Certificate: ${sample.certificate_ref_no} ${sample.cert_status === 'revoked' ? '(REVOKED)' : `(${sample.cert_status.toUpperCase()})`}`);
                }
                console.log(`      Created: ${sample.created_at}`);
            });
            
            console.log('\n🎯 Next steps:');
            console.log('   1. Visit admin dashboard to see all 3 sample users');
            console.log('   2. Test certificate generation for the pending user');
            console.log('   3. Verify QR codes are visible in generated certificates');
            console.log('   4. Test certificate verification with the generated/revoked certificates');
        }
        
    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await dbService.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Add confirmation prompt
function askForConfirmation() {
    return new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        console.log('⚠️  WARNING: This will COMPLETELY CLEAR your database!');
        console.log('All existing data will be permanently deleted.');
        console.log('A new sample test user will be created after clearing.');
        console.log('');
        
        rl.question('Are you absolutely sure you want to continue? (type "YES" to confirm): ', (answer) => {
            rl.close();
            resolve(answer === 'YES');
        });
    });
}

// Main execution
async function main() {
    const confirmed = await askForConfirmation();
    
    if (!confirmed) {
        console.log('❌ Database reset cancelled by user');
        console.log('Database was not modified.');
        process.exit(0);
    }
    
    await resetDatabaseWithSample();
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { resetDatabaseWithSample };
