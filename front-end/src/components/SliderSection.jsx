import { useEffect, useState } from "react";
import { Row, Col, Carousel, Spin, Slider } from "antd";
import { SliderImage } from "../services/imageService";

const SliderSection = () => {
  const [sliderImages, setSliderImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSliderImages = async () => {
      try {
        setLoading(true);
        const response = await SliderImage.getSliderImages();

        if (response.status === "success" && response.data) {
          setSliderImages(response.data);
        } else {
          setError("Failed to load slider images");
        }
      } catch (error) {
        console.error("Error fetching slider images:", error);
        setError("Failed to load slider images");
      } finally {
        setLoading(false);
      }
    };

    fetchSliderImages();
  }, []);

  if (loading) {
    return (
      <div className="hero-section py-12 flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || sliderImages.length === 0) {
    return (
      <div className="hero-section py-12 flex justify-center items-center">
        <Row justify="center" align="middle" className="w-full">
          <Col xs={24} className="flex justify-center">
            <div className="w-full max-w-4xl px-4">
              <div className="bg-gray-200 rounded-lg shadow-lg flex items-center justify-center h-48 sm:h-64 md:h-80 lg:h-96">
                <span className="text-gray-500">No images available</span>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="hero-section py-12 flex justify-center items-center">
      <Row justify="center" align="middle" className="w-full">
        <Col xs={24} className="flex justify-center">
          <div className="w-full max-w-4xl px-4">
            {sliderImages.length === 1 ? (
              // แสดงรูปเดียวถ้ามีแค่รูปเดียว
              <div className="relative  overflow-hidden">
                <img
                  src={sliderImages[0].image}
                  alt={sliderImages[0].title || "Hero Image"}
                  className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-contain"
                  loading="lazy"
                />
                {sliderImages[0].title && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                    {sliderImages[0].title}
                  </div>
                )}
              </div>
            ) : (
              // แสดง Carousel ถ้ามีหลายรูป
              <Carousel
                autoplay
                autoplaySpeed={4000}
                dots={true}
                effect="fade"
                className=" overflow-hidden "
              >
                {sliderImages.map((slide, index) => (
                  <div key={slide._id || index} className="relative ">
                    <img
                      src={slide.image}
                      alt={slide.title || `Slide ${index + 1}`}
                      className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-contain"
                      loading="lazy"
                    />
                    {slide.title && (
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                        {slide.title}
                      </div>
                    )}
                    {slide.description && (
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded max-w-xs">
                        <p className="text-sm">{slide.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </Carousel>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SliderSection;
