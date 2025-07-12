# Improved Google Form Structure for Certificate Automation

## Section 1: Role Selection (Required)
**Title:** SURE Trust Certificate Application
**Description:** Please select your role to access the appropriate certificate application form.

### Fields:
1. **Email** (Required, Email validation)
2. **Choose Your Role** (Required, Single choice)
   - Student (Course completion certificate)
   - Trainee/Intern (Training participation certificate)  
   - Trainer (Training delivery certificate)

---

## Section 2: Student Certificate Application
**Condition:** Show only if "Student" selected in Section 1
**Description:** Complete this form to apply for your course completion certificate.

### Personal Information:
1. **Title** (Required, Dropdown)
   - Mr.
   - Ms.
   - Mrs.
   - Dr.
   - Prof.

2. **Full Name** (Required, Text)
   - Validation: Letters and spaces only

3. **Email Address** (Required, Email)
   - Auto-filled from Section 1

4. **Phone Number** (Required, Text)
   - Validation: 10-digit number format

5. **Date of Birth** (Required, Date)

6. **Gender** (Required, Single choice)
   - Male
   - Female
   - Other
   - Prefer not to say

### Course Information:
7. **Course/Domain** (Required, Dropdown)
   - Cloud Computing (CC)
   - Data Structures & Algorithms (DSA)
   - Robotics
   - Advanced Android Development (AAD)
   - Software Testing & Tools (ST&T)
   - AutoCAD
   - SAP FICO
   - Cyber Security (CS)
   - Embedded Systems (ES)
   - Data Science (DS)
   - Java Programming
   - SQL Database
   - VLSI Design
   - Python Programming
   - Machine Learning (ML)
   - Data Analytics
   - UI/UX Design
   - Full Stack Development (FSD)
   - Generative AI
   - Medical Coding
   - Digital Marketing (DM)
   - PCB Design
   - RPA (Robotic Process Automation)
   - Internet of Things (IoT)

8. **Batch** (Required, Dropdown)
   - G1, G2, G3, G4, G5, G6, G7, G8, G10, G12, G13, G14, G15, G16, G17, G18, G28

9. **Course Start Date** (Required, Date)

10. **Course End Date** (Required, Date)

11. **GPA/Final Score** (Required, Number)
    - Validation: 0-10 scale

12. **Additional Comments** (Optional, Long text)

---

## Section 3: Trainee/Intern Certificate Application  
**Condition:** Show only if "Trainee/Intern" selected in Section 1
**Description:** Complete this form to apply for your training participation certificate.

### Personal Information:
1-6. **Same as Student section**

### Training Information:
7. **Training Program** (Required, Dropdown)
   - Same course list as students

8. **Training Type** (Required, Single choice)
   - Internship
   - Workshop
   - Bootcamp
   - Certification Program
   - Seminar

9. **Batch/Cohort** (Required, Text)

10. **Training Start Date** (Required, Date)

11. **Training End Date** (Required, Date)

12. **Training Duration (Hours)** (Required, Number)

13. **Attendance Percentage** (Required, Number)
    - Validation: 0-100%

14. **Assessment Score** (Optional, Number)

15. **Organization/Institution** (Optional, Text)

16. **Additional Comments** (Optional, Long text)

---

## Section 4: Trainer Certificate Application
**Condition:** Show only if "Trainer" selected in Section 1  
**Description:** Complete this form to apply for your training delivery certificate.

### Personal Information:
1-6. **Same as Student section**

### Professional Information:
7. **Employee ID** (Optional, Text)

8. **Highest Qualification** (Required, Dropdown)
   - Bachelor's Degree
   - Master's Degree
   - PhD
   - Professional Certification
   - Other

9. **Area of Specialization** (Required, Text)

10. **Years of Experience** (Required, Number)

### Training Information:
11. **Course/Domain Taught** (Required, Dropdown)
    - Same course list as students

12. **Batch Conducted** (Required, Text)

13. **Training Start Date** (Required, Date)

14. **Training End Date** (Required, Date)

15. **Total Training Hours** (Required, Number)

16. **Number of Participants** (Required, Number)

17. **Training Mode** (Required, Single choice)
    - In-person
    - Online
    - Hybrid

18. **Performance Rating** (Optional, Number)
    - Validation: 1-5 scale

19. **Additional Comments** (Optional, Long text)

---

## Form Settings Improvements:

### Validation Rules:
- Email format validation
- Phone number format (10 digits)
- Date validations (end date after start date)
- Score validations (appropriate ranges)
- Required field enforcement

### User Experience:
- Progressive disclosure (only show relevant sections)
- Clear section titles and descriptions
- Consistent field ordering
- Auto-save enabled
- Mobile-friendly design

### Data Quality:
- Standardized course names
- Consistent batch naming
- Proper data types for each field
- Optional vs required field clarity

### Integration Ready:
- Field names match your database schema
- Easy to parse with Google Apps Script
- Consistent data format for automation
