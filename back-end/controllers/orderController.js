const Order = require("../models/order");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = {
      buyer_id: req.body.buyer_id,
      items: req.body.items,
      address: req.body.address,
      status: req.body.status || "pending",
      order_date: req.body.order_date || Date.now(),
    };

    // Ensure address is provided for general products
    const hasGeneralProduct = orderData.items.some(
      (item) => item.product_type === "general"
    );
    if (hasGeneralProduct && !orderData.address) {
      return res
        .status(400)
        .json({ message: "Address is required for general products." });
    }

    const order = new Order(orderData);
    await order.save();
    res.status(201).json({ status: "success", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("buyer_id", "name email") // Populate specific buyer fields
      .populate("items.product_id"); // Populate product/course data

    res.status(200).json({ status: "success", orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyer_id", "name email")
      .populate("items.product_id");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ status: "success", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an order by ID
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ status: "success", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an order by ID
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res
      .status(200)
      .json({ status: "success", message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
