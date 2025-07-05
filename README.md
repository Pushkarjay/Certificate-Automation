# CertifyPro - Digital Certificate Platform

A comprehensive digital certificate management platform built with React, Node.js, and dual database support (MongoDB/MySQL). Think of it as a custom Credly clone with advanced features for certificate generation, verification, and management.

## 🌟 Key Features

### 🔐 **Authentication & Authorization**
- **Multi-role Authentication**: Admin and User accounts
- **Social Login**: Google OAuth integration
- **Email/Password**: Traditional login system
- **Profile Management**: Complete user profiles with secondary email, phone, etc.

### 📜 **Certificate Management**
- **Admin Features**: Issue, manage, and track certificates
- **User Features**: Store, download, share, and verify certificates
- **QR Code Integration**: Instant verification via QR scanning
- **Digital Wallet**: Personal certificate portfolio

### 🛡️ **Security & Verification**
- **Blockchain-ready**: Secure certificate storage
- **Real-time Verification**: Instant authenticity checks
- **Audit Trails**: Complete verification history
- **Anti-fraud Protection**: Advanced security measures

### 🎨 **Modern Interface**
- **Responsive Design**: Works on all devices
- **Professional Templates**: Beautiful certificate designs
- **Dashboard**: Comprehensive admin and user dashboards
- **Search & Filter**: Advanced certificate discovery

## 🏗️ Architecture

```
CertifyPro Platform
├── 👥 User Management
│   ├── Authentication (JWT + OAuth)
│   ├── Role-based Access Control
│   └── Profile Management
├── 📜 Certificate Engine
│   ├── Template System
│   ├── QR Code Generation
│   └── Verification System
├── 💾 Dual Database Support
│   ├── MongoDB (NoSQL)
│   └── MySQL (Relational)
└── 🌐 RESTful API
    ├── Public Endpoints
    ├── Admin Endpoints
    └── User Endpoints
```

## 👥 User Roles

### 🔧 **Admin Role**
- Issue and manage certificates
- Create certificate templates
- Manage users and organizations
- View analytics and reports
- Bulk certificate operations

### 👤 **User Role**
- View personal certificate portfolio
- Download and share certificates
- Verify other certificates
- Manage profile and preferences
- Track certificate history

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Database: MongoDB OR MySQL
- Google OAuth credentials (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/Pushkarjay/Certificate-Automation.git
cd Certificate-Automation

# Install dependencies
npm run install-all

# Setup database (choose one)
npm run setup:mongodb    # For MongoDB
npm run setup:mysql      # For MySQL

# Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start development server
npm run dev
```

### Default Admin Account
```
Email: admin@certifypro.com
Password: admin123
```

## 🔧 Configuration

### Environment Variables

**Server (.env)**
```env
# Application
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secure_jwt_secret
FRONTEND_URL=http://localhost:3000

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/certifypro_db

# Database (MySQL) - Alternative
DB_HOST=localhost
DB_PORT=3306
DB_NAME=certifypro_db
DB_USER=root
DB_PASSWORD=your_password

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# File Storage
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5MB
```

**Client (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
GENERATE_SOURCEMAP=false
```

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register        # User registration
POST   /api/auth/login           # User login
POST   /api/auth/google          # Google OAuth
POST   /api/auth/forgot-password # Password reset
GET    /api/auth/me              # Get current user
PUT    /api/auth/profile         # Update profile
```

### Admin Endpoints (Protected)
```
POST   /api/admin/certificates        # Issue certificate
GET    /api/admin/certificates        # Manage certificates
POST   /api/admin/templates          # Create templates
GET    /api/admin/users              # Manage users
GET    /api/admin/analytics          # View analytics
```

### User Endpoints (Protected)
```
GET    /api/user/certificates         # My certificates
GET    /api/user/shared/:id           # Shared certificates
POST   /api/user/verify/:dofNo        # Verify certificate
GET    /api/user/profile              # User profile
PUT    /api/user/preferences          # Update preferences
```

### Public Endpoints
```
GET    /api/public/verify/:dofNo      # Public verification
GET    /api/public/certificate/:id    # Public certificate view
GET    /api/public/shared/:shareId    # Shared certificate link
```

## 🎯 User Journeys

### 👤 **For Certificate Recipients**
1. **Receive Notification** → Email with certificate link
2. **Create Account** → Sign up to claim certificate
3. **Digital Wallet** → View all earned certificates
4. **Share & Verify** → Share achievements publicly
5. **Download** → PDF/Image formats available

### 🔧 **For Certificate Issuers (Admins)**
1. **Admin Dashboard** → Complete management interface
2. **Template Creation** → Design certificate templates
3. **Bulk Issuance** → Issue multiple certificates
4. **Analytics** → Track certificate performance
5. **User Management** → Manage recipients

### 🔍 **For Verifiers (Public)**
1. **QR Scan** → Instant verification via mobile
2. **Manual Entry** → Verify using DOF number
3. **Public View** → See certificate details
4. **Verification History** → Track verification attempts

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (RBAC)
- **Input Validation** and sanitization
- **Rate Limiting** on all endpoints
- **HTTPS Enforcement** in production
- **Password Hashing** with bcrypt
- **XSS Protection** and CSRF tokens
- **Audit Logging** for all operations

## 🎨 Features Overview

### Certificate Templates
- **Professional Designs** for various industries
- **Customizable Fields** and branding
- **Template Library** with pre-made options
- **Brand Guidelines** enforcement

### Digital Wallet
- **Portfolio View** of all certificates
- **Search & Filter** capabilities
- **Sharing Options** (social media, email, direct link)
- **Privacy Controls** (public/private certificates)

### Verification System
- **QR Code Scanning** with mobile app
- **Blockchain Integration** (planned)
- **Verification Badges** for websites
- **API Access** for third-party integration

## 📱 Mobile App (Planned)
- Native iOS and Android apps
- QR code scanning
- Certificate wallet
- Push notifications
- Offline verification

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ User authentication system
- ✅ Role-based access control
- ✅ Basic certificate management
- ✅ QR code verification

### Phase 2 (Next)
- 🔲 Advanced templates
- 🔲 Bulk operations
- 🔲 Email notifications
- 🔲 Social sharing

### Phase 3 (Future)
- 🔲 Mobile applications
- 🔲 Blockchain integration
- 🔲 API marketplace
- 🔲 White-label solutions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork the repository
git fork https://github.com/Pushkarjay/Certificate-Automation.git

# Create feature branch
git checkout -b feature/awesome-feature

# Make changes and test
npm test

# Commit and push
git commit -m "Add awesome feature"
git push origin feature/awesome-feature

# Create Pull Request
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Star the Project

If you find this project useful, please consider giving it a star on GitHub!

## 📞 Support & Community

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Pushkarjay/Certificate-Automation/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/Pushkarjay/Certificate-Automation/discussions)
- 📧 **Email**: support@certifypro.com
- 💬 **Discord**: [Join our community](https://discord.gg/certifypro)

---

**Built with ❤️ by developers, for the digital credential ecosystem**

*Making digital certificates accessible, secure, and beautiful.*

