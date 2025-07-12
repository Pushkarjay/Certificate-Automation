# Google Forms Integration Links

## Form URLs (SRS Requirement FR1)

### Student Certificate Form
- **URL**: [REPLACE_WITH_YOUR_FORM_URL]
- **Type**: Student course completion certificates
- **Fields**: Full Name, Email, Course, Batch Initials, Start Date, End Date, GPA
- **Processing**: Automatic via Google Apps Script webhook

### Trainer Certificate Form
- **URL**: [To be created - follow same pattern]
- **Type**: Instructor certification requests
- **Fields**: Full Name, Email, Employee ID, Qualification, Specialization, Course, Training Hours, etc.
- **Processing**: Automatic via Google Apps Script webhook

### Trainee Certificate Form
- **URL**: [To be created - follow same pattern]
- **Type**: Workshop/training participation certificates
- **Fields**: Full Name, Email, Phone, Organization, Position, Training Type, etc.
- **Processing**: Automatic via Google Apps Script webhook

## Google Sheets Integration

### Main Data Sheet
- **URL**: [REPLACE_WITH_YOUR_SHEET_URL]
- **API Access**: Via Google Sheets API
- **Service Account**: Use Sheet-API.JSON.example as template
- **Processing**: Real-time data transfer to database

## Integration Workflow (SRS FR1 & FR2)

1. **Form Submission**
   - User fills Google Form
   - Data stored in Google Sheets
   - Apps Script triggers webhook

2. **Data Processing**
   - Apps Script validates form data
   - Determines certificate type (student/trainer/trainee)
   - Sends POST request to `/api/forms/submit`

3. **Backend Processing**
   - Receives webhook data
   - Validates and normalizes data
   - Stores in PostgreSQL/MySQL/MongoDB
   - Sends confirmation email

4. **Certificate Generation**
   - Admin triggers generation
   - System creates PDF/IMG certificates
   - QR codes generated with verification URLs
   - Files stored in structured folders

## Security & Authentication

- **API Key**: Required for webhook authentication
- **HTTPS**: All form submissions use secure connections
- **Data Validation**: Server-side validation of all form inputs
- **Rate Limiting**: Protection against form spam/abuse

## Configuration

Update Google Apps Script with these settings:
```javascript
const WEBHOOK_URL = 'https://your-domain.com/api/forms/submit';
const DATABASE_API_KEY = 'your-secure-api-key';
```

## Support

For form issues or integration problems:
- Check Google Apps Script logs
- Verify webhook URL accessibility
- Test database connection
- Monitor server logs at `/api/performance`
