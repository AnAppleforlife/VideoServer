var express = require("express")
var router = express.Router()
const loginBackend = require("../../backend/UserMangement")
const Path = require("path");
const { requireArgumentsPost } = require("../Routes");

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(requireArgumentsPost(["token", "newPass", "oldPass"]), postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    loginBackend.changePassword(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.oldPass, req.body.newPass).then(response => {
        res.send(response);
    })
}

module.exports = router;