# Database Options: MongoDB vs MySQL

This project supports both MongoDB (NoSQL) and MySQL (Relational) databases running in parallel. You can choose which database to use based on your requirements.

## 🏗️ Architecture Overview

```
Certificate System
├── Frontend (React)
├── Backend (Node.js/Express)
├── Database Options:
│   ├── MongoDB (NoSQL) - /api/certificates
│   └── MySQL (Relational) - /api/mysql/certificates
```

## 📊 Database Comparison

| Feature | MongoDB | MySQL |
|---------|---------|-------|
| **Type** | NoSQL Document Database | Relational Database |
| **Schema** | Flexible, dynamic schema | Fixed, structured schema |
| **Queries** | MongoDB query language | SQL |
| **Transactions** | Limited ACID support | Full ACID compliance |
| **Relationships** | Embedded documents | Foreign keys & joins |
| **Scalability** | Horizontal scaling | Vertical scaling |
| **Performance** | Fast for simple queries | Optimized for complex queries |
| **Data Integrity** | Application-level | Database-level constraints |

## 🚀 API Endpoints

### MongoDB Routes (`/api/certificates`)
- `POST /api/certificates` - Generate certificate
- `GET /api/certificates` - List certificates (paginated)
- `GET /api/certificates/:id` - Get certificate by ID
- `GET /api/certificates/verify/:dofNo` - Verify certificate
- `DELETE /api/certificates/:id` - Deactivate certificate

### MySQL Routes (`/api/mysql/certificates`)
- `POST /api/mysql/certificates` - Generate certificate
- `GET /api/mysql/certificates` - List certificates (paginated + search)
- `GET /api/mysql/certificates/:id` - Get certificate by ID
- `GET /api/mysql/certificates/verify/:dofNo` - Verify certificate
- `DELETE /api/mysql/certificates/:id` - Deactivate certificate
- `GET /api/mysql/certificates/stats/:dofNo` - Get verification statistics

## 🛠️ Setup Instructions

### MongoDB Setup (Default)
```bash
# MongoDB should be installed and running
# Default connection: mongodb://localhost:27017/certificate_db
npm run dev
```

### MySQL Setup
```bash
# 1. Install MySQL
# 2. Run setup script
./setup-mysql.bat    # Windows
./setup-mysql.sh     # Linux/Mac

# 3. Start application
npm run dev
```

## 📋 Data Structure Comparison

### MongoDB Document Structure
```javascript
{
  _id: ObjectId("..."),
  refNo: "REF-2025-001",
  dofNo: "DOF-1720258800000-ABC123",
  name: "John Doe",
  program: "Web Development",
  certificateType: "student",
  issueDate: ISODate("2025-07-06"),
  trainingDuration: "6 months",
  subjectCourse: "MERN Stack",
  startDate: ISODate("2025-01-06"),
  endDate: ISODate("2025-07-06"),
  gpa: 3.85,
  qrCodeUrl: "data:image/png;base64,...",
  isActive: true,
  metadata: {
    generatedBy: "system",
    generatedAt: ISODate("2025-07-06"),
    verificationCount: 0,
    lastVerified: null
  },
  createdAt: ISODate("2025-07-06"),
  updatedAt: ISODate("2025-07-06")
}
```

### MySQL Table Structure
```sql
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_no VARCHAR(50) NOT NULL UNIQUE,
    dof_no VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    program VARCHAR(200) NOT NULL,
    certificate_type ENUM('student', 'trainer') DEFAULT 'student',
    issue_date DATE NOT NULL,
    training_duration VARCHAR(50),
    subject_course VARCHAR(200),
    start_date DATE,
    end_date DATE,
    gpa DECIMAL(3,2),
    specialization VARCHAR(200),
    experience_years INT,
    qr_code_data TEXT NOT NULL,
    verification_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    generated_by VARCHAR(100) DEFAULT 'system',
    verification_count INT DEFAULT 0,
    last_verified DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/certificate_db

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=certificate_db
DB_USER=root
DB_PASSWORD=your_password
```

## 🎯 When to Use Which Database

### Choose MongoDB When:
- ✅ Rapid prototyping and development
- ✅ Flexible schema requirements
- ✅ Simple queries and operations
- ✅ Horizontal scaling needs
- ✅ Document-based data structure fits well

### Choose MySQL When:
- ✅ ACID compliance is critical
- ✅ Complex relational queries needed
- ✅ Data integrity and constraints important
- ✅ Reporting and analytics requirements
- ✅ Team familiar with SQL
- ✅ Integration with existing SQL-based systems

## 📈 Performance Considerations

### MongoDB
- **Pros**: Fast document retrieval, good for read-heavy workloads
- **Cons**: Limited complex query capabilities, larger storage footprint

### MySQL
- **Pros**: Optimized queries with indexes, ACID compliance, mature ecosystem
- **Cons**: Schema changes require migrations, vertical scaling limitations

## 🔄 Migration Between Databases

Both implementations follow the same API contract, making it easy to switch between databases:

```javascript
// Switch database by changing API endpoint
const API_BASE = process.env.USE_MYSQL 
  ? '/api/mysql/certificates' 
  : '/api/certificates';
```

## 🧪 Testing Both Databases

The application supports running both databases simultaneously:

```bash
# Start application with both databases
npm run dev

# Test MongoDB
curl http://localhost:5000/api/certificates

# Test MySQL  
curl http://localhost:5000/api/mysql/certificates

# Check database status
curl http://localhost:5000/api/health
```

## 📊 Additional MySQL Features

The MySQL implementation includes additional features:

1. **Verification Logging**: Detailed logs of all verification attempts
2. **Audit Trail**: Automatic logging of certificate changes
3. **Database Views**: Pre-defined views for common queries
4. **Stored Procedures**: Optimized procedures for complex operations
5. **Performance Indexes**: Optimized indexes for better query performance

## 🚀 Production Recommendations

### For Small to Medium Applications
- **MongoDB**: Good choice for rapid development and simple requirements
- **Setup**: MongoDB Atlas (cloud) or local MongoDB instance

### For Enterprise Applications
- **MySQL**: Better choice for complex requirements and data integrity
- **Setup**: AWS RDS, Google Cloud SQL, or dedicated MySQL server

## 📖 Further Reading

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Node.js Database Best Practices](https://nodejs.org/en/docs/guides/database-integration/)
