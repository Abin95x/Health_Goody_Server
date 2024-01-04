const express = require("express")
const adminRoute = express()
const adminController = require("../Controllers/adminController")
const auth = require("../Middlewares/adminAuth")

//login

adminRoute.post("/adminLogin", adminController.adminLogin)

//user

adminRoute.get("/userList", auth.authenticateAdmin, adminController.userList)

adminRoute.post("/userDetails", auth.authenticateAdmin, adminController.userDetails)

adminRoute.post("/blockUnblock", auth.authenticateAdmin, adminController.blockUnblock)

// doctor

adminRoute.get("/doctorList", auth.authenticateAdmin, adminController.doctorList)

adminRoute.post("/doctorDetails", auth.authenticateAdmin, adminController.doctorDetails)

adminRoute.patch("/doctorblockUnblock", auth.authenticateAdmin, adminController.blockApprove)

adminRoute.get("/unVerifiedList", auth.authenticateAdmin, adminController.unVerified)

adminRoute.get("/unVerifiedDetails", auth.authenticateAdmin, adminController.unVerifiedDoctorDetails)

adminRoute.patch("/adminVerify", auth.authenticateAdmin, adminController.adminVerify)

//speciality

adminRoute.post("/addSpeciality", auth.authenticateAdmin, adminController.addSpeciality)

adminRoute.get("/specialityList", auth.authenticateAdmin, adminController.specialList)

adminRoute.patch("/listUnlist", auth.authenticateAdmin, adminController.listUnlist)

adminRoute.patch("/editSpeciality", auth.authenticateAdmin, adminController.editSpeciality)

adminRoute.get("/counts", auth.authenticateAdmin, adminController.counts)

adminRoute.get("/appointmentList", auth.authenticateAdmin, adminController.appointmentList)


adminRoute.get('/adminReport', auth.authenticateAdmin, adminController.adminReport)




module.exports = adminRoute