//Validation
const Joi = require('@hapi/joi');


//Register Validation
const registerValidation = (data) => {

    const schema = {
    name: Joi.string().min(6).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
    };

    return Joi.validate(data, schema)
}


//Register Validation
const loginValidation = (data) => {

    const schema = {
      // name: Joi.string().min(6).required(),
      email: Joi.string().min(6).required().email(),
      password: Joi.string().min(6).required(),
    };

    return Joi.validate(data, schema)
}

//Forgot Password Validation
const forgotValidation = (data) => {
  const schema = {
    email: Joi.string().min(6).required().email(),
  };

  return Joi.validate(data, schema);
};


module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.forgotValidation = forgotValidation;