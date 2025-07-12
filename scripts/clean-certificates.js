#!/usr/bin/env node

/**
 * Clean Generated Certificate Files
 * Removes all generated certificate files except those matching the sample record
 */

const fs = require('fs');
const path = require('path');

function cleanGeneratedFiles() {
    const generatedDir = path.join(__dirname, '../Backend/Generated-Certificates');
    const pdfDir = path.join(generatedDir, 'PDF');
    const imgDir = path.join(generatedDir, 'IMG');
    
    console.log('🧹 Cleaning ALL generated certificate files...');
    
    // Clear all files when doing complete reset
    const keepRef = null; // Don't keep any files during complete reset
    
    let deletedCount = 0;
    
    // Clean PDF directory
    if (fs.existsSync(pdfDir)) {
        const pdfFiles = fs.readdirSync(pdfDir);
        console.log(`📂 Found ${pdfFiles.length} PDF files`);
        
        pdfFiles.forEach(file => {
            if (!file.startsWith('.') && !file.includes('.gitkeep')) {
                const filePath = path.join(pdfDir, file);
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`   🗑️  Deleted: ${file}`);
                } catch (error) {
                    console.log(`   ❌ Failed to delete: ${file} - ${error.message}`);
                }
            }
        });
    }
    
    // Clean IMG directory
    if (fs.existsSync(imgDir)) {
        const imgFiles = fs.readdirSync(imgDir);
        console.log(`📂 Found ${imgFiles.length} IMG files`);
        
        imgFiles.forEach(file => {
            if (!file.startsWith('.') && !file.includes('.gitkeep')) {
                const filePath = path.join(imgDir, file);
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`   🗑️  Deleted: ${file}`);
                } catch (error) {
                    console.log(`   ❌ Failed to delete: ${file} - ${error.message}`);
                }
            }
        });
    }
    
    console.log(`✅ Cleanup complete! Deleted ${deletedCount} files`);
    
    // Show remaining files
    console.log('\n📋 Remaining files:');
    if (fs.existsSync(pdfDir)) {
        const remainingPdf = fs.readdirSync(pdfDir).filter(f => !f.startsWith('.'));
        console.log(`   PDF: ${remainingPdf.length} files`);
        remainingPdf.forEach(f => console.log(`     - ${f}`));
    }
    if (fs.existsSync(imgDir)) {
        const remainingImg = fs.readdirSync(imgDir).filter(f => !f.startsWith('.'));
        console.log(`   IMG: ${remainingImg.length} files`);
        remainingImg.forEach(f => console.log(`     - ${f}`));
    }
}

// Run the cleanup
cleanGeneratedFiles();
