import React from "react";
import { Button } from "antd";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const CartSuccess = () => {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      <Navbar />
      <div className="container mx-auto py-12 px-6 text-center">
        {/* ข้อความสำเร็จ */}
        <div className="bg-white p-6 rounded-md shadow-md max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            สั่งซื้อสำเร็จแล้ว!
          </h1>
          <p className="text-gray-600 mb-6">
            ขอบคุณสำหรับการสั่งซื้อของคุณ.
            การสั่งซื้อของคุณได้รับการดำเนินการแล้ว
            และกำลังอยู่ในระหว่างการตรวจสอบการชำระเงิน.
            เราจะแจ้งให้คุณทราบเมื่อการชำระเงินได้รับการยืนยัน.
          </p>
          <p className="text-gray-600 mb-6">
            กรุณาใช้โปรโมชั่น เข้าเรียนครั้งแรกภายใน 90 วัน
            หลังจากใช้งานครั้งแรกโปรโมชันจะหมดอายุตามระยะเวลาของโปรโมชั่นที่ท่านซื้อ
            หากคุณมีคำถามใด ๆ กรุณาติดต่อทีมสนับสนุนของเรา.
          </p>
          <div className="flex justify-center">
            <Button
              type="primary"
              size="large"
              className="bg-pink-400 text-white px-6 rounded-2xl"
              onClick={() => (window.location.href = "/")}
            >
              กลับสู่หน้าแรก
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CartSuccess;
