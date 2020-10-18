import * as express from "express"
import * as fileStuff from "../../backend/fileStuff";
import * as Path from "path";
import { getUserPOST, requireArgumentsPost } from "../Routes";
const router = express.Router()

let filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split(".");
let routeName = filename.slice(0, filename.length - 1).join(".");

router.route('/' + routeName + '/')
    .post(getUserPOST, requireArgumentsPost(["path"]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    fileStuff.getFileData(req.body.path).then(answer => {
        res.send(answer===null?{"status": false} : {"status": true, "data": answer})
    })
}

export = router;