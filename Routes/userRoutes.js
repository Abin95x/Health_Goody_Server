const express = require("express")
const userRoute = express()
const auth = require("../Middlewares/userAuth")
const userController = require("../Controllers/userController")
console.log("route logged")

/**
 * @swagger
 * /userSignup:
 *   post:
 *     tags:
 *       - User
 *     summary: User Registration
 *     description: Registers a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userData:
 *                   type: object
 *                   description: User data after registration.
 *                 alert:
 *                   type: string
 *                   description: Registration alert message.
 *                 status:
 *                   type: boolean
 *                   description: Registration status (true for success, false for failure).
 *       400:
 *         description: Email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alert:
 *                   type: string
 *                   description: Alert message indicating that the email already exists.
 *                 status:
 *                   type: boolean
 *                   description: Status indicating registration failure due to existing email.
 *       500:
 *         description: Internal Server Error.
 */
userRoute.post("/userSignup", userController.userRegistration);



userRoute.post("/otpVerify",userController.otpVerify)



userRoute.post("/resendOtp",userController.resendOtp)



/**
 * @swagger
 * /userLogin:
 *   post:
 *     tags:
 *       - User
 *     summary: User Login
 *     description: Log in with user credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userData:
 *                   type: object
 *                   description: User data after successful login.
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication.
 *                 status:
 *                   type: boolean
 *                   description: Login status (true for success).
 *       400:
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alert:
 *                   type: string
 *                   description: Alert message indicating invalid credentials (incorrect email or password).
 *       500:
 *         description: Internal Server Error.
 */
userRoute.post("/userLogin",userController.userLogin)







module.exports = userRoute
    
