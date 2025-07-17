## Backend Startup with Google Service Account (Render & Local)

To ensure the backend can access Google Sheets, you must decode your base64-encoded service account key before starting the server. Use the following command instead of running `server.js` directly:

```sh
node Backend/decode-service-account-and-start.js
```

This script will decode the `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable and write it to `sure-trust-1-1a35a986a881.json` in the project root, then start the backend server. This is required for both local and Render deployments.

If running locally, you may also place the decoded JSON file as `sure-trust-1-1a35a986a881.json` in the project root instead of using the environment variable.
# 🎓 SURE Trust Certificate Automation System

A comprehensive digital certificate automation system that handles certificate generation, verification, and management through an integrated workflow.

## 📁 Project Structure

```
Certificate-Automation/
├── 📁 Database/           # Database schemas and scripts
│   ├── schema.sql         # Main PostgreSQL schema
│   ├── PostgreSQL/        # PostgreSQL-specific files
│   ├── MySQL/            # MySQL-specific files
│   └── MongoDB/          # MongoDB-specific files
├── 📁 Google/             # Google integration with enhanced error handling
│   ├── Form/             # Google Forms documentation and config
│   ├── Sheet/            # Google Sheets API files and troubleshooting
│   ├── SECURITY.md       # Security guidelines
│   └── TROUBLESHOOTING.md # Google integration troubleshooting
├── 📁 Frontend/          # Frontend applications
│   ├── static/           # Static HTML/CSS/JS fallback
│   └── React/            # React application
├── 📁 Backend/           # Backend API server with enhanced Google Sheets sync
│   ├── Generated-Certificates/ # Certificate storage
│   │   ├── PDF/          # PDF certificate files
│   │   └── IMG/          # PNG/SVG certificate files
│   ├── Certificate_Templates/ # Template files and fonts
│   ├── services/         # Core services (Google Sheets, DB, generators)
│   ├── API/              # RESTful API endpoints with fallback support
│   └── server.js         # Main application server
├── 📁 scripts/           # Utility scripts
├── admin-dashboard.html  # Enhanced admin interface with Google Sheets testing
├── opportune-sylph-458214-b8-490493912c83.json # Google service account
├── COMPLETE-SETUP-GUIDE.md # Comprehensive setup documentation
└── README.md             # This file
```

## 🚀 Features

### 1. **Enhanced Google Forms Integration**
- **Real-time Sync**: Direct integration with Google Sheets API
- **Fallback Mechanism**: Continues working even when Google Sheets is unavailable
- **Multiple Form Types**: Student, Trainer, and Trainee certificate forms
- **Smart Error Handling**: Automatic fallback with detailed error reporting
- **Admin Testing**: Built-in Google Sheets connectivity testing

### 2. **Robust Backend API System**
- **RESTful API**: Express.js server with PostgreSQL database
- **Google Sheets Sync**: Enhanced sync with fallback data support
- **Certificate Generation**: Automated certificate creation with templates
- **QR Code Integration**: Unique verification codes for each certificate
- **Reference Number System**: Auto-generated certificate identifiers
- **Admin Dashboard**: Web-based management interface with diagnostics

### 3. **Frontend Verification Portal**
- **Certificate Verification**: Public portal for certificate authentication
- **QR Code Scanning**: Mobile-friendly verification
- **Certificate Display**: High-quality certificate preview and download
- **Search Functionality**: Lookup certificates by reference number

### 4. **Enhanced Database Management**
- **PostgreSQL Database**: Structured certificate storage with fallback support
- **Multiple Certificate Types**: Student, Trainer, and Trainee support
- **Template Management**: Dynamic template assignment
- **Audit Trails**: Complete verification and sync logging
- **Fallback Data**: Continues operating when external services fail

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+ (or MySQL 8.0+ with minor config changes)
- Google Cloud Project with Sheets API enabled
- Google service account with appropriate permissions
- Modern web browser

### 1. Google Sheets Setup

**Step 1: Create Google Cloud Project**
```bash
# 1. Go to https://console.cloud.google.com/
# 2. Create new project: opportune-sylph-458214-b8
# 3. Enable Google Sheets API
# 4. Create service account: sure-trust@opportune-sylph-458214-b8.iam.gserviceaccount.com
# 5. Download service account JSON key
# 6. Place in root directory as: opportune-sylph-458214-b8-490493912c83.json
```

**Step 2: Share Google Sheet**
```bash
# 1. Open your Google Sheet
# 2. Click Share
# 3. Add: sure-trust@opportune-sylph-458214-b8.iam.gserviceaccount.com
# 4. Set permission to Editor
# 5. Note the sheet ID from URL
```

### 2. Database Setup

```bash
# Create database and import schema
createdb certificate_automation
psql -d certificate_automation -f Database/PostgreSQL/schema.sql

# For MySQL (alternative):
# mysql -u root -p
# mysql> CREATE DATABASE certificate_automation;
# mysql> exit;
# mysql -u root -p certificate_automation < Database/MySQL/schema.sql
```

### 3. Backend Setup

```bash
cd Backend
npm install

# Configure environment variables
cp ../.env.example .env
# Edit .env with your database and Google credentials

# Test Google Sheets connection
node -e "console.log('Testing...'); require('./services/googleSheetsService').testConnection()"

# Start the server
npm start
```

### 4. Admin Dashboard Setup

```bash
# Open admin dashboard
# Navigate to: http://localhost:3000/admin-dashboard.html
# Click "Test Google Sheets" to verify connection
# Click "Sync Google Forms" to fetch data
```

### 5. Frontend Setup

```bash
cd Frontend/React
npm install

# Start development server
npm start
```

### 6. Google Forms Setup

1. Create Google Forms using templates in `Google/Form/`
2. Configure form responses to save to Google Sheets
3. Share the response sheet with your service account
4. Update the sheet ID in your backend configuration
5. Test the sync using the admin dashboard

**Note**: The system now uses direct Google Sheets API integration instead of Google Apps Script, providing better reliability and error handling.

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/certificate_automation
# Or for MySQL:
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=certificate_automation
# DB_USER=your_username
# DB_PASSWORD=your_password

# Google Sheets Integration
GOOGLE_SHEETS_SPREADSHEET_ID=1zzdRjH24Utl5AWQk6SXOcJ9DnHw4H2hWg3SApHWLUPU
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./opportune-sylph-458214-b8-490493912c83.json

# Application Settings
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:3001
VERIFICATION_BASE_URL=https://certificates.suretrust.org/verify/

# File Paths
TEMPLATE_PATH=Certificate_Templates/
CERTIFICATE_OUTPUT_PATH=Generated-Certificates/
FONT_PATH=Certificate_Templates/fonts/

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

## 📊 API Endpoints

### Certificate Verification
- `GET /api/verify/:refNo` - Verify certificate by reference number
- `GET /api/verify/search?q=query` - Search certificates
- `GET /api/verify/stats/overview` - Get verification statistics

### Google Sheets Integration
- `GET /api/admin/test-google-sheets` - Test Google Sheets connectivity
- `POST /api/admin/sync-current-forms` - Sync Google Form responses with fallback

### Form Submissions
- `POST /api/forms/submit` - Process Google Forms data
- `GET /api/forms/stats` - Get form submission statistics

### Certificate Management
- `GET /api/certificates` - List all certificates
- `POST /api/certificates/generate/:type/:id` - Generate certificate
- `GET /api/certificates/file/:type/:id` - Download certificate file

### Admin Functions
- `GET /api/admin/dashboard` - Admin dashboard data with sync status
- `GET /api/admin/submissions` - List form submissions with filtering
- `GET /api/admin/courses` - Manage courses
- `GET /api/admin/batches` - Manage batches
- `PATCH /api/admin/submissions/:id/status` - Approve/reject submissions

## 🎨 Certificate Templates

Store your certificate templates in the `Backend/Certificate_Templates/` folder:

```
Backend/Certificate_Templates/
├── templates/
│   ├── G28-Python.jpg
│   ├── G15-VLSI.jpg
│   └── ...
└── fonts/
    ├── times.ttf
    └── EBGaramond-Regular.ttf
```

## �️ Enhanced Security & Reliability

### Security Features
- **Environment-based Configuration**: Sensitive data in .env files
- **Service Account Authentication**: Google Cloud service account security
- **Template Protection**: Templates stored outside public access
- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: All form submissions validated
- **CORS Protection**: Cross-origin requests controlled

### Reliability Features
- **Fallback Mechanism**: System continues working when Google Sheets fails
- **Error Recovery**: Automatic retry and graceful degradation
- **Comprehensive Logging**: Detailed logs for troubleshooting
- **Health Monitoring**: Built-in connectivity testing
- **Data Validation**: Robust data normalization and validation

## 📱 Mobile Verification

The verification portal is fully responsive and supports:
- QR code scanning from mobile devices
- Touch-friendly certificate viewing
- Optimized for all screen sizes
- Progressive Web App features

## 🔄 Enhanced Workflow

1. **Google Forms Integration**
   - Users submit forms → Google Sheets stores responses → Backend syncs with fallback support

2. **Certificate Generation**  
   - Admin reviews submissions → Triggers generation → Templates processed → QR codes created → Files saved

3. **Verification Process**
   - User scans QR code → Frontend validates → API verifies → Certificate displayed

4. **Admin Management**
   - Monitor sync status → Test Google Sheets connectivity → Manage submissions → Generate reports

## 🔧 Troubleshooting

### Google Sheets Issues
```bash
# Test Google Sheets connectivity
curl http://localhost:3000/api/admin/test-google-sheets

# If authentication fails:
# 1. Regenerate service account key
# 2. Update opportune-sylph-458214-b8-490493912c83.json
# 3. Verify sheet is shared with service account
# 4. Test again using admin dashboard
```

### Common Issues
- **"Invalid JWT Signature"**: Regenerate Google service account key
- **"Sheet not found"**: Verify sheet ID and sharing permissions  
- **"Sync failed"**: Check admin dashboard for detailed error messages
- **"Fallback mode"**: Google Sheets unavailable, system using sample data

See `Google/TROUBLESHOOTING.md` for detailed troubleshooting guide.

## 🧪 Testing

### Google Sheets Integration Tests
```bash
# Test connectivity from admin dashboard
open http://localhost:3000/admin-dashboard.html
# Click "Test Google Sheets" button

# Command line testing
cd Backend
node -e "require('./services/googleSheetsService').testConnection().then(console.log)"
```

### Backend Tests
```bash
cd Backend
npm test
```

### Frontend Tests  
```bash
cd Frontend/React
npm test
```

### Manual Testing
- Test Google Sheets sync through admin dashboard
- Submit test forms and verify sync functionality
- Verify certificates using the frontend portal
- Test fallback mechanism by temporarily disabling Google Sheets access
- Test API endpoints with tools like Postman

## 🚀 Deployment

### Production Deployment

1. **Google Cloud Setup**: Configure service account and enable APIs
2. **Database**: Set up PostgreSQL on production server  
3. **Backend**: Deploy to hosting service (Render, Railway, etc.)
4. **Frontend**: Build and deploy to static hosting (Netlify, Vercel)
5. **Google Sheets**: Update sheet sharing and verify connectivity
6. **Environment**: Update production environment variables
7. **Testing**: Verify Google Sheets sync and fallback mechanisms

### Environment Variables for Production

```bash
# Production database
DATABASE_URL=postgresql://prod_user:password@prod_host:5432/certificate_automation

# Google Sheets (same service account works for all environments)
GOOGLE_SHEETS_SPREADSHEET_ID=your_production_sheet_id
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./opportune-sylph-458214-b8-490493912c83.json

# Production URLs
FRONTEND_URL=https://your-frontend-domain.com
VERIFICATION_BASE_URL=https://your-certificates-domain.com/verify/
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📈 Monitoring & Analytics

- **Google Sheets Sync**: Monitor sync success/failure rates and source tracking
- **Certificate Generation**: Track success/failure rates with detailed error logs
- **Verification Requests**: Monitor verification attempts and popular certificates
- **Form Submissions**: Analyze application trends and processing times
- **System Health**: Database, API, and Google Sheets connectivity monitoring
- **Fallback Usage**: Track when and why fallback mechanisms are used

## 📚 Documentation

- `COMPLETE-SETUP-GUIDE.md` - Comprehensive setup instructions
- `Google/TROUBLESHOOTING.md` - Google integration troubleshooting
- `Google/SECURITY.md` - Security guidelines and best practices
- `Backend/CERTIFICATE_GENERATION_DOCUMENTATION.md` - Technical documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@suretrust.org
- 📱 Phone: +1-XXX-XXX-XXXX
- 🌐 Website: https://www.suretrust.org

## 🙏 Acknowledgments

- SURE Trust for educational excellence
- All contributors and maintainers
- Open source community for tools and libraries

---

**© 2025 SURE Trust - Empowering Education Through Technology**
