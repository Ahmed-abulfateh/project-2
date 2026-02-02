const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.js");
const isAhmed = require("../middleware/is-ahmed.js");

router.use(isAhmed);

router.get("/admin", usersController.getAllUsers);
router.get("/admin/:id/edit", usersController.getEditUser);
router.put("/admin/:id", usersController.updateUser);
router.delete("/admin/:id", usersController.deleteUser);

module.exports = router;
