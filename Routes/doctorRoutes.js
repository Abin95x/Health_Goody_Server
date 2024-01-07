const express = require("express")
const doctorRoute = express()
const doctorController = require("../Controllers/doctorController")
const authDoc = require("../Middlewares/doctorAuth")

doctorRoute.post("/doctorSignup", doctorController.doctorRegistration)

doctorRoute.post("/doctorOtpVerify", doctorController.otpVerify)

doctorRoute.post("/doctorResendOtp", doctorController.resendOtp)

doctorRoute.post("/doctorLogin", doctorController.doctorLogin)

doctorRoute.get("/forgotPass", doctorController.forgotPass)

doctorRoute.patch("/resetPassword", doctorController.resetPass)

doctorRoute.get("/specialityName", doctorController.specialityName)

doctorRoute.post("/slotDetails", authDoc.authenticateDoctor, doctorController.slotCreation)

doctorRoute.get("/slotList", authDoc.authenticateDoctor, doctorController.slotList)

doctorRoute.get("/doctorDetails", authDoc.authenticateDoctor, doctorController.doctorDetails)

doctorRoute.post("/editProfile", authDoc.authenticateDoctor, doctorController.editProfile)

doctorRoute.get('/appointmentList', authDoc.authenticateDoctor, doctorController.appointmentList)

doctorRoute.post('/createChat', authDoc.authenticateDoctor, doctorController.createChat)

doctorRoute.post('/priscription', authDoc.authenticateDoctor, doctorController.addPriscription)

doctorRoute.patch('/markAsDone', authDoc.authenticateDoctor, doctorController.markAsDone)

doctorRoute.post('/addMedicalReport', authDoc.authenticateDoctor, doctorController.addMedicalReport)

doctorRoute.get('/chartDetails', authDoc.authenticateDoctor, doctorController.chartDetails)

doctorRoute.get('/doctorReport', authDoc.authenticateDoctor, doctorController.doctorReport)

doctorRoute.get('/counts', authDoc.authenticateDoctor, doctorController.getCounts)

doctorRoute.patch('/reschedule', authDoc.authenticateDoctor, doctorController.reschedule)

doctorRoute.patch('/cancelAppointment', authDoc.authenticateDoctor, doctorController.cancelAppointment)

doctorRoute.patch("/editPhoto", authDoc.authenticateDoctor, doctorController.editPhoto)

doctorRoute.get("/getReviews", authDoc.authenticateDoctor, doctorController.getReviews)











module.exports = doctorRoute