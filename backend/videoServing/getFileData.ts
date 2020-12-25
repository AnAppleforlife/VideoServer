import { checkPath, isEmptyObject, SkipData } from "../util";
import * as fs from "fs"
import * as Path from "path"
import * as index from "../../index"

function getFileData (path:string) : SkipData|{"status":true|false, "reason"?:string} {
    let pathCeck = checkPath(path)
    if (!pathCeck.status)
        return pathCeck
    path = pathCeck.data
    if (!fs.existsSync(path))
        return {"status": false, "reason": "The given path does not exist"}
    var ret = {}

    let skip = index.db.prepare("SELECT * FROM intros WHERE path=?").get(path)
    if (skip !== undefined)
        ret["skip"] = {
            "startTime" : skip["startTime"],
            "stopTime" : skip["endTime"]
        }
    else 
        ret["skip"] = {
            "startTime" : -1,
            "stopTime" : -1
        }

    let files = fs.readdirSync(path.substring(0, path.lastIndexOf(Path.sep))).filter(file => index.VideoNameExtensions.includes(file.substring(file.lastIndexOf(".") + 1)))
    let current = files.indexOf(path.substring(path.lastIndexOf(Path.sep) + 1))    
    if (current + 1 != files.length) {
        ret["next"] = Path.join(path.substring(0, path.lastIndexOf(Path.sep)).replace(index.argv["Video Directory"], ""), files[current+1]);
    }    
    ret["pathSep"] = Path.sep
    ret["current"] = path;
    if (!isEmptyObject(ret))
        return <SkipData> ret;
    else 
        return null;
}

export {getFileData}