import Restaurant from "./restaurant.schema.js";
import {addRestaurantValidation} from "./restaurant.validation.js"


// create new restaurant 
export const addRestaurant = async (restaurant_data) => {
    try{
        const {error} = addRestaurantValidation(restaurant_data)
        if(error) {
            throw(error)
        }

        await Restaurant.updateOne(
            {
                "place_id": restaurant_data.place_id
            },
            restaurant_data,
            {
                upsert: true
            }
        );
    } catch(e) {
        throw(e)
    }
}

// find all restaurants in the database
export const findRestaurant = async (req, res) => {
    var restaurantRequest;
    try{
        restaurantRequest = await Restaurant.find({});
        return res.json({data:restaurantRequest});
    } catch(error){
        console.log(`Failed to get restaurants from the backend: ${error}`);  
        res.status(400).json({error: true, data: error})
    }
}