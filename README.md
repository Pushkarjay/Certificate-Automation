# Certificate Generation & Verification System

A comprehensive digital certificate management system built with React, Node.js, and MongoDB. This system allows for secure generation, storage, and verification of digital certificates with QR code integration.

## 🚀 Features

- **Certificate Generation**: Create professional digital certificates with customizable templates
- **QR Code Integration**: Automatic QR code generation for quick verification
- **Secure Verification**: Verify certificate authenticity via QR scanning or DOF number entry
- **Database Storage**: Secure storage of certificate data with MongoDB
- **Responsive Design**: Modern, mobile-friendly user interface
- **Real-time Verification**: Instant certificate validation
- **Certificate Management**: View, search, and manage all certificates
- **RESTful API**: Complete API for integration with other systems

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Icons** - Icon library
- **React Toastify** - Toast notifications
- **QRCode.react** - QR code generation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Database Options:**
  - **MongoDB** - NoSQL database with Mongoose ODM
  - **MySQL** - Relational database with mysql2 driver
- **QRCode** - Server-side QR code generation
- **Joi** - Data validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v14 or higher)
- **Database (choose one):**
  - MongoDB (v4.4 or higher) - Default option
  - MySQL (v8.0 or higher) - Alternative option
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Certificate-Automation
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```
   Or install separately:
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

4. **Set up database and environment variables**
   
   **Option A: MongoDB (Default)**
   ```bash
   # Make sure MongoDB is running
   # Create server/.env file:
   ```
   
   **Server (.env in /server directory):**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/certificate_db
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here
   FRONTEND_URL=http://localhost:3000
   ```
   
   **Option B: MySQL (Alternative)**
   ```bash
   # Run MySQL setup script
   ./setup-mysql.bat    # Windows
   ./setup-mysql.sh     # Linux/Mac
   ```
   
   **Client (.env in /client directory):**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   GENERATE_SOURCEMAP=false
   ```

5. **Run the application**
   ```bash
   # Run both frontend and backend concurrently
   npm run dev
   
   # Or run separately:
   # Backend only
   npm run server
   
   # Frontend only
   npm run client
   ```

## 🌐 API Endpoints

### MongoDB API (`/api/certificates`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/certificates` | Generate new certificate |
| GET | `/api/certificates` | Get all certificates (paginated) |
| GET | `/api/certificates/:id` | Get certificate by ID |
| GET | `/api/certificates/verify/:dofNo` | Verify certificate by DOF number |
| DELETE | `/api/certificates/:id` | Deactivate certificate |

### MySQL API (`/api/mysql/certificates`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mysql/certificates` | Generate new certificate |
| GET | `/api/mysql/certificates` | Get all certificates (paginated + search) |
| GET | `/api/mysql/certificates/:id` | Get certificate by ID |
| GET | `/api/mysql/certificates/verify/:dofNo` | Verify certificate |
| DELETE | `/api/mysql/certificates/:id` | Deactivate certificate |
| GET | `/api/mysql/certificates/stats/:dofNo` | Get verification statistics |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check for both databases |
| GET | `/api/databases` | Available database information |

### Request/Response Examples

**Generate Certificate:**
```json
POST /api/certificates
{
  "name": "John Doe",
  "program": "Web Development Bootcamp",
  "refNo": "REF-2024-001",
  "issueDate": "2024-12-06"
}
```

**Verify Certificate:**
```json
GET /api/certificates/verify/DOF-1733515200000-A1B2C3D4

Response:
{
  "success": true,
  "verified": true,
  "message": "Certificate verified successfully",
  "data": {
    "refNo": "REF-2024-001",
    "dofNo": "DOF-1733515200000-A1B2C3D4",
    "name": "John Doe",
    "program": "Web Development Bootcamp",
    "issueDate": "2024-12-06T00:00:00.000Z",
    "verificationCount": 1,
    "lastVerified": "2024-12-06T12:30:00.000Z"
  }
}
```

## 📱 Usage

### For Administrators

1. **Generate Certificates**
   - Navigate to `/generate`
   - Fill in recipient details
   - Click "Generate Certificate"
   - Download or print the certificate

2. **Manage Certificates**
   - Visit `/certificates` to view all certificates
   - Search and filter certificates
   - View individual certificate details
   - Deactivate certificates if needed

### For End Users

1. **Verify Certificates**
   - Scan QR code on certificate, or
   - Visit `/verify` and enter DOF number
   - View verification status and certificate details

## 🔒 Security Features

- **Input Validation**: All inputs are validated using Joi
- **Rate Limiting**: API endpoints protected against abuse
- **Helmet Security**: Security headers for protection
- **CORS Configuration**: Controlled cross-origin access
- **Unique Identifiers**: DOF numbers are cryptographically unique
- **Data Encryption**: Secure storage of certificate data

## 🗃️ Database Schema

### Certificate Collection
```javascript
{
  refNo: String,        // Reference number (unique)
  dofNo: String,        // DOF number for verification (unique)
  name: String,         // Recipient name
  program: String,      // Program/course name
  issueDate: Date,      // Issue date
  qrCodeUrl: String,    // QR code data URL
  isActive: Boolean,    // Certificate status
  metadata: {
    generatedBy: String,
    generatedAt: Date,
    lastVerified: Date,
    verificationCount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client && npm run build

# Start production server
cd ../server && npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Update `MONGODB_URI` to production database
- Update `FRONTEND_URL` to production domain
- Set secure `JWT_SECRET`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact: [your-email@example.com]

## 🔄 Version History

- **v1.0.0** - Initial release with core features
  - Certificate generation with QR codes
  - Verification system
  - Database integration
  - Responsive web interface

---

**Built with ❤️ using React, Node.js, and MongoDB**

