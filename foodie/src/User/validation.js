import  Joi from '@hapi/joi'

// Ensure that data is valid for a user registration
export const registerValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        userName:Joi.string().required(),
        firstName: Joi.string(),
        lastName: Joi.string(),
        password: Joi.string().required().min(6),
        birthdate:Joi.date().required(),
        signedIn: Joi.boolean(),
        admin: Joi.boolean()
    })
    return schema.validate(data)
}

// Ensure that data is valid for a user login
export const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required().min(6)
    })
    return schema.validate(data)
}

// Check format and datatype of an email input
export const emailValidation = data => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
    })
    return schema.validate(data)
}

// Check datatype and length of a password input
export const passwordValidation = data => {
    const schema = Joi.object({
        password: Joi.string().required().min(6),
    })
    return schema.validate(data)
}