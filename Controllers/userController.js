const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const sendEmail = require("../utils/nodeMailer.js")
const securePassword = require("../utils/securePassword.js")
const User = require("../Models/userModel")
const Doctor = require("../Models/doctorModel.js")
const Payment = require("../Models/paymentModel.js")
const Appointment = require("../Models/appointmentModel.js")
const Otp = require("../Models/userOtpModel.js")
const cloudinary = require("../utils/cloudinary.js")
const Speciality = require("../Models/specialityModel.js")
const moment = require('moment');
const AppointmentModel = require("../Models/appointmentModel.js")




let otpId


//user signup
const userRegistration = async (req, res) => {
    try {
        const { name, mobile, email, password1, photo } = req.body
        const spassword = await securePassword(password1)
        const emailExist = await User.findOne({ email: email })
        if (emailExist) {
            res.json({ alert: "This email is already exist", status: false })
        } else {
            const photoResult = await cloudinary.uploader.upload(photo, { folder: 'doctorPhotos' });
            const user = new User({
                name: name,
                email: email,
                mobile: mobile,
                password: spassword,
                photo: photoResult.secure_url
            })
            const userData = await user.save()
            otpId = await sendEmail(userData.name, userData.email, userData.id);
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
        const { id, name, email } = await User.findById({ _id: userId })
        const otpId = sendEmail(name, email, id)
        if (otpId) {
            res.status(200).json({
                message: `An OTP has been resent to ${email}.`,
            });
        }

    } catch (error) {
        console.log(error.message);
        res
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
                        res.status(401).json({
                            message: "password is incorrect"
                        });
                    }
                } else {
                    res.status(401).json({
                        message: "User is blocked by admin"
                    });
                }

            } else {
                res.status(401).json({
                    message: "Email is not verified",
                    status: false
                });
            }

        } else {
            res.status(401).json({ message: "User not registered" });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const setDetails = async (req, res) => {
    try {
        const { name, age, gender, mobile, _id } = req.body
        const user = await User.findOneAndUpdate({ _id: _id }, { $set: { name: name, age: age, gender: gender, mobile: mobile } }, { new: true });
        res.status(200).json({ message: "User details updated successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const doctorList = async (req, res) => {
    try {
        const { search, select, page, count, sort } = req.query;
        const query = { is_blocked: false };

        if (search) {
            query.$or = [
                { name: { $regex: new RegExp(search, 'i') } },
                { speciality: { $regex: new RegExp(search, 'i') } }
            ];
        }

        if (select) {
            query.speciality = select;
        }

        // Find total count of doctors without pagination
        const totalDoctorsCount = await Doctor.countDocuments(query);

        let doctors;

        if (sort === 'experience') {
            // If sorting by experience
            doctors = await Doctor.find(query)
                .sort({ experience: -1 })
                .skip((page - 1) * count)
                .limit(parseInt(count));
        } else {
            // Default sorting or other sorting options
            doctors = await Doctor.find(query)
                .skip((page - 1) * count)
                .limit(parseInt(count));
        }

        // Send response with doctors and total count
        res.status(200).json({ doctors, totalCount: totalDoctorsCount });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};





const getProfileData = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOne({ _id: id });
        res.status(200).json({ user });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



const doctorDetails = async (req, res) => {
    try {
        const { id } = req.params
        const details = await Doctor.findOne({ _id: id })
        res.status(200).json({ details })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const specialityList = async (req, res) => {
    try {
        const data = await Speciality.find({ list: true })
        res.status(200).json({ message: "successfull", data })
        // console.log(data)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Internal Server Error' });
    }
}



const slotList = async (req, res) => {
    try {
        const { id, date } = req.query;

        const selectedDate = moment.utc(date); // Set timezone to UTC

        const doctor = await Doctor.findById(id);

        // Filter slots based on the selected date
        const availableSlots = doctor.slots.filter((slot) => {
            const slotDate = moment.utc(slot.date); // Set timezone to UTC
            return slotDate.isSame(selectedDate, 'day');
        });


        res.status(200).json({ availableSlots });
    } catch (error) {
        // console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const stripe = require('stripe')('sk_test_51OIn6JSGxvp5pPKvKDRLk0eSdUKaFzQwiFZDUio38fbV98ejXN7w9rgokn1YyxAIWTxMXm6ev5NDqJluUQtp86kB00Fq1zjAPt');

const makePayment = async (req, res) => {
    try {
        console.log('1')
        const { price, date, _id, drId, select } = req.body;
        console.log('1')
        

        const selectedDate = moment(date);
        console.log('1')


        console.log(date, 'original date');
        console.log(selectedDate.format(), 'formatted date');

        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `http://localhost:3000/success?status=true&success&_id=${_id}&drId=${drId}&select=${select}&date=${selectedDate}`,
            cancel_url: `http://localhost:3000/success`,
        });
        console.log('1')

        res.status(200).json({ session });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'An error occurred while processing the payment.' });
    }
};


const makeAppointment = async (req, res) => {
    try {
        
        const { drId, _id, date, select } = req.body;
        const price = "299";

        // Creating a Payment
        const payment = new Payment({
            doctor: drId,
            user: _id,
            price: price,
        });

        const paymentData = await payment.save();

        // Update the booked status of the selected time slot
        const updatedDoctor = await Doctor.findOneAndUpdate(
            { _id: drId, 'slots.timeSlots.objectId': select },
            { $set: { 'slots.$[outer].timeSlots.$[inner].booked': true } },
            {
                arrayFilters: [
                    { 'outer._id': { $exists: true } },
                    { 'inner.objectId': select },
                ],
                new: true, // Return the modified document
            }
        );

        // Finding Selected Slot
        const selectedSlot = updatedDoctor.slots.reduce((found, ts) => {
            const slot = ts.timeSlots.find((item) => item.objectId === select);
            if (slot) {
                found = slot;
            }
            return found;
        }, null);

        // Creating an Appointment
        const appointment = new Appointment({
            doctor: drId,
            user: _id,
            paymentId: paymentData._id,
            slotId: select,
            consultationDate: date,
            start: selectedSlot.start,
            end: selectedSlot.end,
        });

        const appointmentData = await appointment.save();

        // Sending Response
        res.status(200).json({ paymentData, appointmentData ,message:'Payment is success'});

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const mongoose = require("mongoose")

const appointmentList = async (req, res) => {
    try {
        const id = req.query.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        const data = await AppointmentModel.aggregate([
            {
                $match: {
                    // Match appointments for a specific user id
                    'user': new mongoose.Types.ObjectId(id)
                }
            },
            { 
                $lookup: {
                    from: 'doctors',
                    localField: 'doctor',
                    foreignField: '_id',
                    as: 'doctorDetails'
                }
            },
            {
                $unwind: '$doctorDetails'
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: startIndex
            },
            {
                $limit: limit
            },
        ]);

        // Format dates using moment
        const formattedData = data.map(appointment => ({
            ...appointment,
            createdAt: moment(new Date(appointment.createdAt)).format('YYYY-MM-DD '),
            consultationDate: moment(new Date(appointment.consultationDate)).format('YYYY-MM-DD '),
            // Add more fields with date values if needed
        }));

        const date = new Date();
        const currentDate = moment(date).format('YYYY MM DD');
        const currentTime = moment(date).format('HH:mm');

        const totalItems = await AppointmentModel.countDocuments({ user: id });

        const results = {
            data: formattedData,
            currentDate: currentDate,
            currentTime: currentTime,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
            },
        };

        res.status(200).json(results);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.query;

        const data = await AppointmentModel.aggregate([
            {
                $lookup: {
                    from: 'doctors',
                    localField: 'doctor',
                    foreignField: '_id',
                    as: 'doctorDetails',
                },
            },
            {
                $unwind: '$doctorDetails',
            },
        ]);

        // Find the appointment in the data
        const appointment = data.find(appointment => appointment._id.toString() === id);
        console.log(appointment)

        // Update the booked field to false in the timeSlots array
        appointment.doctorDetails.slots[0].timeSlots.forEach(timeSlot => {
            timeSlot.booked = false;
        });

        // Save the updated doctorDetails back to the database
        await Doctor.findByIdAndUpdate(
            appointment.doctorDetails._id,
            { $set: { slots: appointment.doctorDetails.slots } },
            { new: true }
        );

        // Perform the appointment cancellation
        await AppointmentModel.findByIdAndDelete(id);

        res.status(200).json({ message: 'Appointment cancelled' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};















module.exports = {
    userRegistration,
    otpVerify,
    resendOtp,
    userLogin,
    setDetails,
    doctorList,
    doctorDetails,
    getProfileData,
    specialityList,
    slotList,
    makePayment,
    makeAppointment,
    appointmentList,
    cancelAppointment
}

