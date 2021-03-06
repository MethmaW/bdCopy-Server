const router = require('express').Router()
const User = require('../modal/User')
const { registerValidation, loginValidation } = require('../validation')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer");
const randomInt = require("random-int");


//server-side variables
let twofaCodeString = ""
let currentUserLoginEmail = ""
let currentUserRegisterEmail = ""
let currentUserFPEmail = ""

//passcode generator
const passcodeGenerator = () => {

  let twofaCode = randomInt(121375, 999999);
  twofaCodeString = twofaCode.toString();

  return twofaCodeString

}



//----------------------------Register Route----------------------------------
router.post('/register', async (req, res) => {
  //input validation
  const { error } = registerValidation(req.body);
  if (error) return res.send(error.details[0].message);

  //check if the user already exists in the DB
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.send({error: "Email already exists"});

  //temp saving the current register user email
  currentUserRegisterEmail = req.body.email

  //confirm - send email
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASS,
    },
  });

  passcodeGenerator();

  var mailOptions = {
    from: process.env.APP_EMAIL,
    to: "methma.cw@gmail.com",
    subject: "[no-reply] ButterflyApp Passcode",
    html: `<p>Hello Test,</p>
    <p>Thank you for registering your account with ButterflyApp. Please use <b>${twofaCodeString}</b> as the passcode to verify your email address. This passcode is valid for one-time use only.</p>
    <p>Thank you,</p>
    <p>ButterflyApp</p>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.send("Could not verify the user");
    } else {
      console.log("Email sent: " + info.response);
      res.send({ registerStatus: "success" });
    }
  });

});


//Confirm email route
router.post("/confirm-email", async (req, res) => {
  //confirming the email
  if (req.body.email !== currentUserRegisterEmail)
    return res.status(400).send("Session expired, please register again");

  //check if the user already exists in the DB
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("Email already exists");

  //hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  

  //create new user
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    img: req.body.img,
  });

  if (req.body.code === twofaCodeString) {
    try {
      const savedUser = await user.save();
      const token = jwt.sign({ _id: savedUser._id }, process.env.TOKEN_SECRET);
      
      res.header("auth-token", token).send({token: token});

    } catch (err) {
      res.status(400).send(err);
    }
  } else {
    res.send({ error: "Wrong passcode, please try again" });
  }
});



//----------------------------Login Route----------------------------------
router.post("/login", async (req, res) => {
  
  //check if the email exists in the DB
  const userRecord = await User.findOne({
    $or: [{ email: req.body.email }, { name: req.body.email }],
  });
  if (!userRecord) return res.send({ error: "Username or email not found" });

  //temp saving the current login user email
  currentUserLoginEmail = req.body.email;

  //check if the password is correct
  const validPass = await bcrypt.compare(
    req.body.password,
    userRecord.password
  );
  if (!validPass) return res.send({ error: "Invalid password" });

  //2 factor authentication - send email
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASS,
    },
  });

  passcodeGenerator();

  var mailOptions = {
    from: process.env.APP_EMAIL,
    to: "methma.cw@gmail.com",
    subject: "[no-reply] ButterflyApp Passcode",
    html: `<p>Hello Test,</p>
    <p>Please use <b>${twofaCodeString}</b> as the ButterflyApp passcode for the current login session. This passcode is valid for one-time use only.</p>
    <p>Thank you,</p>
    <p>ButterflyApp</p>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.send("Email not found");
    } else {
      console.log("Email sent: " + info.response);
      res.send({ loginStatus: "success" });
    }
  });
});


//confirm passcode route
router.post('/confirm-passcode', async (req, res) => {

  if (
    req.body.code === twofaCodeString &&
    req.body.email === currentUserLoginEmail
  ) {
    const userRecord = await User.findOne({
      $or: [{ email: req.body.email }, { name: req.body.email }],
    });
    const token = jwt.sign({ _id: userRecord._id }, process.env.TOKEN_SECRET);
    res.send({token: token});
  } else {
    res.send({ error: "Invalid passcode or email" });
  }

});


//----------------------------Forgot Password Route----------------------------------
router.post('/forgot-password', async (req, res) => {

  //check if the email exists in the DB
  const userRecord = await User.findOne({ email: req.body.email });
  if (!userRecord) return res.send({ error: "Email not found, plese create an account to login" });

  //temp saving the current register user email
  currentUserFPEmail = req.body.email

  

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASS,
      },
    });

    passcodeGenerator();

    var mailOptions = {
      from: process.env.APP_EMAIL,
      to: "methma.cw@gmail.com",
      subject: "[no-reply] ButterflyApp Passcode",
      html: `<p>Hello Test,</p>
    <p>Please use <b>${twofaCodeString}</b> as the passcode to verify your email and reset the password. This passcode is valid for one-time use only.</p>
    <p>Thank you,</p>
    <p>ButterflyApp</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res.send("Email not found");
      } else {
        console.log("Email sent: " + info.response);
        res.send({ forgotStatus: "success" });
      }
    });

});


//forgot password - confirm the email route
router.post('/forgot-password-passcode', (req, res) => {

  if (req.body.email !== currentUserFPEmail) return res.send('Wrong email');
  
  if (req.body.code === twofaCodeString) {
    return res.send({codeStatus: "success"});
  } else {
    return res.send({ codeStatus: "Wrong passcode" });
  }

});


//forgot password - reset password
router.post('/reset-password', async (req, res) => {
  
  //confirming the email
  if(req.body.email !== currentUserFPEmail) return res.send("Wrong email address")

  //hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);


  try {
     const updatePass = await User.findOneAndUpdate(
       { email: req.body.email },
       { password: hashedPassword }
     );
    
    const token = jwt.sign({ _id: updatePass._id }, process.env.TOKEN_SECRET);
    res.send({ token: token });
    
  } catch(err) {
    res.status(400).send("Error")
  }

});




module.exports = router 