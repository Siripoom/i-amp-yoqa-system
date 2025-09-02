FROM node:20

WORKDIR /app

# สำหรับกรณีที่ build context อยู่ที่ root
COPY back-end/package*.json ./

RUN yarn install

# ติดตั้ง LibreOffice และ dependencies ที่จำเป็น
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-thai \
    && rm -rf /var/lib/apt/lists/*

# สร้างโฟลเดอร์ tmp สำหรับไฟล์ชั่วคราว
RUN mkdir -p /app/tmp && chmod 777 /app/tmp

COPY back-end/ ./

EXPOSE 5000
CMD ["yarn", "start"]