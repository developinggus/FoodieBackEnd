import axios from "axios";
import User from "./../User/user.schema.js";
import { addRestaurant } from "./../Restaurant/restaurant.controller.js";

const outputType = "json";

const nearbysearchURL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch";
const getPhotoURL = "https://maps.googleapis.com/maps/api/place/photo";

// Generate the keyword for the google api request given food filters and profile info
function getKeyword(foodFilters, profileInfo) {
  // If food filters exist, get keyword from food filters
  if (foodFilters.length > 1) {
    var foodTypes = `${foodFilters[0]}`;
    // Iterate through food filters to generate string
    for (var index = 1; index < foodFilters.length; index++) {
      var filterItem = foodFilters[index];
      foodTypes += ` OR ${filterItem}`;
    }
    return `${foodTypes}`;
  } else if (foodFilters.length == 1) {
    return `${foodFilters[0]}`;
  }

  // If there are no food filters, rely on profile info
  if ("foodTypes" in profileInfo && profileInfo.foodTypes.length > 0) {
    var foodTypes = profileInfo.foodTypes.join(" OR ");
    return `${foodTypes}`;
  } else {
    return undefined;
  }
}

// Convert the string price to an integer for the google api
function getPrice(filters, profileInfo) {
  // Note 0 is least expensive, 4 is most
  // Front-end sends '$', '$$', and/or '$$$'
  var min = 4;
  var max = 0;
  for (var index = 0; index < filters.length; index++) {
    var filterItem = filters[index];
    if (filterItem == "$") {
      if (min > 0) min = 0; // If min is higher than 0, lower it to 0
      if (max < 1) max = 1; // If max is lower than 1, raise it to 1
    } else if (filterItem == "$$") {
      if (min > 2) min = 2;
      if (max < 3) max = 3;
    } else if (filterItem == "$$$") {
      if (min > 4) min = 4;
      if (max < 4) max = 4;
    }
  }

  if (min <= max) {
    // If price has been specified in filters
    return [min, max];
  }

  if ("price" in profileInfo) {
    // If min price has been specified in profile info
    if ((profileInfo.price == "none") || (profileInfo.price == undefined)) {
      return undefined;
    } else {
      return [profileInfo.price.length - 1, 4];
    }
  } else {
    return undefined;
  }
}

// Convert the string distances from the filter to integers for the google api
function getRadius(filters, profileInfo) {
  var distance = 50000;
  for (var index = 0; index < filters.length; index++) {
    var filterItem = filters[index];
    if (filterItem == "Under 5 km") {
      if (distance > 5000) distance = 5000;
    } else if (filterItem == "Under 10 km") {
      if (distance > 10000) distance = 10000;
    } else if (filterItem == "Under 20 km") {
      if (distance > 20000) distance = 20000;
    }
  }
  return distance;
}

// Combine the variables to create the parameters for the google request
function getParams(location, radius, keyword, price) {
  var params = {};

  params.key = process.env.GOOGLE_API_KEY;
  params.location = location;
  params.radius = radius;
  params.type = "restaurant";

  if (keyword != undefined) params.keyword = keyword;

  if (price != undefined) {
    params.minprice = price[0];
    params.maxprice = price[1];
  }

  return params;
}

// Adds all places sent to client to the database of restaurants
function addToDB(places) {
  for (var index = 0; index < places.length; index++) {
    var place = places[index];
    var entry = {
      place_id: place.place_id,
      name: place.name,
      address: place.vicinity,
      phonenumber: undefined,
      rating: undefined,
      price: undefined,
      cuisine: undefined,
      rating: undefined,
    };
    addRestaurant(entry).catch(function (e) {
      console.log(`Failed to add restaurant to DB: ${e}`);
      return;
    });
  }
  return;
}

// Finds a nearby place given a query
export async function find(req, res) {
  // Get email from query
  if (!("email" in req.headers)) {
    console.log(`Failed to get a email from headers`);
    return res.status(400).send(`Failed to get email from headers`);
  }

  // Get user from email
  var user = await User.findOne({ email: req.headers.email });

  // Get location from query
  if (!("latitude" in req.query) || !("longitude" in req.query)) {
    console.log(`Failed to get a location from request`);
    return res.status(400).send(`Failed to get location from request`);
  }
  var latitude = req.query.latitude;
  var longitude = req.query.longitude;

  // If location does not exist, send error to client
  if (isNaN(latitude) || isNaN(longitude)) {
    console.log(`Failed to get a location from request`);
    return res.status(400).send(`Failed to get location from request`);
  }

  // Get filters from query
  var filters = [];
  if ("filters" in req.query) {
    filters = JSON.parse(req.query.filters);
  }

  // Get food filters from query
  var foodFilters = [];
  if ("foodFilters" in req.query) {
    foodFilters = JSON.parse(req.query.foodFilters);
  }

  // Convert data to strings to be used in the params of the google api request
  var location = `${latitude}, ${longitude}`;
  var radius = getRadius(filters, user.profileInfo);
  var keyword = getKeyword(foodFilters, user.profileInfo);
  var price = getPrice(filters, user.profileInfo);
  var params = getParams(location, radius, keyword, price);

  var placeDataRequest;
  try {
    // this is an example of the response format
    placeDataRequest = {
      data: {
        results: [
          {
            vicinity: "6 Easton Ave, New Brunswick, NJ 08901, United States",
            name: "Vivi Bubble Tea/KBG",
            place_id: "ChIJ_UDANVHGw4kRyF7OUJ3Uxrw",
            photos: [
              {
                height: 1260,
                html_attributions: ["From a Google User"],
                photo_reference:
                  "CnRwAAAAeM-aLqAm573T44qnNe8bGMkr_BOh1MOVQaA9CCggqtTwuGD1rjsviMyueX_G4-mabgH41Vpr8L27sh-VfZZ8TNCI4FyBiGk0P4fPxjb5Z1LrBZScYzM1glRxR-YjeHd2PWVEqB9cKZB349QqQveJLRIQYKq2PNlOM0toJocR5b_oYRoUYIipdBjMfdUyJN4MZUmhCsTMQwg",
                width: 1890,
              },
            ],
          },
        ],
        status: "OK",
      },
    };

    // requests a place with the text query from google maps
    placeDataRequest = await axios({
      method: "get",
      url: `${nearbysearchURL}/${outputType}`,
      params: params,
    });
  } catch (error) {
    // On an error using the google api, tell client
    console.log(`Failed to get a place from Google API: ${error}`);
    return res
      .status(503)
      .send(`Server failed to get a place from Google API: ${error}`);
  }

  // On a google api error, tell client
  if (placeDataRequest.data.status != "OK") {
    console.log(`Failed to get a place from Google API: ${placeDataRequest.data.status}`);
    return res
      .status(503)
      .send(
        `Server failed to get a place from Google API: ${placeDataRequest.data.status}`
      );
  }

  // Gets a random place from the list
  var length = placeDataRequest.data.results.length;
  if (length == 0) {
    console.log("No places found");
    return res.status(503).send("No places found");
  }

  var N = Math.floor(Math.random() * length);
  var place = [placeDataRequest.data.results[N]];

  addToDB(place);
  return res.send(JSON.stringify(place));
}

// Gets photos given the photo_reference, and maxheight or maxwidth
export async function getPhoto(req, res) {
  // Get the photo_reference
  var photo_reference = req.query.photo_reference;
  if (photo_reference == undefined) {
    console.log(`Missing photo_reference`);
    return res.status(400).send(`Missing photo_reference`);
  }

  // Get maxwidth and/or maxheight
  var maxwidth = req.query.maxwidth;
  var maxheight = req.query.maxheight;

  // Get the image url
  var image_request;
  try {
    var params = {
      key: process.env.GOOGLE_API_KEY,
      photo_reference: photo_reference,
      maxheight: maxheight,
      maxwidth: maxwidth,
    };

    // requests a place with the text query from google maps
    image_request = await axios({
      method: "get",
      responseType: "arraybuffer",
      url: getPhotoURL,
      params: params,
    });
  } catch (error) {
    console.log(`Failed to get a photo from Google API: ${error}`);
    return res
      .status(503)
      .send(`Server failed to get a photo from Google API: ${error}`);
  }

  console.log("Sending image");
  res.set("Content-Type", image_request.headers["content-type"]);
  res.set("Content-Length", image_request.data.length);
  res.send(image_request.data);
}
