const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../Models/userModel")
const Doctor = require("../Models/doctorModel")

const adminLogin = async (req, res) => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        const { username, password } = req.body;

        if (username === adminUsername) {
            const passCheck = await bcrypt.compare(password, adminPassword);

            if (passCheck) {
                const admintoken = jwt.sign({ username }, process.env.SECRET_KEY_ADMIN, { expiresIn: "1h" });
                res.header('admintoken', admintoken);
                res.status(200).json({ admintoken, message: `Welcome ${username}` });
            } else {
                return res.status(400).json({ message: "Password is incorrect" });
            }
        } else {
            return res.status(400).json({ message: "Invalid username" });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

//user----------------------------------------------------------------------------------------------------------------------------------------------------------------------

const userList = async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).json({ users })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Internal Server Error" })

    }
}


const userDetails = async (req, res) => {
    try {
        const { id } = req.body
        const details = await User.findOne({ _id: id })

        res.status(200).json({ details })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


const blockUnblock = async (req, res) => {
    try {
        const { id } = req.body
        const user = await User.findOne({ _id: id })
        const blocked = user.is_blocked

        if (blocked) {
            user.is_blocked = false;
            await user.save();
        } else {
            user.is_blocked = true;
            await user.save();
        }
        res.status(200).json({ user });
        

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


// doctor---------------------------------------------------------------------------------------------------------------------------------------------------------------


const doctorList = async (req, res) => {
    try {
        const doctors = await Doctor.find({ is_blocked: false })
        res.status(200).json({ doctors })


    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


const doctorDetails = async (req, res) => {
    try {
        const { id } = req.body

        const details = await Doctor.findOne({ _id: id })

        res.status(200).json({ details })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const unVerified = async (req, res) => {
    try {
        const doctors = await Doctor.find({ is_blocked: true })
        res.status(200).json({ doctors })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


const blockApprove = async(req,res) =>{
    try{
        const { id } = req.body

        const doctor = await Doctor.findOne({ _id: id })

        const blocked = doctor.is_blocked


        if (blocked) {
            doctor.is_blocked = false;
            await doctor.save();
        } else {
            doctor.is_blocked = true;
            await doctor.save();
        }
        res.status(200).json({ doctor });



    }catch(error){
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });

    }
}






module.exports = {
    adminLogin,
    userList,
    userDetails,
    blockUnblock,
    doctorList,
    doctorDetails,
    unVerified,
    blockApprove


};
