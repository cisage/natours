const express = require('express');
const { isLoggedIn, protect } = require('./../controllers/authController');
const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
} = require('./../controllers/viewController');

const viewRouter = express.Router();

// viewRouter.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Jonas', //these properties when passed into the pug file are called locals in the pug file
//   }); //the object defined after base will immediately be available in the pug template
// });
// //will render the base file, express automatically knows what is the base file
// //it will look for the base template in the folder given above
viewRouter.get('/', isLoggedIn, getOverview);

viewRouter.get('/tour/:slug', isLoggedIn, getTour);

viewRouter.get('/login', isLoggedIn, getLoginForm);

viewRouter.get('/me', protect, getAccount);

module.exports = viewRouter;
