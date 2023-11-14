const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const sendEmail = require("../utils/nodeMailer.js")
const securePassword = require("../utils/securePassword.js")
const User = require("../Models/userModel")
const Otp = require("../Models/userOtpModel.js")

let otpId


//user signup
const userRegistration = async (req, res) => {
    try {
        const { name, mobile, email, password1, password2 } = req.body

        // if (password1 !== password2) {
        //     res.json({ userData, alert: "Registration falied", status: false })
        // }

        const spassword = await securePassword(password1)
        const emailExist = await User.findOne({ email: email })
        if (emailExist) {
            res.json({ alert: "This email is already exist", status: false })
        } else {
            const user = new User({
                name: name,
                email: email,
                mobile: mobile,
                password: spassword,
            })

            const userData = await user.save()
            otpId = await sendEmail(userData.name, userData.email, userData.id);
            // res.json({ userData, alert: "Registration", status: true, otpId: otpId, })
            res.status(201).json({
                status: true,
                userData,
                otpId: otpId,
            });
        }
    } catch (error) {
        res.status(500).json({ status: "Internal Server Error" });
    }
}


//user otp verifying
const otpVerify = async (req, res) => {
    try {
        const { otp, userId } = req.body
        const otpData = await Otp.find({ userId: userId })
        
        const { expiresAt } = otpData[otpData.length - 1];
        const correctOtp = otpData[otpData.length - 1].otp;
        if (otpData && expiresAt < Date.now()) {
            return res.status(401).json({ message: "Email OTP has expired" });
        }
        if (correctOtp === otp) {
            await Otp.deleteMany({ userId: userId });
            await User.updateOne(
                { _id: userId },
                { $set: { otp_verified: true } }
            );
            res.status(200).json({
                status: true,
                message: "User registered successfully,You can login now",
            });
        } else {
            res.status(400).json({ status: false, message: "Incorrect OTP" });
        }

    } catch (error) {
        res.status(400).json({ status: false, message: "Incorrect OTP" });
    }

}


//user resend otp
const resendOtp = async (req, res) => {
    try {
        const { userId } = req.body
        console.log(userId, "ooooooooooooooooooooo");
        const { id, name, email } = await User.findById({ _id: userId })
        const otpId = sendEmail(name, email, id)
        if (otpId) {
            res.status(200).json({
                message: `An OTP has been resent to ${email}.`,
            });
        }

    } catch (error) {
        console.log(error.message);
        return res
            .status(500)
            .json({ message: "Failed to send OTP. Please try again later." });
    }

}


//user login
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        const emailExist = await User.findOne({ email: email })
        if (emailExist) {
            if (emailExist.otp_verified) {
                if (emailExist.is_blocked === false) {
                    const passCheck = await bcrypt.compare(password, emailExist.password)
                    if (passCheck) {
                        const usertoken = jwt.sign({ userId: emailExist._id }, process.env.SECRET_KEY_USER, { expiresIn: "1h" })
                        res.header('usertoken', usertoken);

                        // res.json({ userData: emailExist, token, status: true })
                        res.status(200).json({ userData: emailExist, usertoken, message: `Welome ${emailExist.name}` });
                    } else {
                        // res.json({ alert: "password is incorrect" })
                        return res.status(401).json({
                            message: "password is incorrect"
                        });
                    }
                } else {
                    return res.status(403).json({
                        message: "User is blocked by admin"
                    });
                }

            } else {
                return res.status(401).json({
                    message: "Email is not verified",
                    status: false
                });
            }

        } else {
            return res.status(400).json({ message: "User not registered" });
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


module.exports = {
    userRegistration,
    otpVerify,
    resendOtp,
    userLogin
}

