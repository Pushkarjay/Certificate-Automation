# 🔐 Security Notice - Google Integration

## ⚠️ IMPORTANT SECURITY WARNINGS

### 1. Service Account Credentials
- **NEVER** commit `Sheet-API.JSON` to version control
- Use `Sheet-API.JSON.example` as a template
- Store actual credentials securely (environment variables, secrets manager)

### 2. API Keys and URLs
- Replace all placeholder URLs with your actual endpoints
- Use environment variables for webhook URLs in production
- Keep database API keys secure and rotate regularly

### 3. Form and Sheet URLs
- Replace example URLs with your actual Google Forms and Sheets
- Ensure proper access controls on Google resources
- Use HTTPS for all webhook endpoints

## 📋 Setup Checklist

### Before Deployment:
- [ ] Create your own Google Service Account
- [ ] Download credentials as `Sheet-API.JSON` (keep private)
- [ ] Update all placeholder URLs in documentation
- [ ] Configure webhook endpoints with proper authentication
- [ ] Test form submissions in development environment
- [ ] Verify data flow from Forms → Sheets → Database

### Security Best Practices:
- [ ] Enable 2FA on Google account used for service account
- [ ] Regularly audit Google Cloud IAM permissions
- [ ] Monitor form submission logs for anomalies
- [ ] Implement rate limiting on webhook endpoints
- [ ] Use HTTPS for all production endpoints
- [ ] Backup form data and configurations

## 🚨 If Credentials Were Compromised:
1. Immediately revoke the service account key in Google Cloud Console
2. Generate new service account credentials
3. Update all applications using the old credentials
4. Review audit logs for any unauthorized access
5. Consider rotating all related API keys

---
*Last Updated: July 12, 2025*
*Always prioritize security in your certificate automation system*
