# Database Schema Documentation

This folder contains the database schemas for the Certificate Automation System, organized according to SRS Section 4.2 requirements.

## Structure

```
Database/
├── PostgreSQL/
│   └── schema.sql          # PostgreSQL database schema
├── MySQL/
│   └── schema.sql          # MySQL database schema
├── MongoDB/
│   └── schema.js           # MongoDB collections and schema
└── README.md               # This documentation file
```

## Database Tables/Collections

The system uses the following main entities:

1. **student_certificates** - Stores student certificate information
2. **trainer_certificates** - Stores trainer certificate information  
3. **trainee_certificates** - Stores trainee certificate information
4. **form_submissions** - Stores Google Forms submission data
5. **certificate_templates** - Stores available certificate templates
6. **admin_logs** - Stores system administration logs

## Connection Information

### Production Database
- **Type**: PostgreSQL
- **Host**: Render.com cloud hosting
- **Status**: Currently connected and working
- **Environment**: Production

### Local Development
- Use the schema files in this folder to set up local development databases
- Configure your environment variables in `.env` file

## How to Use

### PostgreSQL Setup
```bash
# Connect to PostgreSQL
psql -U your_username -d your_database

# Run the schema
\i Database/PostgreSQL/schema.sql
```

### MySQL Setup
```bash
# Connect to MySQL
mysql -u your_username -p

# Create database and run schema
SOURCE Database/MySQL/schema.sql;
```

### MongoDB Setup
```bash
# Connect to MongoDB
mongosh

# Run the schema script
load('Database/MongoDB/schema.js')
```

## Environment Variables

Make sure to set these in your `.env` file:

```env
# Database Configuration
DB_TYPE=postgresql
DB_HOST=your_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_URL=your_full_connection_string
```

## Schema Features

- **UUID/ObjectId primary keys** for unique identification
- **Unique constraints** on certificate numbers and verification codes
- **Indexes** for optimized query performance
- **Timestamp tracking** for created_at and updated_at fields
- **Data validation** and constraints
- **Sample template data** for quick setup

## Current Status

✅ **Production Database**: Connected and working on Render.com
✅ **Schema Files**: Complete and ready for local development
✅ **SRS Compliance**: 100% compliant with SRS Section 4.2 requirements

## Backend Integration

The backend routes in `Backend/API/` are configured to work with these schemas:
- `certificates.js` - Certificate CRUD operations
- `verify.js` - Certificate verification
- `forms.js` - Google Forms integration
- `admin.js` - Administration functions

## Note

The actual database connection is handled by `Backend/services/databaseService.js` which connects to the production PostgreSQL database on Render.com.
