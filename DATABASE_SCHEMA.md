# Database Schema Documentation

## MongoDB Collections

### 1. Certificate Collection

**Collection Name:** `certificates`

#### Schema Structure

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  refNo: String,                    // Reference number (unique, required)
  dofNo: String,                    // DOF verification number (unique, required)
  certificateType: String,          // "student" or "trainer"
  name: String,                     // Recipient name (required)
  program: String,                  // Program/course name (required)
  issueDate: Date,                  // Issue date (required)
  qrCodeUrl: String,                // QR code data URL (required)
  isActive: Boolean,                // Certificate status (default: true)
  
  // Student-specific fields
  studentDetails: {
    duration: String,               // e.g., "6 months"
    subject: String,                // Subject/specialization
    startDate: Date,                // Training start date
    endDate: Date,                  // Training end date
    gpa: String,                    // GPA or grade
    lifeSkillsTraining: Boolean     // Mandatory life skills completion
  },
  
  // Trainer-specific fields (for future implementation)
  trainerDetails: {
    specialization: String,         // Area of expertise
    experience: String,             // Years of experience
    certificationLevel: String,     // Certification level
    validUntil: Date               // Certificate expiry date
  },
  
  // Metadata
  metadata: {
    generatedBy: String,            // Admin/system user who generated
    generatedAt: Date,              // Generation timestamp
    lastVerified: Date,             // Last verification timestamp
    verificationCount: Number,      // Number of times verified
    ipAddress: String,              // IP of generator (optional)
    userAgent: String              // Browser info (optional)
  },
  
  // Audit fields
  createdAt: Date,                  // Document creation timestamp
  updatedAt: Date                   // Document update timestamp
}
```

#### Indexes

```javascript
// Unique indexes
db.certificates.createIndex({ "refNo": 1 }, { unique: true })
db.certificates.createIndex({ "dofNo": 1 }, { unique: true })

// Performance indexes
db.certificates.createIndex({ "dofNo": 1, "isActive": 1 })
db.certificates.createIndex({ "name": 1 })
db.certificates.createIndex({ "certificateType": 1 })
db.certificates.createIndex({ "issueDate": -1 })
db.certificates.createIndex({ "createdAt": -1 })

// Compound indexes for queries
db.certificates.createIndex({ "isActive": 1, "certificateType": 1, "createdAt": -1 })
db.certificates.createIndex({ "name": "text", "program": "text" })
```

#### Validation Rules

```javascript
// Mongoose schema validation
const certificateSchema = new mongoose.Schema({
  refNo: {
    type: String,
    required: [true, 'Reference number is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Reference number must be at least 3 characters'],
    maxlength: [50, 'Reference number cannot exceed 50 characters']
  },
  
  dofNo: {
    type: String,
    required: [true, 'DOF number is required'],
    unique: true,
    trim: true,
    match: [/^DOF-\d+-[A-Z0-9]+$/, 'Invalid DOF number format']
  },
  
  certificateType: {
    type: String,
    required: true,
    enum: ['student', 'trainer'],
    default: 'student'
  },
  
  name: {
    type: String,
    required: [true, 'Recipient name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  program: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true,
    minlength: [2, 'Program name must be at least 2 characters'],
    maxlength: [200, 'Program name cannot exceed 200 characters']
  },
  
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Issue date cannot be in the future'
    }
  },
  
  qrCodeUrl: {
    type: String,
    required: [true, 'QR code URL is required']
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
});
```

## SQL Equivalent (For Reference)

If using SQL database instead of MongoDB:

### Certificate Table

```sql
CREATE TABLE certificates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ref_no VARCHAR(50) NOT NULL UNIQUE,
    dof_no VARCHAR(100) NOT NULL UNIQUE,
    certificate_type ENUM('student', 'trainer') NOT NULL DEFAULT 'student',
    name VARCHAR(100) NOT NULL,
    program VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    qr_code_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Student specific fields
    duration VARCHAR(50),
    subject VARCHAR(100),
    start_date DATE,
    end_date DATE,
    gpa VARCHAR(10),
    life_skills_training BOOLEAN DEFAULT FALSE,
    
    -- Trainer specific fields
    specialization VARCHAR(100),
    experience VARCHAR(50),
    certification_level VARCHAR(50),
    valid_until DATE,
    
    -- Metadata
    generated_by VARCHAR(100),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified TIMESTAMP NULL,
    verification_count INT DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_dof_active (dof_no, is_active),
    INDEX idx_name (name),
    INDEX idx_type (certificate_type),
    INDEX idx_issue_date (issue_date DESC),
    INDEX idx_created (created_at DESC),
    INDEX idx_compound (is_active, certificate_type, created_at DESC),
    
    -- Full text search
    FULLTEXT INDEX ft_search (name, program)
);
```

### SQL Constraints

```sql
-- Add constraints
ALTER TABLE certificates 
ADD CONSTRAINT chk_dof_format 
CHECK (dof_no REGEXP '^DOF-[0-9]+-[A-Z0-9]+$');

ALTER TABLE certificates 
ADD CONSTRAINT chk_issue_date 
CHECK (issue_date <= CURDATE());

ALTER TABLE certificates 
ADD CONSTRAINT chk_name_length 
CHECK (CHAR_LENGTH(TRIM(name)) >= 2);

ALTER TABLE certificates 
ADD CONSTRAINT chk_program_length 
CHECK (CHAR_LENGTH(TRIM(program)) >= 2);
```

## Sample Data

### Student Certificate Sample

```javascript
{
  "_id": ObjectId("..."),
  "refNo": "ST-2024-001",
  "dofNo": "DOF-1704563200000-A1B2C3D4",
  "certificateType": "student",
  "name": "John Doe",
  "program": "Full Stack Web Development",
  "issueDate": ISODate("2024-12-06"),
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "isActive": true,
  "studentDetails": {
    "duration": "6 months",
    "subject": "MERN Stack Development",
    "startDate": ISODate("2024-06-01"),
    "endDate": ISODate("2024-12-01"),
    "gpa": "A+",
    "lifeSkillsTraining": true
  },
  "metadata": {
    "generatedBy": "admin@suretrust.org",
    "generatedAt": ISODate("2024-12-06T10:30:00Z"),
    "lastVerified": ISODate("2024-12-06T15:45:00Z"),
    "verificationCount": 3,
    "ipAddress": "192.168.1.100"
  },
  "createdAt": ISODate("2024-12-06T10:30:00Z"),
  "updatedAt": ISODate("2024-12-06T15:45:00Z")
}
```

### Trainer Certificate Sample

```javascript
{
  "_id": ObjectId("..."),
  "refNo": "TR-2024-001",
  "dofNo": "DOF-1704563300000-B2C3D4E5",
  "certificateType": "trainer",
  "name": "Jane Smith",
  "program": "Certified Web Development Trainer",
  "issueDate": ISODate("2024-12-06"),
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "isActive": true,
  "trainerDetails": {
    "specialization": "Frontend Development",
    "experience": "5 years",
    "certificationLevel": "Senior Trainer",
    "validUntil": ISODate("2026-12-06")
  },
  "metadata": {
    "generatedBy": "admin@suretrust.org",
    "generatedAt": ISODate("2024-12-06T11:00:00Z"),
    "verificationCount": 1
  },
  "createdAt": ISODate("2024-12-06T11:00:00Z"),
  "updatedAt": ISODate("2024-12-06T11:00:00Z")
}
```

## Database Operations

### Common Queries

```javascript
// Find certificate by DOF number
db.certificates.findOne({ 
  "dofNo": "DOF-1704563200000-A1B2C3D4", 
  "isActive": true 
});

// Get all active student certificates
db.certificates.find({ 
  "certificateType": "student", 
  "isActive": true 
}).sort({ "createdAt": -1 });

// Search certificates by name or program
db.certificates.find({
  $and: [
    { "isActive": true },
    {
      $or: [
        { "name": { $regex: "john", $options: "i" } },
        { "program": { $regex: "web", $options: "i" } }
      ]
    }
  ]
});

// Get verification statistics
db.certificates.aggregate([
  { $match: { "isActive": true } },
  {
    $group: {
      _id: "$certificateType",
      totalCertificates: { $sum: 1 },
      totalVerifications: { $sum: "$metadata.verificationCount" },
      avgVerifications: { $avg: "$metadata.verificationCount" }
    }
  }
]);

// Update verification count
db.certificates.updateOne(
  { "dofNo": "DOF-1704563200000-A1B2C3D4" },
  {
    $inc: { "metadata.verificationCount": 1 },
    $set: { 
      "metadata.lastVerified": new Date(),
      "updatedAt": new Date()
    }
  }
);
```

### Backup and Restore

```bash
# Backup database
mongodump --db certificate_db --out ./backup/

# Restore database
mongorestore --db certificate_db ./backup/certificate_db/

# Export collection to JSON
mongoexport --db certificate_db --collection certificates --out certificates.json

# Import collection from JSON
mongoimport --db certificate_db --collection certificates --file certificates.json
```

## Performance Considerations

1. **Indexing Strategy**
   - Primary searches on `dofNo` (verification)
   - Secondary searches on `name`, `program`
   - Compound indexes for filtered queries

2. **Query Optimization**
   - Use projection to limit returned fields
   - Implement pagination for large datasets
   - Cache frequently accessed certificates

3. **Storage Optimization**
   - Store QR codes as data URLs or file references
   - Archive old certificates periodically
   - Implement data retention policies

4. **Security**
   - Encrypt sensitive data at rest
   - Use SSL/TLS for data transmission
   - Implement proper authentication and authorization
   - Regular security audits

---

**Note:** This schema supports both MongoDB (NoSQL) and SQL databases. Choose based on your infrastructure and scaling requirements.
