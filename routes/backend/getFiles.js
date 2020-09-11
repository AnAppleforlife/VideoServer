var express = require("express")
var router = express.Router()
const fileStuff = require("../../backend/fileStuff")
const Path = require("path");
const { requireArgumentsPost } = require("../Routes");

__filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = __filename.slice(0, __filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(requireArgumentsPost(["path", "token"]), postRouteHandler);

/**
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
function postRouteHandler(req, res) {
    fileStuff.getFiles(req.body.path, req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(files => {
        res.send({"status" : true, "files" : files});
    })
}


module.exports = router;