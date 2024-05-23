const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const sendEmail = require("../utils/nodeMailer.js")
const securePassword = require("../utils/securePassword.js")
const moment = require('moment');
const cloudinary = require("../utils/cloudinary.js")
const nodemailer = require("nodemailer")
const User = require("../Models/userModel")
const Doctor = require("../Models/doctorModel.js")
const Payment = require("../Models/paymentModel.js")
const Otp = require("../Models/userOtpModel.js")
const Speciality = require("../Models/specialityModel.js")
const AppointmentModel = require("../Models/appointmentModel.js")
const ChatModal = require("../Models/chatModal.js")
const PrescriptionModel = require('../Models/prescriptionModel.js')
const ReportModel = require("../Models/medicalReportModel.js")
const NotificationModel = require('../Models/notificationModel.js')

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
        console.log(email);
        console.log(password);
        const emailExist = await User.findOne({ email: email })
        if (emailExist) {
            if (emailExist.otp_verified) {
                if (emailExist.is_blocked === false) {
                    const passCheck = await bcrypt.compare(password, emailExist.password)
                    if (passCheck) {
                        const usertoken = jwt.sign({ userId: emailExist._id ,role:'user' }, 
                            process.env.SECRET_KEY_USER, 
                            { expiresIn: "1h" })
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


const forgotPass = async (req, res) => {
    try {
        const { email } = req.query
        const secret = process.env.SECRET_KEY_USER
        const isUser = await User.findOne({ email: email });
        if (!isUser) {
            return res.status(401).json({ message: "User is not regitered" });
        }
        const token = jwt.sign({ id: isUser._id }, secret, { expiresIn: "5m" });
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Forgot password",
            text: `https://healthgoody.vercel.app/resetpassword/${isUser._id}/${token}`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error("Error sending email:", error);
                return res
                    .status(500)
                    .json({ message: "Failed to send email for password reset." });
            } else {
                console.log("Email sent:", info.response);
                return res
                    .status(200)
                    .json({ message: "Email sent successfully for password reset." });

            }
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const resetPass = async (req, res) => {
    try {
        const { id, token, password } = req.query
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json({ message: "user not found" });
        }
        try {
            const verify = jwt.verify(token, process.env.SECRET_KEY_USER);
            if (verify) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await User.findByIdAndUpdate(
                    { _id: id },
                    { $set: { password: hashedPassword } }
                );
                return res
                    .status(200)
                    .json({ message: "Successfully changed password" });
            }
        } catch (error) {
            console.log(error.message);
            return res.status(400).json({ message: "Something wrong with token" });
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const setDetails = async (req, res) => {
    try {
        const { name, age, gender, mobile, _id } = req.body
        const user = await User.findOneAndUpdate({ _id: _id }, { $set: { name: name, age: age, gender: gender, mobile: mobile } }, { new: true });

        const notification = new NotificationModel({
            text: 'Profile details successfully edited',
            userId: _id,
        })

        await notification.save()
        res.status(200).json({ message: "User details updated successfully", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const doctorList = async (req, res) => {
    try {
        const { search, select, page, count, sort } = req.query;
        const query = { is_blocked: false, admin_verify: true }; // Added admin_verify condition

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
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const stripe = require('stripe')('sk_test_51OIn6JSGxvp5pPKvKDRLk0eSdUKaFzQwiFZDUio38fbV98ejXN7w9rgokn1YyxAIWTxMXm6ev5NDqJluUQtp86kB00Fq1zjAPt');

const makePayment = async (req, res) => {
    try {

        const { price, date, _id, drId, select } = req.body;

        const selectedDate = moment(date);

        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `https://healthgoody.vercel.app/success?status=true&success&_id=${_id}&drId=${drId}&select=${select}&date=${selectedDate}`,
            cancel_url: `https://healthgoody.vercel.app/`,
            // success_url: `http://localhost:3000/success?status=true&success&_id=${_id}&drId=${drId}&select=${select}&date=${selectedDate}`,
            // cancel_url: `http://localhost:3000/`,

        });


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
        const appointment = new AppointmentModel({
            doctor: drId,
            user: _id,
            paymentId: paymentData._id,
            slotId: select,
            consultationDate: date,
            start: selectedSlot.start,
            end: selectedSlot.end,
        });

        const appointmentData = await appointment.save();

        const notification = new NotificationModel({
            text: 'Your appointment successfully done',
            userId: _id,
        })

        await notification.save()

        // Sending Response
        res.status(200).json({ paymentData, appointmentData, message: 'Payment is success' });

    } catch (error) {
        console.log(error.message);
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
        // const endIndex = page * limit;

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
        const { id, userId, paymentId } = req.query;
        // Delete the payment
        await Payment.findByIdAndDelete(paymentId);

        // Update the appointment status to Cancelled
        await AppointmentModel.findByIdAndUpdate(id, { $set: { status: 'Cancelled' } }, { new: true });

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

        // Refund the user's wallet
        await User.findByIdAndUpdate(userId, { $inc: { wallet: 299 } }, { new: true });

        const cancellationNotification = new NotificationModel({
            text: 'Your appointment has been cancelled successfully.',
            userId: userId,
        });

        // Save the appointment cancellation notification
        await cancellationNotification.save();


        const creditNotification = new NotificationModel({
            text: 'Amount credited to your wallet.',
            userId: userId,
        });

        // Save the amount credited notification
        await creditNotification.save();


        res.status(200).json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const createChat = async (req, res) => {
    try {

        const { userid, doctorid } = req.body

        const chatExist = await ChatModal.findOne({
            members: { $all: [userid, doctorid] }
        })
        if (!chatExist) {
            const newChat = new ChatModal({
                members: [userid.toString(), doctorid.toString()]
            })
            await newChat.save()
            res.status(200).json({ message: 'Your are connected' })

        }

        const notification = new NotificationModel({
            text: 'Your chat created successfully',
            userId: userid,
        })

        await notification.save()

        res.status(200).json({ message: 'You are connected' })

    } catch (error) {
        console.log(error.message)
    }
}

const medicineDetails = async (req, res) => {
    try {
        const { id } = req.query
        const result = await PrescriptionModel.find({ appointmentId: id })
        res.status(200).json({ result })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const reportDetails = async (req, res) => {
    try {
        const { id } = req.query
        const result = await ReportModel.findOne({ appointmentId: id })

        res.status(200).json({ result })

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const walletPayment = async (req, res) => {
    try {
        const { date, _id, drId, select } = req.body;
        const price = 299;
        const userData = await User.findById(_id);

        if (!userData) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (userData.wallet < price) {
            res.status(200).json({ message: 'Insufficient Balance' });
        } else {
            // Decrease the wallet amount
            let newWalletAmount = userData.wallet - price;

            // Update the user's wallet with the new amount
            await User.findByIdAndUpdate(_id, { wallet: newWalletAmount });

            const selectDate = moment(date);
            const payment = new Payment({
                doctor: drId,
                user: _id,
                price: price,
            });

            const paymentData = await payment.save();

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

            const selectedSlot = updatedDoctor.slots.reduce((found, ts) => {
                const slot = ts.timeSlots.find((item) => item.objectId === select);
                if (slot) {
                    found = slot;
                }
                return found;
            }, null);

            const appointment = new AppointmentModel({
                doctor: drId,
                user: _id,
                paymentId: paymentData._id,
                slotId: select,
                consultationDate: selectDate,
                start: selectedSlot.start,
                end: selectedSlot.end,
            });

            const appointmentData = await appointment.save();

            const notification = new NotificationModel({
                text: 'Your appointment successfully done',
                userId: _id,
            })

            await notification.save()

            res.status(201).json({ paymentData, appointmentData, message: 'Payment is success' });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const addReview = async (req, res) => {
    try {
        const { userId, drId, review, rating } = req.body;
        const doctor = await Doctor.findById(drId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Check if the user has already posted a review for this doctor
        const existingReview = doctor.review.find(
            (r) => r.postedBy.toString() === userId.toString()
        );

        if (existingReview) {
            return res.status(400).json({ message: 'Review already submitted by this user' });
        }

        const newReview = {
            text: review,
            star: rating,
            postedBy: userId,
            postedDate: new Date(),
        };

        doctor.review.push(newReview);
        await doctor.save(); // Save the updated doctor object

        const notification = new NotificationModel({
            text: 'Your review successfuly added',
            userId: userId,
        })

        await notification.save()

        res.status(200).json({ message: 'Review added successfully', review: newReview });


    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getReview = async (req, res) => {
    try {
        const { id } = req.query;
        const doctor = await Doctor.findById(id).populate({
            path: 'review.postedBy',
            model: 'User',
            select: 'name email photo' // You can choose which user details to select
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Sort reviews by the 'postedDate' property in descending order
        doctor.review.sort((a, b) => b.postedDate - a.postedDate);

        const reviewDetails = doctor.review.map(review => ({
            text: review.text,
            star: review.star,
            postedBy: {
                name: review.postedBy.name,
                email: review.postedBy.email,
                photo: review.postedBy.photo
            },
            postedDate: review.postedDate
        }));

        res.status(200).json({ reviews: reviewDetails });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};



const editPhoto = async (req, res) => {
    try {
        const { img, _id } = req.body
        const photoResult = await cloudinary.uploader.upload(img, { folder: 'doctorPhotos' });
        const user = await User.findByIdAndUpdate(
            _id,
            { $set: { photo: photoResult.secure_url } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const notification = new NotificationModel({
            text: 'Profile picture updated successfully',
            userId: _id,
        })

        await notification.save()

        res.status(200).json({ message: "Profile picture updated successfully", user });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });

    }
}

const getNotification = async (req, res) => {
    try {
        const { id } = req.query;
        const page = req.query.page || 1;
        const perPage = 10;

        const data = await NotificationModel.find({ userId: id })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ createdAt: -1 });

        const totalNotifications = await NotificationModel.countDocuments({ userId: id });
        const totalPages = Math.ceil(totalNotifications / perPage);

        if (!data) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ notifications: data, totalPages });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getNotification };









module.exports = {
    userRegistration,
    otpVerify,
    resendOtp,
    userLogin,
    forgotPass,
    resetPass,
    setDetails,
    doctorList,
    doctorDetails,
    getProfileData,
    specialityList,
    slotList,
    makePayment,
    makeAppointment,
    appointmentList,
    cancelAppointment,
    createChat,
    medicineDetails,
    reportDetails,
    walletPayment,
    addReview,
    getReview,
    editPhoto,
    getNotification,
}

