const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../Models/userModel")
const Doctor = require("../Models/doctorModel")
const Speciality = require("../Models/specialityModel")
const cloudinary = require("../utils/cloudinary.js");
const speciality = require("../Models/specialityModel");


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

//verified doctoers list

const doctorList = async (req, res) => {
    try {
        const doctors = await Doctor.find({ admin_verify: true, otp_verified: true })
        res.status(200).json({ doctors })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

//doctor details

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




// block doctor

const blockApprove = async (req, res) => {
    try {
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

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });

    }
}

//unverified doctor list

const unVerified = async (req, res) => {
    try {
        const doctors = await Doctor.find({ otp_verified: true, admin_verify: false });
        res.status(200).json({ doctors })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

//doctor details

const unVerifiedDoctorDetails = async (req, res) => {
    try {
        const { id } = req.query; // Retrieve from query parameters
        const details = await Doctor.findOne({ _id: id});
        res.status(200).json({ details });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

//admin verify

const adminVerify = async (req, res) => {
    try {
        const { id } = req.query; 
        const doctor = await Doctor.findById(id);
        const verified = doctor.admin_verify;

        if (verified === false) {
            doctor.admin_verify = true;
            await doctor.save();
            return res.status(200).json({ doctor });
        } else {
            return res.status(400).json({ message: 'Doctor is already verified' });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const addSpeciality = async (req, res) => {
    try {
        const specialityName = req.body.value.speciality;
        const photo = req.body.value.photo;

        const existing = await Speciality.findOne({
            speciality: { $regex: new RegExp('^' + specialityName + '$', 'i') },
        });

        console.log(existing, "uuuuuuuuu");

        if (existing) {
            return res.status(400).json({ message: 'Speciality already exists' });
        }

        const photoResult = await cloudinary.uploader.upload(photo, { folder: 'specialitysvg' });

        const newSpeciality = new Speciality({
            speciality: specialityName,
            photo: photoResult.secure_url, // Save the URL or any identifier you need
        });

        await newSpeciality.save();

        res.status(200).json({ success: true, message: 'Speciality added successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const specialList = async(req,res) =>{
    try{
        const data = Speciality.find()
        console.log(data)
        res.status(200).json({data})

    }catch(error){
        console.log(error.message)
        res.status(500).json({ message: 'Internal server error' });
    }
}








module.exports = {
    adminLogin,
    userList,
    userDetails,
    blockUnblock,
    doctorList,
    doctorDetails,
    blockApprove,
    unVerified,
    unVerifiedDoctorDetails,
    adminVerify,
    addSpeciality,
    specialList


};
