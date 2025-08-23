const Receipt = require("../models/receipt");
const Order = require("../models/order");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");

// สร้างเลขรันนิ่งใบเสร็จ (ตัวอย่าง: R20250821-0001)
async function generateReceiptNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await Receipt.countDocuments({
    createdAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lte: new Date(today.setHours(23, 59, 59, 999)),
    },
  });
  return `R${dateStr}-${String(count + 1).padStart(4, "0")}`;
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
    const receipts = await Receipt.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });
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
    const doc = new PDFDocument();

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${receipt.receiptNumber}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // เพิ่มเนื้อหาใบเสร็จใน PDF
    doc.fontSize(20).text("ใบเสร็จรับเงิน", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`เลขที่ใบเสร็จ: ${receipt.receiptNumber}`);
    doc.text(`วันที่: ${receipt.createdAt.toLocaleDateString("th-TH")}`);
    doc.moveDown();

    // ข้อมูลลูกค้า
    doc.text("ข้อมูลลูกค้า:");
    doc.text(`ชื่อ: ${receipt.customerName}`);
    if (receipt.customerPhone) doc.text(`เบอร์โทร: ${receipt.customerPhone}`);
    if (receipt.customerAddress)
      doc.text(`ที่อยู่: ${receipt.customerAddress}`);
    doc.moveDown();

    // ข้อมูลบริษัท (ถ้ามี)
    if (receipt.companyInfo) {
      doc.text("ข้อมูลบริษัท:");
      doc.text(`ชื่อบริษัท: ${receipt.companyInfo.name}`);
      doc.text(`ที่อยู่: ${receipt.companyInfo.address}`);
      doc.text(`เบอร์โทร: ${receipt.companyInfo.phone}`);
      doc.moveDown();
    }

    // รายการสินค้า
    doc.text("รายการสินค้า:");
    doc.text("─".repeat(50));

    let totalAmount = 0;
    receipt.items.forEach((item, index) => {
      const lineTotal = item.quantity * item.price;
      totalAmount += lineTotal;
      doc.text(`${index + 1}. ${item.name}`);
      doc.text(
        `   จำนวน: ${
          item.quantity
        } ราคา: ${item.price.toLocaleString()} รวม: ${lineTotal.toLocaleString()}`
      );
    });

    doc.text("─".repeat(50));
    doc
      .fontSize(14)
      .text(`ยอดรวมทั้งสิ้น: ${receipt.totalAmount.toLocaleString()} บาท`, {
        align: "right",
      });

    // จบการสร้าง PDF
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
