import { app, argv, VideoNameExtensions, socketIO } from "../index";
import * as express from "express";
import * as path from "path";
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { getUser, limiter } from "./Routes";
import fs from "fs"
import ffmpeg from "fluent-ffmpeg"
import { checkPath } from "../backend/util";

const currentTranscoding = []

export function init() {
    app.use(express.json())
    app.use(cookieParser())
    app.use(json())
    app.use('/', limiter)
    app.locals.streams = {}
    app.locals.converting = []
    app.use("/favicon.ico", express.static(path.join(argv["Working Directory"], "icons", "favicon.ico")))
    app.use("/icon", express.static(path.join(argv["Working Directory"], "icons", "Icon.png")))
    app.use("/manifest", express.static(path.join(argv["Working Directory"], "pwa.webmanifest")))
    app.use("/icons", express.static(path.join(argv["Working Directory"], "icons")))
    app.use('/fonts', express.static(path.join(argv["Working Directory"], "fonts")))

    app.use('/', express.static(path.join(argv["Working Directory"], "html", "public")))
    app.use('/', (req, res, next) => {
        if (req.path.startsWith('/api'))
            res.locals.apiRequest = true
        next()
    }, getUser(true), express.static(path.join(argv["Working Directory"], "html", "private")))
    app.use('/video', getUser(true),  (req, res, next) => {
        if (!VideoNameExtensions.includes(req.url.split("\.").pop())) return next()
        if (app.locals.streams.hasOwnProperty(res.locals.user.username)) {
            app.locals.streams[res.locals.user.username]++;
        } else {
            app.locals.streams[res.locals.user.username] = 1;
        }
        req.on("close", () => {
            app.locals.streams[res.locals.user.username]--;
        })

        next()
    }, (req, res, next) => {
        if (!VideoNameExtensions.includes(req.url.split("\.").pop())) return next()
        let urlPath = req.url.split("\.")
        let pathCheck = checkPath(req.path.replace('/video/', ''))

        if (!pathCheck.status) 
            return res.status(404).end()

        if (urlPath.pop() === "mp4" && VideoNameExtensions.includes(urlPath.pop())) {
            if (fs.existsSync(decodePath(pathCheck.data)))
                return next()

            if (fs.existsSync("temp" + path.sep + decodePath(pathCheck.data.substring(argv["Video Directory"].length)))) {
                res.locals.tempVideo = "temp" + path.sep + decodePath(pathCheck.data.substring(argv["Video Directory"].length))
                return next()
            }

        } else
            next();
    }, (_, res, next) => {
        if (!res.locals.tempVideo)
            return next()
        return res.sendFile(res.locals.tempVideo, {
            root: argv["Working Directory"]
        })
    }, express.static(argv["Video Directory"], {
        dotfiles: "allow"
    }))

    initSocket()
}

function initSocket() {
    socketIO.on("connection", (socket) => {
        socket.on("transcodeStatus", (pathToCheck, callback) => {
            let pathCheck = checkPath(pathToCheck)

            if (!pathCheck.status) 
                return callback({
                    type: "error"
                })

            let p = decodePath(pathCheck.data.substring(argv["Video Directory"].length))
            while (p.startsWith(path.sep))
                p = p.slice(1)
            if (fs.existsSync("temp" + path.sep + p)) 
                return callback({
                    type: "ready"
                })
            
            if (currentTranscoding.includes(pathToCheck))
                return callback({
                    type: "transcoding"
                })
            
            return callback({
                type: "notFound"
            })
        })

        socket.on("startTranscoding", (pathToCheck) => {
            let pathCheck = checkPath(decodePath(pathToCheck))
            if (!pathCheck.status) 
                return;
            if (currentTranscoding.includes(decodeURIComponent(pathCheck.data)))
                return;
            
            let streamPath = pathCheck.data.split("\.").reverse().slice(1).reverse().join("\.")

            pathCheck.data.substring(argv["Video Directory"].length).split(path.sep).forEach((_: string, i: number, a: Array<string>) => {
                if (i === 0)
                    return
                let testPath = ["temp"].concat(a.slice(0, i)).join(path.sep)
                if (!fs.existsSync(testPath))
                    fs.mkdirSync(testPath)
            })
        
            ffmpeg()
                .input(streamPath)
                .outputOptions([ '-preset veryfast', '-vcodec libx264', '-threads 0', '-y'])
                .output("temp" + path.sep + decodePath(pathCheck.data.substring(argv["Video Directory"].length)))
                .on("end", () => {
                    let index = currentTranscoding.indexOf((pathCheck.data))
                    if (index > -1) {
                        currentTranscoding.splice(index, 1);
                    }
                    socketIO.emit(pathToCheck, {
                        type: "finish"
                    })
                })
                .on("error", (err) => {
                    let index = currentTranscoding.indexOf(decodeURIComponent(pathCheck.data))
                    if (index > -1) {
                        currentTranscoding.splice(index, 1);
                    }
                    socketIO.emit(pathToCheck, {
                        type: "error",
                        data: err.message
                    })
                })
                .on("start", () => {
                    currentTranscoding.push(decodeURIComponent(pathCheck.data))
                    socketIO.emit(pathToCheck, {
                        type: "start"
                    })
                })
                .on("progress", (pro) => {
                    socketIO.emit(pathToCheck, {
                        type: "progress",
                        data: pro.percent
                    })
                })
                .run()
        })
    })
}

function decodePath(path: string, escape = false ) {
    let ret = decodeURIComponent(path)
    if (escape)
        ret.replace(/\./g, "\\.")
    return ret;
}