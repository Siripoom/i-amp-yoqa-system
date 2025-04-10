const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

router.post("/classes", classController.createClass);
router.get("/classes", classController.getAllClasses);
router.get("/classes/:id", classController.getClassById);
router.put("/classes/:id", classController.updateClass);
router.delete("/classes/:id", classController.deleteClass);

router.post("/class-catalog", classController.createClassCatalog);
router.get("/class-catalog", classController.getAllClassCatalogs);
router.put("/class-catalog/:id", classController.updateClassCatalog);
router.delete("/class-catalog/:id", classController.deleteClassCatalog);

module.exports = router;
