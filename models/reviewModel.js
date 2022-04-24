const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'A review cannot be empty'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'A review must belong to a tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A review must belong to a user'],
  },
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //this will make sure that the combination of tour and user is always unique, that is a user can only review a tour once

reviewSchema.pre(/^find/, function (next) {
  //console.log('this seems to work');
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// reviewSchema.pre(/^findByIdAnd/, function (next) {
//   console.log('Please work you fucking cunt');
// });

reviewSchema.statics.calcAverageRating = async function (tourId) {
  // we can call this by saying Review.calcAverageRating

  //in a static function the this keyword points to the whole model
  //so we can use aggregate function on the this keyword

  //Steps to calculate avergage ratong
  //1)get all the reviews with tour as the tour passed in the function
  //2)group to calculate the average rating and number of ratings
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  //console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(
      tourId,
      {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      },
      {
        runValidators: true,
        new: true,
      }
    );
  } else {
    await Tour.findByIdAndUpdate(
      tourId,
      {
        ratingsQuantity: 0,
        ratingsAverage: 4.5,
      },
      {
        runValidators: true,
        new: true,
      }
    );
  }
};

reviewSchema.post('save', function () {
  //we will calculate the averageRatings every single time a review is created or updated

  //we need to call by saying Review.calcAverageRating(this.tour) ,this point to the document saved

  this.constructor.calcAverageRating(this.tour); //this.constructor points to the model in this case
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
