import {parentCommentSchema, childCommentSchema} from "./comment.schema.js";
import { addParentCommentValidation } from "./comment.validation.js";

// create a parent comment
export const addParentComment = async (req, res) => {
    // Validate that the request is valid
    const {error} = addParentCommentValidation(req.body)
    if (error) {
        return res.status(400).json({error: true, data: error.details[0].message})
    }

    // Add the comment and return the comment data to the client
    try{
        const parentComment = await parentCommentSchema.create(req.body)
        return res.json({error: false, data: parentComment.toJSON()})
    } catch (e) {
        return res.status(400).json({error: true, data: e})
    }
}

// DEPRECATED
// create a comment of a comment
export const addChildComment = async (req, res) => {
    try {
        const childComment = await childCommentSchema.create(req.body);
        return res.json({ error: false, data: childComment.toJSON() });
    } catch (e) {
        return res.status(400).json({ error: true, data: e });
    }
}

// Searches for comments given the name of a user
export const findComments = async (req, res) => {
    var commentRequest;
    try {
        // Search for comments
        commentRequest = await parentCommentSchema.find({
            poster: req.query.poster,
        });
        return res.json({ data: commentRequest });
    } catch (error) {
        console.log(`Failed to get commments from the backend: ${error}`);
        return res.status(400).json({ error: true, data: error });
    }
};

// DEPRECATED
// Searches for child comments given a comment
export const findChildComments = async (req, res) => {
    var childCommentRequest;
    try {
        // Searches for child comments
        childCommentRequest = await childCommentSchema.find({
            parent: req.query.parent,
        });
        return res.json({ data: childCommentRequest });
    } catch (error) {
        console.log(`Failed to get child commments from the backend: ${error}`);
        res.status(400).json({ error: true, data: error });
    }
};

// Searches for comments given a restaurant id
export const findRestaurantComments = async (req, res) => {
    var commentRequest;
    try {
        // Gets comments
        commentRequest = await parentCommentSchema.find({
            restaurant: req.query.restaurant,
        });
        return res.json({ data: commentRequest });
    } catch (error) {
        console.log(`Failed to get commments from the backend: ${error}`);
        res.status(400).json({ error: true, data: error });
    }
};

// Deletes a comment given the id, includes both child and parent comments
export const deleteComment = async (req, res) => {
    try {
        // Deletes a comment
        await parentCommentSchema.deleteOne({
            _id: req.query.id,
        });
        return res.json({ error: false });
    } catch (error) {
        console.log(`Failed to get commments from the backend: ${error}`);
        res.status(400).json({ error: true, data: error });
    }
};
