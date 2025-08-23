# Postman API Tests สำหรับระบบบัญชีการเงิน YOQA

## ข้อมูลพื้นฐาน
- Base URL: `http://localhost:3000`
- Header ที่ต้องใช้สำหรับทุก API:
  ```
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
  ```

---

## 1. Income Management APIs (รายรับ)

### 1.1 สร้างรายรับแบบ Manual (POST /api/income/manual)
```json
{
  "amount": 2500,
  "income_type": "package",
  "description": "ขายแพ็คเกจโยคะ 10 ครั้ง",
  "income_date": "2024-12-15",
  "payment_method": "transfer",
  "reference_id": "PKG001",
  "notes": "ลูกค้าโอนเงินผ่านแอพธนาคาร"
}
```

### 1.2 ดึงรายรับทั้งหมด (GET /api/income)
Query Parameters:
- `page=1`
- `limit=10`
- `income_type=package`
- `start_date=2024-12-01`
- `end_date=2024-12-31`

### 1.3 อัพเดทรายรับ (PUT /api/income/:id)
```json
{
  "amount": 3000,
  "description": "ขายแพ็คเกจโยคะ 10 ครั้ง (อัพเดทราคา)",
  "status": "confirmed",
  "notes": "ปรับราคาตามโปรโมชั่น"
}
```

### 1.4 ดึงยอดรวมรายรับตามช่วงเวลา (GET /api/income/total)
Query Parameters:
- `start_date=2024-12-01`
- `end_date=2024-12-31`
- `income_type=package`

### 1.5 ดึงรายรับจัดกลุ่มตามประเภท (GET /api/income/by-type)
Query Parameters:
- `start_date=2024-12-01`
- `end_date=2024-12-31`

### 1.6 ดึงรายรับตามช่วงเวลา (GET /api/income/by-period)
Query Parameters:
- `period_type=monthly` (daily, monthly, yearly)
- `start_date=2024-12-01`
- `end_date=2024-12-31`

---

## 2. Expense Management APIs (รายจ่าย)

### 2.1 สร้างรายจ่าย (POST /api/expenses)
```json
{
  "amount": 1200,
  "category": "equipment",
  "description": "ซื้อเสื่อโยคะใหม่ 5 ผืน",
  "expense_date": "2024-12-15",
  "payment_method": "cash",
  "vendor": "บริษัท โยคะอุปกรณ์ จำกัด",
  "receipt_number": "RCP-001",
  "vat_amount": 84,
  "is_recurring": false,
  "notes": "เสื่อโยคะแบบพรีเมี่ยม"
}
```

### 2.2 สร้างรายจ่ายแบบประจำ (POST /api/expenses)
```json
{
  "amount": 8000,
  "category": "rent",
  "description": "ค่าเช่าสตูดิโอโยคะประจำเดือน",
  "expense_date": "2024-12-01",
  "payment_method": "transfer",
  "vendor": "บริษัท อสังหาริมทรัพย์ ABC",
  "is_recurring": true,
  "recurring_frequency": "monthly",
  "recurring_end_date": "2025-11-30",
  "notes": "ค่าเช่ารายเดือน ชำระวันที่ 1 ของเดือน"
}
```

### 2.3 อัพโหลดใบเสร็จ (POST /api/expenses/:id/receipt)
Content-Type: `multipart/form-data`
```
receipt: [ไฟล์รูปภาพหรือ PDF]
```

### 2.4 อนุมัติรายจ่าย (PUT /api/expenses/:id/approve)
```json
{
  "notes": "อนุมัติแล้ว - รายการซื้ออุปกรณ์จำเป็น"
}
```

### 2.5 ปฏิเสธรายจ่าย (PUT /api/expenses/:id/reject)
```json
{
  "rejection_reason": "ไม่สามารถอนุมัติได้ - งบประมาณเกินกว่าที่กำหนด",
  "notes": "กรุณาปรึกษาผู้จัดการก่อนทำรายการ"
}
```

### 2.6 ดึงรายจ่ายทั้งหมด (GET /api/expenses)
Query Parameters:
- `page=1`
- `limit=10`
- `category=equipment`
- `status=pending`
- `start_date=2024-12-01`
- `end_date=2024-12-31`

### 2.7 ดึงรายจ่ายตามหมวดหมู่ (GET /api/expenses/by-category)
Query Parameters:
- `start_date=2024-12-01`
- `end_date=2024-12-31`

---

## 3. Financial Reports APIs (รายงานการเงิน)

### 3.1 รายงานกำไร-ขาดทุน (GET /api/financial-reports/profit-loss)
Query Parameters:
- `start_date=2024-12-01`
- `end_date=2024-12-31`
- `period_type=monthly`

### 3.2 รายงานกระแสเงินสด (GET /api/financial-reports/cash-flow)
Query Parameters:
- `start_date=2024-12-01`
- `end_date=2024-12-31`
- `period_type=monthly`

### 3.3 สรุปยอดรายเดือน (GET /api/financial-reports/monthly-summary)
Query Parameters:
- `year=2024`

### 3.4 เปรียบเทียบข้อมูลการเงิน (GET /api/financial-reports/comparison)
Query Parameters:
- `current_year=2024`
- `current_month=12`
- `compare_year=2024`
- `compare_month=11`

### 3.5 ส่งออกรายงาน Excel (GET /api/financial-reports/export)
Query Parameters:
- `report_type=profit_loss` (profit_loss, cash_flow, monthly_summary)
- `start_date=2024-12-01`
- `end_date=2024-12-31`
- `year=2024` (สำหรับ monthly_summary)

---

## 4. ตัวอย่างข้อมูลสำหรับทดสอบครบชุด

### 4.1 สร้างรายรับหลายรายการ
```json
[
  {
    "amount": 1500,
    "income_type": "package",
    "description": "แพ็คเกจโยคะ 5 ครั้ง",
    "income_date": "2024-12-01",
    "payment_method": "cash"
  },
  {
    "amount": 500,
    "income_type": "product",
    "description": "ขายเสื่อโยคะ",
    "income_date": "2024-12-05",
    "payment_method": "transfer"
  },
  {
    "amount": 3000,
    "income_type": "package",
    "description": "แพ็คเกจโยคะ 15 ครั้ง",
    "income_date": "2024-12-10",
    "payment_method": "credit_card"
  },
  {
    "amount": 800,
    "income_type": "product",
    "description": "ขายชุดออกกำลังกาย",
    "income_date": "2024-12-15",
    "payment_method": "transfer"
  }
]
```

### 4.2 สร้างรายจ่ายหลายรายการ
```json
[
  {
    "amount": 8000,
    "category": "rent",
    "description": "ค่าเช่าสตูดิโอ",
    "expense_date": "2024-12-01",
    "payment_method": "transfer"
  },
  {
    "amount": 2500,
    "category": "utilities",
    "description": "ค่าไฟฟ้า-น้ำประปา",
    "expense_date": "2024-12-05",
    "payment_method": "cash"
  },
  {
    "amount": 1200,
    "category": "equipment",
    "description": "ซื้อเสื่อโยคะ",
    "expense_date": "2024-12-10",
    "payment_method": "credit_card"
  },
  {
    "amount": 15000,
    "category": "salary",
    "description": "เงินเดือนครูโยคะ",
    "expense_date": "2024-12-25",
    "payment_method": "transfer"
  }
]
```

---

## 5. ขั้นตอนการทดสอบแบบครบวงจร

### ขั้นตอนที่ 1: สร้างข้อมูลพื้นฐาน
1. สร้างรายรับ 4-5 รายการ (ใช้ POST /api/income/manual)
2. สร้างรายจ่าย 4-5 รายการ (ใช้ POST /api/expenses)
3. อัพโหลดใบเสร็จสำหรับรายจ่าย
4. อนุมัติรายจ่าย

### ขั้นตอนที่ 2: ทดสอบการดึงข้อมูล
1. ดึงรายรับทั้งหมด
2. ดึงรายจ่ายทั้งหมด
3. ดึงข้อมูลตามประเภทและหมวดหมู่

### ขั้นตอนที่ 3: ทดสอบรายงาน
1. สร้างรายงานกำไร-ขาดทุน
2. สร้างรายงานกระแสเงินสด
3. สร้างสรุปรายเดือน
4. เปรียบเทียบข้อมูลการเงิน
5. ส่งออกรายงาน Excel

---

## 6. Response Examples (ตัวอย่าง Response)

### สำเร็จ (Success Response):
```json
{
  "success": true,
  "data": {
    // ข้อมูลที่ส่งกลับ
  }
}
```

### ข้อผิดพลาด (Error Response):
```json
{
  "success": false,
  "message": "ข้อความอธิบายข้อผิดพลาด",
  "error": "รายละเอียดข้อผิดพลาด"
}
```

---

## 7. หมายเหตุสำคัญ

1. **Authentication**: ต้องมี JWT Token ที่ถูกต้องในทุก Request
2. **Date Format**: ใช้รูปแบบ YYYY-MM-DD
3. **Amount**: ระบุเป็นตัวเลข (บาท)
4. **File Upload**: ใช้ multipart/form-data สำหรับอัพโหลดไฟล์
5. **Status**: รายรับจะมี status เป็น 'pending' หรือ 'confirmed'
6. **Status**: รายจ่ายจะมี status เป็น 'pending', 'approved', หรือ 'rejected'

---

## 8. Environment Variables สำหรับ Postman

```
base_url: http://localhost:3000
auth_token: YOUR_JWT_TOKEN_HERE
```

สามารถใช้ `{{base_url}}` และ `{{auth_token}}` ใน Postman Collection ได้
