const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const { promisify } = require('util');

const comparePassword = async (candidatePassword, userPassword) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    const token = signToken(newUser._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      //secure: true, //only will send cookie on encrypted connection(https)
      httponly: true, //cookie cannot be modified by browser ever
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }
    res.cookie('jwt', token, cookieOptions);

    res.status(201).json({
      status: 'success',
      token: token,
      data: {
        tour: newUser,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.login = async (req, res, next) => {
  //check if email and password are present in request body
  const { email, password } = req.body;
  console.log(email, password);
  if (!email || !password) {
    return next(new AppError('Please provide email or password', 400));
  }

  //check if user exists and if he exists check if password is correct
  const user = await User.findOne({ email: email }).select('+password');
  //find user from the document with email = email from req.body
  if (!user || !(await comparePassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //we want to keep it vague, so the hacker doesnt know if the email if wrong or the password

  //if user is present and password is correct then return token with user
  console.log(user);
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //only will send cookie on encrypted connection(https)
    httponly: true, //cookie cannot be modified by browser ever
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  console.log(token);

  res.status(200).json({
    status: 'success',
    token: token,
  });
};

exports.logout = async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    //secure: true, //only will send cookie on encrypted connection(https)
    httponly: true, //cookie cannot be modified by browser ever
  };
  res.cookie('jwt', 'logged-out', cookieOptions);
  //basically what we are doing is that when one logs out we will send them a dummy text back as jwt
  //and this new token will have a very small expiration time, in our case 10secs
  //this new jwt token will override the old token and because of which our website wont be able to verify the token when a page is rendered

  res.status(200).json({ status: 'success' });
};
exports.protect = async (req, res, next) => {
  //this function checks if user is fair
  //we will use this as a middleware if a user tries to request anything on the tour apis

  //1) getting token and seeing if it exists
  //you send the jwt as a header with field name Authorization
  //Authorization : Bearer fajijgrkamlLllk
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    //now we are checking for the jwt token which is sent as a request
  }

  console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in. Log in to get access', 401)
    );
  }

  //2) Verifying token
  let decodedString;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new AppError('Invalid token. Please login again!', 401));
    } else {
      decodedString = { ...decoded };
      console.log(decoded);
    }
  });

  console.log(decodedString);

  //3) check if user who is asking for the resouce exists
  const user = await User.findById(decodedString.id);
  //console.log(user.email);
  if (!user) {
    return next(
      new AppError('The user belonging to this token no longer exists', 401)
    );
  }

  //4) check if user changed password after the token was issued
  if (user.changedPasswordAfter(decodedString.iat)) {
    return next(
      new AppError('User recently changed password!! Please login again', 401)
    );
  }

  req.user = user; //req is what goes from one middleware to another
  //so we can put user on as a request variable
  res.locals.user = user;

  next();
};

exports.isLoggedIn = async (req, res, next) => {
  //this function checks if user is logged in
  //as we are checking if a user is currently logged in or not we will never return an error from this middleware
  //all we will do is add the user to the response locals if he is logged in, which then can be accessed by our pug templates

  //1) getting token and seeing if it exists

  if (req.cookies.jwt) {
    try {
      //2) Verifying token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //3) check if user who is asking for the resouce exists
      const user = await User.findById(decoded.id);
      //console.log(user.email);
      if (!user) {
        return next();
      }

      //4) check if user changed password after the token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = user;
      //we are gonna put the user on the response locals
      /*same as res.render('',{
      user = user
    })*/
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
  //if jwt doesnt exist then we will directly call next
};

exports.restrictTo = (...roles) => {
  //...roles make an array of the parameters sent
  return (req, res, next) => {
    //returning because middleware functions dont take parameters
    if (!roles.includes(req.user.role)) {
      //checking if the role of current user contains in the roles array
      //we can check this because we added user to the request in protect middleware
      return next(
        new AppError('You dont have access to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  //1)find user by email
  console.log('this is bloddy criminal');
  console.log(req.body.email);
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('The user with this email does not exist', 404));
  }
  //2)create reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //if you wanna update anything on a document you have to save it
  //we are trying to save the document when we are not providing every single field that was required bascially we are not giving passwordConfirm whoch we
  //originally removed once we saved the password

  //3)send resetPasswrdToken using email
  const resetUrl = `localhost:3000/api/v1/users/resetpassword/${resetToken}`;

  const message = `Forgot your password. Send a PATCH request with your new password and passwordConfirm to ${resetUrl}. If you didnt forget your password please ignore this message`;

  try {
    //sending email
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token is only valid for ten minutes',
    //   message: message,
    // });

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetAt = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  //1)we find user depending on reset token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  console.log(Date.now());
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetAt: { $gt: Date.now() },
  });
  //2)if token has not expired and user is present reset the password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetAt = undefined;

  await user.save();
  //3) Update changedpasswordAt property for the user

  //4)login the user, sned JWT
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //only will send cookie on encrypted connection(https)
    httponly: true, //cookie cannot be modified by browser ever
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  res.status(200).json({
    status: 'success',
    token,
  });
};

exports.updatePassword = async (req, res, next) => {
  try {
    //1)find user by id, because this route is only for authorized users we will first use the protect middleware
    const user = await User.findById(req.user.id).select('+password');

    //2)if user exists then check if password is correct
    if (!(await comparePassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError('The password is incorrect', 401));
    }

    //3)if password id correct then we update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //4)Log the user in
    const token = signToken(user._id);

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      //secure: true, //only will send cookie on encrypted connection(https)
      httponly: true, //cookie cannot be modified by browser ever
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }
    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
