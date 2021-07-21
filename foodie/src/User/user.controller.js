import User from "./user.schema.js";
import {
  registerValidation,
  loginValidation,
  emailValidation,
  passwordValidation,
} from "./validation.js";

// Login a user if the email and password are correct, then return user data along with a session token
export const login = async (req, res) => {
  // Validate the login info
  const { error } = loginValidation(req.body);

  // If the login has errored, return an error
  if (error) {
    return res.status(401).json({error: true, data: error.details[0].message})
  }

  const { email, password } = req.body;
  try {
    // Try to find a user associated with the email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({error: true, data: "cannot find email"})
    }


    // Match the password
    await user.comparePassword(password);
    await user.updateOne({ signedIn: true });
    res.json({ error: false, data: user.toJSON() });
  } catch (e) {
    return res.status(401).json({error: true, data: e});
  }
};

// Register a user
export const register = async (req, res) => {
  // Validate the login info
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).json({error: true, data: error.details[0].message})
  }

  // Ensure that there is no existing account under the same email
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) {
    return res.status(401).json({error: true, data: "email already exists."})
  }

  // Create new user and return the user data
  try {
    const user = await User.create(req.body);
    res.json({ error: false, data: user.toJSON() });
  } catch (e) {
    res.status(401).json({error: true, data: e})
  }
};

// Check if the login token is valid
export const checkAuth = async (req, res) => {
  try {
    // Try to find a user given the id
    console.log(req.user + "my");
    const user = await User.findById(req.user.id);
    // Return "wrong token" or the user data
    if (!user) {
        return res.status(401).json({error: true, data: 'wrong token'});
    }
    return res.json({ error: false, data: user });
  } catch (e) {
    return res.status(400).json({error: true, data: e});
  }
};

// Update a user's profile data
export const addProfileInfo = async (req, res) => {
  const update = req.body;

  // Makes sure all of the params are included and that the request has no extras
  const keys = Object.keys(update);
  keys.sort();
  if (
    JSON.stringify(keys) !=
    JSON.stringify(["dining", "distance", "foodTypes", "price"])
  ) {
    return res.status(400).send({ data: "invalid params" });
  }

  // Finds the user by their email to update profile data
  const email = req.headers.email;
  var user;
  try {
    user = await User.findOneAndUpdate({ email }, { profileInfo: update });
    return res.send({error: false, data: user});
  } catch (err) {
    console.log(err);
    return res.status(503).end();
  }
};

// Checks if a registration username is available
export const checkUserName = async (req, res) => {
  try {
    const existingUserName = await User.findOne({
      userName: req.params.userName,
    });

    // If an account under the same username was found, return an true, otherwise, false
    if (existingUserName) {
      return res.json({ error: false, exists: true });
    } else {
      return res.json({ error: false, exists: false });
    }
  } catch (e) {
    return res.status(400).json({ error: true, data: e.message })
  }
};

// Checks if a registration username is available
export const checkEmail = async (req, res) => {
  try {
    // Checks if the email format is valid
    const { error } = emailValidation(req.params);
    if (error) {
      return res.status(400).json({ error: true, data: error.details[0].message });
    }
    const existingEmail = await User.findOne({ email: req.params.email });

    // If an account under the same email was found, return an true, otherwise, false
    if (existingEmail) {
      return res.json({ error: false, exists: true });
    } else {
      return res.json({ error: false, exists: false });
    }
  } catch (e) {
    return res.status(401).json({ error: true, data: e.message })
  }
};

export const addLike = async (req, res) => {
  try {
    //getParentComment
    console.log(req.body.userName);
    const user = User.findOne({ userName: req.body.userName });
    const likes = await user.select("likes");
    console.log(likes);
    if (!likes.likes.includes(req.body.restaurant)) {
      await User.updateOne(
        { userName: req.body.userName },
        { $push: { likes: req.body.restaurant } }
      );
    }
    return res.json({ error: false });
  } catch (error) {
    console.log(error);
    res.json({ error: true, data: error });
  }
};

export const addDislike = async (req, res) => {
  try {
    const user = User.findOne({ userName: req.query.userName });
    const dislikes = await user.select("dislikes");
    if (!dislikes.dislikes.includes(req.body.restaurant)) {
      await User.updateOne(
        { userName: req.body.userName },
        { $push: { dislikes: req.body.restaurant } }
      );
    }
    return res.json({ error: false });
  } catch (error) {
    res.json({ error: true, data: error });
  }
};

export const getLikes = async (req, res) => {
  try {
    const user = User.findOne({ userName: req.query.userName });
    console.log(req.query.userName);
    const likes = await user.select("likes");
    console.log(likes.toString());
    return res.json({ error: false, data: likes.likes });
  } catch (error) {
    console.log(error);
    res.json({ error: true, data: error });
  }
};

export const getDislikes = async (req, res) => {
  try {
    //getParentComment
    const user = User.findOne({ userName: req.query.userName });
    const dislikes = await user.select("dislikes");
    return res.json({ error: false, data: dislikes.dislikes });
  } catch (error) {
    res.json({ error: true, data: error });
  }
};

export const getUserInfo = async (req, res) => {
  var userinfoRequest;
  console.log(req.query)
  try {
    userinfoRequest = await User.find({
      userName: req.query.userName,
    });
    console.log(userinfoRequest)

    return res.json({data:userinfoRequest});
  } catch (error) {
    console.log(`Failed to get user info: ${error}`);  
    res.json({error: true, data: error})
  }
}

export const findUsers = async (req, res) => {
  var userRequest;
  console.log(req.body)
  try {
    userRequest = await User.find({});
    console.log(userRequest)
    return res.json({data:userRequest});
  } catch (error) {
    console.log(`Failed to get users from the backend: ${error}`); 
    res.json({error:true, data:error})
  }
}

export const addFriend = async (req, res) => {
  var friendRequest;
  console.log(req.body)
  try {
    friendRequest = await User.findOneAndUpdate({"userName": req.body.userName}, {$addToSet: {friends: req.body.friends}} );
    console.log(friendRequest)
    return res.send({error: false, data: friendRequest});
  } catch(error) {
    console.log(`Failed to get users from the backend: ${error}`); 
    res.json({error:true, data:error})
  }
}
