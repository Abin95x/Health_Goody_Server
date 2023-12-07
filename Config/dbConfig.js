const mongoose = require("mongoose");
require("dotenv").config();

module.exports = {
  dbconnect: () => {
    mongoose
      .connect(process.env.MONGO, {
   
      })
      .then(() => {
        console.log("Database connected successfully");
      })
      .catch((err) => {
        console.log(err);
      });
  },
};
