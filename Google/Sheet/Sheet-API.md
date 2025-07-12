# Google Sheets API Configuration

## Sheet Details (SRS Requirement FR1)

### Primary Data Sheet
- **Sheet ID**: [REPLACE_WITH_YOUR_SHEET_ID]
- **Sheet URL**: [REPLACE_WITH_YOUR_SHEET_URL]
- **Service Account**: [REPLACE_WITH_YOUR_SERVICE_ACCOUNT_EMAIL]

## Authentication
- **Credentials File**: Sheet-API.JSON (use Sheet-API.JSON.example as template)
- **Project ID**: [REPLACE_WITH_YOUR_PROJECT_ID]
- **Authentication Type**: Service Account

## Sheet Structure

### Student Data Sheet
- Column A: Timestamp
- Column B: Full Name
- Column C: Email Address
- Column D: Course/Domain
- Column E: Batch Initials
- Column F: Start Date
- Column G: End Date
- Column H: GPA
- Column I: Certificate Type (auto-populated)

### Trainer Data Sheet
- Column A: Timestamp
- Column B: Full Name
- Column C: Email Address
- Column D: Employee ID
- Column E: Qualification
- Column F: Specialization
- Column G: Course
- Column H: Training Hours
- Column I: Performance Rating

### Trainee Data Sheet
- Column A: Timestamp
- Column B: Full Name
- Column C: Email Address
- Column D: Phone
- Column E: Organization
- Column F: Position
- Column G: Training Type
- Column H: Course
- Column I: Attendance %

## API Access Configuration

### Google Apps Script Setup
1. Open Google Sheets
2. Extensions → Apps Script
3. Paste webhook code
4. Set up triggers for form submissions
5. Configure authentication

### Permissions Required
- Google Sheets API
- Google Forms API
- Gmail API (for confirmations)

## Data Flow (SRS FR2)

1. **Form → Sheet**: Automatic via Google Forms
2. **Sheet → Database**: Via Apps Script webhook
3. **Processing**: Real-time data validation
4. **Storage**: PostgreSQL/MySQL/MongoDB

## Security Measures

- Service account authentication
- Encrypted API communications
- Data validation at multiple levels
- Audit trail for all operations
