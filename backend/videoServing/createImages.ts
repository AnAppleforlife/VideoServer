import * as child_process from 'child_process';
import { BackendRequest } from '../../interfaces';

/**
 * @param path The path to the video dir
 * @param override Sets the override behavior
 * @param writeOutput Should the process output data. Only used if in async mode
 */
function createImages(path:string, override:boolean, writeOutput:boolean, sync = false): BackendRequest<undefined> {
    console.log('[INFO][ImageCreation] Startet creating of Images!');
    if (sync) {
        const spawn = child_process.spawnSync('java', ['-jar', './java/ThumbnailGenerator-1.2.jar',  path, '' + override]);
        console.log('[INFO][ImageCreation] Image Creation done');
        if (spawn.error)
            console.log('[INFO][ImageCration] Image Cration failed');
        return {isOk: true, value: undefined};
    } else {
        const proc = child_process.spawn('java', ['-jar', './java/ThumbnailGenerator-1.2.jar',  path, '' + override]);
    
        proc.stdout.on('data', (data: string | string[]) => {
            if (writeOutput && (data.toString().trim().length !== 0))
                console.log('[INFO][ImageCreation] ' + data.toString().replace('\n', ''));
        });
              
        proc.stderr.on('data', (data: string | string[]) => {
            if (writeOutput && (data.toString().trim().length !== 0))
                console.log('[INFO][ImageCreation] ' + data.toString().replace('\n', ''));
        });
              
        proc.on('close', (code: number) => {
            console.log(`[INFO][ImageCreation] Image Creation done with code ${code}`);
        });
    
        return {isOk: true, value: undefined};
    }
}

export {createImages};