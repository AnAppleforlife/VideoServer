import * as express from 'express';
import * as fileStuff from '../../backend/fileStuff';
import * as Path from 'path';
import { requireArguments } from '../Routes';
const router = express.Router();

const filename = __filename.split(Path.sep)[__filename.split(Path.sep).length - 1].split('.');
const routeName = filename.slice(0, filename.length - 1).join('.');

router.route('/' + routeName + '/')
    .get(requireArguments([
        { name: 'path' },
        { name: 'token' }
    ]), postRouteHandler);

function postRouteHandler(req:express.Request, res:express.Response) {
    const answer = fileStuff.loadTime(req.query.path as string, req.query.token as string, req.header('x-forwarded-for') || req.socket.remoteAddress);
    if (answer.isOk === true) {
        res.status(200).end(answer.value.toString());
    } else {
        res.status(answer.statusCode).end(answer.message);
    }
}

export = router;