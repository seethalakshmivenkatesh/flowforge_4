class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
  }
}

const success = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({ success: true, message, data });
};

module.exports = { ApiError, success };
