const express = require("express");
const multer = require("../Middleware/Multer-config");
const router = express.Router();
const { authenticateUser } = require("../Middleware/Auth"); // Adjust this path as needed
const bookCtrl = require("../Controllers/Book");

router.get("/", bookCtrl.getAllBooks);
router.post("/", authenticateUser, multer.upload, multer.optimizeImage, bookCtrl.createBook);
router.post("/:id/rating", authenticateUser, bookCtrl.rateBook);
router.get("/bestrating", bookCtrl.bestRating);
router.get("/:id", bookCtrl.getOneBook);
router.put("/:id", authenticateUser, multer.upload, multer.optimizeImage, bookCtrl.modifyBook);
router.delete("/:id", authenticateUser, bookCtrl.deleteBook);

module.exports = router;