
const Chat = require("../Models/chatModal")
const User = require('../Models/userModel')
const Doctor = require('../Models/doctorModel')



const doctorData = async (req,res) => {
    try {
      const {id} = req.params
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
      const {id} = req.params
      const userId = id
      const chats = await Chat.aggregate([
        {
          $match: { members: userId },
        },
        {
          $lookup: {
            from: 'messages', // Replace with the actual name of your messages collection
            let: { chatIdToString: { $toString: '$_id' } }, // Convert _id to string
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$chatId", "$$chatIdToString"] }, // Match on the converted chatId
                },
              },
              {
                $sort: { createdAt: -1 }, // Sort messages in descending order based on timestamp
              },
              {
                $limit: 1, // Get only the latest message
              },
            ],
            as: 'messages',
          },
        },
        {
          $addFields: {
            lastMessageTimestamp: {
              $ifNull: [{ $first: '$messages.createdAt' }, null],
            },
          },
        },
        {
          $sort: { lastMessageTimestamp: -1 }, // Sort chats based on the latest message timestamp
        },
      ]);
      res.status(200).json(chats); 
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