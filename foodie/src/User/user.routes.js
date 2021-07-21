import expressJwt from "express-jwt";
import { Router } from "express";
import {
  login,
  register,
  checkAuth,
  addProfileInfo,
  checkEmail,
  checkUserName,
  addLike,
  addDislike,
  getLikes,
  getDislikes,
  getUserInfo,
  findUsers,
  addFriend
} from "./user.controller.js";

const secret = process.env.MY_SECRET;
const routes = new Router();

// Setup endpoints on the user route
routes.post("/login", login);
routes.post("/register", register);
routes.get("/auth", expressJwt({ secret }), checkAuth);
routes.post("/addProfileInfo", addProfileInfo);
routes.get("/check_username/:userName", checkUserName);
routes.get("/check_email/:email", checkEmail);
routes.post("/addLike", addLike);
routes.post("/addDislike", addDislike);
routes.get("/getLikes", getLikes);
routes.get("/getDislikes", getDislikes);
routes.get('/getUserInfo', getUserInfo);
routes.get('/findUsers', findUsers);
routes.post('/addFriend', addFriend);

export default routes;
