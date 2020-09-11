var child_process = require("child_process")
const fs = require("fs")
const Path = require("path")
const index = require("../index")
const loginBackend = require("./UserMangement")

module.exports = {
    /**
     * @param {string} path 
     * @param {boolean} override
     * @param {number} maxRamInt
     * @param {number} minRamInt
     * @param {boolean} writeOutput
     */
    createImages : function(path, override, maxRamInt, minRamInt, writeOutput) {
        console.log("Startet creating of Images!")
        
        var proc = child_process.spawn("java", ["-Xmx" + maxRamInt + "G", "-Xms" + minRamInt + "G", "-jar", "./java/images.jar",  path, override])

        proc.stdout.on('data', (data) => {
            if (writeOutput || !data.includes("skiped"))
                console.log(data.toString())
        });
          
        proc.stderr.on('data', (data) => {
            if (writeOutput || !data.includes("skiped"))
                console.log(data.toString())
        });
          
        proc.on('close', (code) => {
            console.log(`Image Creation done with code ${code}`);
        });
        return {"status" : true}
    },

    /**
     * 
     * @param {string} path 
     * @param {string} token
     */
    getFiles : async function(path, token, ip) {
        var retarr = [];
        if (!path.startsWith(index.argv["Video Directory"]))
            path = Path.join(index.argv["Video Directory"], path);
        if(!fs.existsSync(path)) return []
        return await readdir(path).then(data => data.forEach(async file => { 
            if (fs.lstatSync(path + Path.sep + file).isFile())
                if (!index.VideoNameExtensions.includes(file.split(".")[file.split(".").length - 1]))
                    return;
            
            if (fs.lstatSync(path + Path.sep + file).isDirectory())
                if (!fs.existsSync(path + Path.sep + file + ".jpg"))
                    return;
            var split = file.split(".");
            var name = index.VideoNameExtensions.includes(split[split.length - 1]) ? name = file.substring(0, file.length - (split[split.length - 1].length + 1)).replace(" [1080p]", "") : file;
            var push = {
                "name" : name,
                "Path" : Path.join(path.replace(index.argv["Video Directory"], ""), file),
                "type" : fs.lstatSync(path + Path.sep + file).isDirectory() ? "folder" : "video",
                "image" : fs.lstatSync(path + Path.sep + file).isDirectory() ? Path.join(path.replace(index.argv["Video Directory"], ""), file + ".jpg") : Path.join(path.replace(index.argv["Video Directory"], ""), file.replace(split[split.length - 1], "jpg"))
            }
            if (push["type"] === "video") 
                push["timeStemp"] = this.loadTime(path + Path.sep + file, token, ip)          
            retarr.push(push);
            
        })).then(() => {
            let promisses = []
            for(let i = 0; i < retarr.length; i++) 
                promisses.push(retarr[i]["timeStemp"])
            return Promise.all(promisses).then((data) => {
                for(let i = 0; i<data.length; i++)
                    retarr[i]["timeStemp"] = data[i]
                return retarr
            })
        })
    },

    /**
     * @param {string} path 
     * @param {string} token 
     */
    loadTime : async function(path, token, ip) {
        if (!path.startsWith(index.argv["Video Directory"]))
            path = index.argv["Video Directory"] + path
        return loginBackend.getUserFromToken(token, ip).then(user => {
            var data = getData();
            if (!user["status"])
                return -1
            user = user["user"];
            if (data.hasOwnProperty(user["username"])) {
                if (data[user["username"]].hasOwnProperty(path)) {
                    return data[user["username"]][path];
                } else {
                    return 0
                }
            } else {
                return 0
            }
        })

    },
    /**
     * 
     * @param {string} path 
     * @param {string} token 
     * @param {number} percent 
     */
    saveTime : async function (path, token, percent, ip) {
        if (!path.startsWith(index.argv["Video Directory"]))
            path = index.argv["Video Directory"] + path;
        return loginBackend.getUserFromToken(token, ip).then(user => {
            if (!user["status"])
                return false;
            user = user["user"]
            let data = getData();
            if (!data.hasOwnProperty(user["username"])) 
                data[user["username"]] = {};
            data[user["username"]][path] = percent
            saveData(data)
            return true;
        })
    },

    /**
     * @param {string} path 
     */
    getFileData : async function(path) {
        if (!path.startsWith(index.argv["Video Directory"]))
            path = Path.join(index.argv["Video Directory"], path);
        if (!fs.existsSync(path))
            return {"status": false, "reason": "The given path does not exist"}
        var ret = {}

        var skips = loadSkips();
        if (skips.hasOwnProperty(path))
            ret["skip"] = skips[path]
        else 
            ret["skip"] = {
                "startTime" : -1,
                "stopTime" : -1
            }

        var split = path.split("\\");
        var string = split[split.length - 1].substring((split[split.length - 1].indexOf("-") + 2));
        var number = -1

        if (string.substring(0, 3).match("^[0-9]+$"))
            number = parseInt(string.substring(0, 3), 10)
        if (string.substring(0, 2).match("^[0-9]+$"))
            number = parseInt(string.substring(0, 2), 10)
        if (number !== -1) {
            var newNumber = number+1;
            if (number < 10)
                number = "0" + number
            if (newNumber < 10)
                newNumber = "0" + newNumber;
            split[split.length - 1] = split[split.length - 1].replace(number, newNumber)
            if (fs.existsSync(split.join("\\")))
                ret["next"] = split.join("\\").replace(index.argv["Video Directory"], "")
        }
        if (!isEmptyObject(ret))
            return ret;
        else 
            return null;
    },

    getUserData: async function(token, ip) {
        return await loginBackend.getUserFromToken(token, ip).then(user => {
            if (!user["status"])
                return user;
            user = user["user"]
            var settings = loadSettings()
            var ret = {};
    
            if (user !== null && settings.hasOwnProperty(user["username"])) {
                ret["volume"] = settings[user["username"]]["volume"]
            } else {
                ret["volume"] = settings["default"]["volume"];
            }
    
            return {"status" : true, "data" : ret};
        })
    },

    saveUserData: function(token, ip, data) {
        loginBackend.getUserFromToken(token, ip).then(user => {
            var settings = loadSettings();
    
            settings[user["user"]["username"]] = data;
    
            saveSettings(settings);
            return {"status" : true}
        })
    }
}

function loadSettings() {
    try {
        return JSON.parse(fs.readFileSync(Path.join(index.argv["Working Directory"], "data", "settings.json")))
    } catch (err) {
        if (index.test) {
            return {}
        } else 
            throw err;
    }
}

function saveSettings(settings) {
    fs.writeFileSync(Path.join(index.argv["Working Directory"], "data", "settings.json"), JSON.stringify(settings, null, 4))
}

function getData() {
    try {
        return JSON.parse(fs.readFileSync(index.argv["Working Directory"] + "/data/status.json"));
    } catch (err) {
        if (index.test) {
            return {}
        } else 
            throw err;
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(index.argv["Working Directory"] + "/data/status.json", JSON.stringify(data, null, 4))
    } catch (err) {
        if (index.test) {
            return {}
        } else 
            throw err;
    }
}
function loadSkips() {
    try {
        return JSON.parse(fs.readFileSync(index.argv["Working Directory"] + "/data/intros.json"));
    } catch (err) {
        if (index.test) {
            return {}
        } else 
            throw err;
    }
}

async function readdir(path) {
    return new Promise(function (resolve, reject) {
        fs.readdir(path, 'utf8', function (err, data) {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}

async function readFile(path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf8', function (err, data) {
            if (err)
                reject(err);
            else
                resolve(JSON.parse(data));
        });
    });
}

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}