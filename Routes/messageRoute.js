

const express = require("express");
const messageRoute = express();
const messageController = require('../Controllers/messageController');

messageRoute.post('/addMsg', messageController.addMessage);
messageRoute.get('/getMsg/:id', messageController.getMessages);

module.exports = messageRoute;
