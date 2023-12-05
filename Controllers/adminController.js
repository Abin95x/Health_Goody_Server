const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../Models/userModel")
const Doctor = require("../Models/doctorModel")
const cloudinary = require("../utils/cloudinary.js");
const Speciality = require("../Models/specialityModel");
const Appointment = require("../Models/appointmentModel.js")
const Payment = require("../Models/paymentModel.js")


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
        const details = await Doctor.findOne({ _id: id });
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

//speciality----------------------------------------------------------------------------------------------------------------------------------------------------------

const addSpeciality = async (req, res) => {
    try {
        const specialityName = req.body.value.speciality;
        const photo = req.body.value.photo;

        // Validate inputs
        if (!specialityName || !photo) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Additional validation for specialityName: No spaces allowed
        if (specialityName.includes(' ')) {
            return res.status(400).json({ message: 'Speciality name cannot contain spaces' });
        }

        const existing = await Speciality.findOne({
            speciality: { $regex: new RegExp('^' + specialityName + '$', 'i') },
        });

        if (existing) {
            return res.status(400).json({ message: 'Speciality already exists' });
        }

        // Add validation for photo URL, if needed

        const photoResult = await cloudinary.uploader.upload(photo, { folder: 'specialitysvg' });

        const newSpeciality = new Speciality({
            speciality: specialityName,
            photo: photoResult.secure_url, // Save the URL or any identifier you need
        });

        await newSpeciality.save();

        res.status(200).json({ success: true, message: 'Speciality added successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const specialList = async (req, res) => {
    try {
        const data = await Speciality.find()

        res.status(200).json({ data })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal server error' });
    }
}

const listUnlist = async (req, res) => {
    try {
        const { id } = req.query
        const data = await Speciality.findById(id)
        console.log(data, 'ddddddddddddddata')

        if (data.list) {
            data.list = false
        } else {
            data.list = true
        }

        await data.save()
        res.status(200).json({ message: "Successfull" })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal server error' });
    }
}

const editSpeciality = async (req, res) => {
    try {
        const id = req.body.values.id;
        const editedName = req.body.values.edit;
        const photo = req.body.values.photo;

        if (!id || !editedName) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const existing = await Speciality.findOne({
            speciality: { $regex: new RegExp('^' + editedName + '$', 'i') },
        });

        if (existing) {
            return res.status(400).json({ message: 'Speciality already exists' });
        }

        let photoUrl;

        if (photo) {
            const photoResult = await cloudinary.uploader.upload(photo, { folder: 'specialitysvg' });
            photoUrl = photoResult.secure_url;
        }

        const data = await Speciality.findOneAndUpdate(
            { _id: id },
            { speciality: editedName, ...(photoUrl && { photo: photoUrl }) },
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Speciality updated successfully', data });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const counts = async (req, res) => {
    try {
        const doctor = await Doctor.countDocuments()
        console.log(doctor)
        const user = await User.countDocuments()
        console.log(user, 'kkk')
        const totalAmount = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: { $toDouble: "$price" } }
                }
            }
        ]);

        const total = totalAmount.length > 0 ? totalAmount[0].total : 0;

        const thirtyPercent = total * 0.3;

        res.status(200).json({ doctor, user, total, thirtyPercent })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal server error' });

    }
}

const appointmentList = async (req, res) => {
    try {
        const data = await Appointment.find()
        res.status(200).json(data)

    } catch (error) {
        console.log(message)
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
    specialList,
    listUnlist,
    editSpeciality,
    counts,
    appointmentList


};
