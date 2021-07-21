import Joi from "@hapi/joi";

// Ensure that data is valid for a restaurant model
export const addRestaurantValidation = (data) => {
  const schema = Joi.object({
    place_id: Joi.string().required(),
    name: Joi.string(),
    address: Joi.string(),
    phonenumber: Joi.string(),
    price: Joi.string(),
    cuisine: Joi.string(),
    rating: Joi.string(),
  });
  return schema.validate(data);
};
