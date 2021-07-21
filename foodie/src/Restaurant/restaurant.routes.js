import { Router } from 'express';
import {findRestaurant } from './restaurant.controller.js';

const routes = new Router();

// Setup restaurant endpoints
routes.get('/findRestaurant', findRestaurant);

export default routes;