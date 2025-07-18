# Generated Certificates Directory

This directory contains automatically generated certificate files.

## Structure

```
Generated-Certificates/
├── IMG/          # Certificate image files (.png, .jpg)
├── PDF/          # Certificate PDF files (.pdf)
└── README.md     # This file
```

## File Types

- **PDF/**: Contains certificate PDFs with embedded QR codes
- **IMG/**: Contains certificate images in PNG/JPG format

## Naming Convention

Certificates use the following naming pattern:
`{TYPE}_{COURSE}_{BATCH}_{YEAR}_{COUNTER}.{extension}`

Example: `STUDENT_PYTH_G28_2025_0001.pdf`

## File Management

- Files are automatically generated by the backend service
- Generated files are ignored by Git (see .gitignore)
- Only the directory structure is tracked in version control
- Certificate files are created at runtime based on form submissions

## Cleanup

To clean generated files during development:
```bash
# Windows PowerShell
Remove-Item -Path "Backend\Generated-Certificates\PDF\*" -Include "*.pdf","*.png","*.svg" -Force
Remove-Item -Path "Backend\Generated-Certificates\IMG\*" -Include "*.png","*.jpg","*.jpeg" -Force

# Linux/Mac
rm -f Backend/Generated-Certificates/PDF/*.{pdf,png,svg}
rm -f Backend/Generated-Certificates/IMG/*.{png,jpg,jpeg}
```
