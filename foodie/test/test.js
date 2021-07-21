// https://github.com/mochajs/
import User from "./../src/User/user.schema.js";
import Restaurant from "./../src/Restaurant/restaurant.schema.js";
import {parentCommentSchema} from "./../src/Comment/comment.schema.js";
const mongoose = require("mongoose");

const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
const app = "http://localhost:3000";

const test_emails = [
    "address0@someDomain.com",
    "address1@someDomain.com",
    "🥝",
    "address2@someDomain.com",
];
const test_place_ids = [
    "🥝",
    "ChIJ57Pc-peww4kRxsjS7GsqWfQ",
    "ChIJ_UDANVHGw4kRyF7OUJ3Uxrw",
]
const test_place_names = [
    "Vivi Bubble Tea/KBG",
    "Wendy's",
    "🥝",
]
var login_data;
var admin_login_data;
var restaurant_data;
var parent_comment_datas = [];

// Removes the test database data
function cleanup() {
    // Connect to DB
    mongoose.connect("mongodb://localhost:27017/Ask-Foodie-DB", {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    });

    // Remove test data in database
    Promise.all([
        User.deleteMany({ email: {$in: test_emails} }),
        Restaurant.deleteMany({ place_id: {$in: test_place_ids} }),
        Restaurant.deleteMany({ name: {$in: test_place_names} }),
        parentCommentSchema.deleteMany({ poster: "userName0" }),
    ])
        .then(function(values) {
            // Disconnect from DB after all test data is removed
            mongoose.disconnect();
            return;
        })
        .catch(console.log);
    return;
};
// Clean before and after testing
before(cleanup);
after(cleanup);

// Test the user controller
describe("User Controller", function() {
    // Test registerring
    describe("POST /api/register", function() {
        // T01 Test registerring normally
        it("should register user normally", function(done) {
            const params = {
                email: test_emails[0],
                firstName: "firstName0",
                userName: "userName0",
                birthdate: new Date(),
                password: "password0",
            };

            chai
                .request(app)
                .post("/api/register")
                .send(params)
                .end(function(err, res) {
                    // Should respond status 200 and have the correct format
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("error");
                    chai.expect(res.body.error).equal(false);
                    done();
                });
        });

        // T02 Test registerring with the same email as the first test, should fail
        it("should fail to register a duplicate email", function(done) {
            const params = {
                email: test_emails[0],
                firstName: "firstName1",
                userName: "userName1",
                birthdate: new Date(),
                password: "password1",
            };

            chai
                .request(app)
                .post("/api/register")
                .send(params)
                .end(function(err, res) {
                    // Should respond status 401
                    chai.expect(res).status(401);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    chai.expect(res.body.data).equal("email already exists.");
                    done();
                });
        });
        
        // T03 Test registerring with the same username as the first test
        it("should fail to register a duplicate username", function(done) {
            const params = {
                email: test_emails[1],
                firstName: "firstName0",
                userName: "userName0",
                birthdate: new Date(),
                password: "password0",
            };

            chai
                .request(app)
                .post("/api/register")
                .send(params)
                .end(function(err, res) {
                    // Should respond status 401
                    chai.expect(res).status(401);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    chai.expect(res.body.data.name).equal("MongoError");
                    chai.expect(res.body.data.code).equal(11000);
                    done();
                });
        });
        
        // T04 Test registerring with a malformatted email
        it("should fail to register an invalid email", function(done) {
            const params = {
                email: test_emails[2],
                firstName: "firstName1",
                userName: "userName1",
                birthdate: new Date(),
                password: "password1",
            };

            chai
                .request(app)
                .post("/api/register")
                .send(params)
                .end(function(err, res) {
                    // Should respond status 400
                    chai.expect(res).status(400);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    chai.expect(res.body.data).equal("\"email\" must be a valid email");
                    done();
                });
        });

        // Register an admin user for future tests
        it("should register an admin user normally", function(done) {
            const params = {
                email: test_emails[1],
                firstName: "firstName1",
                userName: "userName1",
                birthdate: new Date(),
                password: "password1",
            };

            this.timeout(10000);
            chai
                .request(app)
                .post("/api/register")
                .send(params)
                .end(function(err, res) {
                    // Expecting status 200 and no error
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("error");
                    chai.expect(res.body.error).equal(false);

                    admin_login_data = res.body.data;

                    // Connect to DB
                    mongoose.connect("mongodb://localhost:27017/Ask-Foodie-DB", {
                        useNewUrlParser: true,
                        useCreateIndex: true,
                        useUnifiedTopology: true
                    })

                    // Then, find the currently registerred user and set as an admin
                    User.findByIdAndUpdate(admin_login_data._id, { admin: true }, function(err, _) {
                        if (err) {
                            fail(err);
                        } else {
                            done();
                        }
                    });
                });
        });
    });

    // Test logging in
    describe("POST /api/login", function() {
        // T05 Test logging in normally
        it("should login user normally", function(done) {
            const params = {
                email: test_emails[0],
                password: "password0"
            };

            chai
                .request(app)
                .post("/api/login")
                .send(params)
                .end(function(err, res) {
                    // Response should have status 200, and have respond with the login data
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    chai.expect(res.body.data).ownProperty("token");
                    login_data = res.body.data;
                    done();
                });
        });
        
        // T06 Tests logging in with an account that does not exist
        it("should fail to login invalid user", function(done) {
            const params = {
                email: test_emails[3],
                password: "password0"
            };

            // Login
            chai
                .request(app)
                .post("/api/login")
                .send(params)
                .end(function(err, res) {
                    // Response should have status 401, and respond with an error
                    chai.expect(res).status(401);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    chai.expect(res.body.data).equal("cannot find email");
                    done();
                });
        });
        
        // T07 Tests logging in with an invalid password
        it("should fail to login wrong password", function(done) {
            const params = {
                email: test_emails[0],
                password: "password1"
            };

            chai
                .request(app)
                .post("/api/login")
                .send(params)
                .end(function(err, res) {
                    // Response should have status 401, and respond with an error
                    chai.expect(res).status(401);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    chai.expect(res.body.data).equal("incorrect password");
                    done();
                });
        });
    });

    // Test adding profile info
    describe("POST /api/addProfileInfo", function() {
        // T08 Tests updating a user's profile data normally
        it("should update profile normally", function(done) {
            const params = {
                foodTypes: ["chinese", "italian"],
                price: "$$",
                distance: 10,
                dining: 2,
            }

            chai
                .request(app)
                .post("/api/addProfileInfo")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Should respond with status 200 and have data in the body
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    done();
                });
        });

        // T09 Tests updating profile data with extra parameters
        it("should fail with extra params", function(done) {
            const params = {
                foodTypes: ["chinese", "italian"],
                price: "$$",
                distance: 10,
                dining: 2,
                age: 6, // Extra parameter
            }

            chai
                .request(app)
                .post("/api/addProfileInfo")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Should respond with a bad request status
                    chai.expect(res).status(400);
                    done();
                });
        });
        
        // T10 Tests updating profile data with missing parameters
        it("should fail with missing params", function(done) {
            const params = {
                // Removed parameters
            }

            chai
                .request(app)
                .post("/api/addProfileInfo")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Should respond with status 400
                    chai.expect(res).status(400);
                    done();
                });
        });
        
        // T11 Tests updating profile data with invalid parameters
        it("should fail with extra params", function(done) {
            const params = {
                distance: [0], // Distance should be an integer
            }

            chai
                .request(app)
                .post("/api/addProfileInfo")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Should respond with a bad request status
                    chai.expect(res).status(400);
                    done();
                });
        });
    });
});

// Test the authentification
describe("Auth", function() {
    // Checks each endpoint if authentification is setup
    describe("Check endpoints if auth is setup", function() {
        // T12 Tests if the update profile data endpoint requires auth
        it("addProfileInfo should fail without auth", function(done) {
            const params = {}

            chai
                .request(app)
                .post("/api/addProfileInfo")
                .send(params)
                .end(function(err, res) {
                    // Should respond with a bad request status
                    chai.expect(res).status(401);
                    done();
                });
        });
        
        // T13 Tests if the find place endpoint requires auth
        it("find place should fail without auth", function(done) {
            const params = {}

            chai
                .request(app)
                .post("/api/places/find")
                .send(params)
                .end(function(err, res) {
                    // Should respond with a bad request status
                    chai.expect(res).status(401);
                    done();
                });
        });
        
        // T14 Tests if the photos endpoint requires auth
        it("photos should fail without auth", function(done) {
            const params = {}

            chai
                .request(app)
                .post("/api/places/photos")
                .send(params)
                .end(function(err, res) {
                    // Should respond with a bad request status
                    chai.expect(res).status(401);
                    done();
                });
        });
        
        // T15 Tests if the add comment endpoint requires auth
        it("add comments should fail without auth", function(done) {
            const params = {}

            chai
                .request(app)
                .post("/api/addParentComment")
                .send(params)
                .end(function(err, res) {
                    // Should respond with a bad request status
                    chai.expect(res).status(401);
                    done();
                });
        });
        
        // T16 Tests if the find comments endpoint requires auth
        it("find comments should fail without auth", function(done) {
            const params = {}

            chai
                .request(app)
                .post("/api/findComments")
                .send(params)
                .end(function(err, res) {
                    // Should respond with a bad request status
                    chai.expect(res).status(401);
                    done();
                });
        });

        // T__ Tests if the delete comment endpoint requres auth
        it("delete comments should fail without auth", function(done) {
            const params = {}

            chai
                .request(app)
                .post("/api/deleteComment")
                .send(params)
                .end(function(err, res) {
                    // Should respond with a bad request status
                    chai.expect(res).status(401);
                    done();
                });
        });
    });

    // Checks if the authentification system is working
    describe("GET /", function() {
        // T17 A request should fail with an invalid token
        it("should fail with invalid token", function(done) {
            chai
                .request(app)
                .get("/")
                .set("email", login_data.email)
                .set("Authorization", ``)
                .end(function(err, res) {
                    // Should have status 401
                    chai.expect(res).to.have.status(401);
                    done();
                })
        });
        
        // T18 A request should fail with an invalid email
        it("should fail with invalid email", function(done) {
            chai
                .request(app)
                .get("/")
                .set("email", 'a')
                .set("Authorization", `Bearer ${login_data.token}`)
                .end(function(err, res) {
                    // Should have status 401
                    chai.expect(res).to.have.status(401);
                    done();
                })
        });
        
        // T19 A request should fail with a missing email
        it("should fail with missing email", function(done) {
            chai
                .request(app)
                .get("/")
                .set("Authorization", `Bearer ${login_data.token}`)
                .end(function(err, res) {
                    // Should have status 401
                    chai.expect(res).to.have.status(401);
                    done();
                })
        });
    });
});

// Test the places controller
describe("Places Controller", function() {
    // Tests finding a place
    describe("GET /api/places/find", function() {
        // T20 Tests finding a place normally
        it("should find a place normally", function(done) {
            const params = {
                latitude: '40.6129',
                longitude: '-74.416',
                filters: JSON.stringify(["$$$"]),
                foodFilters: JSON.stringify(["Fast Food"]),
            };

            chai
                .request(app)
                .get("/api/places/find")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should have status 200 and a text property
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("text");
                    
                    var places;
                    try {
                        places = JSON.parse(res.text);
                    } catch(err) {
                        fail(err.message);
                    }

                    // Places data should have at least one place and should all be formatted correctly
                    chai.expect(places).not.empty;
                    for (var result_i = 0; result_i < places.length; result_i++) {
                        chai.expect(places[result_i]).include.keys("vicinity", "name", "place_id");
                    }
                    restaurant_data = places[0];

                    done();
                });
        });
        
        // T21 Tests finding a place with a missing latutude
        it("should error without latitude", function(done) {
            const params = {
                longitude: '-74.416',
                filters: JSON.stringify(["$$$"]),
                foodFilters: JSON.stringify(["Fast Food"]),
            };

            chai
                .request(app)
                .get("/api/places/find")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should error with malformed input
                    chai.expect(res).status(400);
                    done();
                });
        });

        // T22 Tests finding a place without a longitude
        it("should error without longitude", function(done) {
            const params = {
                latitude: '40.6129',
                filters: JSON.stringify(["$$$"]),
                foodFilters: JSON.stringify(["Fast Food"]),
            };

            chai
                .request(app)
                .get("/api/places/find")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should error with a malformed input
                    chai.expect(res).status(400);
                    done();
                });
        });
        
        // T23 Tests finding a place without filters
        it("should find a place with filters missing", function(done) {
            const params = {
                latitude: '40.6129',
                longitude: '-74.416'
            };

            chai
                .request(app)
                .get("/api/places/find")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should have similar results compared to finding with a filter
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("text");
                    
                    var places;
                    try {
                        places = JSON.parse(res.text);
                    } catch(err) {
                        fail(err.message);
                    }

                    chai.expect(places).not.empty;
                    for (var result_i = 0; result_i < places.length; result_i++) {
                        chai.expect(places[result_i]).include.keys(["vicinity", "name", "place_id"]);
                    }
                    done();
                });
        });

        // T__ Tests finding a place with invalid coordinates
        it("should error with too low longitude and too low latitude", function(done) {
            const params = {
                latitude: '-1',
                longitude: '-181',
                filters: JSON.stringify(["$$$"]),
                foodFilters: JSON.stringify(["Fast Food"]),
            };

            chai
                .request(app)
                .get("/api/places/find")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should give an error from google's api
                    chai.expect(res).status(503);
                    done();
                });
        });
        
        // T__ Tests finding a place with invalid coordinates
        it("should error with too high longitude and too high latitude", function(done) {
            const params = {
                latitude: '-1',
                longitude: '-181',
                filters: JSON.stringify(["$$$"]),
                foodFilters: JSON.stringify(["Fast Food"]),
            };

            // Register a user
            chai
                .request(app)
                .get("/api/places/find")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should give an error from google's api
                    chai.expect(res).status(503);
                    done();
                });
        });
    });

    // Tests getting images from google's api
    describe("GET /api/places/photos", function() {
        // T__ Tests getting an image normally from google's api
        it("should get an image normally", function(done) {
            const params = {
                photo_reference: "CnRtAAAATLZNl354RwP_9UKbQ_5Psy40texXePv4oAlgP4qNEkdIrkyse7rPXYGd9D_Uj1rVsQdWT4oRz4QrYAJNpFX7rzqqMlZw2h2E2y5IKMUZ7ouD_SlcHxYq1yL4KbKUv3qtWgTK0A6QbGh87GB3sscrHRIQiG2RrmU_jF4tENr9wGS_YxoUSSDrYjWmrNfeEHSGSc3FyhNLlBU",
                maxwidth: 400,
            };

            chai
                .request(app)
                .get("/api/places/photos")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Expects status 200 and a jpeg file
                    chai.expect(res).status(200);
                    chai.expect(res.headers["content-type"]).equals("image/jpeg");
                    done();
                });
        });

        // T__ Tests getting an image without an image reference
        it("should fail without photo_reference", function(done) {
            const params = {
                maxwidth: 400,
            };

            chai
                .request(app)
                .get("/api/places/photos")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Expects a malformed request status
                    chai.expect(res).status(400);
                    done();
                });
        });

        // T__ Tests getting an image without a max width
        it("should fail without maxwidth", function(done) {
            const params = {
                photo_reference: "CnRtAAAATLZNl354RwP_9UKbQ_5Psy40texXePv4oAlgP4qNEkdIrkyse7rPXYGd9D_Uj1rVsQdWT4oRz4QrYAJNpFX7rzqqMlZw2h2E2y5IKMUZ7ouD_SlcHxYq1yL4KbKUv3qtWgTK0A6QbGh87GB3sscrHRIQiG2RrmU_jF4tENr9wGS_YxoUSSDrYjWmrNfeEHSGSc3FyhNLlBU",
            };

            chai
                .request(app)
                .get("/api/places/photos")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Expects a google api error
                    chai.expect(res).status(503);
                    done();
                });
        });
        
        // T__ Tests getting an image with an invalid reference
        it("should fail with invalid photo_reference", function(done) {
            const params = {
                photo_reference: "🥝",
                maxwidth: 400,
            };

            chai
                .request(app)
                .get("/api/places/photos")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Expects a google api error
                    chai.expect(res).status(503);
                    done();
                });
        });
        
        // T__ Tests getting an image with an invalid width reference
        it("should fail with invalid maxwidth", function(done) {
            const params = {
                photo_reference: "CnRtAAAATLZNl354RwP_9UKbQ_5Psy40texXePv4oAlgP4qNEkdIrkyse7rPXYGd9D_Uj1rVsQdWT4oRz4QrYAJNpFX7rzqqMlZw2h2E2y5IKMUZ7ouD_SlcHxYq1yL4KbKUv3qtWgTK0A6QbGh87GB3sscrHRIQiG2RrmU_jF4tENr9wGS_YxoUSSDrYjWmrNfeEHSGSc3FyhNLlBU",
                maxwidth: "🥝",
            };

            // Register a user
            chai
                .request(app)
                .get("/api/places/photos")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Expects a google error
                    chai.expect(res).status(503);
                    done();
                });
        });
    });
});

// Test the comments controller
describe("Comment Controller", function() {
    // Tests adding comments
    describe("POST /api/addParentComment", function() {
        // T24 Tests adding a comment normally
        it("should post a comment", function(done) {
            const params = {
                poster: login_data.userName,
                restaurant: restaurant_data._id,
                content: "Comment 0"
            };

            chai
                .request(app)
                .post("/api/addParentComment")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Expects a success and the comment data
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    parent_comment_datas.push(res.body.data);
                    done();
                });
        });
        
        // T25 Tests adding a comment with the same data as the previous test
        it("should post a duplicate", function(done) {
            const params = {
                poster: login_data.userName,
                restaurant: restaurant_data._id,
                content: "Comment 0"
            };

            chai
                .request(app)
                .post("/api/addParentComment")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Expects a success
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    parent_comment_datas.push(res.body.data);
                    done();
                });
        });
        
        // T26 Tests adding a comment without content
        it("should fail without comment", function(done) {
            const params = {
                poster: login_data.userName,
                restaurant: restaurant_data._id,
            };

            chai
                .request(app)
                .post("/api/addParentComment")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Expects status 400
                    chai.expect(res).status(400);
                    done();
                });
        });

        // T27 Tests adding a comment without a restaurant
        it("should post with no restaurant", function(done) {
            const params = {
                poster: login_data.userName,
                content: "Comment 0"
            };

            chai
                .request(app)
                .post("/api/addParentComment")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Expects a success
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("error");
                    chai.expect(res.body.error).equal(false);
                    done();
                });
        });

        // T__ Tests adding a comment with an invalid restaurant
        it("should fail with an invalid restaurant", function(done) {
            const params = {
                poster: login_data.userName,
                restaurant: 'a',
                content: "Comment 0"
            };

            chai
                .request(app)
                .post("/api/addParentComment")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Expects status 400
                    chai.expect(res).status(400);
                    done();
                });
        });

        // T__ Tests adding a comment with an invalid poster
        it("should fail with an invalid poster", function(done) {
            const params = {
                poster: 'a',
                restaurant: restaurant_data._id,
                content: "Comment 0"
            };

            chai
                .request(app)
                .post("/api/addParentComment")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Expects status 400
                    chai.expect(res).status(400);
                    done();
                });
        });

        // T__ Tests adding a comment with an missing poster
        it("should fail with a missing poster", function(done) {
            const params = {
                restaurant: restaurant_data._id,
                content: "Comment 0"
            };

            chai
                .request(app)
                .post("/api/addParentComment")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .send(params)
                .end(function(err, res) {
                    // Expects status 400
                    chai.expect(res).status(400);
                    done();
                });
        });
    });
    
    // Tests finding comments
    describe("GET /api/findComments", function() {
        // T28 Tests finding comments normally
        it("should get comments normally", function(done) {
            const params = {
                poster: login_data.userName,
            };

            chai
                .request(app)
                .get("/api/findComments")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should give status 200, and the array of comments
                    chai.expect(res).status(200);
                    chai.expect(res).ownProperty("body");
                    chai.expect(res.body).ownProperty("data");
                    chai.expect(res.body.data).an("array");
                    chai.expect(res.body.data).not.empty;
                    done();
                });
        });
        
        // T29 Tests finding comments without a specified poster
        it("should get fail without poster", function(done) {
            const params = {};

            chai
                .request(app)
                .get("/api/findComments")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should have status 400
                    chai.expect(res).status(400);
                    done();
                });
        });
        
        // T30 Tests finding comments of a poster that has no comments
        it("should get no comments with poster that has no comments", function(done) {
            const params = {
                poster: admin_login_data.userName,
            };

            chai
                .request(app)
                .get("/api/findComments")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should not error
                    chai.expect(res).status(200);
                    done();
                });
        });
        
        // T31 Tests finding comments of an invalid poster
        it("should get no comments with invalid poster", function(done) {
            const params = {
                poster: admin_login_data.userName,
            };

            chai
                .request(app)
                .get("/api/findComments")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should not error
                    chai.expect(res).status(200);
                    done();
                });
        });
    });

    // Tests deleting comments
    describe("GET /api/deleteComment", function() {
        // T32 Tests deleting a comment normally
        it("should delete comment normally", function(done) {
            const params = {
                id: parent_comment_datas.pop()._id,
            };

            chai
                .request(app)
                .get("/api/findComments")
                .set("email", admin_login_data.email)
                .set("Authorization", `Bearer ${admin_login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should give status 200
                    chai.expect(res).status(200);
                    done();
                });
        });
        
        // T33 Tests deleting a comment with an invalid id
        it("should fail to delete comment that does not exist", function(done) {
            const params = {
                id: 0,
            };

            chai
                .request(app)
                .get("/api/findComments")
                .set("email", admin_login_data.email)
                .set("Authorization", `Bearer ${admin_login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should give status 400
                    chai.expect(res).status(400);
                    done();
                });
        });
        
        // T34 Tests deleting a comment without an id
        it("should fail to delete comment without an id", function(done) {
            const params = {};

            chai
                .request(app)
                .get("/api/findComments")
                .set("email", admin_login_data.email)
                .set("Authorization", `Bearer ${admin_login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should give status 200
                    chai.expect(res).status(200);
                    done();
                });
        });
        
        // T35 Tests deleting as a non-admin
        it("should fail to delete comment as non-admin", function(done) {
            const params = {
                id: parent_comment_datas.pop()._id,
            };

            chai
                .request(app)
                .get("/api/findComments")
                .set("email", login_data.email)
                .set("Authorization", `Bearer ${login_data.token}`)
                .query(params)
                .end(function(err, res) {
                    // Should give an unauthorized error
                    chai.expect(res).status(401);
                    done();
                });
        });
    });
});