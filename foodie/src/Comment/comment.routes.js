import { Router } from "express";
import {
  addChildComment,
  addParentComment,
  findChildComments,
  findComments,
  findRestaurantComments,
  deleteComment,
} from "./comment.controller.js";

const routes = new Router();

// Setup the endpoints for the comments system
routes.post("/addParentComment", addParentComment);
//DEPRECATED    routes.post("/addChildComment", addChildComment);
routes.get("/findComments", findComments);
//DEPRECATED    routes.get("/findChildComments", findChildComments);
routes.get("/findCommentsForRestaurant", findRestaurantComments);
routes.get("/deleteComment", deleteComment);

export default routes;
