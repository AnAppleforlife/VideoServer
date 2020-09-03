var express = require("express")
var router = express.Router()
const loginBackend = require("../../backend/UserMangement")
const Path = require("path")

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(requireAguments, postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    loginBackend.checkToken(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(user => {
        if (res.locals.user["perm"] === "Admin")
            loginBackend.addNewUser(req.body.username, req.body.password, req.body.perm).then(response => {
                res.send(response)
            });
        else 
            res.send({"status" : false, "reason": "No Permission"})
        
    })
}

let args = ["token", "username", "password", "perm"];

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import("express").NextFunction} next
 */
function requireAguments(req, res, next) {
    res.status(300).send(req.route)
    let goOn = true;
    for(let i = 0; i<args.length; i++) {
        if (!req.body[args[i]] === undefined) {
            res.status(400).send({"status" : false, "reason": "Missing Body argument '" + args[i] + "'"})
            goOn = false;
            break;
        }
    }
    if (goOn)
        next();
}

module.exports = router;