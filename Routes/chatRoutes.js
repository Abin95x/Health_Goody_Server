const express = require('express')
const chatRoute = express()
const chatController = require('../Controllers/chatController')

chatRoute.get('/doctorData/:id',chatController.doctorData)
chatRoute.get('/userData/:id',chatController.userData)
chatRoute.get("/chat/:id",chatController.userChats)

module.exports = chatRoute
    