const express = require('express')
const app = express()
const socketConnection = require("./socketIo")
require("dotenv").config()
const cors = require('cors')
const PORT = process.env.PORT || 3000;
const http = require("http")

const dbconnect = require("./Config/dbConfig")
dbconnect.dbconnect()

app.use(express.json({ limit: "20mb" }))
app.use(express.urlencoded({ limit: "20mb", extended: true }))

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API",
      version: "0.1.0",
      description:
        "API for the purpose of understanding each routes specification.",
      contact: {
        name: "HEALTH GOODY",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/",
      },
    ],
  },
  apis: ["./Routes/*.js"],
};


// Enable CORS for specific origin and methods
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH"],
    credentials: true, // Set to true if you need to include credentials
  })
);

const userRoute = require("./Routes/userRoutes")
app.use("/", userRoute)

const doctorRoute = require("./Routes/doctorRoutes")
app.use("/doctor", doctorRoute)

const adminRoute = require("./Routes/adminRoutes")
app.use("/admin", adminRoute)

const chatRoute = require("./Routes/chatRoutes")
app.use("/chat", chatRoute)

const messageRoute = require("./Routes/messageRoute")
app.use('/message', messageRoute)


const server = http.createServer(app)
socketConnection(server)
server.listen(PORT, () => {
  console.log(`server running on port http://localhost:${PORT}`);
})

