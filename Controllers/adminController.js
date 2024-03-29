const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../Models/userModel")
const Doctor = require("../Models/doctorModel")
const cloudinary = require("../utils/cloudinary.js");
const Speciality = require("../Models/specialityModel");
const Appointment = require("../Models/appointmentModel.js")
const Payment = require("../Models/paymentModel.js");



const adminLogin = async (req, res) => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const { username, password } = req.body;

        if (username === adminUsername) {
            const passCheck = await bcrypt.compare(password, adminPassword);

            if (passCheck) {
                const admintoken = jwt.sign({ username ,role:'admin' }, process.env.SECRET_KEY_ADMIN, { expiresIn: "1h" });
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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const totalItems = await User.countDocuments();


        const users = await User.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);


        const results = {
            users: users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
            },
        };

        res.status(200).json(results);

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const totalItems = await Doctor.countDocuments();

        const doctors = await Doctor.find({ admin_verify: true, otp_verified: true })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const results = {
            doctors: doctors,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
            },
        };

        res.status(200).json(results);

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const totalItems = await Doctor.countDocuments();

        const doctors = await Doctor.find({ otp_verified: true, admin_verify: false })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const results = {
            doctors: doctors,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
            },
        };

        res.status(200).json(results);


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
        const { limit, currentPage, } = req.query;

        const page = parseInt(currentPage);
        const lim = parseInt(limit);

        const startIndex = (page - 1) * lim;

        const totalItems = await Speciality.countDocuments();
        const data = await Speciality.find().skip(startIndex).limit(lim).sort({ speciality: 1 });


        const results = {
            data: data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / lim),
                totalItems: totalItems,
            },
        };

        res.status(200).json(results);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const listUnlist = async (req, res) => {
    try {
        const { id } = req.query
        const data = await Speciality.findById(id)

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
            if (photo) {
            const photoResult = await cloudinary.uploader.upload(photo, { folder: 'specialitysvg' });
            photoUrl = photoResult.secure_url;
        }
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

        const user = await User.countDocuments()

        const totalAmount = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: { $toDouble: "$price" } }
                }
            }
        ]);

        const total = totalAmount.length > 0 ? Math.round(totalAmount[0].total) : 0;
        const thirtyPercent = Math.round(total * 0.3);
        res.status(200).json({ doctor, user, total, thirtyPercent })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal server error' });

    }
}

const appointmentList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const totalItems = await Appointment.countDocuments(); // Calculate total items

        const data = await Appointment.find()
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order (latest first)
            .skip((page - 1) * limit)
            .limit(limit);


        const results = {
            data: data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
            },
        };

        res.status(200).json(results);
    } catch (error) {
        console.error(error.message); // Log error for debugging
        res.status(500).json({ error: 'Failed to fetch appointments' }); // Send error response
    }
};


const adminReport = async (req, res) => {
    try {
        const currentDate = new Date();
        // const currentMonth = currentDate.getMonth() + 1;
        const monthName = currentDate.toLocaleString("default", { month: "long" });
        let date = new Date();
        let year = date.getFullYear();
        let currentYear = new Date(year, 0, 1);
        let users = []
        let usersByYear = await User.aggregate([
            {
                $match: { createdAt: { $gte: currentYear }, is_blocked: { $ne: true } },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%m", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        for (let i = 1; i <= 12; i++) {
            let result = true;
            for (let j = 0; j < usersByYear.length; j++) {
                result = false;
                if (usersByYear[j]._id == i) {
                    users.push(usersByYear[j]);
                    break;
                } else {
                    result = true;
                }
            }
            if (result) users.push({ _id: i, count: 0 });
        }
        let usersData = [];
        for (let i = 0; i < users.length; i++) {
            usersData.push(users[i].count);
        }

        let doctors = []
        let doctorsByYear = await Doctor.aggregate([
            {
                $match: { createdAt: { $gte: currentYear }, is_blocked: { $ne: true } },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%m", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        for (let i = 1; i <= 12; i++) {
            let result = true;
            for (let j = 0; j < doctorsByYear.length; j++) {
                result = false;
                if (doctorsByYear[j]._id == i) {
                    doctors.push(doctorsByYear[j]);
                    break;
                } else {
                    result = true;
                }
            }
            if (result) doctors.push({ _id: i, count: 0 });
        }
        let doctorsData = [];
        for (let i = 0; i < doctors.length; i++) {
            doctorsData.push(doctors[i].count);
        }

        const result = {
            currentMonthName: monthName,
            doctorsData,
            usersData,
        }

        res.status(200).json(result);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: "Internal Server Error" });

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
    appointmentList,
    adminReport,


};
