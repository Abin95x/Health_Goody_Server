const jwt = require('jsonwebtoken');

// const authenticateUser = (req, res, next) => {
//     const token = req.headers.authorization  
//   if (!token) {
//     return res.status(401).json({ message: 'Access denied. No token provided.' });
//   }
//   try {
//     const decoded = jwt.verify(token, process.env.SECRET_KEY_USER);
//     req.userId = decoded.userId; // Add the adminId to the request object for later use
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token.' });
//   }
// };

// module.exports = {authenticateUser};

 const userTokenVerify = async (req, res, next) => {
  try {
    let token = req.headers.autherization;
    if (!token) {
      return res.status(403).json({ message: "Access Denied" });
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, userSecret);
    req.user = verified;
    if (verified.role == "user") {
      const user = await User.findOne({ email: verified.email });
      if (user.isBlocked) {
        return res.status(403).json({ message: "User is blocked " });
      } else {
        next();
      }
    } else {
      return res.status(403).json({ message: "Access Denied" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = userTokenVerify