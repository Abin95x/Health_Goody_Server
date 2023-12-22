const express = require("express")
const DoctorRoute = express()
const doctorController = require("../Controllers/doctorController")
const authDoc = require("../Middlewares/doctorAuth")

DoctorRoute.post("/doctorSignup", doctorController.doctorRegistration)

DoctorRoute.post("/doctorOtpVerify", doctorController.otpVerify)

DoctorRoute.post("/doctorResendOtp", doctorController.resendOtp)

DoctorRoute.post("/doctorLogin", doctorController.doctorLogin)

DoctorRoute.get("/specialityName", doctorController.specialityName)

DoctorRoute.post("/slotDetails", authDoc.authenticateDoctor, doctorController.slotCreation)

DoctorRoute.get("/slotList", authDoc.authenticateDoctor, doctorController.slotList)

DoctorRoute.get("/doctorDetails", authDoc.authenticateDoctor, doctorController.doctorDetails)

DoctorRoute.post("/editProfile", authDoc.authenticateDoctor, doctorController.editProfile)

DoctorRoute.get('/appointmentList', authDoc.authenticateDoctor, doctorController.appointmentList)

DoctorRoute.post('/createChat', authDoc.authenticateDoctor, doctorController.createChat)

DoctorRoute.post('/priscription', authDoc.authenticateDoctor, doctorController.addPriscription)


module.exports = DoctorRoute