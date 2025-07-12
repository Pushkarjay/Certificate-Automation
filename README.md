# 🎓 SURE Trust Certificate Automation System

A comprehensive digital certificate automation system that handles certificate generation, verification, and management through an integrated workflow.

## 📁 Project Structure (SRS Compliant)

```
Certificate-Automation/
├── 📁 Database/           # Database schemas and scripts (SRS Section 4.1)
│   ├── Schema.SQL         # Main PostgreSQL schema
│   ├── PostgreSQL/        # PostgreSQL-specific files
│   ├── MySQL/            # MySQL-specific files
│   └── MongoDB/          # MongoDB-specific files
├── 📁 Google/             # Google integration (SRS FR1)
│   ├── Form/             # Google Forms documentation
│   ├── Sheet/            # Google Sheets API files
│   └── README.md         # Google setup guide
├── 📁 Frontend/          # Frontend applications (SRS FR5)
│   ├── static/           # Static HTML/CSS/JS fallback
│   │   ├── Index.html    # Static verification page
│   │   ├── Style.css     # Styles
│   │   └── Script.JS     # JavaScript functionality
│   └── React/            # React application
│       └── React-flow/   # React app structure
├── 📁 Backend/           # Backend API server (SRS FR3)
│   ├── Generated-Certificates/ # Certificate storage (SRS FR4)
│   │   ├── PDF/          # PDF certificate files
│   │   └── IMG/          # PNG certificate files
│   ├── Certificate_Templates/ # Template files
│   ├── .env              # Environment configuration
│   └── API/              # RESTful API endpoints
├── 📁 google-forms/      # Legacy Google Apps Script (deprecated)
├── 📁 confidential-templates/ # Legacy template storage (deprecated)
├── .env.example          # Environment template
├── .env.srs-compliant    # SRS-compliant configuration
├── validate-srs-compliance.js # SRS validation script
├── SRS-COMPLIANCE-SUCCESS.md  # 100% compliance report
└── README.md             # This file
```

## 🚀 Features

### 1. **Google Forms Data Collection**
- **Student Certificate Form**: Course completion applications
- **Trainer Certificate Form**: Instructor certification requests  
- **Trainee Certificate Form**: Workshop/training participation certificates
- **Auto-processing**: Google Apps Script automatically processes submissions

### 2. **Backend API System**
- **RESTful API**: Express.js server with MySQL database
- **Certificate Generation**: Automated certificate creation with templates
- **QR Code Integration**: Unique verification codes for each certificate
- **Reference Number System**: Auto-generated certificate identifiers

### 3. **Frontend Verification Portal**
- **Certificate Verification**: Public portal for certificate authentication
- **QR Code Scanning**: Mobile-friendly verification
- **Certificate Display**: High-quality certificate preview and download
- **Search Functionality**: Lookup certificates by reference number

### 4. **Database Management**
- **MySQL Database**: Structured certificate storage
- **Three Certificate Types**: Student, Trainer, and Trainee tables
- **Template Management**: Dynamic template assignment
- **Audit Trails**: Complete verification logging

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- MySQL 8.0+
- Google Workspace account (for Forms)
- Modern web browser

### 1. Database Setup

```bash
# Create database and import schema
mysql -u root -p
mysql> CREATE DATABASE certificate_automation;
mysql> exit;

mysql -u root -p certificate_automation < Database/MySQL/schema.sql
```

### 2. Backend Setup

```bash
cd Backend
npm install

# Configure environment variables
cp ../.env.example ../.env
# Edit .env with your database credentials

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
cd Frontend/React
npm install

# Start development server
npm start
```

### 4. Google Forms Setup

1. Create three Google Forms using the templates in `Google/Form/`
2. Open Google Apps Script editor for each form
3. Paste the code from `Google/Sheet/google-apps-script.js`
4. Configure the `CONFIG` object with your backend URL
5. Set up form submission triggers

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=certificate_automation
DB_USER=your_username
DB_PASSWORD=your_password

# Application
PORT=3000
FRONTEND_URL=http://localhost:3001
VERIFICATION_BASE_URL=https://certificates.suretrust.org/verify/

# File Paths
TEMPLATE_PATH=Backend/Certificate_Templates/
CERTIFICATE_OUTPUT_PATH=Backend/Generated-Certificates/
FONT_PATH=Backend/Certificate_Templates/fonts/

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

## 📊 API Endpoints

### Certificate Verification
- `GET /api/verify/:refNo` - Verify certificate by reference number
- `GET /api/verify/search?q=query` - Search certificates
- `GET /api/verify/stats/overview` - Get verification statistics

### Form Submissions
- `POST /api/forms/submit` - Process Google Forms data
- `GET /api/forms/stats` - Get form submission statistics

### Certificate Management
- `GET /api/certificates` - List all certificates
- `POST /api/certificates/generate/:type/:id` - Generate certificate
- `GET /api/certificates/file/:type/:id` - Download certificate file

### Admin Functions
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/courses` - Manage courses
- `GET /api/admin/batches` - Manage batches

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

## 🔐 Security Features

- **Environment-based Configuration**: Sensitive data in .env files
- **Template Protection**: Templates stored outside public access
- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: All form submissions validated
- **CORS Protection**: Cross-origin requests controlled

## 📱 Mobile Verification

The verification portal is fully responsive and supports:
- QR code scanning from mobile devices
- Touch-friendly certificate viewing
- Optimized for all screen sizes
- Progressive Web App features

## 🔄 Workflow

1. **Application Submission**
   - Users fill Google Forms → Apps Script processes → Backend stores data

2. **Certificate Generation**  
   - Admin triggers generation → Templates filled → QR codes created → Files saved

3. **Verification Process**
   - User scans QR code → Frontend loads → API verifies → Certificate displayed

## 🧪 Testing

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
- Submit test forms through Google Forms
- Verify certificates using the frontend portal
- Test API endpoints with tools like Postman

## 🚀 Deployment

### Production Deployment

1. **Database**: Set up MySQL on production server
2. **Backend**: Deploy to hosting service (PM2, Docker, etc.)
3. **Frontend**: Build and deploy to static hosting (Netlify, Vercel)
4. **Forms**: Update Google Apps Script with production URLs

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📈 Monitoring & Analytics

- **Certificate Generation**: Track success/failure rates
- **Verification Requests**: Monitor verification attempts  
- **Form Submissions**: Analyze application trends
- **System Health**: Database and API monitoring

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
