const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");

const adminLogin = async (req, res) => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        const { username, password } = req.body;

        if (username === adminUsername) {
            const passCheck = await bcrypt.compare(password, adminPassword);
            console.log(passCheck);
            if (passCheck) {
                const admintoken = jwt.sign({ username }, process.env.SECRET_KEY_ADMIN, { expiresIn: "1h" });
                res.header('admintoken', admintoken);
                res.status(200).json({ admintoken, message: `Welcome ${username}` });
            } else {
                return res.status(400).json({ message: "Password is incorrect" });
            }
        } else {
            return res.status(400).json({ message: "Invalid username" });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    adminLogin
};
