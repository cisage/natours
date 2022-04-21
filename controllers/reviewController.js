const AppError = require('../utils/appError');
const Review = require('./../models/reviewModel');

const filteredObj = (obj, ...allowedFields) => {
  const filter = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      filter[el] = obj[el];
    }
  });

  return filter;
};
exports.getAllReviews = async (req, res, next) => {
  // if(req.params.tourId)
  //   const reviews = await Review.find({tour : tourId})

  let filter = {};
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }
  const reviews = await Review.find(filter);
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
};

exports.createReview = async (req, res, next) => {
  //Nested Routes
  //POST tours/:tourID/reviews
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  //user added to request in protect middleware
  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  const newReview = await Review.create(req.body);
  res.status(200).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
};

exports.updateReview = async (req, res, next) => {
  try {
    let filter = {};
    filter = filteredObj(req.body, 'review', 'rating');
    const review = await Review.findById(req.params.id);
    //now we are gonna check if the user that is logged in is the same as the user who created the review
    console.log(req.user._id, review.user._id);
    if (!req.user._id === review.user._id) {
      return next(
        new AppError('You are not authorized to update this review'),
        403
      );
    }
    console.log(filter);
    if (filter.review) {
      review.review = filter.review;
    }
    if (filter.rating) {
      review.rating = filter.rating;
    }
    await review.save();

    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    //now we are gonna check if the user that is logged in is the same as the user who created the review
    console.log(req.user._id, review.user._id);
    if (!req.user._id === review.user._id) {
      return next(
        new AppError('You are not authorized to delete this review'),
        403
      );
    }

    await Review.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: {
        review: null,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
