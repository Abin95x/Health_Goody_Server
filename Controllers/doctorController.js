const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const sendEmail = require("../utils/doctorMailer.js")
const securePassword = require("../utils/securePassword.js")
const Otp = require("../Models/doctorOtpModel.js")
const Doctor = require("../Models/doctorModel.js")
const cloudinary = require("../utils/cloudinary.js")
const nodemailer = require("nodemailer")
const Speciality = require("../Models/specialityModel.js")
const { ObjectId } = require("mongodb");
const moment = require('moment');
const AppointmentModel = require("../Models/appointmentModel.js")
const chatModal = require("../Models/chatModal.js")
const prescriptionModal = require('../Models/prescriptionModel.js')
const User = require("../Models/userModel")
const MedicalReportModel = require("../Models/medicalReportModel.js")
const Payment = require("../Models/paymentModel.js");
const mongoose = require("mongoose")
const NotificationModel = require('../Models/notificationModel.js')



let otpId


const doctorRegistration = async (req, res) => {
    try {

        const { name, mobile, email, speciality, password1, photo, certificates } = req.body

        const spassword = await securePassword(password1)
        const emailExist = await Doctor.findOne({ email: email })
        if (emailExist) {
            res.status(409).json({ status: "Partner already registered with this email" });
        } else {
            const photoResult = await cloudinary.uploader.upload(photo, { folder: 'doctorPhotos' });

            // Upload multiple certificates to Cloudinary
            const certificateResults = await Promise.all(certificates.map(async (certificate) => {
                return await cloudinary.uploader.upload(certificate, { folder: 'doctorsCertificates' });
            }));

            const doctor = new Doctor({
                name: name,
                mobile: mobile,
                email: email,
                speciality: speciality,
                password: spassword,
                photo: photoResult.secure_url,
                certificates: certificateResults.map(result => result.secure_url)
            })

            const doctorData = await doctor.save()
            otpId = await sendEmail(
                doctorData.name,
                doctorData.email,
                doctorData._id,
            )
            res.status(201).json({
                status: `Otp has sent to ${email}`, doctorData: doctorData, otpId: otpId,
            });

        }

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ status: "Internal Server Error" });
    }
}


//doctor otp verifying
const otpVerify = async (req, res) => {
    try {
        const { otp, doctorId } = req.body
        const otpData = await Otp.find({ doctorId: doctorId })
        const { expiresAt } = otpData[otpData.length - 1];
        const correctOtp = otpData[otpData.length - 1].otp;
        if (otpData && expiresAt < Date.now()) {
            return res.status(401).json({ message: "Email OTP has expired" });
        }
        if (correctOtp === otp) {
            await Otp.deleteMany({ doctorId: doctorId });
            await Doctor.updateOne(
                { _id: doctorId },
                { $set: { otp_verified: true } }
            );
            res.status(200).json({
                status: true,
                message: "Doctor registered successfully,You can login now",
            });
        } else {
            res.status(400).json({ status: false, message: "Incorrect OTP" });
        }

    } catch (error) {
        res.status(400).json({ status: false, message: "Incorrect OTP" });
    }

}


//doctor resend otp
const resendOtp = async (req, res) => {
    try {
        const { doctorId } = req.body
        const { id, name, email } = await Doctor.findById({ _id: doctorId })
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


const doctorLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        const emailExist = await Doctor.findOne({ email: email })
        if (emailExist) {
            if (emailExist.otp_verified) {
                if (emailExist.admin_verify) {
                    if (emailExist.is_blocked === false) {
                        const passCheck = await bcrypt.compare(password, emailExist.password)
                        if (passCheck) {
                            const doctortoken = jwt.sign({ doctorId: emailExist._id ,role:'doctor'}, 
                            process.env.SECRET_KEY_DOCTOR,
                             { expiresIn: "1h" })
                             
                            res.header('doctortoken', doctortoken);
                            res.status(200).json({ doctorData: emailExist, doctortoken, message: `Welome ${emailExist.name}` });
                        } else {
                            res.status(401).json({
                                message: "password is incorrect"
                            });
                        }
                    } else {
                        res.status(401).json({
                            message: "You are blocked by admin"
                        });
                    }

                } else {
                    res.status(401).json({
                        message: "Admin needs to verify you"
                    });
                }

            } else {
                otpId = await sendEmail(
                    emailExist.name,
                    emailExist.email,
                    emailExist._id,
                )

                res.status(403).json({
                    message: "Email is not verified",
                    status: false,
                    otpId: otpId,
                });
            }
        } else {
            return res.status(404).json({ message: "Doctor not registered" });
        }

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ status: "Internal Server Error" });
    }
}

const forgotPass = async (req, res) => {
    try {
        const { email } = req.query
        const secret = process.env.SECRET_KEY_DOCTOR
        const isDoctor = await Doctor.findOne({ email: email });
        if (!isDoctor) {
            return res.status(401).json({ message: "Doctor is not regitered" });
        }
        const token = jwt.sign({ id: isDoctor._id }, secret, { expiresIn: "5m" });
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
            text: `https://healthgoody.vercel.app/doctor/resetpassword/${isDoctor._id}/${token}`,
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
        console.log(id, token, password);
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(401).json({ message: "Doctor not found" });
        }
        try {
            const verify = jwt.verify(token, process.env.SECRET_KEY_DOCTOR);
            if (verify) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await Doctor.findByIdAndUpdate(
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

const specialityName = async (req, res) => {
    try {
        const data = await Speciality.find({ list: true })
        res.status(200).json({ data })

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ status: "Internal Server Error" });

    }
}



// Function to generate time slots
const generateTimeSlots = (start, end, duration) => {
    const timeSlots = [];
    const slotDuration = parseInt(duration);

    const [hours, minutes] = start.split(":");
    let currentTime = new Date();
    currentTime.setHours(hours);
    currentTime.setMinutes(minutes);

    const [hrs, min] = end.split(":");
    const ends = new Date();
    ends.setHours(hrs);
    ends.setMinutes(min);

    while (currentTime < ends) {
        const endTime = new Date(currentTime);
        endTime.setMinutes(endTime.getMinutes() + slotDuration);

        if (endTime <= ends) {
            const objectId = new ObjectId();
            const endingTime = moment(endTime);
            const staring = new Date(currentTime);
            const startingTime = moment(staring);
            timeSlots.push({
                start: startingTime.format("HH:mm"),
                end: endingTime.format("HH:mm"),
                booked: false,
                objectId: objectId.toString(),
            });
        }

        currentTime = endTime;
    }

    return timeSlots;
};


const slotCreation = async (req, res) => {
    try {
        const { startTime, endTime, slotDuration, date } = req.body.formData;
        if (!date) {
            return res.status(200).send({
                success: false,
                message: "Invalid date.",
            });
        }

        const id = req.body.id;

        // Ensure date is a valid JavaScript Date object
        const parsedDate = new Date(date);

        const currentDate = new Date();
        if (parsedDate < currentDate) {
            return res.status(200).send({
                success: false,
                message: "Invalid date. Slot creation allowed only for future dates.",
            });
        }
        // Ensure startTime is less than endTime
        if (startTime >= endTime) {
            return res.status(200).send({
                success: false,
                message: "Invalid time range. Starting time must be less than ending time.",
            });
        }

        const isExist = await Doctor.findOne({
            _id: id,
            slots: {
                $elemMatch: {
                    $and: [
                        { date: parsedDate },
                        { startTime: startTime },
                        { endTime: endTime }
                    ]
                }
            }
        });

        if (isExist) {
            return res.status(200).send({
                success: false,
                message: "This time already exists",
            });
        }

        // Rest of the code remains unchanged

        const timeSlots = generateTimeSlots(startTime, endTime, slotDuration);

        await Doctor.updateOne(
            { _id: id },
            {
                $push: {
                    slots: {
                        date: parsedDate, // Use the parsed date here
                        startTime,
                        endTime,
                        slotDuration,
                        timeSlots,
                    },
                },
            }
        );


        res.status(200).send({
            success: true,
            message: "Slot created successfully",
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "Internal Server Error" });
    }
};




const slotList = async (req, res) => {
    try {
        const id = req.query.id;
        const doctor = await Doctor.findById(id);
        const allSlots = doctor.slots;

        // Reverse the order of slots
        const reversedSlots = allSlots.slice().reverse();

        res.status(200).json({
            data: reversedSlots,
            totalSlots: reversedSlots.length
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "Internal Server Error" });
    }
};





const editProfile = async (req, res) => {
    try {
        const { name, mobile, experience, bio, speciality, id } = req.body;

        const doctor = await Doctor.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    name: name,
                    mobile: mobile,
                    experience: experience,
                    bio: bio,
                    speciality: speciality,
                },

            },
            { new: true }
        );

        res.status(200).json({ message: "Doctor details updated successfully", doctor });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "Internal Server Error" });
    }
};


const doctorDetails = async (req, res) => {
    try {
        const id = req.query.id
        const doctor = await Doctor.findById(id)
        res.status(200).json({ doctor })


    } catch (error) {
        console.log(error.message)
    }
}


const appointmentList = async (req, res) => {
    try {
        const doctorId = req.query.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;


        const startIndex = (page - 1) * limit;

        const data = await AppointmentModel.aggregate([
            {
                $match: {
                    'doctor': new mongoose.Types.ObjectId(doctorId)
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails',
                },
            },
            {
                $unwind: '$userDetails',
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $skip: startIndex,
            },
            {
                $limit: limit,
            },
        ]);

        // Format dates using moment
        const formattedData = data.map((appointment) => ({
            ...appointment,
            createdAt: moment(new Date(appointment.createdAt)).format('YYYY-MM-DD '),
            consultationDate: moment(new Date(appointment.consultationDate)).format('YYYY-MM-DD '),
            // Add more fields with date values if needed
        }));

        const date = new Date();
        const currentDate = moment(date).format('YYYY MM DD');
        const currentTime = moment(date).format('HH:mm');

        const totalItems = await AppointmentModel.countDocuments({ doctor: doctorId });

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


const createChat = async (req, res) => {
    try {

        const { userid, doctorid } = req.body

        const chatExist = await chatModal.findOne({
            members: { $all: [userid, doctorid] }
        })
        if (!chatExist) {
            const newChat = new chatModal({
                members: [userid.toString(), doctorid.toString()]
            })
            await newChat.save()
            res.status(200).json({ message: 'Your are connected' })

        }
        const notification = new NotificationModel({
            text: 'Doctor created a chat room with you ',
            userId: userid,
        })

        await notification.save()

        res.status(200).json({ message: 'You are connected' })

    } catch (error) {
        console.log(error.message)
    }
}

const addPriscription = async (req, res) => {
    try {
        const { date, start, end, userId, drId, note, medicines, appoId } = req.body;
        // Basic validation checks
        if (!date || !start || !end || !userId || !drId || !note || !medicines) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const user = await User.findById(userId);
        const doctor = await Doctor.findById(drId);

        // Check if user and doctor exist
        if (!user || !doctor) {
            return res.status(404).json({ message: 'User or Doctor not found' });
        }

        const prescription = new prescriptionModal({
            doctorName: doctor.name,
            userName: user.name,
            medicines: medicines,
            date: moment(date).format('YYYY MM DD'),
            note: note,
            appointmentId: appoId
        });

        await prescription.save();

        const notification = new NotificationModel({
            text: 'Your prescription added by doctor',
            userId: userId,
        })

        await notification.save()

        res.status(200).json({ message: 'Prescription added' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const markAsDone = async (req, res) => {
    try {
        const { id, userId } = req.query;

        const result = await AppointmentModel.findByIdAndUpdate(
            id,
            { $set: { status: 'Done' } },
            { new: true } // Return the updated document
        );

        const notification = new NotificationModel({
            text: 'Your appointment marked as done ',
            userId: userId,
        })

        await notification.save()

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};


const addMedicalReport = async (req, res) => {
    try {
        const { values, appoDate, appoId, drName, userId, userName, } = req.body

        const existingMedicalReport = await MedicalReportModel.findOne({ appointmentId: appoId });

        if (existingMedicalReport) {
            return res.status(400).json({ message: 'Medical Report already added' });
        }

        const medicalReport = new MedicalReportModel({
            patientName: userName,
            doctorName: drName,
            date: appoDate,
            age: values.age,
            gender: values.gender,
            weight: values.weight,
            medicalHistory: values.history,
            complaint: values.complaint,
            diagnosis: values.diagnosis,
            appointmentId: appoId,
            investigation: values.investigation,
            additionalInfo: values.additionalInfo
        })
        await medicalReport.save()


        const notification = new NotificationModel({
            text: 'Your medical report added by doctor ',
            userId: userId,
        })

        await notification.save()

        res.status(200).json({ message: 'Medical Report added' });




    } catch (error) {
        console.log(error);
    }
}

const chartDetails = async (req, res) => {
    try {
        const { drId } = req.query
        const appoPending = await AppointmentModel.countDocuments({ doctor: drId, status: "Pending" })
        const appoDone = await AppointmentModel.countDocuments({ doctor: drId, status: "Done" })
        const appoCancelled = await AppointmentModel.countDocuments({ doctor: drId, status: "Cancelled" })

        let obj = {}
        obj.Pending = appoPending
        obj.Done = appoDone
        obj.Cancelled = appoCancelled
        res.status(200).json({ obj })
    } catch (error) {
        console.log(error.message);
    }
}

const doctorReport = async (req, res) => {
    try {
        const currentDate = new Date();
        const monthName = currentDate.toLocaleString("default", { month: "long" });
        let date = new Date();
        let year = date.getFullYear();
        let currentYear = new Date(year, 0, 1);
        let appointments = []
        let appointmentByYear = await AppointmentModel.aggregate([
            {
                $match: { createdAt: { $gte: currentYear } },
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
            for (let j = 0; j < appointmentByYear.length; j++) {
                result = false;
                if (appointmentByYear[j]._id == i) {
                    appointments.push(appointmentByYear[j]);
                    break;
                } else {
                    result = true;
                }
            }
            if (result) appointments.push({ _id: i, count: 0 });
        }
        let appointmentData = [];
        for (let i = 0; i < appointments.length; i++) {
            appointmentData.push(appointments[i].count);
        }

        const result = {
            currentMonthName: monthName,
            appointmentData,
        }

        res.status(200).json(result);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: "Internal Server Error" });

    }
}


const getCounts = async (req, res) => {
    try {
        const doctorId = req.query.doctorId;

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const totalAmount = await Payment.aggregate([
            {
                $match: { doctor: doctor._id }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $toDouble: { $ifNull: ["$price", 0] } } }
                }
            }
        ]);

        const total = totalAmount.length > 0 ? Math.round(totalAmount[0].total) : 0;
        const seventyPercent = Math.round(total * 0.7);
        const totalSlotCount = doctor.slots.length;

        res.status(200).json({ totalSlotCount, seventyPercent });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};




const reschedule = async (req, res) => {
    try {
        const { date, startTime, endTime, appoId, userId } = req.body;

        // Convert start time to 24-hour format
        const startDateTime = new Date(`${date} ${startTime}`);
        const formattedStart = startDateTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        // Convert end time to 24-hour format
        const endDateTime = new Date(`${date} ${endTime}`);
        const formattedEnd = endDateTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        // Format the date using moment
        const formattedDate = moment(date).format('YYYY-MM-DD');

        // Update the appointment
        const updatedAppointment = await AppointmentModel.findOneAndUpdate(
            { _id: appoId },
            { $set: { consultationDate: formattedDate, start: formattedStart, end: formattedEnd, rescheduled: true } },
            { new: true }
        );

        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const notification = new NotificationModel({
            text: 'Your appointment has been rescheduled by doctor ',
            userId: userId,
        })

        await notification.save()

        res.status(200).json({ message: 'Appointment rescheduled successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};



const cancelAppointment = async (req, res) => {
    try {
        const { appoId, paymentId, userId } = req.body
        // Delete the payment
        await Payment.findByIdAndDelete(paymentId);

        await AppointmentModel.findByIdAndUpdate(appoId, { $set: { status: 'CancelledByDoctor' } }, { new: true });

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
        const appointment = data.find(appointment => appointment._id.toString() === appoId);

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

        const notification = new NotificationModel({
            text: 'Your appointment cancelled by doctor ',
            userId: userId,
        })

        await notification.save()

        res.status(200).json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal server error' });

    }
}


const editPhoto = async (req, res) => {
    try {
        const { img, id } = req.body
        const photoResult = await cloudinary.uploader.upload(img, { folder: 'doctorPhotos' });
        const doctor = await Doctor.findByIdAndUpdate(
            id,
            { $set: { photo: photoResult.secure_url } },
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile picture updated successfully", doctor });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });

    }
}

const getReviews = async (req, res) => {
    try {
        const { id } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const doctor = await Doctor.findById(id)
            .populate('review.postedBy');

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Sort reviews by the 'postedDate' property in descending order
        doctor.review.sort((a, b) => b.postedDate - a.postedDate);

        const totalItems = doctor.review.length;
        const reviews = doctor.review.slice((page - 1) * limit, page * limit);

        const results = {
            data: reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
            },
        };

        res.status(200).json(results);
    } catch (error) {
        console.error(error); // Log the error
        res.status(500).json({ error: 'Internal Server Error' });
    }
};








module.exports = {
    doctorRegistration,
    otpVerify,
    resendOtp,
    doctorLogin,
    forgotPass,
    resetPass,
    specialityName,
    slotCreation,
    slotList,
    editProfile,
    doctorDetails,
    appointmentList,
    createChat,
    addPriscription,
    markAsDone,
    addMedicalReport,
    chartDetails,
    doctorReport,
    getCounts,
    reschedule,
    cancelAppointment,
    editPhoto,
    getReviews

}

