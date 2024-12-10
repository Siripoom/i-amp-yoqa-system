import { Card, Badge, Button } from "antd";
import { useEffect } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import image from "../assets/images/imageC1.png";
const Course = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const courseData = [
    {
      title: "10 sessions",
      // originalPrice: "฿3,290.00",
      salePrice: "฿1,990.00 ",
      badge: "Sale!",
      image: image,
    },
    {
      title: "15 sessions",
      // originalPrice: "฿6,280.00",
      salePrice: "฿3,590.00 ",
      badge: "Sale!",
      image: image,
    },
    {
      title: "20 sessions",
      // originalPrice: "฿3,590.00",
      salePrice: "฿1,990.00 ",
      badge: "Sale!",
      image: image,
    },
    {
      title: "30 sessions",
      // originalPrice: "฿3,590.00",
      salePrice: "฿2,990.00",
      badge: "Sale!",
      image: image,
    },
  ];

  return (
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
          Course Session
        </h2>

        {/* Course Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courseData.map((course, index) => (
            <Badge.Ribbon text={course.badge} color="pink" key={index}>
              <Card
                hoverable
                className="rounded-lg shadow-lg"
                cover={
                  <img
                    alt={course.title}
                    src={course.image}
                    className="rounded-t-lg object-cover h-48"
                  />
                }
              >
                <h3 className="font-bold text-md text-gray-900">
                  {course.title}
                </h3>
                <div className="text-gray-500 line-through text-sm">
                  {course.originalPrice}
                </div>
                <div className="text-red-600 font-semibold text-sm">
                  {course.salePrice}
                </div>
                <div className="flex justify-center space-x-4">
                  {/* <Link to="/CourseDetail"> */}
                  <Button
                    type="primary"
                    className="bg-pink-400 text-white px-6 rounded-lg mt-2 hover:bg-yellow-400"
                  >
                    Details
                  </Button>
                  {/* </Link> */}
                  {/* <Link to="/checkout"> */}
                  <Button
                    type="primary"
                    className="bg-pink-400 text-white px-6 rounded-lg mt-2 hover:bg-yellow-400"
                  >
                    Checkout
                  </Button>
                  {/* </Link> */}
                </div>
              </Card>
            </Badge.Ribbon>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Course;
