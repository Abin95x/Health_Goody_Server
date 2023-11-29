const mongoose = require("mongoose")

const slotSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Doctor,
        required: true
    },
    date: {
        type: Date,
        required: true

    },
    startTime: {

    },
    endTime: {

    },
    is_booked: {
        type: Boolean,
        default: false
    },
    is_blocked: {
        type: Boolean,
        default: false

    }
})

const slot = mongoose.model("Slot", slotSchema)
module.exports = slot