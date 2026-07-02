FROM node:20

WORKDIR /app

# เปิดใช้งาน Yarn ผ่าน Corepack (อัปเดต corepack ให้รองรับ Yarn 4 และไม่ค้างที่ prompt)
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install -g corepack@latest && corepack enable

# Install system dependencies first
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-liberation \
    fonts-dejavu \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./

# Install Node.js dependencies (Yarn Berry ใช้ --immutable แทน --frozen-lockfile)
RUN yarn install --immutable

# สร้างโฟลเดอร์ tmp สำหรับไฟล์ชั่วคราว
RUN mkdir -p /app/tmp && chmod 777 /app/tmp

# Copy fonts folder and install fonts
COPY fonts/ /app/fonts/
RUN mkdir -p /usr/share/fonts/truetype/thsarabun && \
    cp /app/fonts/*.ttf /usr/share/fonts/truetype/thsarabun/ && \
    fc-cache -fv

# Copy the rest of the application
COPY . ./

EXPOSE 5000

CMD ["yarn", "start"]
