import { Button, message } from "antd";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import image1 from "../assets/images/iamge1.png";
import courseShow from "../assets/images/courseshow.png";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getProducts } from "../services/productService";
import { useEffect, useState } from "react";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setLoading(true);
    getProducts()
      .then((response) => {
        if (response.status === "success" && Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          message.error("Failed to load products");
        }
      })
      .catch((error) => {
        // console.error("Error fetching products:", error);
        message.error("Failed to load products");
      })
      .finally(() => setLoading(false));
  }, []);

  // Animation Variants
  const fadeInVariant = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const staggerVariant = {
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      <Navbar />
      {/* Image slider Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full px-4 sm:px-6 lg:px-8"
      >
        <HeroSection />
      </motion.div>
      {/* Explore More Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerVariant}
        className="explore-more-section py-8 px-4 sm:px-6 lg:px-8"
      >
        <motion.h2
          variants={fadeInVariant}
          className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-blue-900 mb-2"
        >
          EXPLORE OUR PRODUCT
        </motion.h2>
        <motion.p
          variants={fadeInVariant}
          className="text-center text-gray-700 mb-6"
        >
          Yoga
        </motion.p>
        <div className="flex justify-center flex-wrap gap-3 sm:gap-4 md:gap-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading products...</p>
          ) : products.length > 0 ? (
            products.map((product, index) => (
              <div
                key={index}
                className="w-32 sm:w-36 md:w-40 h-40 sm:h-48 md:h-52 bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-3 md:p-4 hover:shadow-lg transition-shadow duration-300"
              >
                <img
                  src={product.image || image1}
                  alt="Product"
                  className="w-full h-24 sm:h-28 md:h-32 object-cover rounded-t-lg"
                />
                <p className="mt-2 text-gray-700 font-semibold text-center text-xs sm:text-sm">
                  {product.sessions
                    ? `${product.sessions} sessions`
                    : "No session data"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No products available</p>
          )}
        </div>
        <motion.div variants={fadeInVariant} className="text-center mt-6">
          <Link to="/course">
            <Button
              type="primary"
              className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-2xl hover:bg-pink-300 text-sm sm:text-base"
            >
              View All Courses
            </Button>
          </Link>
        </motion.div>
      </motion.section>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full px-4 sm:px-6 lg:px-8"
      >
        <HeroSection />
      </motion.div>
      {/* Courses Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerVariant}
        className="courses-section py-8 px-4 sm:px-6 lg:px-8"
      >
        <motion.h2
          variants={fadeInVariant}
          className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-blue-900 mb-6"
        >
          COURSE
        </motion.h2>
        <motion.div
          variants={staggerVariant}
          className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6"
        >
          <motion.div
            variants={fadeInVariant}
            className="w-full md:w-2/3 h-auto rounded-lg shadow-md mb-4 md:mb-0"
          >
            <img
              src={courseShow}
              alt="courseShow"
              className="rounded-lg shadow-lg w-full h-auto"
            />
          </motion.div>
          <motion.div
            variants={fadeInVariant}
            className="w-full md:w-1/3 lg:w-1/4 h-auto bg-white rounded-lg shadow-md p-4 md:p-6"
          >
            {/* Benefits Section */}
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              Why Learn Yoga?
            </h3>
            <ul className="text-gray-700 text-sm space-y-2">
              <li>🌟 Enhance flexibility and strength.</li>
              <li>🧘‍♀️ Reduce stress and promote relaxation.</li>
              <li>🩺 Boost mental clarity and focus.</li>
              <li>❤️ Improve overall physical health.</li>
              <li>✨ Cultivate inner peace and balance.</li>
            </ul>
            <div className="text-center mt-4">
              <Link to="/course">
                <Button
                  type="primary"
                  className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold py-1 sm:py-2 px-4 sm:px-6 rounded-full hover:bg-pink-300 text-sm sm:text-base"
                >
                  Join Now
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
