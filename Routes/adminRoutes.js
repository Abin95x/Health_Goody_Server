const express = require("express")
const AdminRoute = express()
const adminController = require("../Controllers/adminController")

AdminRoute.post("/adminLogin",adminController.adminLogin)




module.exports = AdminRoute