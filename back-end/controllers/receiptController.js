const Receipt = require("../models/receipt");
const Order = require("../models/order");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
// สำหรับการสร้าง DOCX จาก template
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { formatNumber } = require('../utils/formatters');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ฟังก์ชันสำหรับแทนที่ฟอนต์ใน DOCX
function replaceFontsInDocx(docxBuffer) {
  try {
    const zip = new PizZip(docxBuffer);

    // อ่านและแก้ไขไฟล์ styles.xml
    const stylesXml = zip.file('word/styles.xml');
    if (stylesXml) {
      let stylesContent = stylesXml.asText();
      console.log('Original styles.xml found');

      // แทนที่ฟอนต์ทุกแบบเป็น TH Sarabun New
      stylesContent = stylesContent.replace(/w:ascii="[^"]*"/g, 'w:ascii="TH Sarabun New"');
      stylesContent = stylesContent.replace(/w:hAnsi="[^"]*"/g, 'w:hAnsi="TH Sarabun New"');
      stylesContent = stylesContent.replace(/w:cs="[^"]*"/g, 'w:cs="TH Sarabun New"');
      stylesContent = stylesContent.replace(/w:eastAsia="[^"]*"/g, 'w:eastAsia="TH Sarabun New"');

      zip.file('word/styles.xml', stylesContent);
    }

    // อ่านและแก้ไขไฟล์ document.xml
    const docXml = zip.file('word/document.xml');
    if (docXml) {
      let docContent = docXml.asText();
      console.log('Original document.xml found');

      // แทนที่ฟอนต์ทุกแบบเป็น TH Sarabun New
      docContent = docContent.replace(/w:ascii="[^"]*"/g, 'w:ascii="TH Sarabun New"');
      docContent = docContent.replace(/w:hAnsi="[^"]*"/g, 'w:hAnsi="TH Sarabun New"');
      docContent = docContent.replace(/w:cs="[^"]*"/g, 'w:cs="TH Sarabun New"');
      docContent = docContent.replace(/w:eastAsia="[^"]*"/g, 'w:eastAsia="TH Sarabun New"');

      zip.file('word/document.xml', docContent);
    }

    // อ่านและแก้ไขไฟล์ fontTable.xml (ถ้ามี)
    const fontTableXml = zip.file('word/fontTable.xml');
    if (fontTableXml) {
      let fontTableContent = fontTableXml.asText();
      console.log('Original fontTable.xml found');

      // แทนที่ชื่อฟอนต์ทั้งหมดเป็น TH Sarabun New
      fontTableContent = fontTableContent.replace(/w:name="[^"]*"/g, 'w:name="TH Sarabun New"');

      zip.file('word/fontTable.xml', fontTableContent);
    }

    console.log('Font replacement completed');
    return zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });
  } catch (error) {
    console.error('Error replacing fonts:', error);
    return docxBuffer; // ถ้าเกิดข้อผิดพลาด ให้ส่งไฟล์เดิมกลับไป
  }
}

// สร้างเลขรันนิ่งใบเสร็จ (ตัวอย่าง: R20250826-0001)
async function generateReceiptNumber() {
  // สร้าง Date object ใหม่ทุกครั้งที่ใช้
  const today = new Date();

  // สร้าง Date object ใหม่สำหรับ start และ end
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // สร้างรูปแบบวันที่ YYYYMMDD จาก today โดยตรง
  const dateStr = today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  // หาเลขล่าสุดของวันนี้
  const latestReceipt = await Receipt.findOne({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort({ receiptNumber: -1 });

  // เริ่มที่ 0001 ทุกวัน
  let nextNumber = 1;
  if (latestReceipt) {
    const currentNumber = parseInt(latestReceipt.receiptNumber.split('-')[1]);
    nextNumber = currentNumber + 1;
  }

  // สร้างเลขใบเสร็จใหม่
  const receiptNumber = `R${dateStr}-${String(nextNumber).padStart(4, '0')}`;

  // ตรวจสอบซ้ำอีกครั้ง
  const existingReceipt = await Receipt.findOne({
    receiptNumber,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });

  if (existingReceipt) {
    // ถ้าซ้ำ ให้เรียกฟังก์ชันนี้ใหม่
    return generateReceiptNumber();
  }

  return receiptNumber;
}

// สร้างใบเสร็จอัตโนมัติเมื่อมีการสั่งซื้อ
exports.createReceipt = async (req, res) => {
  try {
    const { orderId, template, companyInfo } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const receiptNumber = await generateReceiptNumber();
    const receiptData = {
      receiptNumber,
      orderId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      companyInfo,
      items: order.items,
      totalAmount: order.totalAmount,
      template,
    };
    // สร้าง QR Code สำหรับตรวจสอบใบเสร็จ
    const qrCodeData = `Receipt:${receiptNumber}`;
    receiptData.qrCode = await QRCode.toDataURL(qrCodeData);

    const receipt = new Receipt(receiptData);
    await receipt.save();
    res.status(201).json(receipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ดาวน์โหลดใบเสร็จเป็น DOCX
exports.downloadReceiptDOCX = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id).lean();

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const templatePath = path.resolve(__dirname, '../templates/receipt-template.docx');
    const content = fs.readFileSync(templatePath);

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    // เตรียมข้อมูลสำหรับตาราง
    const rows = receipt.items.map((item, index) => ({
      no: (index + 1).toString(),
      detail: item.name,
      quantity: `${item.quantity} คอร์ส`,
      unitPrice: formatNumber(item.price),
      amount: formatNumber(item.quantity * item.price)
    }));

    // เตรียมข้อมูลทั้งหมดสำหรับ template
    const data = {
      // ข้อมูลบริษัท
      companyName: receipt.companyInfo?.name || 'YOQA Studio',
      companyAddress: receipt.companyInfo?.address || '',
      companyPhone: receipt.companyInfo?.phone || '',

      // ข้อมูลใบเสร็จ
      receiptNumber: receipt.receiptNumber,
      date: new Date(receipt.createdAt).toLocaleDateString('th-TH'),

      // ข้อมูลลูกค้า
      customerName: receipt.customerName,
      customerAddress: receipt.customerAddress || '',
      customerPhone: receipt.customerPhone || '',

      // ข้อมูลตาราง
      items: rows,

      // ยอดเงิน
      totalAmount: formatNumber(receipt.totalAmount),
      amountInThai: convertToThaiWords(receipt.totalAmount),

      // ราคาเต็ม (ถ้ามี)
      originalPrice: '35,000.00'
    };

    // Render template
    doc.render(data);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${receipt.receiptNumber}.docx`);

    return res.send(buf);

  } catch (err) {
    console.error('Error generating DOCX:', err);
    return res.status(500).json({
      message: "Error generating DOCX file",
      error: err.message
    });
  }
};

// ดาวน์โหลดใบเสร็จเป็น PDF (จาก DOCX template)
exports.downloadReceiptPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id).lean();

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // ตรวจสอบไฟล์ template
    const templatePath = path.resolve(__dirname, '../templates/receipt-template.docx');

    if (!fs.existsSync(templatePath)) {
      console.error('Template file not found at:', templatePath);
      return res.status(500).json({
        message: "Template file missing. Please check server configuration.",
        error: "Template file not found"
      });
    }

    // ตรวจสอบ LibreOffice ก่อนใช้งาน
    try {
      await execAsync('libreoffice --version');
      console.log('LibreOffice is available');
    } catch (libreOfficeError) {
      console.error('LibreOffice not available:', libreOfficeError.message);
      return res.status(500).json({
        message: "PDF conversion not available. LibreOffice is not installed on the server.",
        error: "LibreOffice not available",
        details: "Please contact administrator to install LibreOffice"
      });
    }

    const content = fs.readFileSync(templatePath);

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    // เตรียมข้อมูลสำหรับตาราง (เหมือนกับ DOCX)
    const rows = receipt.items.map((item, index) => ({
      no: (index + 1).toString(),
      detail: item.name,
      quantity: `${item.quantity} คอร์ส`,
      unitPrice: formatNumber(item.price),
      amount: formatNumber(item.quantity * item.price)
    }));

    // เตรียมข้อมูลทั้งหมดสำหรับ template
    const data = {
      // ข้อมูลบริษัท
      companyName: receipt.companyInfo?.name || 'YOQA Studio',
      companyAddress: receipt.companyInfo?.address || '',
      companyPhone: receipt.companyInfo?.phone || '',

      // ข้อมูลใบเสร็จ
      receiptNumber: receipt.receiptNumber,
      date: new Date(receipt.createdAt).toLocaleDateString('th-TH'),

      // ข้อมูลลูกค้า
      customerName: receipt.customerName,
      customerAddress: receipt.customerAddress || '',
      customerPhone: receipt.customerPhone || '',

      // ข้อมูลตาราง
      items: rows,

      // ยอดเงิน
      totalAmount: formatNumber(receipt.totalAmount),
      amountInThai: convertToThaiWords(receipt.totalAmount),

      // ราคาเต็ม (ถ้ามี)
      originalPrice: '35,000.00'
    };

    // Render template
    doc.render(data);

    // สร้างไฟล์ DOCX ใน memory
    let docxBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    // แทนที่ฟอนต์เป็น THSarabunNew
    docxBuffer = replaceFontsInDocx(docxBuffer);

    // สร้างไฟล์ชั่วคราว
    const tempDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempDocxPath = path.join(tempDir, `receipt-${receipt.receiptNumber}-${Date.now()}.docx`);
    const tempPdfPath = path.join(tempDir, `receipt-${receipt.receiptNumber}-${Date.now()}.pdf`);

    // เขียนไฟล์ DOCX ชั่วคราว
    fs.writeFileSync(tempDocxPath, docxBuffer);

    try {
      // แปลง DOCX เป็น PDF ด้วย LibreOffice
      console.log('Converting DOCX to PDF with LibreOffice...');
      const { stdout, stderr } = await execAsync(`libreoffice --headless --convert-to pdf --outdir "${tempDir}" "${tempDocxPath}"`);

      if (stderr) {
        console.log('LibreOffice stderr:', stderr);
      }
      if (stdout) {
        console.log('LibreOffice stdout:', stdout);
      }

      // ตรวจสอบว่าไฟล์ PDF ถูกสร้างขึ้นหรือไม่
      if (!fs.existsSync(tempPdfPath)) {
        throw new Error('PDF file was not generated by LibreOffice');
      }

      // อ่านไฟล์ PDF ที่สร้างขึ้น
      const pdfBuffer = fs.readFileSync(tempPdfPath);
      console.log('PDF generated successfully, size:', pdfBuffer.length);

      // ลบไฟล์ชั่วคราว
      fs.unlinkSync(tempDocxPath);
      fs.unlinkSync(tempPdfPath);

      // ส่ง PDF กลับไป
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${receipt.receiptNumber}.pdf`);
      return res.send(pdfBuffer);

    } catch (conversionError) {
      // ลบไฟล์ชั่วคราวในกรณีที่เกิดข้อผิดพลาด
      if (fs.existsSync(tempDocxPath)) fs.unlinkSync(tempDocxPath);
      if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);

      console.error('Error converting DOCX to PDF:', conversionError);
      return res.status(500).json({
        message: "Error converting to PDF. Please make sure LibreOffice is installed.",
        error: conversionError.message,
        details: "LibreOffice conversion failed"
      });
    }

  } catch (err) {
    console.error('Error generating PDF from template:', err);
    return res.status(500).json({
      message: "Error generating PDF file",
      error: err.message
    });
  }
};




// สร้างใบเสร็จแบบ manual (สำหรับกรณีที่ส่งข้อมูลมาเอง)
exports.createManualReceipt = async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      customerPhone,
      customerAddress,
      companyInfo,
      items,
      totalAmount,
      template,
    } = req.body;

    // Validate required fields
    if (!customerName) {
      return res.status(400).json({ message: "customerName is required" });
    }

    if (!totalAmount) {
      return res.status(400).json({ message: "totalAmount is required" });
    }

    const receiptNumber = await generateReceiptNumber();
    const receiptData = {
      receiptNumber,
      orderId: orderId || null,
      customerName,
      customerPhone: customerPhone || "",
      customerAddress: customerAddress || "",
      companyInfo: companyInfo || {
        name: "YOQA Studio",
        address: "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
        phone: "02-xxx-xxxx",
      },
      items: items || [],
      totalAmount,
      template: template || "default",
    };

    // สร้าง QR Code สำหรับตรวจสอบใบเสร็จ
    const qrCodeData = `Receipt:${receiptNumber}`;
    receiptData.qrCode = await QRCode.toDataURL(qrCodeData);

    const receipt = new Receipt(receiptData);
    await receipt.save();
    res.status(201).json(receipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ค้นหาใบเสร็จด้วยเลขที่ใบเสร็จ
exports.getReceiptByNumber = async (req, res) => {
  try {
    const { number } = req.params;
    const receipt = await Receipt.findOne({ receiptNumber: number });
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ค้นหาใบเสร็จด้วยชื่อลูกค้า
exports.getReceiptsByCustomer = async (req, res) => {
  try {
    const { name } = req.query;
    const receipts = await Receipt.find({
      customerName: { $regex: name, $options: "i" },
    });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ดึงใบเสร็จทั้งหมด
exports.getAllReceipts = async (req, res) => {
  try {
    console.log('📋 Getting all receipts...');

    const receipts = await Receipt.find({})
      .sort({ createdAt: -1 }) // เรียงจากวันที่ล่าสุด
      .exec();

    console.log(`📊 Found ${receipts.length} receipts`);

    res.json(receipts);
  } catch (err) {
    console.error('Error getting all receipts:', err);
    res.status(500).json({ message: err.message });
  }
};

// ค้นหาใบเสร็จด้วยช่วงวันที่
exports.getReceiptsByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);

    console.log('📅 Searching receipts from:', startDate, 'to:', endDate);

    // เพิ่ม sort ที่ database query โดยตรง
    const receipts = await Receipt.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .sort({ createdAt: -1 }) // เรียงจากวันที่ล่าสุด
      .exec();

    console.log(`📊 Found ${receipts.length} receipts in date range`);

    res.json(receipts);
  } catch (err) {
    console.error('Error getting receipts by date range:', err);
    res.status(500).json({ message: err.message });
  }
};



// ฟังก์ชันแปลงตัวเลขเป็นคำอ่านภาษาไทย
function convertToThaiWords(number) {
  const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const tens = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  if (number === 0) return 'ศูนย์';

  let result = '';
  let num = Math.floor(number);

  if (num >= 1000000) {
    result += convertToThaiWords(Math.floor(num / 1000000)) + 'ล้าน';
    num %= 1000000;
  }

  if (num >= 100000) {
    result += convertToThaiWords(Math.floor(num / 100000)) + 'แสน';
    num %= 100000;
  }

  if (num >= 10000) {
    result += convertToThaiWords(Math.floor(num / 10000)) + 'หมื่น';
    num %= 10000;
  }

  if (num >= 1000) {
    result += convertToThaiWords(Math.floor(num / 1000)) + 'พัน';
    num %= 1000;
  }

  if (num >= 100) {
    result += convertToThaiWords(Math.floor(num / 100)) + 'ร้อย';
    num %= 100;
  }

  if (num >= 10) {
    if (num >= 20) {
      result += units[Math.floor(num / 10)] + 'สิบ';
    } else {
      result += 'สิบ';
    }
    num %= 10;
  }

  if (num > 0) {
    result += units[num];
  }

  return result + 'บาทถ้วน';
}

// พิมพ์ใบเสร็จ (ส่งข้อมูลสำหรับพิมพ์)
exports.printReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id);
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });

    // ส่งข้อมูลใบเสร็จสำหรับการพิมพ์
    res.json({
      success: true,
      message: "Receipt data for printing",
      data: {
        receiptNumber: receipt.receiptNumber,
        date: receipt.createdAt,
        customer: {
          name: receipt.customerName,
          phone: receipt.customerPhone,
          address: receipt.customerAddress,
        },
        company: receipt.companyInfo,
        items: receipt.items,
        totalAmount: receipt.totalAmount,
        qrCode: receipt.qrCode,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ดึงใบเสร็จตาม user ID (สำหรับ user ดูใบเสร็จของตัวเอง)
exports.getReceiptsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // ดึงใบเสร็จที่เกี่ยวข้องกับ user นี้
    const receipts = await Receipt.find({
      $or: [
        { 'customerName': { $regex: userId, $options: 'i' } }, // ค้นหาจากชื่อลูกค้า
        { 'orderId': { $exists: true } } // หรือมี orderId (จะต้องเชื่อมโยงกับ order ที่มี user_id)
      ]
    })
      .populate({
        path: 'orderId',
        match: { user_id: userId },
        select: 'user_id order_date status'
      })
      .sort({ createdAt: -1 });

    // กรองเฉพาะใบเสร็จที่เกี่ยวข้องกับ user นี้จริงๆ
    const userReceipts = receipts.filter(receipt =>
      receipt.orderId && receipt.orderId.user_id === userId
    );

    res.json({
      success: true,
      data: userReceipts
    });
  } catch (err) {
    console.error('Error getting receipts by user ID:', err);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลใบเสร็จ",
      error: err.message
    });
  }
};

// ดึงใบเสร็จตาม order ID
exports.getReceiptByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const receipt = await Receipt.findOne({ orderId })
      .populate('orderId', 'user_id order_date status product_id quantity');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบใบเสร็จสำหรับคำสั่งซื้อนี้"
      });
    }

    res.json({
      success: true,
      data: receipt
    });
  } catch (err) {
    console.error('Error getting receipt by order ID:', err);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลใบเสร็จ",
      error: err.message
    });
  }
};