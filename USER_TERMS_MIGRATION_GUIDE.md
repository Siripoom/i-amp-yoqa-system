# ตัวอย่างข้อมูล UserTerms Collection

## โครงสร้างข้อมูลใหม่:
```javascript
{
  "_id": ObjectId("..."),
  "fullName": "สมชาย ใจดี",
  "privacyConsents": {
    "registration": true,      // จำเป็น - การลงทะเบียนและยืนยันตัวบุคคล
    "monitoring": true,        // จำเป็น - การติดตามและประเมินผล
    "planning": true,          // จำเป็น - การวางแผนการจัดการเรียนการสอน
    "communication": true,     // จำเป็น - การติดต่อสื่อสารและแจ้งข่าวสาร
    "publicity": false         // ไม่บังคับ - การประชาสัมพันธ์และใช้ภาพในการเผยแพร่
  },
  "termsAccepted": true,
  "acceptedAt": ISODate("2025-09-19T10:30:00.000Z"),
  "createdAt": ISODate("2025-09-19T10:30:00.000Z"),
  "updatedAt": ISODate("2025-09-19T10:30:00.000Z")
}
```

## ตัวอย่างข้อมูลหลายแบบ:

### 1. ผู้ใช้ที่ยอมรับทุกข้อ (เหมาะสำหรับการประชาสัมพันธ์):
```javascript
{
  "fullName": "สุดา สวยงาม",
  "privacyConsents": {
    "registration": true,
    "monitoring": true,
    "planning": true,
    "communication": true,
    "publicity": true        // ✅ ยินยอมให้ใช้ภาพในการประชาสัมพันธ์
  },
  "termsAccepted": true,
  "acceptedAt": ISODate("2025-09-19T09:15:00.000Z")
}
```

### 2. ผู้ใช้ที่ยอมรับเฉพาะข้อจำเป็น:
```javascript
{
  "fullName": "มานะ รักเรียน",
  "privacyConsents": {
    "registration": true,
    "monitoring": true,
    "planning": true,
    "communication": true,
    "publicity": false       // ❌ ไม่ยินยอมให้ใช้ภาพในการประชาสัมพันธ์
  },
  "termsAccepted": true,
  "acceptedAt": ISODate("2025-09-19T14:45:00.000Z")
}
```

### 3. ข้อมูลที่ไม่ครบถ้วน (จะไม่ผ่าน validation):
```javascript
{
  "fullName": "ทดสอบ ไม่ครบ",
  "privacyConsents": {
    "registration": true,
    "monitoring": false,     // ❌ ข้อจำเป็นแต่ไม่ยินยอม
    "planning": true,
    "communication": true,
    "publicity": false
  },
  "termsAccepted": false,    // ❌ ไม่ยอมรับข้อกำหนด
  "acceptedAt": null
}
```

## Script สำหรับ Migrate ข้อมูลเดิม:

### MongoDB Migration Script:
```javascript
// migrate-userterms.js

// ใช้ในกรณีที่มีข้อมูลเดิมที่ใช้โครงสร้าง { accepted: Boolean }
// และต้องการ migrate เป็นโครงสร้างใหม่

db.userterms.find({ accepted: { $exists: true } }).forEach(function(doc) {
    // อัปเดตเฉพาะเอกสารที่มี field เก่า
    db.userterms.updateOne(
        { _id: doc._id },
        {
            $set: {
                privacyConsents: {
                    registration: doc.accepted || false,
                    monitoring: doc.accepted || false,
                    planning: doc.accepted || false,
                    communication: doc.accepted || false,
                    publicity: doc.accepted || false
                },
                termsAccepted: doc.accepted || false
            },
            $unset: {
                accepted: ""  // ลบ field เก่า
            }
        }
    );
});

print("Migration completed!");
```

### Node.js Migration Script:
```javascript
// migrate-userterms-node.js

const mongoose = require('mongoose');
const UserTerms = require('./models/userTerms');

async function migrateUserTerms() {
    try {
        // หาข้อมูลที่ยังใช้โครงสร้างเก่า
        const oldDocs = await UserTerms.find({ 
            accepted: { $exists: true },
            privacyConsents: { $exists: false }
        });

        for (const doc of oldDocs) {
            const acceptedValue = doc.accepted || false;
            
            await UserTerms.updateOne(
                { _id: doc._id },
                {
                    $set: {
                        privacyConsents: {
                            registration: acceptedValue,
                            monitoring: acceptedValue,
                            planning: acceptedValue,
                            communication: acceptedValue,
                            publicity: acceptedValue
                        },
                        termsAccepted: acceptedValue
                    },
                    $unset: {
                        accepted: ""
                    }
                }
            );
        }

        console.log(`Migrated ${oldDocs.length} documents`);
    } catch (error) {
        console.error('Migration error:', error);
    }
}

migrateUserTerms();
```

## การใช้งานใน Application:

### 1. สร้างข้อมูลใหม่:
```javascript
const newUserTerms = new UserTerms({
    fullName: "ทดสอบ ระบบใหม่",
    privacyConsents: {
        registration: true,
        monitoring: true,
        planning: true,
        communication: true,
        publicity: false
    },
    termsAccepted: true,
    acceptedAt: new Date()
});

await newUserTerms.save();
```

### 2. Query ข้อมูล:
```javascript
// หาผู้ที่ยินยอมให้ประชาสัมพันธ์
const publicityConsented = await UserTerms.find({
    "privacyConsents.publicity": true
});

// หาผู้ที่ยอมรับข้อกำหนดแล้ว
const termsAccepted = await UserTerms.find({
    "termsAccepted": true
});

// หาผู้ที่ยินยอมครบทุกข้อจำเป็น
const fullConsented = await UserTerms.find({
    "privacyConsents.registration": true,
    "privacyConsents.monitoring": true,
    "privacyConsents.planning": true,
    "privacyConsents.communication": true
});
```

### 3. อัปเดตข้อมูล:
```javascript
// เปลี่ยนการยินยอมการประชาสัมพันธ์
await UserTerms.updateOne(
    { fullName: "สมชาย ใจดี" },
    { 
        $set: { 
            "privacyConsents.publicity": false,
            updatedAt: new Date()
        }
    }
);
```

## ข้อควรระวัง:
1. **ข้อยินยอมที่จำเป็น** (registration, monitoring, planning, communication) ต้องเป็น `true` ทั้งหมด
2. **publicity** เป็นข้อไม่บังคับ สามารถเป็น `false` ได้
3. **termsAccepted** ต้องเป็น `true` เสมอ
4. ใช้ `acceptedAt` เพื่อบันทึกวันที่ยอมรับ
5. `timestamps: true` จะเพิ่ม `createdAt` และ `updatedAt` อัตโนมัติ