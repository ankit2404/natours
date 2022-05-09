/* eslint-disable */
const AppError = require('./../utils/appError');

const handleCastErrorDb = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// const handleDuplicateFieldDb = err => {
//   const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
//   console.log(value);
//   const message = `Duplicate field value: x. Please use another value.`;
//   return new AppError(message, 400);
// };

const handleValidationErrordDb = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const sendDevError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  } else {
    // RENDERED WEBSITE
    console.error('Error: ', err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
  }
};

const sendProdError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    //operational, trusted error: send message to the client
    if (err.isOperational) {
      // if(!err.message) err.message = 'No tour found with that ID';
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });

      //programming or unknown error: don't leak error details to client
    } else {
      //1) log error
      console.error('Error: ', err);
      //2) send generic message
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message
      });
      //programming or unknown error: don't leak error details to client
    } else {
      //1) log error
      console.error('Error: ', err);

      //2) send generic message
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: 'Please try again later.'
      });
    }
  }
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please Login Again', 401);

const handleJWTExpiredError = () =>
  new AppError('Token Expired. Please Login Again', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDb(error);
    // if (error.code === 11000) error = handleDuplicateFieldDb(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrordDb(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendProdError(error, req, res);
  } else if (process.env.NODE_ENV === 'development') {
    sendDevError(err, req, res);
  }
};
