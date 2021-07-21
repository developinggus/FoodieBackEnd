import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from "../User/user.schema.js";

const SECRET = process.env.MY_SECRET;

// Check if the auth token is valid
export default (req, res, next) => {
    const { authorization } = req.headers;
    // authorization === 'Bearer laksjdflaksdjasdfklj'

    // Checks if the auth token exists
    if (!authorization) {
        return res.status(401).json({ error: 'You must be logged in.' });
    }

    // Get the token
    const token = authorization.replace('Bearer ', '');
    jwt.verify(token, SECRET, async (err, payload) => {
        if (err) {
            return res.status(401).json({ error: 'You must be logged in.' });
        }

        // If the decrypted token returns the user id, set the user in the request
        const { sub } = payload;
        const user = await User.findById(sub);
        req.user = user;
        next();
    });
};
