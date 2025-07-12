// MongoDB Database Schema for Certificate Automation System
// This schema is designed based on the SQL queries found in the backend routes

// Database: certificate_automation
// Collections and their schemas

// Student Certificates Collection
db.createCollection("student_certificates", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["student_name", "course_name", "completion_date", "certificate_number", "template_type", "verification_code"],
            properties: {
                _id: {
                    bsonType: "objectId"
                },
                student_name: {
                    bsonType: "string",
                    description: "Student name is required and must be a string"
                },
                course_name: {
                    bsonType: "string",
                    description: "Course name is required and must be a string"
                },
                completion_date: {
                    bsonType: "date",
                    description: "Completion date is required and must be a date"
                },
                certificate_number: {
                    bsonType: "string",
                    description: "Certificate number is required and must be unique"
                },
                grade: {
                    bsonType: "string",
                    description: "Grade must be a string"
                },
                trainer_name: {
                    bsonType: "string",
                    description: "Trainer name must be a string"
                },
                template_type: {
                    bsonType: "string",
                    description: "Template type is required and must be a string"
                },
                certificate_path: {
                    bsonType: "string",
                    description: "Certificate path must be a string"
                },
                verification_code: {
                    bsonType: "string",
                    description: "Verification code is required and must be unique"
                },
                issued_date: {
                    bsonType: "date",
                    description: "Issued date must be a date"
                },
                is_verified: {
                    bsonType: "bool",
                    description: "Verification status must be a boolean"
                },
                created_at: {
                    bsonType: "date",
                    description: "Created at must be a date"
                },
                updated_at: {
                    bsonType: "date",
                    description: "Updated at must be a date"
                }
            }
        }
    }
});

// Trainer Certificates Collection
db.createCollection("trainer_certificates", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["trainer_name", "course_name", "certification_type", "completion_date", "certificate_number", "template_type", "verification_code"],
            properties: {
                _id: {
                    bsonType: "objectId"
                },
                trainer_name: {
                    bsonType: "string",
                    description: "Trainer name is required and must be a string"
                },
                course_name: {
                    bsonType: "string",
                    description: "Course name is required and must be a string"
                },
                certification_type: {
                    bsonType: "string",
                    description: "Certification type is required and must be a string"
                },
                completion_date: {
                    bsonType: "date",
                    description: "Completion date is required and must be a date"
                },
                certificate_number: {
                    bsonType: "string",
                    description: "Certificate number is required and must be unique"
                },
                institute_name: {
                    bsonType: "string",
                    description: "Institute name must be a string"
                },
                template_type: {
                    bsonType: "string",
                    description: "Template type is required and must be a string"
                },
                certificate_path: {
                    bsonType: "string",
                    description: "Certificate path must be a string"
                },
                verification_code: {
                    bsonType: "string",
                    description: "Verification code is required and must be unique"
                },
                issued_date: {
                    bsonType: "date",
                    description: "Issued date must be a date"
                },
                is_verified: {
                    bsonType: "bool",
                    description: "Verification status must be a boolean"
                },
                created_at: {
                    bsonType: "date",
                    description: "Created at must be a date"
                },
                updated_at: {
                    bsonType: "date",
                    description: "Updated at must be a date"
                }
            }
        }
    }
});

// Trainee Certificates Collection
db.createCollection("trainee_certificates", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["trainee_name", "course_name", "completion_date", "certificate_number", "template_type", "verification_code"],
            properties: {
                _id: {
                    bsonType: "objectId"
                },
                trainee_name: {
                    bsonType: "string",
                    description: "Trainee name is required and must be a string"
                },
                course_name: {
                    bsonType: "string",
                    description: "Course name is required and must be a string"
                },
                completion_date: {
                    bsonType: "date",
                    description: "Completion date is required and must be a date"
                },
                certificate_number: {
                    bsonType: "string",
                    description: "Certificate number is required and must be unique"
                },
                grade: {
                    bsonType: "string",
                    description: "Grade must be a string"
                },
                training_duration: {
                    bsonType: "string",
                    description: "Training duration must be a string"
                },
                trainer_name: {
                    bsonType: "string",
                    description: "Trainer name must be a string"
                },
                template_type: {
                    bsonType: "string",
                    description: "Template type is required and must be a string"
                },
                certificate_path: {
                    bsonType: "string",
                    description: "Certificate path must be a string"
                },
                verification_code: {
                    bsonType: "string",
                    description: "Verification code is required and must be unique"
                },
                issued_date: {
                    bsonType: "date",
                    description: "Issued date must be a date"
                },
                is_verified: {
                    bsonType: "bool",
                    description: "Verification status must be a boolean"
                },
                created_at: {
                    bsonType: "date",
                    description: "Created at must be a date"
                },
                updated_at: {
                    bsonType: "date",
                    description: "Updated at must be a date"
                }
            }
        }
    }
});

// Form Submissions Collection
db.createCollection("form_submissions", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["form_type", "submission_data"],
            properties: {
                _id: {
                    bsonType: "objectId"
                },
                form_type: {
                    bsonType: "string",
                    enum: ["student", "trainer", "trainee"],
                    description: "Form type is required and must be one of: student, trainer, trainee"
                },
                submission_data: {
                    bsonType: "object",
                    description: "Submission data is required and must be an object"
                },
                processed: {
                    bsonType: "bool",
                    description: "Processed status must be a boolean"
                },
                certificate_generated: {
                    bsonType: "bool",
                    description: "Certificate generated status must be a boolean"
                },
                certificate_id: {
                    bsonType: "string",
                    description: "Certificate ID must be a string"
                },
                submission_timestamp: {
                    bsonType: "date",
                    description: "Submission timestamp must be a date"
                },
                processed_at: {
                    bsonType: "date",
                    description: "Processed at must be a date"
                },
                created_at: {
                    bsonType: "date",
                    description: "Created at must be a date"
                },
                updated_at: {
                    bsonType: "date",
                    description: "Updated at must be a date"
                }
            }
        }
    }
});

// Certificate Templates Collection
db.createCollection("certificate_templates", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["template_name", "template_path", "template_type"],
            properties: {
                _id: {
                    bsonType: "objectId"
                },
                template_name: {
                    bsonType: "string",
                    description: "Template name is required and must be unique"
                },
                template_path: {
                    bsonType: "string",
                    description: "Template path is required and must be a string"
                },
                template_type: {
                    bsonType: "string",
                    enum: ["student", "trainer", "trainee"],
                    description: "Template type is required and must be one of: student, trainer, trainee"
                },
                is_active: {
                    bsonType: "bool",
                    description: "Active status must be a boolean"
                },
                created_at: {
                    bsonType: "date",
                    description: "Created at must be a date"
                },
                updated_at: {
                    bsonType: "date",
                    description: "Updated at must be a date"
                }
            }
        }
    }
});

// Admin Logs Collection
db.createCollection("admin_logs", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["action"],
            properties: {
                _id: {
                    bsonType: "objectId"
                },
                action: {
                    bsonType: "string",
                    description: "Action is required and must be a string"
                },
                details: {
                    bsonType: "object",
                    description: "Details must be an object"
                },
                admin_user: {
                    bsonType: "string",
                    description: "Admin user must be a string"
                },
                timestamp: {
                    bsonType: "date",
                    description: "Timestamp must be a date"
                },
                ip_address: {
                    bsonType: "string",
                    description: "IP address must be a string"
                },
                user_agent: {
                    bsonType: "string",
                    description: "User agent must be a string"
                }
            }
        }
    }
});

// Create indexes for better performance
db.student_certificates.createIndex({ "verification_code": 1 }, { unique: true });
db.student_certificates.createIndex({ "certificate_number": 1 }, { unique: true });
db.trainer_certificates.createIndex({ "verification_code": 1 }, { unique: true });
db.trainer_certificates.createIndex({ "certificate_number": 1 }, { unique: true });
db.trainee_certificates.createIndex({ "verification_code": 1 }, { unique: true });
db.trainee_certificates.createIndex({ "certificate_number": 1 }, { unique: true });
db.form_submissions.createIndex({ "form_type": 1 });
db.form_submissions.createIndex({ "processed": 1 });
db.certificate_templates.createIndex({ "template_name": 1 }, { unique: true });

// Sample data for certificate templates
db.certificate_templates.insertMany([
    {
        template_name: "G1 CC",
        template_path: "templates/G1 CC.jpg",
        template_type: "student",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        template_name: "G2 DSA",
        template_path: "templates/G2 DSA.jpg",
        template_type: "student",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        template_name: "G2 ROBOTICS",
        template_path: "templates/G2 ROBOTICS.jpg",
        template_type: "student",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        template_name: "G3 AAD",
        template_path: "templates/G3 AAD.jpg",
        template_type: "student",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        template_name: "G10 VLSI",
        template_path: "templates/G10 VLSI.jpg",
        template_type: "student",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        template_name: "G12 Java",
        template_path: "templates/G12 Java.jpg",
        template_type: "student",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        template_name: "G12 SQL",
        template_path: "templates/G12 SQL.jpg",
        template_type: "student",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        template_name: "G28 Python",
        template_path: "templates/G28 Python.jpg",
        template_type: "student",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    }
]);

console.log("MongoDB schema and sample data created successfully!");
