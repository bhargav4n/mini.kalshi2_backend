import express from 'express';
import { signup, signin, onramp } from '../controllers/auth.js'
import { validate } from '../middleware/validate.js';
import { authmiddleware } from '../middleware/authmiddleware.js';
import { userZschema, onrampZschema} from '../types/users.js';
const Router = express.Router();

// 1. Signup and SignIn :
Router.post("/signup", validate(userZschema), signup);
Router.post("/signin", validate(userZschema), signin)

// 2. Onramp : take the token and balance amount as imput :
// 2.1 token from the header through authmiddleware
// 2.2 balance amount from the body of the req body
Router.post("/onramp", validate(onrampZschema), authmiddleware,  onramp )


export default Router;