import { useEffect, useState } from "react";
import {
  Layout,
  Table,
  Button,
  message,
  Upload,
  Image,
  Modal,
  Input,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/User.css";
import { HeroImage, MasterImage } from "../../services/imageService";
import { QrcodePayment } from "../../services/imageService"; // Import the QrcodePayment service

const { Sider, Content } = Layout;

const ImageSetup = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [masterImages, setMasterImages] = useState([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMaster, setUploadingMaster] = useState(false);
  const [isHeroUpdateModalVisible, setIsHeroUpdateModalVisible] =
    useState(false);
  const [selectedHeroImage, setSelectedHeroImage] = useState(null);

  const [masterName, setMasterName] = useState(""); // New state for mastername
  const [selectedMasterImage, setSelectedMasterImage] = useState(null); // Track the selected master image for update
  const [qrcodes, setQrcodes] = useState([]);
  const [uploadingQrcode, setUploadingQrcode] = useState(false);
  const [selectedQrcodeImage, setSelectedQrcodeImage] = useState(null);
  const [isQrcodeModalVisible, setIsQrcodeModalVisible] = useState(false);

  useEffect(() => {
    fetchHeroImages();
    fetchMasterImages();
    fetchQrcodeImages(); // 👈 เพิ่มเรียก Qrcode ด้วย
  }, []);
  const fetchQrcodeImages = async () => {
    try {
      const response = await QrcodePayment.getQrcodePayment();
      if (response.status === "success" && Array.isArray(response.data)) {
        setQrcodes(response.data);
      } else {
        message.error("Failed to fetch QR Code images");
      }
    } catch (err) {
      message.error("Error fetching QR Code images");
    }
  };

  // Fetch Hero images from the API
  const fetchHeroImages = async () => {
    try {
      const response = await HeroImage.getHeroImage();
      if (response.status === "success" && Array.isArray(response.data)) {
        setHeroImages(response.data); // Set the images from the 'data' field
      } else {
        console.error("Fetched data is not in the expected format:", response);
        message.error("Failed to fetch hero images");
      }
    } catch (err) {
      console.error("Error fetching hero images:", err);
      message.error("Failed to fetch hero images");
    }
  };

  // Fetch Master images from the API
  const fetchMasterImages = async () => {
    try {
      const response = await MasterImage.getMasterImage();
      if (response.status === "success" && Array.isArray(response.data)) {
        setMasterImages(response.data); // Set the images from the 'data' field
      } else {
        console.error("Fetched data is not in the expected format:", response);
        message.error("Failed to fetch master images");
      }
    } catch (err) {
      message.error("Failed to fetch master images");
    }
  };
  const handleQrcodeUpload = async (info) => {
    setUploadingQrcode(true);
    const formData = new FormData();
    formData.append("image", info.file);

    try {
      if (selectedQrcodeImage) {
        await QrcodePayment.updateQrcodePayment(
          selectedQrcodeImage._id,
          formData
        );
        message.success("QR Code updated");
      } else {
        await QrcodePayment.createQrcodePayment(formData);
        message.success("QR Code uploaded");
      }
      fetchQrcodeImages();
      setIsQrcodeModalVisible(false);
    } catch (err) {
      message.error("QR Code upload failed");
    } finally {
      setUploadingQrcode(false);
    }
  };
  const deleteQrcodeImage = async (id) => {
    try {
      await QrcodePayment.deleteQrcodePayment(id);
      message.success("QR Code deleted");
      fetchQrcodeImages();
    } catch (err) {
      message.error("QR Code delete failed");
    }
  };

  const updateQrcodeImage = (record) => {
    setSelectedQrcodeImage(record);
    setIsQrcodeModalVisible(true);
  };

  // Handle Hero Image Upload
  const handleHeroUpload = async (info) => {
    setUploadingHero(true);
    const formData = new FormData();
    formData.append("image", info.file);

    try {
      if (selectedHeroImage) {
        await HeroImage.updateHeroImage(selectedHeroImage._id, formData); // Update existing image
        message.success("Hero image updated successfully");
      } else {
        await HeroImage.createHeroImage(formData); // Create new image
        message.success("Hero image uploaded successfully");
      }
      fetchHeroImages();
      setIsHeroUpdateModalVisible(false); // Close the modal
    } catch (err) {
      message.error("Hero image upload failed");
    } finally {
      setUploadingHero(false);
    }
  };

  // Handle Master Image Upload (with mastername)
  const handleMasterUpload = async (info) => {
    setUploadingMaster(true);
    const formData = new FormData();
    formData.append("image", info.file);
    formData.append("mastername", masterName); // Include mastername in the request body

    try {
      if (selectedMasterImage) {
        await MasterImage.updateMasterImage(selectedMasterImage._id, formData); // Update the master image
        message.success("Master image updated successfully");
      } else {
        await MasterImage.createMasterImage(formData); // Create new master image
        message.success("Master image uploaded successfully");
      }
      fetchMasterImages();
      setMasterName(""); // Clear the mastername input field
    } catch (err) {
      message.error("Master image upload failed");
    } finally {
      setUploadingMaster(false);
    }
  };
  const qrcodeImageColumns = (onDelete, onUpdate) => [
    {
      title: "Preview",
      dataIndex: "image",
      key: "image",
      render: (url) => <Image width={100} src={url} />,
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <>
          <Button
            icon={<EditOutlined />}
            onClick={() => onUpdate(record)}
            style={{ marginRight: 8 }}
          >
            Update
          </Button>
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  // Columns for displaying images in the table
  const heroImageColumns = (onDelete, onUpdate) => [
    {
      title: "Preview",
      dataIndex: "image",
      key: "image",
      render: (url) => <Image width={100} src={url} />,
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <>
          <Button
            icon={<EditOutlined />}
            onClick={() => onUpdate(record)}
            style={{ marginRight: 8 }}
          >
            Update
          </Button>
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  const masterImageColumns = (onDelete, onUpdate) => [
    {
      title: "Master Name",
      dataIndex: "mastername",
      key: "mastername",
    },
    {
      title: "Preview",
      dataIndex: "image",
      key: "image",
      render: (url) => <Image width={100} src={url} />,
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <>
          <Button
            icon={<EditOutlined />}
            onClick={() => onUpdate(record)}
            style={{ marginRight: 8 }}
          >
            Update
          </Button>
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  // Delete Hero Image
  const deleteHeroImage = async (id) => {
    try {
      await HeroImage.deleteHeroImage(id);
      message.success("Hero image deleted");
      fetchHeroImages();
    } catch (err) {
      message.error("Delete failed");
    }
  };

  // Delete Master Image
  const deleteMasterImage = async (id) => {
    try {
      await MasterImage.deleteMasterImage(id);
      message.success("Master image deleted");
      fetchMasterImages();
    } catch (err) {
      message.error("Delete failed");
    }
  };

  // Update Hero Image (opens the modal)
  const updateHeroImage = (record) => {
    setSelectedHeroImage(record); // Store the selected image for updating
    setIsHeroUpdateModalVisible(true); // Open the update modal
  };

  // Update Master Image (opens the modal)
  const updateMasterImage = (record) => {
    setSelectedMasterImage(record); // Store the selected master image for updating
    setMasterName(record.mastername); // Set the master name in the input field
  };

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Image Setup" />

        <Content className="user-container">
          {/* Hero Image Section */}
          <div className="mb-6">
            <h2>Hero Images</h2>
            <Upload
              customRequest={handleHeroUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploadingHero}>
                Upload Hero Image
              </Button>
            </Upload>

            <Table
              dataSource={heroImages}
              columns={heroImageColumns(deleteHeroImage, updateHeroImage)}
              rowKey="_id"
              style={{ marginTop: 16 }}
            />
          </div>

          {/* Master Image Section */}
          <div>
            <h2>Master Images</h2>
            <Input
              value={masterName}
              onChange={(e) => setMasterName(e.target.value)}
              placeholder="Enter master name"
              style={{ marginBottom: "10px" }}
            />
            <Upload
              customRequest={handleMasterUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploadingMaster}>
                Upload Master Image
              </Button>
            </Upload>

            <Table
              dataSource={masterImages}
              columns={masterImageColumns(deleteMasterImage, updateMasterImage)}
              rowKey="_id"
              style={{ marginTop: 16 }}
            />
          </div>
          {/* Qrcode Image Section */}
          <div style={{ marginTop: "2rem" }}>
            <h2>QR Code Payment</h2>
            <Upload
              customRequest={handleQrcodeUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploadingQrcode}>
                Upload QR Code
              </Button>
            </Upload>

            <Table
              dataSource={qrcodes}
              columns={qrcodeImageColumns(deleteQrcodeImage, updateQrcodeImage)}
              rowKey="_id"
              style={{ marginTop: 16 }}
            />
          </div>
        </Content>
      </Layout>
      <Modal
        title="Update QR Code"
        visible={isQrcodeModalVisible}
        onCancel={() => {
          setIsQrcodeModalVisible(false);
          setSelectedQrcodeImage(null);
        }}
        footer={null}
      >
        <Upload
          customRequest={handleQrcodeUpload}
          showUploadList={false}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />} loading={uploadingQrcode}>
            Update QR Code
          </Button>
        </Upload>
      </Modal>

      {/* Modal for Hero Image Update */}
      <Modal
        title="Update Hero Image"
        visible={isHeroUpdateModalVisible}
        onCancel={() => setIsHeroUpdateModalVisible(false)}
        footer={null}
      >
        <Upload
          customRequest={handleHeroUpload}
          showUploadList={false}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />} loading={uploadingHero}>
            Update Hero Image
          </Button>
        </Upload>
      </Modal>
    </Layout>
  );
};

export default ImageSetup;
