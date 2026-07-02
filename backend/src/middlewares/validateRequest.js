export const validateRequest = (schema) => (req, res, next) => {
  try {
    // Attempt to validate the request body against the provided Zod schema
    schema.parse(req.body);
    
    // If successful, pass control to the actual controller
    next();
  } catch (err) {
    // If validation fails, Zod throws an error. We map it to a clean array for the frontend.
    const formattedErrors = err.errors.map((e) => ({
      field: e.path[0],
      message: e.message
    }));
    
    return res.status(400).json({ errors: formattedErrors });
  }
};