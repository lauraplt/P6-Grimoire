const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    const formattedError = {
      message: err.message || 'Une erreur est survenue',
    };
  
    res.status(err.statusCode || 500).json(formattedError);
  };
  
  module.exports = errorHandler;