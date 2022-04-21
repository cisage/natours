const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxLength: [40, 'A tour must hav less than 40 characters'],
      minLength: [10, 'A tour must have more than 10 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour  must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A tour must have minimum 1 as rating'],
      max: [5, 'A tour must have maximum 5 as rating'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
      //required : true or required : [true,err string]
    },
    priceDiscount: {
      type: Number,
      validate: function (value) {
        //this only points to the current doc when doing creating a new document
        return value < this.price;
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
      //for type string we have a schema option trim which id true will remove whitespace in the beginning and end
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      //normally we always just add a reference to the image and leave the image in the file system
      required: [true, 'A tour must have an image cover'],
    },
    images: [String],
    //we want an array of images
    createdAt: {
      //stoes
      type: Date,
      default: Date.now(), //this gives a time in ms which is automically converted in mongoose to give todays date
    },
    startDates: [Date], //array of dates which signifies when the tours start
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      //for it to be underatood GeoJSON we needed to create a nested type
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //for coordinates we are expecting an array of numbers with longitude first and then the latitude\
      address: String,
      description: String,
    },

    locations: [
      {
        //now this right here is not just a schema object when you define an array this is an array of documents(embedded locations in tours)
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    guides: [
      //this is how you reference documents
      //ref will internally reference User schema
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//VIRTUAL FIELD
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //foreign field in review that is referencing the tour
  localField: '_id',
});

//DOCUMENT MIDDLEWARE : runs before .create() and .save(),insertMany wont trigger this middleware
tourSchema.pre('save', function (next) {
  //this keyword points to the currently processed document
  //thats why we dont use arrow function because we want to use the this keyword
  //infact when working with mongoose when we want to do some operations on
  // the particular document we use this keyword and  not use the arrow function
  this.slug = slugify(this.name, { lower: true });
  next();
});

//QUERY MIDDLEWARE : allows to run functions before any query os executed

tourSchema.pre('find', function (next) {
  //'find' - In this case it runs before a find query
  this.find({ secretTour: { $ne: true } });
  //what we are basically doing is that we are running a find query when we use getAllTours
  //so this middleware is getting executed
  //this here refers to the documents returned in the above mentioned query
  //so we are absically chaining a find query to the result and getting the answers for when the secretTour is not true
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

//AGGREGATION MIDDLEWARE : executed before an aggregation function is executed
tourSchema.pre('aggregate', function (next) {
  //now the aggreagtion functions that we are running in the tourController is actually running on all th documents includin even the secret ones
  // we dont want that, so what do we do well we can just add the condition in match event to remove the documents which have the secretTour as true
  // but we will have to do this for each and every aggregation function, so a better option is to do it all at once by using this aggregation middleware

  //this.pipeline(); -----------------------  this is an array containing the whole pipeline consisting of each stage of the aggregation function so we have to append a
  //match function at the start of the aggregation function to remove any documents that are secret

  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

//the way we work with mongoose is that we create an object depending on a schema that we have created
//Here tour is the object and tourSchema is the schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
