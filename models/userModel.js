const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resolver } = require('dns');
const { userInfo } = require('os');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: [true, 'An email must be unique'],
    lowercase: true,
    validate: [validator.isEmail, 'Enter a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false, //so that the password even if it is hashed is neever sent back  to the client
  },
  passwordConfirm: {
    type: String,
    required: true,
    //remember that this type of customvalidation only works on .create and .save, so you cant update a users password using finByIDandUpdate
    //because that will not run this validator
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'passwords are not the same!!',
    },
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now(),
  },
  passwordResetToken: String,
  passwordResetAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //if the password is modified it will encrypt the password
  //isModified is a function which checks on the document and sees if particular field is modified or not
  //will work if password is modified or if a new document is created
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  //when you make a schema variable undefined it stops being persisted in the database
  //if the field is required then how is this possible
  //the required field means that the field is necessary to be entered but it doesnt say anything about whether it needs to be persisted
  next();
});

userSchema.pre('save', async function (next) {
  //if password is modified and and the document is not new then we update the passwordChangedAt
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 10000;
  next();
});

userSchema.pre(/^find/, async function (next) {
  //query middleware to remove the users which are deleted before performing any queries
  // /^find/ ensures this will work for all queries which have find in it
  //so for eg findByIdAndDelete,findById

  this.find({ active: { $ne: false } });
  //when a find query is executed find all the docs with the above condition
  next();
});
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  //returns false if the changed password is less than the time the JWT was issued

  if (this.passwordChangedAt) {
    const changedPassword = this.passwordChangedAt.getTime() / 1000;
    //console.log(JWTTimestamp);
    //console.log(changedPassword);
    return JWTTimestamp < changedPassword;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetAt = Date.now() + 10 * 60 * 1000;
  // console.log(
  //   resetToken,
  //   this.passwordResetToken,
  //   this.passwordResetAt.getTime() / 1000
  // );
  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
