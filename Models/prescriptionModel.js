const mongoose = require('mongoose')
const appointment = require('./appointmentModel')

const prescriptionSchema = mongoose.Schema({
    doctorName: {
        type: String
    },
    userName: {
        type: String
    },
    date: {
        type: String
    },
    medicines: {
        type: Array
    },
    note: {
        type: String
    },
    appointmentId: {
        type: String

    }
}, { timestamps: true })

const prescription = mongoose.model("Prescription", prescriptionSchema)
module.exports = prescription