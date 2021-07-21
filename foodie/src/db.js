import mongoose from "mongoose";

// Connect app to the database
export default () => {
    const url = process.env.LOCAL_URL;
    mongoose.Promise = global.Promise;
    mongoose.connect(url, {
        useCreateIndex: true,
        useNewUrlParser: true
    });
	mongoose.connection
		.once("open", () => console.log("mongodb running"))
		.on("error", err => console.error(err))
};