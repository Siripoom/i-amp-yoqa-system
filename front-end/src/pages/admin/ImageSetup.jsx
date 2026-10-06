import { colors } from "../../theme/tokens.js";
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

import { apiErrorMessage } from "../../utils/apiError";

const ImageSetup = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [masterImages, setMasterImages] = useState([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMaster, setUploadingMaster] = useState(false);
  const [isHeroUpdateModalVisible, setIsHeroUpdateModalVisible] =
    useState(false);
  const [selectedHeroImage, setSelectedHeroImage] = useState(null);

  // Get user role from localStorage for permission control
  const userRole = localStorage.getItem("role");

  // Define permissions based on role
  const canCreate = userRole === "SuperAdmin" || userRole === "Admin" || userRole === "Accounting";
  const canEdit = userRole === "SuperAdmin" || userRole === "Admin" || userRole === "Accounting";
  const canDelete = userRole === "SuperAdmin";

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
        message.error("โหลดรูปภาพสไลด์ไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Error fetching slider images:", err);
      message.error("โหลดรูปภาพสไลด์ไม่สำเร็จ");
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
      message.error("กรุณาเลือกรูปภาพที่จะอัปโหลด");
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
        message.success("เพิ่มรูปภาพสไลด์สำเร็จ");
      } else {
        response = await SliderImage.updateSliderImage(
          selectedSliderImage._id,
          formData
        );
        message.success("แก้ไขรูปภาพสไลด์สำเร็จ");
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
      message.error(`ดำเนินการไม่สำเร็จ: ${errorMessage}`);
    } finally {
      setUploadingSlider(false);
    }
  };

  const deleteSliderImage = async (id) => {
    if (!canDelete) {
      message.warning("คุณไม่มีสิทธิ์ลบรูปภาพสไลด์");
      return;
    }

    try {
      await SliderImage.deleteSliderImage(id);
      message.success("ลบรูปภาพสไลด์สำเร็จ");
      fetchSliderImages();
    } catch {
      message.error("ลบไม่สำเร็จ");
    }
  };

  const createSliderImage = () => {
    if (!canCreate) {
      message.warning("คุณไม่มีสิทธิ์สร้างรูปภาพสไลด์");
      return;
    }

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
    if (!canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขรูปภาพสไลด์");
      return;
    }

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
      title: "ลำดับ",
      dataIndex: "order",
      key: "order",
      sorter: (a, b) => a.order - b.order,
      width: 80,
    },
    // {
    //   title: "ชื่อ",
    //   dataIndex: "title",
    //   key: "title",
    //   render: (text) => text || "No Title",
    // },
    {
      title: "ตัวอย่าง",
      dataIndex: "image",
      key: "image",
      render: (url) => (url ? <Image width={100} src={url} /> : "ไม่มีรูปภาพ"),
    },
    // {
    //   title: "รายละเอียด",
    //   dataIndex: "description",
    //   key: "description",
    //   ellipsis: true,
    //   render: (text) => text || "No Description",
    // },
    {
      title: "สถานะ",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      render: (record) => (
        <Space>
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={() => updateSliderImage(record)}
            >
              อัปเดต
            </Button>
          )}
          {canDelete ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteSliderImage(record._id)}
            >
              ลบ
            </Button>
          ) : (
            <Tooltip title="ไม่มีสิทธิ์ลบ">
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled
              >
                ลบ
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];
  const fetchClassCatalogs = async () => {
    try {
      const response = await ImageCatalog.getImageCatalog();
      if (response.status === "success" && Array.isArray(response.data)) {
        setClassCatalogs(response.data);
      } else {
        message.error("โหลดรายการคลาสไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Error fetching class catalogs:", err);
      message.error("โหลดรายการคลาสไม่สำเร็จ");
    }
  };

  const fetchQrcodeImages = async () => {
    try {
      const response = await QrcodePayment.getQrcodePayment();
      if (response.status === "success" && Array.isArray(response.data)) {
        setQrcodes(response.data);
      } else {
        message.error("โหลดรูปคิวอาร์โค้ดไม่สำเร็จ");
      }
    } catch {
      message.error("โหลดรูปคิวอาร์โค้ดไม่สำเร็จ");
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
        message.error("โหลดรูปภาพหลักไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Error fetching hero images:", err);
      message.error("โหลดรูปภาพหลักไม่สำเร็จ");
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
        message.error("โหลดรูปครูผู้สอนไม่สำเร็จ");
      }
    } catch {
      message.error("โหลดรูปครูผู้สอนไม่สำเร็จ");
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
        message.success("แก้ไขข้อมูลครูผู้สอนสำเร็จ");
      } else {
        // Create new master
        await MasterImage.createMasterImage(formData);
        message.success("เพิ่มครูผู้สอนสำเร็จ");
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
        apiErrorMessage(err, "Operation failed. Please check if all required fields are filled.")
      );
    } finally {
      setUploadingMaster(false);
    }
  };

  // Open modal for creating a new master
  const createMaster = () => {
    if (!canCreate) {
      message.warning("คุณไม่มีสิทธิ์สร้างโปรไฟล์ครูผู้สอน");
      return;
    }

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
    if (!canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขโปรไฟล์ครูผู้สอน");
      return;
    }

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
        message.success("เพิ่มคลาสในรายการสำเร็จ");
      } else {
        // Update existing class catalog
        await ImageCatalog.updateImageCatalog(
          selectedClassCatalog._id,
          formData
        );
        message.success("แก้ไขรายการคลาสสำเร็จ");
      }

      // Reset form and fetch updated data
      form.resetFields();
      fetchClassCatalogs();
      setIsClassModalVisible(false);
    } catch (error) {
      console.error("Error with class catalog operation:", error);
      message.error(
        apiErrorMessage(error, "Operation failed. Please check if all required fields are filled.")
      );
    } finally {
      setUploadingClass(false);
    }
  };

  // Delete Class Catalog
  const deleteClassCatalog = async (id) => {
    if (!canDelete) {
      message.warning("คุณไม่มีสิทธิ์ลบรายการคลาส");
      return;
    }

    try {
      await ImageCatalog.deleteImageCatalog(id);
      message.success("ลบรายการคลาสสำเร็จ");
      fetchClassCatalogs();
    } catch {
      message.error("ลบไม่สำเร็จ");
    }
  };

  // Open modal for creating a new class catalog
  const createClassCatalog = () => {
    if (!canCreate) {
      message.warning("คุณไม่มีสิทธิ์สร้างรายการคลาส");
      return;
    }

    setIsClassCreateMode(true);
    setSelectedClassCatalog(null);
    form.resetFields();
    setIsClassModalVisible(true);
  };

  // Open modal for updating an existing class catalog
  const updateClassCatalog = (record) => {
    if (!canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขรายการคลาส");
      return;
    }

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
        message.success("แก้ไขคิวอาร์โค้ดสำเร็จ");
      } else {
        await QrcodePayment.createQrcodePayment(formData);
        message.success("อัปโหลดคิวอาร์โค้ดสำเร็จ");
      }
      fetchQrcodeImages();
      setIsQrcodeModalVisible(false);
      setSelectedQrcodeImage(null);
      info.onSuccess?.({ status: "success" });
    } catch (error) {
      message.error(apiErrorMessage(error, "QR Code upload failed"));
      info.onError?.(error);
    } finally {
      setUploadingQrcode(false);
    }
  };

  const deleteQrcodeImage = async (id) => {
    if (!canDelete) {
      message.warning("คุณไม่มีสิทธิ์ลบคิวอาร์โค้ด");
      return;
    }

    try {
      await QrcodePayment.deleteQrcodePayment(id);
      message.success("ลบคิวอาร์โค้ดสำเร็จ");
      fetchQrcodeImages();
    } catch {
      message.error("ลบคิวอาร์โค้ดไม่สำเร็จ");
    }
  };

  const updateQrcodeImage = (record) => {
    if (!canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขคิวอาร์โค้ด");
      return;
    }

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
        message.success("แก้ไขรูปภาพหลักสำเร็จ");
      } else {
        await HeroImage.createHeroImage(formData);
        message.success("อัปโหลดรูปภาพหลักสำเร็จ");
      }
      fetchHeroImages();
      setIsHeroUpdateModalVisible(false);
      setSelectedHeroImage(null);
      info.onSuccess?.({ status: "success" });
    } catch (error) {
      message.error(apiErrorMessage(error, "อัปโหลดรูปภาพหลักไม่สำเร็จ"));
      info.onError?.(error);
    } finally {
      setUploadingHero(false);
    }
  };

  // Delete Hero Image
  const deleteHeroImage = async (id) => {
    if (!canDelete) {
      message.warning("คุณไม่มีสิทธิ์ลบรูปภาพหลัก");
      return;
    }

    try {
      await HeroImage.deleteHeroImage(id);
      message.success("ลบรูปภาพหลักสำเร็จ");
      fetchHeroImages();
    } catch {
      message.error("ลบไม่สำเร็จ");
    }
  };

  // Delete Master Image
  const deleteMasterImage = async (id) => {
    if (!canDelete) {
      message.warning("คุณไม่มีสิทธิ์ลบโปรไฟล์ครูผู้สอน");
      return;
    }

    try {
      await MasterImage.deleteMasterImage(id);
      message.success("ลบครูผู้สอนสำเร็จ");
      fetchMasterImages();
    } catch {
      message.error("ลบไม่สำเร็จ");
    }
  };

  // Update Hero Image (opens the modal)
  const updateHeroImage = (record) => {
    if (!canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขรูปภาพหลัก");
      return;
    }

    setSelectedHeroImage(record);
    setIsHeroUpdateModalVisible(true);
  };

  // Columns for displaying images in the table
  const classCatalogColumns = [
    {
      title: "ชื่อคลาส",
      dataIndex: "classname",
      key: "classname",
    },
    {
      title: "ตัวอย่าง",
      dataIndex: "image",
      key: "image",
      render: (url) => (url ? <Image width={100} src={url} /> : "ไม่มีรูปภาพ"),
    },
    {
      title: "รายละเอียด",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "จัดการ",
      key: "action",
      render: (record) => (
        <Space>
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={() => updateClassCatalog(record)}
            >
              อัปเดต
            </Button>
          )}
          {canDelete ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteClassCatalog(record._id)}
            >
              ลบ
            </Button>
          ) : (
            <Tooltip title="ไม่มีสิทธิ์ลบ">
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled
              >
                ลบ
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const qrcodeImageColumns = (onDelete, onUpdate) => [
    {
      title: "ตัวอย่าง",
      dataIndex: "image",
      key: "image",
      render: (url) => <Image width={100} src={url} />,
    },
    {
      title: "จัดการ",
      key: "action",
      render: (record) => (
        <Space>
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={() => onUpdate(record)}
            >
              อัปเดต
            </Button>
          )}
          {canDelete ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record._id)}
            >
              ลบ
            </Button>
          ) : (
            <Tooltip title="ไม่มีสิทธิ์ลบ">
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled
              >
                ลบ
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Columns for displaying hero images in the table
  const heroImageColumns = (onDelete, onUpdate) => [
    {
      title: "ตัวอย่าง",
      dataIndex: "image",
      key: "image",
      render: (url) => <Image width={100} src={url} />,
    },
    {
      title: "จัดการ",
      key: "action",
      render: (record) => (
        <Space>
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={() => onUpdate(record)}
            >
              อัปเดต
            </Button>
          )}
          {canDelete ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record._id)}
            >
              ลบ
            </Button>
          ) : (
            <Tooltip title="ไม่มีสิทธิ์ลบ">
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled
              >
                ลบ
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Columns for displaying master images in the table
  const masterImageColumns = [
    {
      title: "ชื่อครูผู้สอน",
      dataIndex: "mastername",
      key: "mastername",
    },
    {
      title: "ตัวอย่าง",
      dataIndex: "image",
      key: "image",
      render: (url) => <Image width={100} src={url} />,
    },
    {
      title: "วิดีโอ YouTube",
      dataIndex: "videoUrl",
      key: "videoUrl",
      render: (url) =>
        url ? (
          <Button
            type="link"
            icon={<YoutubeOutlined />}
            onClick={() => window.open(url, "_blank")}
          >
            ดูวิดีโอ
          </Button>
        ) : (
          "ไม่มีวิดีโอ"
        ),
    },
    {
      title: "รายละเอียด",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },

    {
      title: "จัดการ",
      key: "action",
      render: (record) => (
        <Space>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => updateMaster(record)}>
              แก้ไข
            </Button>
          )}
          {canDelete ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteMasterImage(record._id)}
            >
              ลบ
            </Button>
          ) : (
            <Tooltip title="ไม่มีสิทธิ์ลบ">
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled
              >
                ลบ
              </Button>
            </Tooltip>
          )}
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
        <Header title="จัดการรูปภาพ" />

        <Content className="user-container">
          {/* แสดงข้อความแจ้งเตือนสำหรับ role ที่มีข้อจำกัด */}
          {userRole === "Admin" && (
            <div style={{
              background: "var(--color-warning-soft)",
              border: "1px solid var(--color-warning-soft)",
              borderRadius: "4px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "14px",
              color: colors["warning"]
            }}>
              <strong>⚠️ Admin Role:</strong> คุณดู เพิ่ม และแก้ไขรูปภาพได้ แต่ลบรูปภาพไม่ได้
            </div>
          )}

          {userRole === "Accounting" && (
            <div style={{
              background: "var(--color-info-soft)",
              border: "1px solid var(--color-info-soft)",
              borderRadius: "4px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "14px",
              color: colors["info"]
            }}>
              <strong>ℹ️ Accounting Role:</strong> คุณดู เพิ่ม และแก้ไขรูปภาพได้ แต่ลบรูปภาพไม่ได้
            </div>
          )}

          <Tabs defaultActiveKey="1">
            <TabPane tab="รูปภาพหลัก" key="1">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2>รูปภาพหลัก</h2>
                  {canCreate && (
                    <Upload
                      customRequest={handleHeroUpload}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />} loading={uploadingHero}>
                        อัปโหลดรูปภาพหลัก
                      </Button>
                    </Upload>
                  )}
                </div>

                <Table
                  dataSource={heroImages}
                  columns={heroImageColumns(deleteHeroImage, updateHeroImage)}
                  rowKey="_id"
                  style={{ marginTop: 16 }}
                />
              </div>
            </TabPane>

            <TabPane tab="โปรไฟล์ครูผู้สอน" key="2">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2>โปรไฟล์ครูผู้สอน</h2>
                  {canCreate && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={createMaster}
                    >
                      เพิ่มครูผู้สอน
                    </Button>
                  )}
                </div>

                <Table
                  dataSource={masterImages}
                  columns={masterImageColumns}
                  rowKey="_id"
                  style={{ marginTop: 16 }}
                />
              </div>
            </TabPane>

            <TabPane tab="คิวอาร์โค้ดชำระเงิน" key="3">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2>คิวอาร์โค้ดชำระเงิน</h2>
                  {canCreate && (
                    <Upload
                      customRequest={handleQrcodeUpload}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />} loading={uploadingQrcode}>
                        อัปโหลดคิวอาร์โค้ด
                      </Button>
                    </Upload>
                  )}
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

            <TabPane tab="รายการคลาส" key="4">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2>รายการคลาส</h2>
                  {canCreate && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={createClassCatalog}
                    >
                      เพิ่มคลาสใหม่
                    </Button>
                  )}
                </div>

                <Table
                  dataSource={classCatalogs}
                  columns={classCatalogColumns}
                  rowKey="_id"
                  style={{ marginTop: 16 }}
                />
              </div>
            </TabPane>
            <TabPane tab="รูปภาพสไลด์" key="5">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2>รูปภาพสไลด์</h2>
                  {canCreate && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={createSliderImage}
                    >
                      เพิ่มรูปภาพสไลด์
                    </Button>
                  )}
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
          isSliderCreateMode ? "Add New Slider Image" : "แก้ไขรูปภาพสไลด์"
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
          {/* <Form.Item name="title" label="ชื่อ">
            <Input placeholder="ระบุชื่อรูปภาพ (ไม่บังคับ)" />
          </Form.Item> */}

          {/* <Form.Item name="description" label="รายละเอียด">
            <Input.TextArea
              rows={3}
              placeholder="ระบุรายละเอียดรูปภาพ (ไม่บังคับ)"
            />
          </Form.Item> */}

          <Form.Item name="order" label="เลขลำดับการแสดงผล">
            <InputNumber
              min={0}
              placeholder="ระบุลำดับการแสดง (0 = ลำดับแรก)"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="สถานะใช้งาน"
            valuePropName="checked"
          >
            <Switch checkedChildren="ใช้งาน" unCheckedChildren="ไม่ใช้งาน" />
          </Form.Item>

          {/* แก้ไขส่วน Upload ให้ถูกต้อง */}
          <Form.Item
            name="image"
            label="รูปภาพสไลด์"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
            rules={
              isSliderCreateMode
                ? [{ required: true, message: "กรุณาอัปโหลดรูปภาพ" }]
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
                  message.error("อัปโหลดได้เฉพาะไฟล์รูปภาพ");
                  return Upload.LIST_IGNORE;
                }

                // ตรวจสอบขนาดไฟล์ (5MB)
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
                  return Upload.LIST_IGNORE;
                }

                return false; // ป้องกันการอัพโหลดอัตโนมัติ
              }}
              maxCount={1}
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>อัปโหลด</div>
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
              ยกเลิก
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      {/* Modal for QR Code Update */}
      <Modal
        title="อัปเดตคิวอาร์โค้ด"
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
            อัปเดตคิวอาร์โค้ด
          </Button>
        </Upload>
      </Modal>

      {/* Modal for Hero Image Update */}
      <Modal
        title="อัปเดตภาพหลัก"
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
            อัปเดตภาพหลัก
          </Button>
        </Upload>
      </Modal>

      {/* Modal for Master Create/Update with YouTube link */}
      <Modal
        title={
          isEditingMaster ? "แก้ไขโปรไฟล์ครูผู้สอน" : "เพิ่มโปรไฟล์ครูผู้สอน"
        }
        visible={isMasterModalVisible}
        onCancel={() => setIsMasterModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: "24px" }}>
            <Title level={5}>ข้อมูลโปรไฟล์ครูผู้สอน</Title>
            <Text type="secondary">
              Add information about the yoga master including profile image,
              YouTube video and biography.
            </Text>
          </div>

          <Form layout="vertical">
            <Form.Item
              label="ชื่อครูผู้สอน"
              required
              tooltip="ชื่อครูโยคะ"
            >
              <Input
                value={masterFormData.mastername}
                onChange={(e) =>
                  setMasterFormData({
                    ...masterFormData,
                    mastername: e.target.value,
                  })
                }
                placeholder="ระบุชื่อครูผู้สอน"
              />
            </Form.Item>
            <Form.Item
              label="description"

              tooltip="รายละเอียดครูโยคะ"
            >
              <Input
                value={masterFormData.description}
                onChange={(e) =>
                  setMasterFormData({
                    ...masterFormData,
                    description: e.target.value,
                  })
                }
                placeholder="ระบุรายละเอียด"
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
                      <span>รูปโปรไฟล์</span>
                      <Tooltip title="อัปโหลดรูปครูโยคะ">
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
                      <div style={{ marginTop: 8 }}>อัปโหลด</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>

              <div style={{ flex: 1 }}>
                <Form.Item
                  label={
                    <Space>
                      <span>ลิงก์วิดีโอ YouTube</span>
                      <Tooltip title="ระบุลิงก์วิดีโอ YouTube">
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
                      placeholder="ระบุลิงก์วิดีโอ YouTube"
                      prefix={<YoutubeOutlined style={{ color: "red" }} />}
                      style={{ marginRight: "10px", flex: 1 }}
                    />
                    <Button
                      icon={<VideoCameraOutlined />}
                      onClick={showVideoPreview}
                      disabled={!masterFormData.videoUrl}
                    >
                      ตัวอย่าง
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
                ยกเลิก
              </Button>
              <Button
                type="primary"
                onClick={handleMasterFormSubmit}
                loading={uploadingMaster}
                disabled={!masterFormData.mastername}
              >
                {isEditingMaster ? "แก้ไขครูผู้สอน" : "เพิ่มครูผู้สอน"}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Modal for YouTube Video Preview */}
      <Modal
        title="ตัวอย่างวิดีโอ YouTube"
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
            title="ตัวอย่างวิดีโอ YouTube"
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
          <Form.Item name="classname" label="ชื่อคลาส">
            <Input placeholder="ระบุชื่อคลาส" />
          </Form.Item>

          <Form.Item name="description" label="รายละเอียด">
            <TextArea rows={4} placeholder="ระบุรายละเอียดคลาส" />
          </Form.Item>

          <Form.Item name="image" label="รูปคลาส" valuePropName="file">
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>อัปโหลด</div>
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
              ยกเลิก
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ImageSetup;
