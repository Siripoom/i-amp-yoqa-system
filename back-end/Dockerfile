FROM node:20-slim

WORKDIR /app

# Install system dependencies first
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-liberation \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY back-end/package*.json ./

# Install Node.js dependencies
RUN yarn install

# สร้างโฟลเดอร์ tmp สำหรับไฟล์ชั่วคราว
RUN mkdir -p /app/tmp && chmod 777 /app/tmp

# Copy the rest of the application
COPY back-end/ ./

EXPOSE 5000

CMD ["yarn", "start"]