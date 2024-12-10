import { Button, Input, Table, Typography } from "antd";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
const { Title, Text } = Typography;
import image from "../assets/images/imageC1.png";
const Cart = () => {
  const dataSource = [
    {
      key: "1",
      productImage: image, // Mockup image path
      productName: "Advanced Yoga Session - 10 Sessions",
      price: "฿1,590.00",
      session: 10,
      subtotal: "฿1,590.00",
    },
  ];

  const columns = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <div className="flex items-center">
          <img
            src={record.productImage}
            alt="Product"
            className="w-20 h-20 rounded-md"
          />
          <Text className="ml-4">{record.productName}</Text>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "center",
    },
    {
      title: "Session",
      key: "session",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center items-center space-x-2">
          <Button size="small">-</Button>
          <Input className="text-center w-12" value={record.session} readOnly />
          <Button size="small">+</Button>
        </div>
      ),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      align: "center",
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
        <Title level={3} className="mb-6">
          Your Cart
        </Title>

        {/* Cart Table */}
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          className="mb-6"
        />

        {/* Coupon Section */}
        {/* <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-md shadow-md mb-6">
          <Input
            placeholder="Coupon code"
            className="w-full md:w-2/3 mb-4 md:mb-0"
          />
          <Button type="primary" className="bg-yellow-500 text-white">
            Apply coupon
          </Button>
        </div> */}

        {/* Cart Totals */}
        <div className="flex flex-col md:flex-row justify-between bg-white p-6 rounded-md shadow-md">
          <div className="space-y-2">
            <Text>Subtotal:</Text>
            <Text className="font-bold">฿1,590.00</Text>
          </div>
          <div className="space-y-2">
            <Text>Total:</Text>
            <Text className="font-bold">
              ฿1,590.00{" "}
              <span className="text-gray-500">(includes ฿104.02 VAT)</span>
            </Text>
          </div>
          <Link to="/checkout">
            <Button
              type="primary"
              className="bg-pink-400 text-white mt-4 md:mt-0"
            >
              Proceed to checkout
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
