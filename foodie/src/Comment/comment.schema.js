import mongoose from 'mongoose';

const {Schema} = mongoose

// Initialize the model to store all comments
const baseOptions = {
    discriminatorKey: '__type',
    collection: 'Comments',
    timestamps: true
}
export const Base = mongoose.model('Base', new Schema({}, baseOptions));

// Comments on either a user profile or a restaurant
export const parentCommentSchema = Base.discriminator('parentComment', new mongoose.Schema({
    poster: {
        //User ObjectID
        type: String,
        require: true,
    },
    restaurant:{
        //Restaurant ObjectID
        type: String,
    },
    content: {
        type: String,
        require: true,
    },
}));

// Methods to comments
parentCommentSchema.methods = {
    // Converts the model to json
    toJSON() {
        return {
            _id: this._id,
            poster: this.poster,
            restaurant: this.restaurant,
            content: this.content
        }
    }
}

// DEPRECATED
// A comment of a comment
export const childCommentSchema = Base.discriminator('childComment', new mongoose.Schema({
    poster: {
        //User ObjectID
        type: String,
        require: true,
    },
    restaurant: {
        type: String,
    },
    content:{
        type: String,
        require: true,
    },
    parent: {
        type: String,
        require: true
    },
}));

// Methods for child comments
childCommentSchema.methods = {
    // Converts the model to JSON
    toJSON() {
        return {
            _id: this._id,
            poster: this.poster,
            restaurant: this.restaurant,
            content: this.content,
            parent: this.parent,
        }
    },
}