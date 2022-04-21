const Tour = require('./../models/tourModel');
const APIfeatures = require('./../utils/apiFeatures');
const AppError = require('../utils/appError');
const { getAllDocs } = require('./handler');
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkBody = (req, res, next) => {
//   if (!(req.body.name && req.body.price)) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

exports.getAllTours = getAllDocs(Tour); //from handler.js

exports.getTour = async (req, res, next) => {
  //const id = req.params.id * 1;
  //this id is not a number, but what you can do is that
  //by mulitplying it with a number javascript will automatically convert it into a number
  try {
    //const tour = await Tour.find()
    //  .where('duration')
    //  .equals(5)
    //  .where('difficulty')
    //  .equals('easy')

    //const tour = await Tour.findById(req.params.id).populate('guides'); //populate will make it seem like the guides data was always in the tour database when it was just referenced internally
    const tour = await Tour.findById(req.params.id).populate('reviews');
    //in case we get no tour with a certain id that wont give us an error it will just give us anull value
    if (!tour) {
      //we could throw an error that will jsut get caught by catch and create out custom messag error, but we cant define a statusCode
      return next(
        new AppError(`No tour present with id ${req.params.id}`, 404)
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        tour: tour,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 404));
  }
};

exports.addTour = async (req, res, next) => {
  //you can send data from client to server and so the req object should contain all the data being sent
  //now express doesnt put the data in the body of the req so we need to use the middleware

  // const newId = tours.length;
  // const newTour = Object.assign({ id: newId }, req.body);
  // //Object.assign allows you to add two objects together

  // tours.push(newTour);
  // fs.writeFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours),
  //   (err) => {
  //     res.status(201).json({
  //       status: 'success',
  //       data: {
  //         tour: newTour,
  //       },
  //     });
  //   }
  // );
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newTour,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.updateTour = async (req, res, next) => {
  try {
    const newTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      //as a third parameter you can pass some options
      new: true,
      //when you put new as true then it returns the newest tour
      //false will send back the original document
      runValidators: true,
      //true to run validation check once again that were originally defined in the schema
      //all this you can find in the mongoose documentation
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 404));
  }
};

exports.deleteTour = async (req, res, next) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
      return next(new AppError(`No tour with id ${req.params.id}`, 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getTourStats = async (req, res, next) => {
  //aggregate pipeline is a mongoose feature that we can use to get aggreagte values
  //all documents in the table pass through this
  //   An aggregation pipeline consists of one or more stages that process documents:

  // Each stage performs an operation on the input documents. For example, a stage can filter documents, group documents, and calculate values.
  // The documents that are output from a stage are passed to the next stage.
  // An aggregation pipeline can return results for groups of documents. For example, return the total, average, maximum, and minimum values.
  try {
    const stats = await Tour.aggregate([
      //stage1:
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      //stage2:
      {
        $group: {
          _id: '$difficulty',
          num: { $sum: 1 }, //for all documents going through the pipleline 1 is added to num
          numRating: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      //stage 3
      {
        $sort: { avgPrice: 1 },
        //we can use average price because at every stage the previous object is sent so average rating is provided to us
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: stats,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getMonthlyPlan = async (req, res, next) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      //stage 1
      {
        //for each document we had multiple startDates
        //unwind will give us a new document for each startDate for every document
        $unwind: '$startDates',
      },
      //stage 2
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      //stage 3
      {
        $group: {
          _id: { $month: '$startDates' },
          noTours: { $sum: 1 },
          tours: { $push: '$name' },
          //push will create an array
        },
      },
      {
        $addFields: {
          month: '$_id',
        },
      },
      {
        $project: {
          _id: 0, //0 means that attribute is not projected
          //default 1 for everything
        },
      },
      {
        $sort: {
          noTours: -1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        results: plan.length,
        plan: plan,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

// exports.getToursWithin = (req, res, next) => {
//   try {
//     const { distance, latlon, unit } = req.params;
//     const [lat, lon] = latlon.split(',');
//     if (!lat || !lon) {
//       return next(new AppError('Latitutde or Longitude missing', 404));
//     }
//     console.log(distance, lat, lon, unit);

//     const tours = await Tour.find({

//     })

//   } catch (err) {
//     next(new AppError(err.message, 400));
//   }
// };
