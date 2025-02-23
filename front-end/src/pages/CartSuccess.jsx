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
        {/* Success Message */}
        <div className="bg-white p-6 rounded-md shadow-md max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been placed and is being
            processed. We will notify you once the payment has been confirmed.
          </p>
          <p className="text-gray-600 mb-6">
            If you have any questions, feel free to contact our support team.
          </p>
          <div className="flex justify-center">
            <Button
              type="primary"
              size="large"
              className="bg-pink-400 text-white px-6 rounded-2xl"
              onClick={() => (window.location.href = "/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartSuccess;
