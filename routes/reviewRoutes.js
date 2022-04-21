const express = require('express');
const {
  createReview,
  getAllReviews,
  updateReview,
  deleteReview,
} = require('./../controllers/reviewController');
const { protect, restrictTo } = require('./../controllers/authController');
const reviewRouter = express.Router();

reviewRouter
  .route('/')
  .get(protect, restrictTo('admin'), getAllReviews)
  .post(protect, restrictTo('user'), createReview);

reviewRouter
  .route('/:id')
  .patch(protect, restrictTo('user'), updateReview)
  .delete(protect, restrictTo('user'), deleteReview);

module.exports = reviewRouter;
