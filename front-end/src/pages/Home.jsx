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
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      if (response.status === "success") {
        console.log(response.data);

        setProducts(response.data); // อัปเดตข้อมูลคอร์ส
      } else {
        message.error("Failed to load products");
      }
    } catch (error) {
      message.error("Failed to load products");
    }
    setLoading(false);
  };
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

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <HeroSection />
      </motion.div>

      {/* Explore More Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerVariant}
        className="explore-more-section py-8"
      >
        <motion.h2
          variants={fadeInVariant}
          className="text-2xl font-bold text-center text-blue-900 mb-2"
        >
          EXPLORE OUR PRODUCT
        </motion.h2>
        <motion.p
          variants={fadeInVariant}
          className="text-center text-gray-700 mb-6"
        >
          Yoga
        </motion.p>
        <motion.div
          variants={staggerVariant}
          className="flex justify-center gap-6 flex-wrap px-4"
        >
          {products.slice(0, 3).map((product, index) => (
            <motion.div
              key={index}
              variants={fadeInVariant}
              className="w-40 h-52 bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-4"
              style={{ borderRadius: "25px" }}
            >
              <img
                src={image1} // Replace with actual image path
                className="w-full h-32 object-cover rounded-t-lg"
                style={{ borderRadius: "15px" }}
              />
              <p className="mt-2 text-gray-700 font-semibold text-center">
                {product.sessions} sessions
              </p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div variants={fadeInVariant} className="text-center mt-4">
          <Button
            type="primary"
            className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold py-2 rounded-2xl hover:bg-pink-300 px-6"
          >
            More
          </Button>
        </motion.div>
      </motion.section>

      {/* Courses Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerVariant}
        className="courses-section py-8"
      >
        <motion.h2
          variants={fadeInVariant}
          className="text-2xl font-bold text-center text-blue-900"
        >
          COURSE
        </motion.h2>
        <motion.div
          variants={staggerVariant}
          className="flex justify-center gap-4 px-4 mt-6"
        >
          <motion.div
            variants={fadeInVariant}
            className="w-2/3 h-auto rounded-lg shadow-md"
          >
            <img
              src={courseShow}
              alt="courseShow"
              className="rounded-lg shadow-lg"
            />
          </motion.div>
          <motion.div
            variants={fadeInVariant}
            className="w-1/4 h-auto bg-white rounded-lg shadow-md p-6"
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
                  className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold py-2 rounded-full hover:bg-pink-300 px-6"
                >
                  Join Now
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
        <motion.div variants={fadeInVariant} className="text-center mt-6">
          <Link to="/course">
            <Button
              type="primary"
              className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold py-2 rounded-2xl hover:bg-pink-300 px-6"
            >
              View All Courses
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
