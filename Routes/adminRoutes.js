const express = require("express")
const AdminRoute = express()
const adminController = require("../Controllers/adminController")

AdminRoute.post("/adminLogin",adminController.adminLogin)

//user

AdminRoute.get("/userList",adminController.userList)

AdminRoute.post("/userDetails",adminController.userDetails)

AdminRoute.post("/blockUnblock",adminController.blockUnblock)

// doctor

AdminRoute.get("/doctorList",adminController.doctorList)

AdminRoute.post("/doctorDetails",adminController.doctorDetails)

AdminRoute.get("/unVerifiedList",adminController.unVerified)

AdminRoute.patch("/doctorblockUnblock",adminController.blockApprove)





module.exports = AdminRoute