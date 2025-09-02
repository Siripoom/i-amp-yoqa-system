#!/bin/bash

echo "Installing fonts for receipt generation..."

# ตรวจสอบระบบปฏิบัติการ
if [ -f /etc/debian_version ]; then
    echo "Debian/Ubuntu system detected"
    
    # ติดตั้งฟอนต์ที่ใช้ได้ใน Debian
    apt-get update
    apt-get install -y fonts-liberation fonts-dejavu
    
    # ลองติดตั้งฟอนต์ไทย (ถ้ามี)
    if apt-get install -y fonts-thai 2>/dev/null; then
        echo "Thai fonts installed successfully"
    else
        echo "Thai fonts not available, using Liberation Sans as fallback"
    fi
    
elif [ -f /etc/redhat-release ]; then
    echo "RedHat/CentOS system detected"
    yum install -y liberation-fonts dejavu-fonts
    
    # ลองติดตั้งฟอนต์ไทย (ถ้ามี)
    if yum install -y thai-fonts 2>/dev/null; then
        echo "Thai fonts installed successfully"
    else
        echo "Thai fonts not available, using Liberation Sans as fallback"
    fi
else
    echo "Unknown system, using default fonts"
fi

echo "Font installation completed"
