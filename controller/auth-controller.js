import * as usersDao from "../daos/users-dao.js";
import * as privilegeDao from "../daos/privilege-dao.js";
import bcrypt from "bcrypt"
const saltRounds = 10;

/**
 * @class AuthenticationController Implements RESTful Web service API for authentication requests.
 * Defines the following HTTP endpoints:
 * <ul>
 *     <li>POST /api/auth/login to set appropriate session with respect to user that logs in</li>
 *     <li>POST /api/auth/register to create a new user</li>
 *     <li>POST /api/auth/profile to load appropriate profile with respect to user that logs in</li>
 *     <li>POST /api/auth/logout to remove the session associated with the logged in user</li>
 * </ul>
 * @property {UserDao} userDao Singleton DAO implementing users CRUD operations
 * RESTful Web service API
 */
const AuthenticationController = (app) => {

    const login = async (req, res) => {
        console.log("RESPONSE BODY",req.body)
        const email = req.body.email;
        const password = req.body.password;
        const user =  await usersDao.findUserByEmailAddress(email);
        console.log("USER LOGGED IN ",user);
        const match = await bcrypt.compare(password, user.password);
        let allowSignInVal = true;
        if (match) {
            const allowSignIn = await privilegeDao.getPrivilegeByUser(user._id)
            allowSignInVal=allowSignIn.allowSignIn;
        }

        if (match && allowSignInVal) {
            user.password = '*****';
            req.session['currentUser'] = user;
            res.json(user);
        } else {
            res.sendStatus(403);
        }
    }

    /*const googleLogin = async (req: Request, res: Response) => {
        const newUser = req.body;
        console.log('This is the user',newUser)
        const password = newUser.password;
        const hash = await bcrypt.hash(password, saltRounds);
        newUser.password = hash;

        const existingUser = await userDao
            .findUserByUsername(req.body.userName);
        let allowSignInVal = true;
        if (existingUser) {
            const allowSignIn = await PrivilegeDao.getInstance().getPrivilegesUser(existingUser._id)
            allowSignInVal=allowSignIn.allowSignIn;
        }

        if(allowSignInVal) {
            if (existingUser) {
                existingUser.password = '*****';
                // @ts-ignore
                req.session['profile'] = existingUser;
                res.json(existingUser);
                console.log("I am reaching here creating the session");
            } else {
                const insertedUser = await userDao
                    .createUser(newUser);
                insertedUser.password = '';
                // @ts-ignore
                req.session['profile'] = insertedUser;
                res.json(insertedUser);
            }
        }
        else {
            res.sendStatus(403);
        }
    }
*/

    const register = async (req, res) => {
        const newUser = req.body;
        const password = newUser.password;
        const hash = await bcrypt.hash(password, saltRounds);
        newUser.password = hash;

        const user = await usersDao.findUserByEmailAddress(newUser.email);

        if (user) {
            res.sendStatus(403);
            return;
        } else {
            const insertedUser = await usersDao
                .createUser(newUser);
            console.log("INSERTED USER",insertedUser)
            insertedUser.password = '********';
            await privilegeDao.createPrivilege(insertedUser._id)
            req.session['currentUser'] = insertedUser;
            res.json(insertedUser);
        }
    }


    const profile = (req, res) => {
        // @ts-ignore
        const profile = req.session['currentUser'];
        console.log(profile);
        if (profile) {
            res.json(profile);
        } else {
            res.sendStatus(403);
        }
    }


    const logout = (req, res) => {
        // @ts-ignore
        req.session.destroy();
        res.sendStatus(200);
    }

    app.post("/api/auth/login", login);
    app.post("/api/auth/register", register);
    app.post("/api/auth/profile", profile);
    app.post("/api/auth/logout", logout);
    //app.post("/api/auth/googleLogin", googleLogin);
}

export default AuthenticationController;