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
  Form,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/User.css";
import {
  HeroImage,
  MasterImage,
  QrcodePayment,
  ImageCatalog,
} from "../../services/imageService";

const { Sider, Content } = Layout;
const { TextArea } = Input;

const ImageSetup = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [masterImages, setMasterImages] = useState([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMaster, setUploadingMaster] = useState(false);
  const [isHeroUpdateModalVisible, setIsHeroUpdateModalVisible] =
    useState(false);
  const [selectedHeroImage, setSelectedHeroImage] = useState(null);

  const [masterName, setMasterName] = useState("");
  const [selectedMasterImage, setSelectedMasterImage] = useState(null);
  const [qrcodes, setQrcodes] = useState([]);
  const [uploadingQrcode, setUploadingQrcode] = useState(false);
  const [selectedQrcodeImage, setSelectedQrcodeImage] = useState(null);
  const [isQrcodeModalVisible, setIsQrcodeModalVisible] = useState(false);

  // Class Catalog states
  const [classCatalogs, setClassCatalogs] = useState([]);
  const [uploadingClass, setUploadingClass] = useState(false);
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);
  const [isClassCreateMode, setIsClassCreateMode] = useState(true);
  const [selectedClassCatalog, setSelectedClassCatalog] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchHeroImages();
    fetchMasterImages();
    fetchQrcodeImages();
    fetchClassCatalogs(); // Fetch class catalogs on component mount
  }, []);

  // Fetch Class Catalogs from the API
  const fetchClassCatalogs = async () => {
    try {
      const response = await ImageCatalog.getImageCatalog();
      if (response.status === "success" && Array.isArray(response.data)) {
        setClassCatalogs(response.data);
      } else {
        message.error("Failed to fetch class catalogs");
      }
    } catch (err) {
      console.error("Error fetching class catalogs:", err);
      message.error("Failed to fetch class catalogs");
    }
  };

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
        setHeroImages(response.data);
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
        setMasterImages(response.data);
      } else {
        console.error("Fetched data is not in the expected format:", response);
        message.error("Failed to fetch master images");
      }
    } catch (err) {
      message.error("Failed to fetch master images");
    }
  };

  // Handle Class Catalog Form Submit (Create/Update)

  const handleClassFormSubmit = async (values) => {
    setUploadingClass(true);
    const formData = new FormData();
   
    // Append form values to FormData - ensure classname is included
    formData.append("classname", values.classname);

    // Add description if provided, or empty string to avoid undefined
    formData.append("description", values.description || "");

    formData.append("image", values.image.file);

    try {
      if (isClassCreateMode) {
        // Create new class catalog
        await ImageCatalog.createImageCatalog(formData);
        message.success("Class catalog created successfully");
      } else {
        // Update existing class catalog
        await ImageCatalog.updateImageCatalog(
          selectedClassCatalog._id,
          formData
        );
        message.success("Class catalog updated successfully");
      }

      // Reset form and fetch updated data
      form.resetFields();
      fetchClassCatalogs();
      setIsClassModalVisible(false);
    } catch (err) {
      console.error("Error with class catalog operation:", err);
      // Log more detailed error information
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
      }
      message.error(
        "Operation failed. Please check if all required fields are filled."
      );
    } finally {
      setUploadingClass(false);
    }
  };

  // Delete Class Catalog
  const deleteClassCatalog = async (id) => {
    try {
      await ImageCatalog.deleteImageCatalog(id);
      message.success("Class catalog deleted successfully");
      fetchClassCatalogs();
    } catch (err) {
      message.error("Delete failed");
    }
  };

  // Open modal for creating a new class catalog
  const createClassCatalog = () => {
    setIsClassCreateMode(true);
    setSelectedClassCatalog(null);
    form.resetFields();
    setIsClassModalVisible(true);
  };

  // Open modal for updating an existing class catalog
  const updateClassCatalog = (record) => {
    setIsClassCreateMode(false);
    setSelectedClassCatalog(record);
    form.setFieldsValue({
      classname: record.classname,
      description: record.description,
    });
    setIsClassModalVisible(true);
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
        await HeroImage.updateHeroImage(selectedHeroImage._id, formData);
        message.success("Hero image updated successfully");
      } else {
        await HeroImage.createHeroImage(formData);
        message.success("Hero image uploaded successfully");
      }
      fetchHeroImages();
      setIsHeroUpdateModalVisible(false);
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
    formData.append("mastername", masterName);

    try {
      if (selectedMasterImage) {
        await MasterImage.updateMasterImage(selectedMasterImage._id, formData);
        message.success("Master image updated successfully");
      } else {
        await MasterImage.createMasterImage(formData);
        message.success("Master image uploaded successfully");
      }
      fetchMasterImages();
      setMasterName("");
    } catch (err) {
      message.error("Master image upload failed");
    } finally {
      setUploadingMaster(false);
    }
  };

  // Columns for Class Catalog table
  const classCatalogColumns = [
    {
      title: "Class Name",
      dataIndex: "classname",
      key: "classname",
    },
    {
      title: "Preview",
      dataIndex: "image",
      key: "image",
      render: (url) => (url ? <Image width={100} src={url} /> : "No image"),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <>
          <Button
            icon={<EditOutlined />}
            onClick={() => updateClassCatalog(record)}
            style={{ marginRight: 8 }}
          >
            Update
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteClassCatalog(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

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
    setSelectedHeroImage(record);
    setIsHeroUpdateModalVisible(true);
  };

  // Update Master Image (opens the modal)
  const updateMasterImage = (record) => {
    setSelectedMasterImage(record);
    setMasterName(record.mastername);
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
          <div className="mb-6">
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
          <div className="mb-6">
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

          {/* Class Catalog Section */}
          <div className="mb-6">
            <h2>Class Catalogs</h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createClassCatalog}
              style={{ marginBottom: 16 }}
            >
              Add New Class
            </Button>

            <Table
              dataSource={classCatalogs}
              columns={classCatalogColumns}
              rowKey="_id"
              style={{ marginTop: 16 }}
            />
          </div>
        </Content>
      </Layout>

      {/* Modal for QR Code Update */}
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

      {/* Modal for Class Catalog Create/Update */}
      <Modal
        title={isClassCreateMode ? "Add New Class" : "Update Class"}
        visible={isClassModalVisible}
        onCancel={() => {
          setIsClassModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleClassFormSubmit}>
          <Form.Item name="classname" label="Class Name">
            <Input placeholder="Enter class name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Enter class description" />
          </Form.Item>

          <Form.Item name="image" label="Class Image" valuePropName="file">
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploadingClass}
              style={{ marginRight: 8 }}
            >
              {isClassCreateMode ? "Create" : "Update"}
            </Button>
            <Button onClick={() => setIsClassModalVisible(false)}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ImageSetup;
