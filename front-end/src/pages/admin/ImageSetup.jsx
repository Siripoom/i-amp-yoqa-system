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
  Tabs,
  Space,
  Divider,
  Typography,
  Tooltip,
  Tag,
  InputNumber,
  Switch,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/User.css";
import {
  HeroImage,
  MasterImage,
  QrcodePayment,
  ImageCatalog,
  SliderImage,
} from "../../services/imageService";

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

const ImageSetup = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [masterImages, setMasterImages] = useState([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMaster, setUploadingMaster] = useState(false);
  const [isHeroUpdateModalVisible, setIsHeroUpdateModalVisible] =
    useState(false);
  const [selectedHeroImage, setSelectedHeroImage] = useState(null);

  const [masterFormData, setMasterFormData] = useState({
    mastername: "",
    bio: "",
    specialization: "",
    image: null,
    videoUrl: "",
  });

  const [selectedMasterImage, setSelectedMasterImage] = useState(null);
  const [isMasterModalVisible, setIsMasterModalVisible] = useState(false);
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [videoPreviewVisible, setVideoPreviewVisible] = useState(false);

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

  // 2. เพิ่ม state สำหรับ slider images
  const [sliderImages, setSliderImages] = useState([]);
  const [uploadingSlider, setUploadingSlider] = useState(false);
  const [isSliderModalVisible, setIsSliderModalVisible] = useState(false);
  const [isSliderCreateMode, setIsSliderCreateMode] = useState(true);
  const [selectedSliderImage, setSelectedSliderImage] = useState(null);
  const [sliderForm] = Form.useForm();

  // YouTube URL แปลงเป็น embed URL สำหรับ Preview
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;

    // Extract video ID
    let videoId = "";

    // Match YouTube URL patterns
    const regularMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (regularMatch) videoId = regularMatch[1];

    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) videoId = shortMatch[1];

    const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (embedMatch) videoId = embedMatch[1];

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
  };

  useEffect(() => {
    fetchHeroImages();
    fetchMasterImages();
    fetchQrcodeImages();
    fetchClassCatalogs();
    fetchSliderImages();
  }, []);
  const fetchSliderImages = async () => {
    try {
      const response = await SliderImage.getAllSliderImages();
      if (response.status === "success" && Array.isArray(response.data)) {
        setSliderImages(response.data);
      } else {
        message.error("Failed to fetch slider images");
      }
    } catch (err) {
      console.error("Error fetching slider images:", err);
      message.error("Failed to fetch slider images");
    }
  };
  const handleSliderFormSubmit = async (values) => {
    console.log("Form values received:", values); // Debug log

    setUploadingSlider(true);
    const formData = new FormData();

    // จัดการค่าต่างๆ ให้ถูกต้อง
    const title = values.title || "";
    const description = values.description || "";
    const isActive = values.isActive !== undefined ? values.isActive : true;
    const order = values.order !== undefined ? values.order : 0;

    console.log("Processed values:", { title, description, isActive, order }); // Debug log

    formData.append("title", title);
    formData.append("description", description);
    formData.append("isActive", isActive);
    formData.append("order", order);

    // จัดการไฟล์
    let hasFile = false;
    if (
      values.image &&
      Array.isArray(values.image) &&
      values.image.length > 0
    ) {
      const fileObj = values.image[0];
      if (fileObj.originFileObj) {
        console.log("File found:", fileObj.originFileObj); // Debug log
        formData.append("image", fileObj.originFileObj);
        hasFile = true;
      }
    }

    if (!hasFile && isSliderCreateMode) {
      message.error("Please select an image to upload");
      setUploadingSlider(false);
      return;
    }

    // Debug: แสดงข้อมูลใน FormData
    console.log("FormData contents:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ": ", pair[1]);
    }

    try {
      let response;
      if (isSliderCreateMode) {
        response = await SliderImage.createSliderImage(formData);
        message.success("Slider image created successfully");
      } else {
        response = await SliderImage.updateSliderImage(
          selectedSliderImage._id,
          formData
        );
        message.success("Slider image updated successfully");
      }

      console.log("API Response:", response); // Debug log

      sliderForm.resetFields();
      fetchSliderImages();
      setIsSliderModalVisible(false);
    } catch (err) {
      console.error("Error with slider image operation:", err);

      // แสดงข้อความข้อผิดพลาดที่ชัดเจนขึ้น
      const errorMessage =
        err.response?.data?.message || err.message || "Operation failed";
      message.error(`Operation failed: ${errorMessage}`);
    } finally {
      setUploadingSlider(false);
    }
  };

  const deleteSliderImage = async (id) => {
    try {
      await SliderImage.deleteSliderImage(id);
      message.success("Slider image deleted successfully");
      fetchSliderImages();
    } catch (err) {
      message.error("Delete failed");
    }
  };

  const createSliderImage = () => {
    setIsSliderCreateMode(true);
    setSelectedSliderImage(null);
    sliderForm.resetFields();
    // ตั้งค่าเริ่มต้น
    sliderForm.setFieldsValue({
      title: "",
      description: "",
      isActive: true,
      order: 0,
      image: [],
    });
    setIsSliderModalVisible(true);
  };

  const updateSliderImage = (record) => {
    setIsSliderCreateMode(false);
    setSelectedSliderImage(record);

    // ตั้งค่าฟอร์มด้วยข้อมูลที่มีอยู่
    sliderForm.setFieldsValue({
      title: record.title || "",
      description: record.description || "",
      isActive: record.isActive !== undefined ? record.isActive : true,
      order: record.order || 0,
      image: [], // ไม่ต้องใส่รูปเก่า เพราะจะให้เลือกใหม่
    });

    setIsSliderModalVisible(true);
  };

  // 5. เพิ่ม columns สำหรับ slider table
  const sliderImageColumns = [
    {
      title: "Order",
      dataIndex: "order",
      key: "order",
      sorter: (a, b) => a.order - b.order,
      width: 80,
    },
    // {
    //   title: "Title",
    //   dataIndex: "title",
    //   key: "title",
    //   render: (text) => text || "No Title",
    // },
    {
      title: "Preview",
      dataIndex: "image",
      key: "image",
      render: (url) => (url ? <Image width={100} src={url} /> : "No image"),
    },
    // {
    //   title: "Description",
    //   dataIndex: "description",
    //   key: "description",
    //   ellipsis: true,
    //   render: (text) => text || "No Description",
    // },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <>
          <Button
            icon={<EditOutlined />}
            onClick={() => updateSliderImage(record)}
            style={{ marginRight: 8 }}
          >
            Update
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteSliderImage(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];
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

  // Preview YouTube Video in Modal
  const showVideoPreview = () => {
    if (!masterFormData.videoUrl) {
      message.warning("กรุณาใส่ลิงก์ YouTube ก่อน");
      return;
    }

    setVideoPreviewVisible(true);
  };

  // Handle Master Form Submit (Create/Update)
  const handleMasterFormSubmit = async () => {
    setUploadingMaster(true);
    const formData = new FormData();

    // Append form values to FormData
    formData.append("mastername", masterFormData.mastername);
    formData.append("bio", masterFormData.bio || "");
    formData.append("specialization", masterFormData.specialization || "");
    formData.append("videoUrl", masterFormData.videoUrl || "");
    formData.append("description", masterFormData.description || "");

    // Append files if they exist
    if (masterFormData.image) {
      formData.append("image", masterFormData.image);
    }

    try {
      if (isEditingMaster) {
        // Update existing master
        await MasterImage.updateMasterImage(selectedMasterImage._id, formData);
        message.success("Master updated successfully");
      } else {
        // Create new master
        await MasterImage.createMasterImage(formData);
        message.success("Master created successfully");
      }

      // Reset form and fetch updated data
      setMasterFormData({
        mastername: "",
        bio: "",
        specialization: "",
        image: null,
        videoUrl: "",
      });
      fetchMasterImages();
      setIsMasterModalVisible(false);
    } catch (err) {
      console.error("Error with master operation:", err);
      message.error(
        "Operation failed. Please check if all required fields are filled."
      );
    } finally {
      setUploadingMaster(false);
    }
  };

  // Open modal for creating a new master
  const createMaster = () => {
    setIsEditingMaster(false);
    setSelectedMasterImage(null);
    setMasterFormData({
      mastername: "",
      bio: "",
      specialization: "",
      description: "",
      image: null,
      videoUrl: "",
    });
    setIsMasterModalVisible(true);
  };

  // Open modal for updating an existing master
  const updateMaster = (record) => {
    setIsEditingMaster(true);
    setSelectedMasterImage(record);
    setMasterFormData({
      mastername: record.mastername || "",
      bio: record.bio || "",
      specialization: record.specialization || "",
       description: record.description || "",
      image: record.image || null,
      videoUrl: record.videoUrl || "",
    });
    setIsMasterModalVisible(true);
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
      message.success("Master deleted successfully");
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

  // Columns for displaying images in the table
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
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  // Columns for displaying hero images in the table
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
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record._id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  // Columns for displaying master images in the table
  const masterImageColumns = [
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
      title: "YouTube Video",
      dataIndex: "videoUrl",
      key: "videoUrl",
      render: (url) =>
        url ? (
          <Button
            type="link"
            icon={<YoutubeOutlined />}
            onClick={() => window.open(url, "_blank")}
          >
            View Video
          </Button>
        ) : (
          "No video"
        ),
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
        <Space>
          <Button icon={<EditOutlined />} onClick={() => updateMaster(record)}>
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteMasterImage(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Image Setup" />

        <Content className="user-container">
          <Tabs defaultActiveKey="1">
            <TabPane tab="Hero Images" key="1">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
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
                </div>

                <Table
                  dataSource={heroImages}
                  columns={heroImageColumns(deleteHeroImage, updateHeroImage)}
                  rowKey="_id"
                  style={{ marginTop: 16 }}
                />
              </div>
            </TabPane>

            <TabPane tab="Master Profiles" key="2">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2>Master Profiles</h2>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={createMaster}
                  >
                    Add New Master
                  </Button>
                </div>

                <Table
                  dataSource={masterImages}
                  columns={masterImageColumns}
                  rowKey="_id"
                  style={{ marginTop: 16 }}
                />
              </div>
            </TabPane>

            <TabPane tab="QR Code Payment" key="3">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
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
                </div>

                <Table
                  dataSource={qrcodes}
                  columns={qrcodeImageColumns(
                    deleteQrcodeImage,
                    updateQrcodeImage
                  )}
                  rowKey="_id"
                  style={{ marginTop: 16 }}
                />
              </div>
            </TabPane>

            <TabPane tab="Class Catalogs" key="4">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2>Class Catalogs</h2>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={createClassCatalog}
                  >
                    Add New Class
                  </Button>
                </div>

                <Table
                  dataSource={classCatalogs}
                  columns={classCatalogColumns}
                  rowKey="_id"
                  style={{ marginTop: 16 }}
                />
              </div>
            </TabPane>
            <TabPane tab="Slider Images" key="5">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2>Slider Images</h2>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={createSliderImage}
                  >
                    Add New Slider Image
                  </Button>
                </div>

                <Table
                  dataSource={sliderImages}
                  columns={sliderImageColumns}
                  rowKey="_id"
                  style={{ marginTop: 16 }}
                />
              </div>
            </TabPane>
          </Tabs>
        </Content>
      </Layout>
      <Modal
        title={
          isSliderCreateMode ? "Add New Slider Image" : "Update Slider Image"
        }
        visible={isSliderModalVisible}
        onCancel={() => {
          setIsSliderModalVisible(false);
          sliderForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={sliderForm}
          layout="vertical"
          onFinish={handleSliderFormSubmit}
          initialValues={{
            isActive: true,
            order: 0,
          }}
        >
          {/* <Form.Item name="title" label="Title">
            <Input placeholder="Enter image title (optional)" />
          </Form.Item> */}

          {/* <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Enter image description (optional)"
            />
          </Form.Item> */}

          <Form.Item name="order" label="เลขลำดับการแสดงผล">
            <InputNumber
              min={0}
              placeholder="Enter display order (0 = first)"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          {/* แก้ไขส่วน Upload ให้ถูกต้อง */}
          <Form.Item
            name="image"
            label="Slider Image"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
            rules={
              isSliderCreateMode
                ? [{ required: true, message: "Please upload an image" }]
                : []
            }
          >
            <Upload
              name="image"
              listType="picture-card"
              beforeUpload={(file) => {
                // ตรวจสอบประเภทไฟล์
                const isImage = file.type.startsWith("image/");
                if (!isImage) {
                  message.error("You can only upload image files!");
                  return Upload.LIST_IGNORE;
                }

                // ตรวจสอบขนาดไฟล์ (5MB)
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error("Image must be smaller than 5MB!");
                  return Upload.LIST_IGNORE;
                }

                return false; // ป้องกันการอัพโหลดอัตโนมัติ
              }}
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
              loading={uploadingSlider}
              style={{ marginRight: 8 }}
            >
              {isSliderCreateMode ? "Create" : "Update"}
            </Button>
            <Button onClick={() => setIsSliderModalVisible(false)}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
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

      {/* Modal for Master Create/Update with YouTube link */}
      <Modal
        title={
          isEditingMaster ? "Edit Master Profile" : "Add New Master Profile"
        }
        visible={isMasterModalVisible}
        onCancel={() => setIsMasterModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: "24px" }}>
            <Title level={5}>Master Profile Information</Title>
            <Text type="secondary">
              Add information about the yoga master including profile image,
              YouTube video and biography.
            </Text>
          </div>

          <Form layout="vertical">
            <Form.Item
              label="Master Name"
              required
              tooltip="The name of the yoga master"
            >
              <Input
                value={masterFormData.mastername}
                onChange={(e) =>
                  setMasterFormData({
                    ...masterFormData,
                    mastername: e.target.value,
                  })
                }
                placeholder="Enter master's name"
              />
            </Form.Item>
            <Form.Item
              label="description"
              
              tooltip="The description of the yoga master"
            >
              <Input
                value={masterFormData.description}
                onChange={(e) =>
                  setMasterFormData({
                    ...masterFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter description"
              />
            </Form.Item>

            <Divider />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
              }}
            >
              <div style={{ flex: 1 }}>
                <Form.Item
                  label={
                    <Space>
                      <span>Profile Image</span>
                      <Tooltip title="Upload a professional photo of the yoga master">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                >
                  <Upload
                    accept="image/*"
                    showUploadList={!!masterFormData.image}
                    beforeUpload={(file) => {
                      setMasterFormData({ ...masterFormData, image: file });
                      return false;
                    }}
                    onRemove={() => {
                      setMasterFormData({ ...masterFormData, image: null });
                    }}
                    maxCount={1}
                    listType="picture-card"
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>

              <div style={{ flex: 1 }}>
                <Form.Item
                  label={
                    <Space>
                      <span>YouTube Video URL</span>
                      <Tooltip title="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=xxxxxxxxxxx)">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                >
                  <div style={{ display: "flex", marginBottom: "10px" }}>
                    <Input
                      value={masterFormData.videoUrl}
                      onChange={(e) =>
                        setMasterFormData({
                          ...masterFormData,
                          videoUrl: e.target.value,
                        })
                      }
                      placeholder="Enter YouTube video URL"
                      prefix={<YoutubeOutlined style={{ color: "red" }} />}
                      style={{ marginRight: "10px", flex: 1 }}
                    />
                    <Button
                      icon={<VideoCameraOutlined />}
                      onClick={showVideoPreview}
                      disabled={!masterFormData.videoUrl}
                    >
                      Preview
                    </Button>
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Supported formats: youtube.com/watch?v=XXXX, youtu.be/XXXX
                  </Text>
                </Form.Item>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <Button
                onClick={() => setIsMasterModalVisible(false)}
                style={{ marginRight: 8 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleMasterFormSubmit}
                loading={uploadingMaster}
                disabled={!masterFormData.mastername}
              >
                {isEditingMaster ? "Update Master" : "Add Master"}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Modal for YouTube Video Preview */}
      <Modal
        title="YouTube Video Preview"
        visible={videoPreviewVisible}
        onCancel={() => setVideoPreviewVisible(false)}
        footer={null}
        width={800}
        centered
      >
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%" /* 16:9 Aspect Ratio */,
            height: 0,
            overflow: "hidden",
            maxWidth: "100%",
          }}
        >
          <iframe
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
            src={getYoutubeEmbedUrl(masterFormData.videoUrl)}
            title="YouTube Video Preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
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
