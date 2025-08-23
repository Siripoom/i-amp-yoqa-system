# YOQA Financial System API Testing Guide

## การใช้งาน Postman Collection

### 1. Import Collection
1. เปิด Postman
2. คลิก "Import" 
3. เลือกไฟล์ `YOQA_Financial_API_Collection.json`

### 2. ตั้งค่า Environment Variables
```
base_url = http://localhost:3000/api
auth_token = your_jwt_token_here
```

## API Endpoints และ Body Examples

### 🟢 Income Management APIs

#### 1. สร้างรายรับแบบ Manual (F001-F002)
**POST** `/api/income/manual`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

**Body (JSON):**
```json
{
  "amount": 5000,
  "description": "รายรับจากการสอนพิเศษ",
  "income_type": "manual",
  "income_date": "2024-08-08",
  "payment_method": "cash",
  "reference_number": "MANUAL001",
  "notes": "รายรับเพิ่มเติมจากการสอนพิเศษ",
  "category": "teaching"
}
```

**ตัวอย่างอื่นๆ:**
```json
{
  "amount": 3500,
  "description": "รายรับจากการขายของที่ระลึก",
  "income_type": "goods",
  "income_date": "2024-08-08",
  "payment_method": "transfer",
  "reference_number": "GOODS001",
  "notes": "ขายเสื้อยืดและเสื่อโยคะ",
  "category": "merchandise"
}
```

#### 5. ดูรายการรายรับทั้งหมด (แก้ไขใหม่)
**GET** `/api/income`

**Query Parameters (ทั้งหมด optional):**
```
page=1
limit=10
start_date=2024-01-01     # Optional - ถ้าไม่ส่งจะแสดงทั้งหมด
end_date=2024-12-31       # Optional - ถ้าไม่ส่งจะแสดงทั้งหมด
income_type=manual        # Optional
status=confirmed          # Optional
search=สอน               # Optional - ค้นหาใน description, notes, reference_number
```

**ตัวอย่างการใช้งาน:**
```
# ดูทั้งหมดโดยไม่กรอง (จากล่าสุดไปเก่าสุด)
GET /api/income

# ดูเฉพาะช่วงวันที่
GET /api/income?start_date=2024-08-01&end_date=2024-08-31

# ดูเฉพาะตั้งแต่วันที่ไปถึงปัจจุบัน
GET /api/income?start_date=2024-08-01

# ดูรายรับประเภท manual พร้อมค้นหา
GET /api/income?income_type=manual&search=สอน
```

**Response เมื่อไม่มีการกรองวันที่ (จะมี summary เพิ่ม):**
```json
{
  "success": true,
  "data": {
    "incomes": [...],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_records": 50,
      "per_page": 10
    },
    "summary": {
      "total_amount": 150000,
      "total_transactions": 50,
      "latest_date": "2024-08-08T00:00:00.000Z",
      "earliest_date": "2024-01-01T00:00:00.000Z",
      "formatted_total": "฿150,000.00"
    },
    "filters": {
      "start_date": null,
      "end_date": null,
      "income_type": null,
      "status": null,
      "search": null
    }
  }
}
```

#### 3. จัดกลุ่มรายรับตามประเภท (F004)
**GET** `/api/income/by-type?start_date=2024-01-01&end_date=2024-12-31`

#### 4. รายรับตามช่วงเวลา (F005)
**GET** `/api/income/by-period?period_type=daily&year=2024&month=8`

### 🔴 Expense Management APIs

#### 1. สร้างรายจ่าย (F006-F010)
**POST** `/api/expenses`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {{auth_token}}
```

**Body (Form Data):**
```
amount: 2500
description: ค่าไฟฟ้าประจำเดือน
category: utilities
expense_date: 2024-08-08
payment_method: transfer
reference_number: ELEC001
vendor_name: การไฟฟ้านครหลวง
notes: ค่าไฟฟ้าเดือนสิงหาคม 2024
receipt: [ไฟล์รูปภาพ/PDF]
```

**ตัวอย่าง Body แบบ JSON (ไม่มีไฟล์แนบ):**
```json
{
  "amount": 15000,
  "description": "ค่าเช่าสถานที่ประจำเดือน",
  "category": "rent",
  "expense_date": "2024-08-01",
  "payment_method": "transfer",
  "reference_number": "RENT001",
  "vendor_name": "บริษัท ABC จำกัด",
  "notes": "ค่าเช่าเดือนสิงหาคม 2024"
}
```

#### 2. อนุมัติรายจ่าย
**PUT** `/api/expenses/{expense_id}/approve`

**Body:**
```json
{
  "approval_notes": "อนุมัติการจ่ายค่าไฟฟ้า"
}
```

#### 3. ปฏิเสธรายจ่าย
**PUT** `/api/expenses/{expense_id}/reject`

**Body:**
```json
{
  "approval_notes": "ไม่อนุมัติ - ใบเสร็จไม่ชัดเจน กรุณาส่งใบเสร็จใหม่"
}
```

### 📊 Financial Reports APIs

#### 1. รายงานกำไร-ขาดทุน (F011)
**GET** `/api/financial-reports/profit-loss?start_date=2024-01-01&end_date=2024-12-31&period_type=monthly`

#### 2. รายงานกระแสเงินสด (F012)
**GET** `/api/financial-reports/cash-flow?start_date=2024-01-01&end_date=2024-12-31&period_type=monthly`

#### 3. สรุปรายเดือน (F013)
**GET** `/api/financial-reports/monthly-summary?year=2024&month=8`

#### 4. เปรียบเทียบช่วงเวลา (F014)
**GET** `/api/financial-reports/compare-periods?period1_start=2024-01-01&period1_end=2024-06-30&period2_start=2024-07-01&period2_end=2024-12-31`

#### 5. Export Excel (F015)
**GET** `/api/financial-reports/export-excel?report_type=profit_loss&start_date=2024-01-01&end_date=2024-12-31`

## ตัวอย่างข้อมูลทดสอบ

### Income Types
- `package` - รายรับจากแพ็คเกจ
- `goods` - รายรับจากสินค้า  
- `manual` - รายรับแบบ manual

### Expense Categories
- `utilities` - ค่าสาธารณูปโภค
- `rent` - ค่าเช่า
- `equipment` - ค่าอุปกรณ์
- `marketing` - ค่าการตลาด
- `salary` - เงินเดือน
- `maintenance` - ค่าบำรุงรักษา
- `insurance` - ค่าประกัน
- `office_supplies` - เครื่องเขียน
- `professional_services` - ค่าบริการวิชาชีพ
- `other` - อื่นๆ

### Payment Methods
- `cash` - เงินสด
- `transfer` - โอนเงิน
- `credit_card` - บัตรเครดิต
- `debit_card` - บัตรเดบิต
- `cheque` - เช็ค

### Status Values
- `pending` - รอการอนุมัติ
- `approved` - อนุมัติแล้ว
- `rejected` - ปฏิเสธ
- `confirmed` - ยืนยันแล้ว

## การใช้งาน Authentication

1. ต้องมี JWT Token จากการ login
2. ส่ง Token ใน Header: `Authorization: Bearer {token}`
3. หากไม่มี Token บาง API อาจทำงานได้แต่ `created_by` จะเป็น null

## Tips การทดสอบ

1. **ทดสอบ Income Management ก่อน** - เริ่มจากสร้างรายรับ manual
2. **ทดสอบ Expense Management** - สร้างรายจ่ายและทดสอบ approval workflow
3. **ทดสอบ Reports** - หลังจากมีข้อมูลแล้วค่อยทดสอบรายงาน
4. **ทดสอบ Excel Export** - ทดสอบการดาวน์โหลดไฟล์

## Troubleshooting

### ❌ Error: "Cannot read properties of undefined (reading 'id')"
**สาเหตุ:** ไม่มี JWT Token หรือ Token ไม่ถูกต้อง
**วิธีแก้:** ตรวจสอบ Authorization Header หรือ login ใหม่

### ❌ Error: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด"
**สาเหตุ:** ไม่ได้ส่ง query parameters
**วิธีแก้:** ตรวจสอบ URL parameters

### ❌ Error: File upload issues
**สาเหตุ:** Content-Type ไม่ถูกต้อง
**วิธีแก้:** ใช้ `multipart/form-data` สำหรับการอัพโหลดไฟล์
