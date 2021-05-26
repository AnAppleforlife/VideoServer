import * as express from 'express';
import * as fileStuff from '../../backend/fileStuff';
import * as Path from 'path';
import { getUser, requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .get(getUser(true), requireArguments(['path', 'token']), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    if (typeof req.query.token !== 'string' || typeof req.query.path !== 'string')
        return res.status(400).send({status: false, reason: 'Can\'t parse query parameters'});
    res.send(fileStuff.getStars(<string> req.query.token, req.header('x-forwarded-for') || req.socket.remoteAddress, <string> req.query.path));
}

export = router;