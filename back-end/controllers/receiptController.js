const Receipt = require("../models/receipt");
const Order = require("../models/order");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
// สำหรับการสร้าง DOCX จาก template
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { formatNumber } = require('../utils/formatters');

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

// back-end/controllers/receiptController.js
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

// ค้นหาใบเสร็จด้วยช่วงวันที่
exports.getReceiptsByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);

    // เพิ่ม sort ที่ database query โดยตรง
    const receipts = await Receipt.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .sort({ createdAt: -1 }) // เรียงจากวันที่ล่าสุด
      .exec();

    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ดาวน์โหลดใบเสร็จเป็น PDF
exports.downloadReceiptPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id);
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });

    // สร้าง PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30
      }
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${receipt.receiptNumber}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // ใช้ font THSarabun สำหรับภาษาไทย
    doc.registerFont('THSarabun', path.join(__dirname, '../fonts/THSarabunNew.ttf'));
    doc.registerFont('THSarabunBold', path.join(__dirname, '../fonts/THSarabunNew Bold.ttf'));
    doc.font('THSarabun');

    // กำหนดสี
    const primaryColor = '#E91E63'; // สีชมพูเข้มตามรูป
    const secondaryColor = '#333333'; // สีเทาเข้ม
    const lightPink = '#FCE4EC'; // สีชมพูอ่อนสำหรับพื้นหลัง

    // เพิ่มโลโก้ (ด้านซ้ายบน)
    try {
      const logoPath = path.join(__dirname, '../../front-end/src/assets/images/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 30, 30, { width: 60, height: 60 });
      }
    } catch (logoError) {
      console.error('Error loading logo:', logoError);
    }

    // Header - "ใบเสร็จรับเงิน" ด้านขวาบน
    doc.fillColor(primaryColor);
    doc.font('THSarabunBold').fontSize(24).text("ใบเสร็จรับเงิน", 420, 40);
    doc.fontSize(14).text("ต้นฉบับ", 480, 65);

    // ข้อมูลด้านขวาบน
    doc.fillColor(secondaryColor);
    doc.font('THSarabun').fontSize(12);
    doc.text("เลขที่", 420, 90);
    doc.text("วันที่ขาย", 420, 105);
    doc.text("ผู้ขาย", 420, 120);
    doc.text("ผู้ติดต่อ", 420, 135);
    doc.text("เบอร์โทร", 420, 150);
    doc.text("อีเมล", 420, 165);

    // ค่าข้อมูลด้านขวา
    doc.text(receipt.receiptNumber, 480, 90);
    doc.text(receipt.createdAt.toLocaleDateString("th-TH"), 480, 105);
    doc.text("ชำระเงินตามเงื่อนไข", 480, 120);
    doc.text("095-5674305", 480, 135);
    doc.text("skameing@gmail.com", 480, 150);

    // ข้อมูลบริษัทด้านซ้าย
    doc.font('THSarabunBold').fontSize(16).text("ไอแอมป์โยคะ", 30, 100);
    doc.font('THSarabun').fontSize(11);
    doc.text("88/139 หมู่บ้านเดอะธารา ซ.8 ถ.พระยาสุเรนทร์ 35 แขวงบางชัน เขตคลองสามวา กรุงเทพมหานคร", 30, 118);
    doc.text("ต.บางชัน อ.คลองสามวา จ.กรุงเทพมหานคร 10510", 30, 133);
    doc.text("เลขประจำตัวผู้เสียภาษี 1710500222241", 30, 148);
    doc.text("โทร. 0991636169", 30, 163);
    doc.text("เบอร์มือถือ 0991636169", 30, 178);
    doc.fillColor(primaryColor);
    doc.text("www.iamyqoa.com", 30, 193);

    // กรอบข้อมูลลูกค้า
    const customerBoxY = 230;
    doc.strokeColor(secondaryColor);
    doc.rect(30, customerBoxY, 535, 70).stroke();

    doc.fillColor(secondaryColor);
    doc.font('THSarabunBold').fontSize(12).text("ลูกค้า", 40, customerBoxY + 10);
    doc.font('THSarabun').fontSize(11);
    doc.text(`คุณ${receipt.customerName} (${receipt.customerName})`, 40, customerBoxY + 28);
    if (receipt.customerAddress) {
      doc.text(`ที่อยู่ ${receipt.customerAddress} เก้า 10250`, 40, customerBoxY + 43);
    }
    doc.text(`เลขประจำตัวผู้เสียภาษี 1234567890123451`, 40, customerBoxY + 58);

    // ตารางสินค้า/บริการ
    const tableStartY = customerBoxY + 90;
    const tableWidth = 535;
    const colWidths = [40, 280, 60, 55, 100]; // ความกว้างแต่ละคอลัมน์
    let currentX = 30;

    // สร้างตาราง header สีชมพู
    doc.fillColor(primaryColor);
    doc.rect(30, tableStartY, tableWidth, 25).fill();

    // หัวตาราง
    doc.fillColor('#FFFFFF');
    doc.font('THSarabunBold').fontSize(11);
    doc.text("ลำดับ", 35, tableStartY + 8);
    doc.text("รายละเอียด", 85, tableStartY + 8);
    doc.text("จำนวน", 355, tableStartY + 8);
    doc.text("ราคา", 420, tableStartY + 8);
    doc.text("จำนวนเงิน", 490, tableStartY + 8);

    // แถวข้อมูล
    let currentY = tableStartY + 25;
    doc.fillColor(secondaryColor);
    doc.font('THSarabun').fontSize(10);

    receipt.items.forEach((item, index) => {
      const lineTotal = item.quantity * item.price;

      // เส้นขอบแถว
      doc.strokeColor(secondaryColor);
      doc.rect(30, currentY, tableWidth, 20).stroke();

      doc.text(`${index + 1}`, 40, currentY + 6);
      doc.text(item.name, 85, currentY + 6);
      doc.text(`${item.quantity} คอร์ส`, 355, currentY + 6);
      doc.text(`${item.price.toFixed(2)}`, 420, currentY + 6);
      doc.text(`${lineTotal.toFixed(2)}`, 490, currentY + 6);

      currentY += 20;
    });

    // เติมแถวว่างให้ครบ 5 แถว
    const maxRows = 5;
    for (let i = receipt.items.length; i < maxRows; i++) {
      doc.rect(30, currentY, tableWidth, 20).stroke();
      currentY += 20;
    }

    // แถว "รวมเงิน"
    doc.rect(30, currentY, tableWidth, 25).stroke();
    doc.fillColor(secondaryColor);
    doc.font('THSarabunBold').fontSize(11);
    doc.text("รวมเงิน", 420, currentY + 8);
    doc.text(`${receipt.totalAmount.toFixed(2)} บาท`, 490, currentY + 8);

    // แถว "จำนวนเงินรวมทั้งสิ้น" สีชมพู
    currentY += 25;
    doc.fillColor(primaryColor);
    doc.rect(30, currentY, tableWidth, 25).fill();
    doc.fillColor('#FFFFFF');
    doc.font('THSarabunBold').fontSize(12);
    doc.text("จำนวนเงินรวมทั้งสิ้น", 355, currentY + 8);
    doc.text(`${receipt.totalAmount.toFixed(2)} บาท`, 490, currentY + 8);

    // จำนวนเงินเป็นตัวอักษร
    currentY += 35;
    doc.fillColor(secondaryColor);
    doc.font('THSarabun').fontSize(10);
    const amountInWords = convertToThaiWords(receipt.totalAmount);
    doc.text(`(${amountInWords})`, 30, currentY);

    // การชำระเงิน
    currentY += 25;
    doc.font('THSarabun').fontSize(10);
    doc.text("การชำระเงินจะสมบูรณ์เมื่อบริษัทได้รับเงินเรียบร้อยแล้ว  เงินสด / เช็ค /  โอนเงิน / ธนาคาร กสิกรไทย ออมทรัพย์", 30, currentY);

    currentY += 15;
    doc.text("ชำระ", 30, currentY);
    doc.text("เลขที่ 1808207008", 100, currentY);
    doc.text(`วันที่ ${receipt.createdAt.toLocaleDateString("th-TH")}`, 250, currentY);
    doc.text(`จำนวนเงิน ${receipt.totalAmount.toLocaleString()}`, 380, currentY);

    currentY += 15;
    doc.text(`ในนาม คุณ${receipt.customerName}`, 30, currentY);

    // ลายเซ็นและโลโก้
    const signatureY = currentY + 50;

    // ลายเซ็นผู้จ่ายเงิน (ซ้าย)
    doc.font('THSarabunBold').fontSize(10);
    doc.text(`ในนาม คุณ${receipt.customerName}`, 30, signatureY);
    doc.font('THSarabun').fontSize(10);
    doc.text("ผู้จ่ายเงิน", 30, signatureY + 35);
    doc.text("วันที่", 30, signatureY + 55);
    // เส้นสำหรับลายเซ็น
    doc.strokeColor(secondaryColor);
    doc.moveTo(30, signatureY + 45).lineTo(150, signatureY + 45).stroke();
    doc.moveTo(30, signatureY + 65).lineTo(150, signatureY + 65).stroke();

    // โลโก้และข้อความตรงกลาง
    try {
      const logoPath = path.join(__dirname, '../../front-end/src/assets/images/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 260, signatureY - 10, { width: 80, height: 80 });
      }
    } catch (logoError) {
      console.error('Error loading logo:', logoError);
    }
    // ลายเซ็นผู้รับเงิน (ขวา)
    doc.fillColor(secondaryColor);
    doc.font('THSarabunBold').fontSize(10);
    doc.text("ในนาม ไอแอมป์โยคะ", 420, signatureY);
    doc.font('THSarabun').fontSize(10);
    doc.text("ผู้รับเงิน", 420, signatureY + 35);
    doc.text(`วันที่ ${receipt.createdAt.toLocaleDateString("th-TH")}`, 420, signatureY + 55);
    // เส้นสำหรับลายเซ็น
    doc.moveTo(420, signatureY + 45).lineTo(540, signatureY + 45).stroke();

    // จบการสร้าง PDF
    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
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