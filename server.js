//anything related to express we will put in the app.js

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
//dotenv is a package that lets node know about the env variables
//dotenv.config can be used to give a path to config file so that node can now use those environment variables

//console.log(process.env)process is a node given object where process.env contains all the environment variables
//process.env will contain the in built variables but will also contain the vars that we have externally defined

const mongoose = require('mongoose');
const app = require(`${__dirname}/app`);

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(db, {
    //some configuration settings for mongoose to help handle deprecated commands
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    //mongoose.connect gets a promise which has a connection object
    console.log('DB connection successful');
  });

// const newTour = new Tour({
//   name: 'The park camper',
//   price: 500,
// });
// //here we are creating a new Tour and we have have saved it on newTour
// //now we have to save newTour in the database

// //save is an async function which returns a promise and when successful returns the document just saved
// newTour
//   .save()
//   .then((doc) => console.log(doc))
//   .catch((err) => console.log(err));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('app on running port 3000');
});

//we normally use environment variables to change confu=iguration of our app
// for

//dependencies
/*
nodemon - live server
mongoose
dotenv - to work with env files
express - middleware on top of node
morgan - log requests to console
slugify - to create slug for all data returned as response
ndb(global) - help in debugging
validator - to use validation functions on email in mongoose schema
express-rate-limit - to limit the no of api calls from the ip(DOS attack ot brute force attack)
*/
