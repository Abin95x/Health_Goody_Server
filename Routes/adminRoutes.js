const express = require("express")
const AdminRoute = express()
const adminController = require("../Controllers/adminController")
const auth = require("../Middlewares/adminAuth")

AdminRoute.post("/adminLogin",adminController.adminLogin)

//user

AdminRoute.get("/userList",auth.authenticateAdmin,adminController.userList)

AdminRoute.post("/userDetails",auth.authenticateAdmin,adminController.userDetails)

AdminRoute.post("/blockUnblock",auth.authenticateAdmin,adminController.blockUnblock)

// doctor

AdminRoute.get("/doctorList",auth.authenticateAdmin,adminController.doctorList)

AdminRoute.post("/doctorDetails",auth.authenticateAdmin,adminController.doctorDetails)

AdminRoute.get("/unVerifiedList",auth.authenticateAdmin,adminController.unVerified)

AdminRoute.patch("/doctorblockUnblock",auth.authenticateAdmin,adminController.blockApprove)





module.exports = AdminRoute