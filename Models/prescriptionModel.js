const mongoose = require('mongoose')

const prescriptionSchema = mongoose.Schema({
    doctorName:{
        type:String
    },
    userName:{
        type:String
    },
    medicines:[
        {
            name:{
                type:String
            },
            duration:{
                type:String
            },
            Frequency:{
                type:String
            }
        }
    ],
    text:{
        type:String
    }
},{timeStamp:true})

const prescription = mongoose.model("Prescription",prescriptionSchema)
module.exports = prescription