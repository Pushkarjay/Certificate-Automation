# Google Forms Setup Guide

## Overview
This folder contains the Google Apps Script code to integrate Google Forms with your certificate automation system.

## Setup Instructions

### 1. Create Google Forms

Create three separate Google Forms for different certificate types:

#### Student Certificate Form
- **Form Title**: "Student Certificate Application - SURE Trust"
- **Fields**:
  - Title (Dropdown): Mr, Ms, Dr, Prof
  - Full Name (Text)
  - Email Address (Email)
  - Course/Domain (Dropdown): Python & ML, VLSI, Java, etc.
  - Batch Initials (Text): G28, G15, etc.
  - Start Date (Date)
  - End Date (Date)
  - GPA (Number)

#### Trainer Certificate Form
- **Form Title**: "Trainer Certificate Application - SURE Trust"
- **Fields**:
  - Title (Dropdown): Mr, Ms, Dr, Prof
  - Full Name (Text)
  - Email Address (Email)
  - Employee ID (Text)
  - Qualification (Text)
  - Specialization (Text)
  - Course Taught (Dropdown)
  - Batch Initials (Text)
  - Training Hours (Number)
  - Training Start Date (Date)
  - Training End Date (Date)
  - Performance Rating (Number)

#### Trainee Certificate Form
- **Form Title**: "Trainee Certificate Application - SURE Trust"
- **Fields**:
  - Title (Dropdown): Mr, Ms, Dr, Prof
  - Full Name (Text)
  - Email Address (Email)
  - Phone (Text)
  - Organization (Text)
  - Position (Text)
  - Course/Training (Dropdown)
  - Training Type (Dropdown): Workshop, Bootcamp, Certification, Seminar
  - Training Start Date (Date)
  - Training End Date (Date)
  - Training Duration (Hours) (Number)
  - Attendance Percentage (Number)
  - Assessment Score (Number)

### 2. Set up Google Apps Script

1. Open your Google Form
2. Click the three dots menu → Script editor
3. Delete the default code and paste the content from `google-apps-script.js`
4. Update the configuration variables:
   - `WEBHOOK_URL`: Your backend server URL
   - `DATABASE_API_KEY`: Your API authentication key

### 3. Configure Triggers

1. In Google Apps Script, go to Triggers (clock icon)
2. Click "Add Trigger"
3. Configure:
   - Function: `onFormSubmit`
   - Event source: From form
   - Event type: On form submit
4. Save the trigger

### 4. Test the Integration

1. Run the `testWebhook` function in Google Apps Script
2. Submit a test form response
3. Check your backend logs to ensure data is being received

### 5. Deploy as Web App (Optional)

If you want to create a custom form interface:

1. In Google Apps Script, click "Deploy" → "New deployment"
2. Choose type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Deploy and get the web app URL

## Form URLs

After creating the forms, you'll get URLs like:
- Student Form: `https://forms.gle/xxxxx`
- Trainer Form: `https://forms.gle/yyyyy`
- Trainee Form: `https://forms.gle/zzzzz`

Add these URLs to your frontend application or share them directly.

## Data Flow

1. User fills out Google Form
2. Google Apps Script triggers on form submission
3. Script processes form data and determines certificate type
4. Data is sent to your backend API via webhook
5. Backend stores data in MySQL database
6. Confirmation email is sent to user
7. Certificate generation process begins

## Security Notes

- Keep your `DATABASE_API_KEY` secure
- Use HTTPS for your webhook URL in production
- Validate all incoming form data in your backend
- Implement rate limiting to prevent abuse

## Troubleshooting

- Check Google Apps Script logs for errors
- Verify webhook URL is accessible
- Ensure database connection is working
- Test with small batches first

## Customization

You can customize the form fields and validation logic in the Google Apps Script based on your specific requirements.
