class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    //the stack trace shows all the calls that have led upto this point
    //by writing this statement we make sure that this constructor doesnt show up in the stack trace
  }
}

module.exports = AppError;
