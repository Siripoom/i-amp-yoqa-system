# ใช้ Node.js version 18 เป็น base image
FROM node:20

# ตั้งค่า working directory ภายใน container
WORKDIR /app

# คัดลอก package.json และ package-lock.json เข้าไปใน container
COPY package*.json ./

# ติดตั้ง dependencies
RUN yarn install

# คัดลอกโค้ดทั้งหมดเข้าไปใน container
COPY . .

# เปิด port 5000 (หรือ port ที่ backend ของคุณใช้)
EXPOSE 5000

# รัน server เมื่อ container เริ่มต้น
CMD ["yarn", "start"]
