const express = require("express")
const AdminRoute = express()
const adminController = require("../Controllers/adminController")
const auth = require("../Middlewares/adminAuth")

//login

AdminRoute.post("/adminLogin", adminController.adminLogin)

//user

AdminRoute.get("/userList", auth.authenticateAdmin, adminController.userList)

AdminRoute.post("/userDetails", auth.authenticateAdmin, adminController.userDetails)

AdminRoute.post("/blockUnblock", auth.authenticateAdmin, adminController.blockUnblock)

// doctor

AdminRoute.get("/doctorList", auth.authenticateAdmin, adminController.doctorList)

AdminRoute.post("/doctorDetails", auth.authenticateAdmin, adminController.doctorDetails)

AdminRoute.patch("/doctorblockUnblock", auth.authenticateAdmin, adminController.blockApprove)

AdminRoute.get("/unVerifiedList", auth.authenticateAdmin, adminController.unVerified)

AdminRoute.get("/unVerifiedDetails", auth.authenticateAdmin, adminController.unVerifiedDoctorDetails)

AdminRoute.patch("/adminVerify", auth.authenticateAdmin, adminController.adminVerify)

//speciality

AdminRoute.post("/addSpeciality", auth.authenticateAdmin, adminController.addSpeciality)

AdminRoute.get("/specialityList", auth.authenticateAdmin, adminController.specialList)

AdminRoute.patch("/listUnlist", auth.authenticateAdmin, adminController.listUnlist)

AdminRoute.patch("/editSpeciality", auth.authenticateAdmin, adminController.editSpeciality)

AdminRoute.get("/counts", auth.authenticateAdmin, adminController.counts)

AdminRoute.get("/appointmentList", auth.authenticateAdmin, adminController.appointmentList)


AdminRoute.get('/adminReport', auth.authenticateAdmin, adminController.adminReport)




module.exports = AdminRoute