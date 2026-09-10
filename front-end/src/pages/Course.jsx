import {
  Card,
  Badge,
  Button,
  message,
  Tag,
  Modal,
  Space,
  Divider,
  Typography,
  Image,
  Carousel,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FireOutlined,
  PercentageOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  StockOutlined,
  LeftOutlined,
  RightOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import Footer from "../components/Footer";
import { brand } from "../config/brand.js";
import Navbar from "../components/Navbar";
import { getProducts } from "../services/productService";
import goodsService from "../services/goods-service";
import image from "../assets/images/imageC1.png";
import SEOHead from "../components/SEOHead";

const { Text } = Typography;

const Course = () => {
  const [loading, setLoading] = useState(false);
  const [goodsLoading, setGoodsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [goods, setGoods] = useState([]);
  const [isGoodsModalVisible, setIsGoodsModalVisible] = useState(false);
  const [selectedGoods, setSelectedGoods] = useState(null);
  const [productSortOrder, setProductSortOrder] = useState("asc");
  const [goodsSortOrder, setGoodsSortOrder] = useState("desc");
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `คอร์สโยคะ ${brand.name}`,
    description: "โปรโมชั่นคอร์สโยคะ ราคาพิเศษ",
    provider: {
      "@type": "Organization",
      name: brand.name,
    },
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProducts();
    fetchGoods();
  }, []);

  const fetchProducts = async (sortOrder = "asc") => {
    setLoading(true);
    try {
      const response = await getProducts({
        sortBy: "price",
        sortOrder: sortOrder,
      });
      if (response.status === "success") {
        setProducts(response.data);
      } else {
        message.error("Failed to load products");
      }
    } catch (error) {
      message.error("Failed to load products");
      console.error(error);
    }
    setLoading(false);
  };

  const fetchGoods = async (sortOrder = "desc") => {
    setGoodsLoading(true);
    try {
      const response = await goodsService.getAllGoods({
        limit: 8,
        sortBy: "price",
        sortOrder: sortOrder,
      });
      if (response.status === "success") {
        setGoods(response.data || []);
      } else {
        message.error("Failed to load goods");
      }
    } catch (error) {
      message.error("Failed to load goods");
      console.error(error);
    }
    setGoodsLoading(false);
  };

  // Helper function to get the first image from multiple images
  const getFirstImage = (images) => {
    if (!images) return "/placeholder-image.jpg";
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    if (typeof images === "string") {
      return images;
    }
    return "/placeholder-image.jpg";
  };

  // Helper function to get all images as array
  const getAllImages = (images) => {
    if (!images) return ["/placeholder-image.jpg"];
    if (Array.isArray(images)) {
      return images.length > 0 ? images : ["/placeholder-image.jpg"];
    }
    if (typeof images === "string") {
      return [images];
    }
    return ["/placeholder-image.jpg"];
  };

  // ฟังก์ชันเปิด Image Modal
  const showImageModal = (images, initialIndex = 0) => {
    setSelectedImageIndex(initialIndex);
    setIsImageModalVisible(true);
  };

  // ฟังก์ชันปิด Image Modal
  const handleImageModalCancel = () => {
    setIsImageModalVisible(false);
    setSelectedImageIndex(0);
  };

  // ฟังก์ชันเช็คการล็อกอินและส่ง product ไปหน้า Checkout
  const handleProductCheckout = (product) => {
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      navigate("/checkout", {
        state: {
          item: product,
          orderType: "product",
        },
      });
    } else {
      message.warning("Please login before proceeding to checkout");
      navigate("/auth/signin");
    }
  };

  // ฟังก์ชันเช็คการล็อกอินและส่ง goods ไปหน้า Checkout
  const handleGoodsCheckout = (goodsItem) => {
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      // ตรวจสอบสต็อกก่อน
      if (goodsItem.stock <= 0) {
        message.error("This item is out of stock");
        return;
      }
      navigate("/checkout", {
        state: {
          item: goodsItem,
          orderType: "goods",
        },
      });
    } else {
      message.warning("Please login before proceeding to checkout");
      navigate("/auth/signin");
    }
  };

  // ฟังก์ชันแสดงราคา product
  const renderPrice = (product) => {
    const hasActivePromotion =
      product.isPromotionActive && product.promotion?.price;

    if (hasActivePromotion) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-lg">
              ฿{product.promotion.price.toLocaleString()}
            </span>
            <Tag color="error" size="small" icon={<PercentageOutlined />}>
              -{product.discountPercentage}%
            </Tag>
          </div>
          <div className="text-secondary text-sm line-through">
            ฿{product.price.toLocaleString()}
          </div>
        </div>
      );
    }

    return (
      <div className="text-text font-semibold text-lg">
        ฿{product.price.toLocaleString()}
      </div>
    );
  };

  // ฟังก์ชันแสดงราคาสินค้า
  const renderGoodsPrice = (goods) => {
    const hasActivePromotion =
      goods.promotion &&
      goods.promotion.startDate &&
      goods.promotion.endDate &&
      new Date() >= new Date(goods.promotion.startDate) &&
      new Date() <= new Date(goods.promotion.endDate);

    if (hasActivePromotion) {
      const discountPercent = Math.round(
        ((goods.price - goods.promotion.price) / goods.price) * 100
      );

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-error font-bold text-lg">
              ฿{goods.promotion.price.toLocaleString()}
            </span>
            <Tag color="error" size="small" icon={<PercentageOutlined />}>
              -{discountPercent}%
            </Tag>
          </div>
          <div className="text-secondary text-sm line-through">
            ฿{goods.price.toLocaleString()}
          </div>
        </div>
      );
    }

    return (
      <div className="text-text font-semibold text-lg">
        ฿{goods.price.toLocaleString()}
      </div>
    );
  };

  // ฟังก์ชันเช็คโปรโมชั่น
  const isPromotionActive = (promotion) => {
    if (!promotion || !promotion.startDate || !promotion.endDate) return false;
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    return now >= start && now <= end;
  };

  // ฟังก์ชันเปิด Modal ดูรายละเอียดสินค้า
  const showGoodsModal = (goodsItem) => {
    setSelectedGoods(goodsItem);
    setIsGoodsModalVisible(true);
  };

  // ฟังก์ชันปิด Modal
  const handleGoodsModalCancel = () => {
    setIsGoodsModalVisible(false);
    setSelectedGoods(null);
  };

  // ฟังก์ชันสำหรับเปลี่ยน sort order ของ products
  const handleProductSortChange = (value) => {
    setProductSortOrder(value);
    fetchProducts(value);
  };

  // ฟังก์ชันสำหรับเปลี่ยน sort order ของ goods
  const handleGoodsSortChange = (value) => {
    setGoodsSortOrder(value);
    fetchGoods(value);
  };

  // ฟังก์ชันสร้าง ProductCard
  const ProductCard = ({ product }) => {
    const hasActivePromotion =
      product.isPromotionActive && product.promotion?.price;
    const isHotSale = product.hotSale;

    // กำหนด ribbon text และสี
    let ribbonText = null;
    let ribbonColor = "pink";

    if (isHotSale && hasActivePromotion) {
      ribbonText = "🔥 Hot Sale!";
      ribbonColor = "red";
    } else if (isHotSale) {
      ribbonText = "🔥 Hot Sale";
      ribbonColor = "orange";
    }
    // else if (hasActivePromotion) {
    //   ribbonText = "💰 Sale!";
    //   ribbonColor = "red";
    // }

    const CardContent = (
      <Card
      onClick={() => handleProductCheckout(product)}
        hoverable
        className="rounded-lg shadow-lg overflow-hidden h-full"
        cover={
          <div className="relative w-full overflow-hidden">
            <img
              src={product.image || image}
              className="rounded-t-lg object-cover h-65"
              alt={`${product.sessions} sessions course`}
              loading="lazy"
            />
            {/* Status badges บนรูปภาพ */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isHotSale && (
                <Tag
                  color="warning"
                  icon={<FireOutlined />}
                  className="shadow-md"
                >
                  Hot Sale
                </Tag>
              )}
            </div>
          </div>
        }
        bodyStyle={{
          padding: "16px",
          height: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div className="flex-1">
          <div className="mb-3">
            <h3 className="font-bold text-lg text-text mb-2">
              {product.sessions} Sessions
            </h3>
            <div className="text-sm text-secondary mb-2">
              Duration: {product.duration} Days
            </div>
            {renderPrice(product)}
            {hasActivePromotion && (
              <div className="text-xs text-error mt-1">
                ⏰ Promotion ends:{" "}
                {new Date(product.promotion.endDate).toLocaleDateString(
                  "th-TH"
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button
            type="primary"
            size="large"
            className={`
              px-8 py-2 rounded-lg font-semibold transition-all duration-300
              ${
                isHotSale
                  ? "bg-accent hover:bg-accent border-accent hover:border-accent"
                  : hasActivePromotion
                  ? "bg-error hover:bg-error border-error hover:border-error"
                  : "bg-primary hover:bg-primary border-primary hover:border-primary"
              }
              text-white shadow-lg hover:shadow-xl hover:scale-105
            `}
            onClick={() => handleProductCheckout(product)}
          >
            {isHotSale
              ? "🔥 Buy Now!"
              : hasActivePromotion
              ? "💰 Get Deal!"
              : "Checkout"}
          </Button>
        </div>
      </Card>
    );

    // ถ้ามี ribbon ให้ใส่ Badge.Ribbon
    if (ribbonText) {
      return (
        <Badge.Ribbon
          text={ribbonText}
          color={ribbonColor}
          key={product._id}
          className="animate-pulse"
        >
          {CardContent}
        </Badge.Ribbon>
      );
    }

    // ถ้าไม่มี ribbon ให้แสดง Card ธรรมดา
    return <div key={product._id}>{CardContent}</div>;
  };

  // ฟังก์ชันสร้าง GoodsCard
  const GoodsCard = ({ goodsItem }) => {
    const hasActivePromotion = isPromotionActive(goodsItem.promotion);
    const isHotSale = goodsItem.hotSale;
    const isOutOfStock = goodsItem.stock <= 0;
    const firstImage = getFirstImage(goodsItem.image);
    const allImages = getAllImages(goodsItem.image);

    // กำหนด ribbon text และสี
    let ribbonText = null;
    let ribbonColor = "blue";

    if (isOutOfStock) {
      ribbonText = "📦 Out of Stock";
      ribbonColor = "gray";
    } else if (isHotSale && hasActivePromotion) {
      ribbonText = "🔥 Hot Sale!";
      ribbonColor = "red";
    } else if (isHotSale) {
      ribbonText = "🔥 Hot Sale";
      ribbonColor = "orange";
    } else if (hasActivePromotion) {
      ribbonText = "💰 Sale!";
      ribbonColor = "red";
    }

    const CardContent = (

      <Card
      onClick={() => handleGoodsCheckout(goodsItem)}
        hoverable={!isOutOfStock}
        className={`rounded-lg shadow-lg overflow-hidden h-full ${
          isOutOfStock ? "opacity-75" : ""
        }`}
        cover={
          <div className="relative w-full overflow-hidden">
            <img
              src={firstImage}
              className="rounded-t-lg object-cover h-48 w-full"
              alt={goodsItem.goods}
              loading="lazy"
            />

            {/* Multiple Images Indicator */}
            {allImages.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-primary-dark bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                +{allImages.length - 1} more
              </div>
            )}

            {/* Status badges บนรูปภาพ */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isHotSale && !isOutOfStock && (
                <Tag
                  color="warning"
                  icon={<FireOutlined />}
                  className="shadow-md"
                >
                  Hot Sale
                </Tag>
              )}
              {hasActivePromotion && !isOutOfStock && (
                <Tag
                  color="error"
                  icon={<PercentageOutlined />}
                  className="shadow-md"
                >
                  Sale
                </Tag>
              )}
            </div>
            {/* Stock badge */}
            <div className="absolute top-2 right-2">
              <Tag
                color={goodsItem.stock > 0 ? "green" : "red"}
                icon={<StockOutlined />}
                className="shadow-md"
              >
                {goodsItem.stock} {goodsItem.unit}
              </Tag>
            </div>
          </div>
        }
        bodyStyle={{
          padding: "16px",
          height: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div className="flex-1">
          <div className="mb-3">
            <h3 className="font-bold text-lg text-text mb-1">
              {goodsItem.goods}
            </h3>
            {goodsItem.code && (
              <div className="text-xs text-secondary mb-2 font-mali">
                {goodsItem.code}
              </div>
            )}

            {/* Size and Color tags */}
            <div className="mb-2 flex flex-wrap gap-1">
              {goodsItem.size && (
                <Tag color="processing" size="small">
                  {goodsItem.size}
                </Tag>
              )}
              {goodsItem.color && (
                <Tag color="warning" size="small">
                  {goodsItem.color}
                </Tag>
              )}
            </div>

            {renderGoodsPrice(goodsItem)}

            {hasActivePromotion && (
              <div className="text-xs text-error mt-1">
                ⏰ Promotion ends:{" "}
                {new Date(goodsItem.promotion.endDate).toLocaleDateString(
                  "th-TH"
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => showGoodsModal(goodsItem)}
            className="flex-1"
          >
            View Details
          </Button>
          {!isOutOfStock && (
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              className={`
                flex-1 font-semibold transition-all duration-300
                ${
                  isHotSale
                    ? "bg-accent hover:bg-accent border-accent hover:border-accent"
                    : hasActivePromotion
                    ? "bg-error hover:bg-error border-error hover:border-error"
                    : "bg-primary hover:bg-primary border-primary hover:border-primary"
                }
                text-white shadow-lg hover:shadow-xl hover:scale-105
              `}
              onClick={() => handleGoodsCheckout(goodsItem)}
            >
              Checkout
            </Button>
          )}
        </div>
      </Card>
    );

    // ถ้ามี ribbon ให้ใส่ Badge.Ribbon
    if (ribbonText) {
      return (
        <Badge.Ribbon
          text={ribbonText}
          color={ribbonColor}
          key={goodsItem._id}
          className={isOutOfStock ? "" : "animate-pulse"}
        >
          {CardContent}
        </Badge.Ribbon>
      );
    }

    // ถ้าไม่มี ribbon ให้แสดง Card ธรรมดา
    return <div key={goodsItem._id}>{CardContent}</div>;
  };

  return (
    <>
      <SEOHead
        title="โปรโมชั่นคอร์สโยคะ"
        description={`โปรโมชั่นคอร์สโยคะ ${brand.name} ราคาพิเศษ คอร์สหลากหลาย เหมาะกับทุกระดับ จองง่าย เริ่มเรียนได้ทันที`}
        keywords="โปรโมชั่นโยคะ, คอร์สโยคะ, ราคาพิเศษ, จองคอร์สโยคะ"
        url="/course"
        structuredData={structuredData}
      />
      <div
        className="min-h-screen"
        style={{
          background:
            "var(--color-background)",
        }}
      >
        <Navbar />
        <div className="container mx-auto py-12 px-6">
          {/* Course Promotions Section */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-primary mb-2">
                Course Promotions
              </h2>
              <p className="text-secondary">
                เลือกแพ็คเกจที่เหมาะกับคุณ พร้อมโปรโมชั่นพิเศษ
              </p>
            </div>
            <div className="flex justify-end mb-4">
              <Space>
                <span className="text-secondary">เรียงตามราคา:</span>
                <Select
                  value={productSortOrder}
                  onChange={handleProductSortChange}
                  style={{ width: 180 }}
                  options={[
                    {
                      value: "asc",
                      label: (
                        <span>
                          <SortAscendingOutlined /> ต่ำไปสูง
                        </span>
                      ),
                    },
                    {
                      value: "desc",
                      label: (
                        <span>
                          <SortDescendingOutlined /> สูงไปต่ำ
                        </span>
                      ),
                    },
                  ]}
                />
              </Space>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-primary font-semibold">
                  Loading courses...
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <div className="text-secondary text-xl mb-4">
                    No courses available at the moment.
                  </div>
                  <div className="text-secondary">
                    Please check back later for new promotions!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Goods Section */}
          <Divider className="my-16" />

          <div className="mb-8">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-primary mb-2">
                🛍️ Yoga Accessories & Goods
              </h2>
              <p className="text-secondary">
                อุปกรณ์โยคะและสินค้าคุณภาพดี เสริมการออกกำลังกายของคุณ
              </p>
            </div>
            <div className="flex justify-end mb-4">
              <Space>
                <span className="text-secondary">เรียงตามราคา:</span>
                <Select
                  value={goodsSortOrder}
                  onChange={handleGoodsSortChange}
                  style={{ width: 180 }}
                  options={[
                    {
                      value: "asc",
                      label: (
                        <span>
                          <SortAscendingOutlined /> ต่ำไปสูง
                        </span>
                      ),
                    },
                    {
                      value: "desc",
                      label: (
                        <span>
                          <SortDescendingOutlined /> สูงไปต่ำ
                        </span>
                      ),
                    },
                  ]}
                />
              </Space>
            </div>
          </div>

          {goodsLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-primary font-semibold">
                  Loading goods...
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {goods.length > 0 ? (
                goods.map((goodsItem) => (
                  <GoodsCard key={goodsItem._id} goodsItem={goodsItem} />
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <div className="text-secondary text-xl mb-4">
                    No goods available at the moment.
                  </div>
                  <div className="text-secondary">
                    Please check back later for new items!
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Goods Detail Modal */}
      <Modal
        title="Product Details"
        visible={isGoodsModalVisible}
        onCancel={handleGoodsModalCancel}
        footer={[
          <Button key="close" onClick={handleGoodsModalCancel}>
            Close
          </Button>,
          selectedGoods && selectedGoods.stock > 0 && (
            <Button
              key="checkout"
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => {
                handleGoodsCheckout(selectedGoods);
                handleGoodsModalCancel();
              }}
            >
              Checkout
            </Button>
          ),
        ]}
        width={950}
        className="goods-detail-modal"
      >
        {selectedGoods && (
          <div className="goods-modal-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - Image Gallery */}
              <div className="image-section">
                {getAllImages(selectedGoods.image).length > 1 ? (
                  <div style={{ width: "100%" }}>
                    <Carousel
                      arrows={true}
                      prevArrow={<LeftOutlined />}
                      nextArrow={<RightOutlined />}
                      dots={true}
                      autoplay={false}
                    >
                      {getAllImages(selectedGoods.image).map((img, index) => (
                        <div key={index}>
                          <img
                            src={img}
                            alt={`${selectedGoods.goods} - Image ${index + 1}`}
                            className="w-full h-80 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      ))}
                    </Carousel>
                    <div className="mt-2 text-center">
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {getAllImages(selectedGoods.image).length} image(s)
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div>
                    <img
                      src={getFirstImage(selectedGoods.image)}
                      alt={selectedGoods.goods}
                      className="w-full h-80 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              {/* Right side - Details */}
              <div className="details-section">
                <div className="space-y-4">
                  {/* Title and Code */}
                  <div>
                    <h3 className="text-2xl font-bold text-text mb-2">
                      {selectedGoods.goods}
                    </h3>
                    {selectedGoods.code && (
                      <div className="text-sm text-secondary font-mali bg-surface px-2 py-1 rounded inline-block">
                        Code: {selectedGoods.code}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {selectedGoods.size && (
                      <Tag color="processing" icon={<TagsOutlined />}>
                        Size: {selectedGoods.size}
                      </Tag>
                    )}
                    {selectedGoods.color && (
                      <Tag color="warning" icon={<TagsOutlined />}>
                        Color: {selectedGoods.color}
                      </Tag>
                    )}
                    {selectedGoods.hotSale && (
                      <Tag color="error" icon={<FireOutlined />}>
                        Hot Sale
                      </Tag>
                    )}
                    {isPromotionActive(selectedGoods.promotion) && (
                      <Tag color="error" icon={<PercentageOutlined />}>
                        On Sale
                      </Tag>
                    )}
                  </div>

                  {/* Price */}
                  <div className="price-section">
                    {renderGoodsPrice(selectedGoods)}
                  </div>

                  {/* Stock */}
                  <div className="stock-section">
                    <Space>
                      <Text strong>Stock:</Text>
                      <Tag
                        color={selectedGoods.stock > 0 ? "green" : "red"}
                        icon={<StockOutlined />}
                      >
                        {selectedGoods.stock} {selectedGoods.unit}
                      </Tag>
                    </Space>
                  </div>

                  {/* Description */}
                  {selectedGoods.detail && (
                    <div className="description-section">
                      <Text strong className="block mb-2">
                        Description:
                      </Text>
                      <div className="text-secondary text-sm leading-relaxed">
                        {selectedGoods.detail}
                      </div>
                    </div>
                  )}

                  {/* Promotion Info */}
                  {isPromotionActive(selectedGoods.promotion) && (
                    <div className="promotion-section bg-error-soft border border-border rounded-lg p-3">
                      <Text strong className="text-error block mb-1">
                        🎉 Special Promotion!
                      </Text>
                      <div className="text-xs text-error">
                        <div>
                          Promotion Price: ฿
                          {selectedGoods.promotion.price.toLocaleString()}
                        </div>
                        <div>
                          Valid until:{" "}
                          {new Date(
                            selectedGoods.promotion.endDate
                          ).toLocaleDateString("th-TH")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stock Status */}
                  {selectedGoods.stock <= 0 && (
                    <div className="stock-warning bg-background border border-border rounded-lg p-3">
                      <Text className="text-secondary">
                        ⚠️ This item is currently out of stock
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Zoom Modal - Removed */}

      {/* Custom CSS for Modal */}
      <style jsx>{`
        .goods-detail-modal .ant-modal-body {
          padding: 24px;
        }

        .ant-carousel .slick-prev,
        .ant-carousel .slick-next {
          z-index: 2;
          width: 40px;
          height: 40px;
          background: rgba(73,47,42,0.5);
          border-radius: 50%;
        }

        .ant-carousel .slick-prev:before,
        .ant-carousel .slick-next:before {
          color: white;
          font-size: 16px;
        }

        .ant-carousel .slick-dots {
          bottom: 10px;
        }

        .ant-carousel .slick-dots li button {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
        }

        .ant-carousel .slick-dots li.slick-active button {
          background: white;
        }
      `}</style>
    </>
  );
};

export default Course;
