const jwt = require('jsonwebtoken');

const authenticateDoctor = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY_DOCTOR);
    req.doctorId = decoded.doctorId; // Add the adminId to the request object for later use
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = { authenticateDoctor };

