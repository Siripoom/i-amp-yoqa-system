const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

// สร้างสคริปต์แก้ไข template font
function fixTemplateFonts() {
  const templatePath = path.resolve(__dirname, 'templates/receipt-template.docx');
  const backupPath = path.resolve(__dirname, 'templates/receipt-template-backup.docx');

  // สำรองไฟล์เดิม
  fs.copyFileSync(templatePath, backupPath);
  console.log('Template backed up to:', backupPath);

  // อ่านและแก้ไขไฟล์ template
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);

  // แก้ไขไฟล์ styles.xml
  const stylesXml = zip.file('word/styles.xml');
  if (stylesXml) {
    let stylesContent = stylesXml.asText();
    console.log('Fixing styles.xml...');

    // แทนที่ฟอนต์ทุกแบบเป็น TH Sarabun New
    stylesContent = stylesContent.replace(/w:ascii="[^"]*"/g, 'w:ascii="TH Sarabun New"');
    stylesContent = stylesContent.replace(/w:hAnsi="[^"]*"/g, 'w:hAnsi="TH Sarabun New"');
    stylesContent = stylesContent.replace(/w:cs="[^"]*"/g, 'w:cs="TH Sarabun New"');
    stylesContent = stylesContent.replace(/w:eastAsia="[^"]*"/g, 'w:eastAsia="TH Sarabun New"');

    zip.file('word/styles.xml', stylesContent);
  }

  // แก้ไขไฟล์ document.xml
  const docXml = zip.file('word/document.xml');
  if (docXml) {
    let docContent = docXml.asText();
    console.log('Fixing document.xml...');

    // แทนที่ฟอนต์ทุกแบบเป็น TH Sarabun New
    docContent = docContent.replace(/w:ascii="[^"]*"/g, 'w:ascii="TH Sarabun New"');
    docContent = docContent.replace(/w:hAnsi="[^"]*"/g, 'w:hAnsi="TH Sarabun New"');
    docContent = docContent.replace(/w:cs="[^"]*"/g, 'w:cs="TH Sarabun New"');
    docContent = docContent.replace(/w:eastAsia="[^"]*"/g, 'w:eastAsia="TH Sarabun New"');

    zip.file('word/document.xml', docContent);
  }

  // แก้ไขไฟล์ fontTable.xml
  const fontTableXml = zip.file('word/fontTable.xml');
  if (fontTableXml) {
    let fontTableContent = fontTableXml.asText();
    console.log('Fixing fontTable.xml...');

    // แทนที่ชื่อฟอนต์ทั้งหมดเป็น TH Sarabun New
    fontTableContent = fontTableContent.replace(/w:name="[^"]*"/g, 'w:name="TH Sarabun New"');

    zip.file('word/fontTable.xml', fontTableContent);
  }

  // บันทึกไฟล์ที่แก้ไขแล้ว
  const modifiedBuffer = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  fs.writeFileSync(templatePath, modifiedBuffer);
  console.log('Template font fixed successfully!');
  console.log('Original template backed up as: receipt-template-backup.docx');
}

// รันสคริปต์
fixTemplateFonts();
