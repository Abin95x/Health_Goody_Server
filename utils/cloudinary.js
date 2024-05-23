const cloudinary = require('cloudinary').v2;
const dotenv = require("dotenv")
dotenv.config();


cloudinary.config({
  cloud_name: process.env.CLOUD,
  api_key: process.env.APIKEY,
  api_secret: process.env.APISECRET
});
module.exports = cloudinary


