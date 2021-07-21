import 'dotenv/config.js';
import express from 'express';
import db from "./db.js"
import expressJwt from 'express-jwt';
import bodyParser from 'body-parser';
import UserRoute from './User/user.routes.js';
import PlacesRouter from "./Places/places.routes.js"
import RestaurantRoute from "./Restaurant/restaurant.routes.js"
import CommentRoute from "./Comment/comment.routes.js"
import requireAuth from "./middleware/requireAuth.js"

// Secret for encoding token
const secret = process.env.MY_SECRET;

const app = express();
db();

app.set('trust proxy', true)

// Setup routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false,}));
app.use("/api", UserRoute );
app.use("/api", RestaurantRoute);
app.use("/api", CommentRoute);
app.use('/api/places', expressJwt({ secret }), PlacesRouter);

app.get('/', requireAuth, (req, res) => {
  res.send(`Your id: ${req.user._id}`);
});

// Initialize the app to run on the process's port or on port 3000
let port = process.env.PORT || 3000;
const server = app.listen(port, function () {
  console.log(`We're listening on port ${port}.`)
});

export {app}