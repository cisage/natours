//convention to have all express configuration in app.js
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/appError');

//express is a function which when called will add a bunch of methods to our app

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug'); //pug is the most common template engine used with express
//to make a server side rendered website we will make make templates using plug which can be easily dynamically created
app.set('views', `${__dirname}/views`);

//MIDDLEWARES//

//1)set http security headers
app.use(helmet());

//Cookie Parser
app.use(cookieParser());
//this will allow us to use the cookie coming from a request
//for eg when you login the jwt is stored as a cookie
//so then we access any page after that the cookie is sent to the server with the request

//Data sanitization NOSQL injection
app.use(mongoSanitize());
//removes $ signs from query

//Data sanitization using XSS
app.use(xss());

//prevent Parameter pollution by removing duplicate parameter fields in request
// ?sort=name&sort=duration
app.use(hpp());

app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  //basically 100 requests from an ip in 1 hour
  message: 'Too many requests from this IP, Please try again in an hour',
});

app.use('/api', limiter); //limiter used on every route starting with api

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //lets say we want to have a way to add date with every response
  //by using a middleware we can just add the current date to the request
  //console.log('added time to the request');
  //console.log(req.cookies); //we can access the cookies on the request because of the package cookie-parser
  next();
});
//built in middleware to serve static files
app.use(express.static(`${__dirname}/public`));
//express.json is a middleware
//app.use can be used to use the middleware

//to define routes you can just do app.get(path,callback function which defines what happens when thayt route is accessed)
// app.get('/',(req,res) => {
//     //res.status(200).send('Hello from the server side');
//     //.send - string
//     res.status(200).json({message: 'Hello from the server' , app : 'natours'});
//     //by using .json in express we dont have tp manually define the content type like last time

// })

// app.post('/',(req,res) => {
//     res
//         .status(200)
//         .send('Post successful')
// })

//ROUTE HANDLERS//

const defaultPage = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Hello from the server',
  });
};

//NOT IDEAL
// app.get("/api/v1/tours", getAllTours);

// app.get("/api/v1/tours/:id", getTour);

// app.post("/api/v1/tours", addTour);

// app.patch("/api/v1/tours/:id", updateTour);

// app.delete("/api/v1/tours/:id", deleteTour);

//ROUTES//
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//will only come here of none of the other routes can handle the requested route
//UNHANDLED ROUTESs
app.all('*', (req, res, next) => {
  // const err = new Error(`Cant find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  const err = new AppError(`Cant find ${req.originalUrl} on this server`, 404);

  next(err);
});

//COMMON MIDDLEWARE TO HANDLE ERRORS
app.use((err, req, res, next) => {
  //by defining four parameters express knows this a error handling middleware
  //console.log(err);
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
