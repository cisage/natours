const express = require('express');

const {
  signUp,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} = require('../controllers/authController');

const {
  getAllUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require(`${__dirname}/../controllers/userController`);

const userRouter = express.Router();

userRouter.route('/signup').post(signUp);
userRouter.route('/login').post(login);
userRouter.route('/logout').get(logout);

userRouter.route('/forgotpassword').post(forgotPassword);
userRouter.route('/resetpassword/:token').patch(resetPassword);
userRouter.route('/updatepassword').patch(protect, updatePassword);

userRouter
  .route('/updateMe')
  .patch(protect, uploadUserPhoto, resizeUserPhoto, updateMe);
userRouter.route('/deleteMe').delete(protect, deleteMe);
userRouter.route('/getMe').delete(protect, getMe);

userRouter.route('/').get(protect, restrictTo('admin'), getAllUsers);

userRouter
  .route('/:id')
  .get(protect, restrictTo('admin'), getUser)
  .patch(protect, restrictTo('admin'), updateUser)
  .delete(protect, restrictTo('admin'), deleteUser);

module.exports = userRouter;
