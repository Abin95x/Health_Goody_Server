const jwt = require('jsonwebtoken');

const authenticateDoctor = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY_DOCTOR);
    req.doctorId = decoded.doctorId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = { authenticateDoctor };

