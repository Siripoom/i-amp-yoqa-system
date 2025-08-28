#!/bin/bash

# สร้างโฟลเดอร์สำหรับฟอนต์ระบบ
sudo mkdir -p /usr/share/fonts/truetype/thsarabun

# คัดลอกฟอนต์ไปยังโฟลเดอร์ระบบ
sudo cp /opt/i-amp-yoqa-system/back-end/fonts/*.ttf /usr/share/fonts/truetype/thsarabun/

# อัปเดต font cache
sudo fc-cache -fv

# ตรวจสอบว่าฟอนต์ติดตั้งสำเร็จ
fc-list | grep -i sarabun

echo "THSarabun fonts have been installed successfully!"
