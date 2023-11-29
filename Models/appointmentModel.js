const mongoose = require("mongoose")

const appointmentSchema = new mongoose({
    doctor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:Doctor,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:User,
        require:true
    },
    slot:{
        type:mongoose.Schema.Types.ObjectId,
        ref:Slot,
        required:true
    }
})

const appointment = mongoose.model("Appointment",appointmentSchema)
module.exports = appointment