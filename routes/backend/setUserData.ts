import * as express from "express"
import * as util from "../../backend/util";
import * as Path from "path";
import { requireArguments, getUser } from "../Routes";
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .put(getUser(true), requireArguments(["token","data"]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    let response = util.saveUserData(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.data)
    res.send(response)
}

export = router;