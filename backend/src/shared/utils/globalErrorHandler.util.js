// this error show when you are working on production mode, error size are more concise
const productionError = (error, res) => {
  console.log("from production error function ", error);
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
    });
  } else {
    return res.status(error.statusCode).json({
      status: "error",
      message: "Something went wrong , please try again later !!",
    });
  }
};

// this error only show when you are working on development mode
const developmentError = (error, res) => {
  return res.status(error.statusCode).json({
    statusCode: error.statusCode,
    message: error.message,
    status: error.status,
    isOperational: error.isOperational,
    data: error.data,
    errorStack: error.stack,
  });
};

export const globalErrorHandler = (error, req, res, next) => {
  console.log("Error from Global Error Handler", error);
  error.statusCode = error.statusCode || 500;
  if (process.env.NODE_ENV === "development") {
    developmentError(error, res);
  } else if (process.env.NODE_ENV === "production") {
    productionError(error, res);
  }
};
