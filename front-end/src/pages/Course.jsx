import { Card, Badge, Button, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { getProducts } from "../services/productService";
import image from "../assets/images/imageC1.png";

const Course = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      if (response.status === "success") {
        setProducts(response.data);
      } else {
        message.error("Failed to load products");
      }
    } catch (error) {
      message.error("Failed to load products");
    }
    setLoading(false);
  };

  // ฟังก์ชันเช็คการล็อกอินและส่ง product_id ไปหน้า Checkout
  const handleCheckout = (product) => {
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      navigate("/checkout", { state: { product } }); // ส่งข้อมูลสินค้าไป Checkout
    } else {
      message.warning("Please login before proceeding to checkout");
      navigate("/auth/signin");
    }
  };

  return (
    <>
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
        }}
      >
        <Navbar />
        <div className="container mx-auto py-12 px-6">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-8">
            Promotion
          </h2>

          {loading ? (
            <div className="text-center text-blue-500 font-semibold">
              Loading courses...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.length > 0 ? (
                products.map((product) => (
                  <Badge.Ribbon
                    text={product.badge || "Sale!"}
                    color="pink"
                    key={product._id}
                  >
                    <Card
                      hoverable
                      className="rounded-lg shadow-lg"
                      cover={
                        <img
                          src={image}
                          className="rounded-t-lg object-cover h-48"
                          alt="Course"
                        />
                      }
                    >
                      <h3 className="font-bold text-md text-gray-900">
                        {product.sessions} sessions
                      </h3>
                      <div className="text-red-600 font-semibold text-sm">
                        {product.price} THB
                      </div>
                      <div className="flex justify-center space-x-4">
                        <Button
                          type="primary"
                          className="bg-pink-400 text-white px-6 rounded-lg mt-2 hover:bg-yellow-400"
                          onClick={() => handleCheckout(product)} // ส่งสินค้าไป Checkout
                        >
                          Checkout
                        </Button>
                      </div>
                    </Card>
                  </Badge.Ribbon>
                ))
              ) : (
                <div className="text-center text-gray-500">
                  No courses available.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Course;
