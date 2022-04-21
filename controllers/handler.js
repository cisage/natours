const APIfeatures = require('./../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.getAllDocs = (Model) => async (req, res, next) => {
  try {
    const features = new APIfeatures(Model.find(), req.query);

    features.filter();
    features.sort();
    features.limit();
    features.pagination();

    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      date_time: req.requestTime,
      results: docs.length,
      data: {
        data: docs,
      },
    }); //JSON formatting Jsend standard
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
