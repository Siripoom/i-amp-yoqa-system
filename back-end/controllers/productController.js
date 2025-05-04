const Product = require("../models/product");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig"); // Import the Supabase client
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Product creation (with Supabase file upload)
exports.createProduct = async (req, res) => {
  try {
    let imageUrl = req.body.image; // Default to the image URL from the request body

    // If a file is uploaded, upload it to Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname); // Get the file extension
      const fileName = `${Date.now()}${ext}`; // Unique file name
      const folderPath = "products"; // The folder where files will be stored

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("store") // Replace with your Supabase bucket name
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // Construct the public URL for the uploaded image
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // Prepare product data
    const productData = {
      sessions: req.body.sessions,
      price: req.body.price,
      duration: req.body.duration,
      image: imageUrl, // Store the public URL of the image
    };

    // Save product to the database
    const product = new Product(productData);
    await product.save();

    res.status(201).json({ status: "success", data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Product update (with Supabase file upload)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imageUrl = product.image; // Default to the existing image URL

    if (imageUrl && typeof imageUrl === "string") {
      try {
        const Url = imageUrl;

        // Extract file name directly from the image URL (after the last '/')
        const fileName = Url.split("/").pop().split("?")[0]; // Get the last part of the URL, remove query params if present

        if (fileName) {
          // Correct file path: Remove any spaces between "products" and the file name
          const { error } = await supabase.storage
            .from("store") // Replace with your Supabase bucket name
            .remove([`products/${fileName}`]); // Remove the space between "products" and fileName

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res
              .status(500)
              .json({ message: "Error deleting file from storage" });
          }
        } else {
          console.error("Image URL structure is incorrect:", imageUrl);
          return res
            .status(400)
            .json({ message: "Invalid image URL structure" });
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res
          .status(500)
          .json({ message: "Error processing the image URL" });
      }
    } else {
      console.warn("No image URL found for the product, skipping deletion");
    }

    // If a new file is uploaded, upload it to Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname); // Get the file extension
      const fileName = `${Date.now()}${ext}`; // Unique file name
      const folderPath = "products"; // The folder where files will be stored

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("store") // Replace with your Supabase bucket name
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // Construct the public URL for the uploaded image
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // Update product data
    product.sessions = req.body.sessions || product.sessions;
    product.price = req.body.price || product.price;
    product.duration = req.body.duration || product.duration;
    product.image = imageUrl;

    // Save updated product to the database
    await product.save();

    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ price: 1 }); 
    res.status(200).json({
      status: "success",
      productCount: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ensure product.image exists and is a valid string before attempting to split it
    if (product.image && typeof product.image === "string") {
      try {
        const imageUrl = product.image;

        // Extract file name directly from the image URL (after the last '/')
        const fileName = imageUrl.split("/").pop().split("?")[0]; // Get the last part of the URL, remove query params if present

        if (fileName) {
          // Correct file path: Remove any spaces between "products" and the file name
          const { error } = await supabase.storage
            .from("store") // Replace with your Supabase bucket name
            .remove([`products/${fileName}`]); // Remove the space between "products" and fileName

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res
              .status(500)
              .json({ message: "Error deleting file from storage" });
          }
        } else {
          console.error("Image URL structure is incorrect:", imageUrl);
          return res
            .status(400)
            .json({ message: "Invalid image URL structure" });
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res
          .status(500)
          .json({ message: "Error processing the image URL" });
      }
    } else {
      console.warn("No image URL found for the product, skipping deletion");
    }

    // Delete the product from the database
    await Product.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json({ status: "success", message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: error.message });
  }
};
