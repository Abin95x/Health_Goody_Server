const express = require("express")
const userRoute = express()
const authUser = require("../Middlewares/userAuth")
const userController = require("../Controllers/userController")
console.log("route logged")

userRoute.post("/userSignup", userController.userRegistration);

userRoute.post("/otpVerify", userController.otpVerify)

userRoute.post("/resendOtp", userController.resendOtp)

userRoute.post("/userLogin", userController.userLogin)

userRoute.post("/setDetails", authUser.authenticateUser, userController.setDetails)

userRoute.get('/profileData/:id', authUser.authenticateUser, userController.getProfileData)

userRoute.get("/doctorList", authUser.authenticateUser, userController.doctorList)

userRoute.get("/doctorDetails/:id", authUser.authenticateUser, userController.doctorDetails)

userRoute.get("/specialityList", userController.specialityList)

userRoute.get("/slotList", authUser.authenticateUser, userController.slotList)

userRoute.post("/makePayment", authUser.authenticateUser, userController.makePayment)

userRoute.post("/makeAppointment", authUser.authenticateUser, userController.makeAppointment)

userRoute.get("/appointmentList", authUser.authenticateUser, userController.appointmentList)

userRoute.patch("/cancelAppointment",authUser.authenticateUser,userController.cancelAppointment)

userRoute.post("/createChat",authUser.authenticateUser,userController.createChat)






module.exports = userRoute

