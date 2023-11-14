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
    speciality:{
        type:String,
        required:true
    },
    password: {
        type: String,
        required: true,
    },
    photo:{
        type:String,
        required: true
    },
    cerificates:{
        type: Array,
        required: true
    },
    // admin_verifed:{
    //     type:Boolean,
    //     default:false
    // },
    otp_verified: {
        type: Boolean,
        default: false
    },
    is_blocked: {
        type: Boolean,
        default: false
    },

})

const doctor = mongoose.model("Doctor",doctorSchema)
module.exports = doctor