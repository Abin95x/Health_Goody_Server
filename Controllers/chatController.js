
const Chat = require("../Models/chatModal")
const User = require('../Models/userModel')
const Doctor = require('../Models/doctorModel')



const doctorData = async (req,res) => {
    try {
      const {id} = req.params
      console.log(id)
      const result = await Doctor.findOne({_id:id})
      res.status(200).json(result)
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
const userData = async (req,res) => {
    try {
      const {id} = req.params
      const result = await User.findOne({_id:id})
      res.status(200).json(result)
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }


const userChats = async(req,res)=>{
    try{

        
    }catch(error){
        console.log(error.message)
        res.status(500),json({message:"Internal error"})
    }
}

module.exports ={
    userChats,
    doctorData,
    userData
}