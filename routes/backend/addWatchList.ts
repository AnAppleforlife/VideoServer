import { Request, Response } from 'express';
import * as express from 'express';
import * as fileStuff from '../../backend/fileStuff';
import * as Path from 'path';
import { requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');


router.route('/' + routeName + '/')
    .put(requireArguments([
        { name: 'token' },
        { name: 'path' }
    ]), postRouteHandler);

function postRouteHandler(req:Request, res:Response) {
    const response = fileStuff.addToWatchList(req.body.token, req.header('x-forwarded-for') || req.socket.remoteAddress, req.body.path);
    if (response.isOk === true) {
        res.status(200).end(response.value);
    } else {
        res.status(response.statusCode).end(response.message);
    }
}


export = router;