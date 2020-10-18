import * as express from "express"
import * as loginBackend from "../../backend/UserMangement";
import * as Path from "path";
import { requireArgumentsPost, getUserPOST } from "../Routes";
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(requireArgumentsPost(["token", "state", "uuid", "token"]), getUserPOST ,postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    if (res.locals.user["perm"] === "Admin") {
        loginBackend.changeActiveState(req.body.state, req.body.uuid, req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress).then(response => {
            res.send(response);
        })
    } else 
        res.send({"status" : false})
}

export = router;