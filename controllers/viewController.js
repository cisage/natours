const Tour = require('./../models/tourModel');
const AppError = require('./../utils/appError');
exports.getOverview = async (req, res, next) => {
  try {
    //1)Get tour data from collection

    const tours = await Tour.find();
    //2)Build Template
    //3)REnder that template using data from 1)
    res.status(200).render('overview', {
      title: 'All Tours',
      tours: tours, //will be passed to pug file as locals
    });
  } catch (err) {
    next(new AppError(err.message), 400);
  }
};

exports.getTour = async (req, res) => {
  try {
    //1)get tour depending on slug

    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });
    if (!tour) {
      return next(new AppError('No tour with that name', 404));
    }
    //console.log(tour);
    res
      .status(200)
      .set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
      )
      .render('tour', {
        title: `${tour.name} tour`,
        tour,
      });
  } catch (err) {
    next(new AppError(err.message), 400);
  }
};

exports.getLoginForm = (req, res, next) => {
  try {
    res.status(200).render('login', {
      title: 'Login into your account',
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getAccount = (req, res, next) => {
  try {
    res.status(200).render('account', {
      title: 'Your Account',
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
