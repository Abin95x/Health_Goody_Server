const express = require("express")
const DoctorRoute = express()
const doctorController = require("../Controllers/doctorController")
const authDoc = require("../Middlewares/doctorAuth")

DoctorRoute.post("/doctorSignup",doctorController.doctorRegistration)

DoctorRoute.post("/doctorOtpVerify",doctorController.otpVerify)

DoctorRoute.post("/doctorResendOtp",doctorController.resendOtp)

DoctorRoute.post("/doctorLogin",doctorController.doctorLogin)


module.exports = DoctorRoute