import mongoose from 'mongoose';

const {Schema} = mongoose

// Schema for the restaurant model
const restaurantSchema = new Schema({
    place_id:{
        type: String,
        require: [true, 'google place id is required'],
        unique: true,
        trim: true,
        dropDups: true,
    },
    name:{
        type: String,
        trim: true,
    },
    address:{
        type: String,
        trim: true,
    },
    phonenumber:{
        type: String,
        trim :true,
    },
    price:{
        type: String,
        trim: true,
    },
    cuisine:{
        type:String,
        trim: true,
    },
    rating:{
        type: String,
        trim: true
    },
    comments: [
        {
            //objectid of comment
            type: String,
        }
    ]

}, {timestamps: true, strict:false});

// Methods for a restaurant model
restaurantSchema.methods = {
    // Converts the model to json
    toJSON(){
        return {
            _id: this._id,
            place_id: this.place_id,
            name: this.name,
            address: this.address,
            phonenumber: this.phonenumber,
            price: this.price,
            cuisine: this.cuisine,
            rating: this.rating,
            comments: this.comments
        }
    },
}

export default mongoose.model('Restaurant', restaurantSchema);