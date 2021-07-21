import  Joi from '@hapi/joi'

// Ensure that data is valid for a a comment to be entered into the database
export const addParentCommentValidation = (data) => {
    const schema = Joi.object({
        poster: Joi.string().required(),
        restaurant: Joi.string(),
        content: Joi.string().required()
    });
    return schema.validate(data)
}
