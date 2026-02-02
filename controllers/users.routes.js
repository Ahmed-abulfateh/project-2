const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.js");
const isAdmin = require("../middleware/is-admin.js");

router.use(isAdmin);

router.get("/admin", usersController.getAllUsers);
router.get("/admin/:id/edit", usersController.getEditUser);
router.put("/admin/:id", usersController.updateUser);
router.delete("/admin/:id", usersController.deleteUser);

module.exports = router;
