import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;

  // 1. Check if the Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extract the token (Format is "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach the decoded user ID to the request object
      // This allows future controllers to instantly know who is logged in
      req.user = { id: decoded.userId };

      next(); // Pass control to the next middleware or controller
    } catch (error) {
      console.error("JWT Verification Failed:", error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};