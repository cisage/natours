const express = require('express');
const { getToursWithin } = require('../controllers/tourController');
const {
  getAllTours,
  addTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require(`${__dirname}/../controllers/tourController`);

const { protect, restrictTo } = require('./../controllers/authController');

const {
  createReview,
  getAllReviews,
} = require('./../controllers/reviewController');
const tourRouter = express.Router();

//param is a middlew are that can run when a certain parameter is present in the route
//in this case the only parameter we might have is id
// tourRouter.param('id', (req, res, next, val) => {
//   //id - is the name of the parameter
//   //val - is the value of the parameter
//   console.log(`The id is : ${val}`);
//   next();
// });

// tourRouter.param('id', checkId);

//checkBody check if req body has a name and a price
//if not send status 400 which stands for bad request
//you can do this by chaining a middleware to the post function
//post(middleware,addTour)

//making aliases
tourRouter.route('/top-5-tours').get(aliasTopTours, getAllTours);
//this is just a normal /get request with limit=5&sort=,-ratingsAverage,price

tourRouter
  .route('/tour-stats')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getTourStats);

tourRouter
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

tourRouter
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), addTour);

// POST /tours/:tourid/reviews
tourRouter
  .route('/:tourId/reviews')
  .post(protect, restrictTo('user'), createReview)
  .get(protect, restrictTo('user'), getAllReviews);

tourRouter
  .route('/:id')
  .get(getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

// tourRouter
//   .route('/tours-within/:distance/center/:latlon/unit/:unit')
//   .get(getToursWithin);
//tours within certain distance from a center(given by latitude and longitude of that place),also give the option of distance being in any unit
// /tours/544/center/-43.343,34.3445/unit/km
module.exports = tourRouter;
