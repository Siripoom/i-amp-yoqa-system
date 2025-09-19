# User Terms Fix Guide

## ปัญหาที่แก้ไข:
- หลังจาก SignUp ไปที่หน้า Terms แล้วได้ 401 error เพราะไม่มี token

## การแก้ไขที่ทำ:

### 1. แก้ไข SignUp.jsx
```javascript
// เพิ่มการเก็บ token หลัง register
if (response.token) {
  localStorage.setItem("token", response.token);
  localStorage.setItem("user_id", response.user.user_id || response.user._id);
  localStorage.setItem("role", response.user.role_id || "Member");
  localStorage.setItem("username", `${response.user.first_name} ${response.user.last_name}`);
  console.log("Token saved after registration:", response.token);
}
```

### 2. เพิ่ม Debug Logs
- เพิ่ม logs ใน UserTermsForm.jsx
- เพิ่ม logs ใน userTermService.js
- เพิ่ม logs ใน auth middleware

### 3. ตรวจสอบ API Routes
```javascript
// userTermsRoutes.js
router.post("/user-terms", authenticate, createUserTerms);
```

## การทดสอบ:

### 1. ตรวจสอบ Token หลัง SignUp:
```javascript
// เปิด Browser Developer Tools > Console
localStorage.getItem("token")
// ควรแสดง JWT token
```

### 2. ตรวจสอบ API Call:
```javascript
// Network tab ใน Developer Tools
// ดู request ไปที่ /api/user-terms
// Header ควรมี Authorization: Bearer <token>
```

### 3. ตรวจสอบ Backend Logs:
```bash
# Backend console ควรแสดง:
🔑 Debug authenticate middleware:
  - Authorization header: Bearer <token>
✅ Token verified successfully:
  - Decoded user ID: <userId>
```

## ข้อมูลที่ส่งไป API:
```javascript
{
  "fullName": "ชื่อ นามสกุล",
  "privacyConsents": {
    "registration": true,
    "monitoring": true,
    "planning": true,
    "communication": true,
    "publicity": false // หรือ true
  },
  "termsAccepted": true
}
```

## Response ที่คาดหวัง:
```javascript
{
  "status": "success",
  "message": "User terms created successfully",
  "data": {
    "_id": "...",
    "fullName": "ชื่อ นามสกุล",
    "privacyConsents": { ... },
    "termsAccepted": true,
    "acceptedAt": "2025-09-19T...",
    "createdAt": "2025-09-19T...",
    "updatedAt": "2025-09-19T..."
  }
}
```

## หากยังมีปัญหา:

### 1. ตรวจสอบ JWT Secret:
```bash
# ใน .env file
JWT_SECRET=your_secret_key_here
```

### 2. ตรวจสอบ Token Expiry:
```javascript
// JWT tokens อาจหมดอายุ (default: 1 hour)
// ลอง SignUp ใหม่และไปที่ Terms ทันที
```

### 3. ตรวจสอบ Database Connection:
```bash
# MongoDB ต้องเชื่อมต่อได้
# User collection ต้องมี document ที่ match กับ userId ใน token
```

### 4. Clear Storage และทดสอบใหม่:
```javascript
// Clear localStorage
localStorage.clear()
// หรือเฉพาะ token
localStorage.removeItem("token")
```