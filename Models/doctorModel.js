const mongoose = require("mongoose")

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    mobile: {
        type: Number,
        required: true,
    },
    // speciality: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref:'Speciality',
    //     required: true
    // },
    speciality: {
        type: String,
        require: true
    },
    password: {
        type: String,
        required: true,
    },
    photo: {
        type: String,
        required: true
    },
    certificates: [
        {
            type: String,
            required: true
        }
    ],
    otp_verified: {
        type: Boolean,
        default: false
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    admin_verify: {
        type: Boolean,
        default: false
    },
    languages: [
        {
            type: String
        }
    ],
    experiance: {
        type: String,
    },
    bio: {
        type: String,
    },
    rating: {
        type: Number
    },
    // availability: [daySchema],
    slots: [
        {
            date: {
                type: String,
            },
            startTime: {
                type: String,
            },
            endTime: {
                type: String,
            },
            status: {
                type: String,
                default: "active",
            },
            slotDuration: {
                type: String,
            },
            timeSlots: {
                type: Array
            }
        },
    ],

})

const doctor = mongoose.model("Doctor", doctorSchema)
module.exports = doctor
