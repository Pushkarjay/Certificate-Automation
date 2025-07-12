# Scripts Directory

This directory contains utility scripts for development, testing, and maintenance.

## Available Scripts

### Development & Testing
- **`test-system.js`** - Comprehensive system testing script
  - Tests QR code generation
  - Tests certificate generation
  - Tests database connectivity
  - Tests revocation functionality
  - Usage: `node scripts/test-system.js`

### Database Management
- **`reset-database.js`** - Database reset with sample data
  - Clears all existing data
  - Creates 3 sample users (generated, pending, revoked)
  - Usage: `node scripts/reset-database.js`

### File Management
- **`clean-certificates.js`** - Clean generated certificate files
  - Removes all generated PDF/IMG files
  - Keeps directory structure
  - Usage: `node scripts/clean-certificates.js`

### Validation
- **`validate-srs.js`** - SRS compliance validation
  - Validates repository structure against SRS requirements
  - Checks required files and directories
  - Usage: `node scripts/validate-srs.js`

## Running Scripts

All scripts should be run from the project root directory:

```bash
# From project root
cd /path/to/Certificate-Automation

# Run a script
node scripts/script-name.js
```

## Notes

- Scripts are designed to be run in development environments
- Always backup important data before running reset/clean scripts
- Test scripts are safe to run multiple times
- Validation scripts only read files, they don't modify anything
