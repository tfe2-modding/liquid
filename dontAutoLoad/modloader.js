const fs = require("fs")
const path = require("path")

const LiquidEvents = require("./events")

function readJSON(p, fallback) {
    try {
        return JSON.parse(fs.readFileSync(path.join(global.__dirname, "mod_data", p), "utf8"))
    } catch(e) {
        if (typeof fallback !== "undefined") {
            return fallback
        } else {
            throw e
        }
    }
}

function writeJSON(p, v) {
    fs.writeFileSync(path.join(global.__dirname, "mod_data", p), JSON.stringify(v, null, "\t"))
}

function checkValue(value, types) {
    const typelist = types.split(":")
    const type = typelist.shift()
    if (type == "any") return true
    const subtypes = typelist.join(":")
    const isType = (typeof value === type && value != null) || (value == null && type == "null") || (type == "array" && Array.isArray(value))
    if (isType) {
        if (typeof value === "object") {
            let istrue = true
            for (const [k, v] of Object.entries(value)) {
                istrue = istrue && checkValue(v, subtypes)
            }
            return istrue
        } else {
            return true
        }
    }
    return false
}
function verifyValue(value, types, altvalue) {
    if (checkValue(value, types)) return value
    return altvalue
}
function tryLoad(mods, modId, modPath, nonmods) {
    let configFile
    try {
        configFile = fs.readFileSync(path.join(modPath, "/dontAutoLoad/config.json"), "utf8")
    } catch (e) {}
    if (!configFile) {
        nonmods[modId] = modPath
        return false
    }
    let config
    try {
        config = JSON.parse(configFile)
    } catch (e) {
        let errmsg = "Config file error in mod "+modId+":\n"+e.stack
        console.error(errmsg)
        alert(errmsg)
    }
    if (config) {
        if (typeof config.entrypoint === "string") {
            config.entrypoint = path.join(modPath, "/dontAutoLoad/", config.entrypoint)
        }
        return mods[modId] = {
            id: modId,
            path: modPath,
            name: verifyValue(config.name, "string", modId),
            description: verifyValue(config.description, "string", null),
            author: verifyValue(config.author, "string", null),
            version: verifyValue(config.version, "number", "Unknown"),
            entrypoint: verifyValue(config.entrypoint, "string", null),
            dependancies: verifyValue(config.dependancies, "array:string", []),
            settings: verifyValue(config.settings, "object:any", null),
            liquid: true,
        }
    }
    nonmods[modId] = modPath
    return false
}
function makeLoadOrder(mods) {
    const DISABLED_MODS = readJSON("disabled_mods.json", {})
    // check dependancies and dont add disabled mods
    let modList = []
    for (const [modId, mod] of Object.entries(mods)) {
        if (mod.settings) try {
            const settings = readJSON(modId+".json")
            for (const [k, v] of Object.entries(settings)) {
                mod.settings[k].value = v
            }
        } catch(e) {
            const defaultSettings = {}
            for (const [k, v] of Object.entries(mod.settings)) {
                defaultSettings[k] = v.value
            }
            writeJSON(modId+".json", defaultSettings)
        }
        mod.enabled = !DISABLED_MODS[modId]
        if (!mod.enabled) continue
        let insertAt = Infinity
        for (let i = 0; i < mod.dependancies.length; i++) {
            if (!mods[mod.dependancies[i]]) {
                if (confirm("In order for "+JSON.stringify(mod.name)+" to function properly, you need to subscribe to "+mod.dependancies[i]+". Would you like to view the mod now?")) window.open("https://steamcommunity.com/sharedfiles/filedetails/?id="+mod.dependancies[i])
            }
            const index = modList.indexOf(mods[mod.dependancies[i]])
            if (index != -1) {
                if (index < insertAt) insertAt = index
            }
        }
        modList.splice(insertAt, 0, mod)
    }
    return modList
}
function initMods(mods) {
    const modList = makeLoadOrder(mods)
    for (let i = 0; i < modList.length; i++) {
        console.log(modList[i])
        if (modList[i].entrypoint) {
            if (fs.existsSync(modList[i].entrypoint)) {
                try {
                    require(modList[i].entrypoint)
                    LiquidEvents.emit("modLoaded")
                    LiquidEvents.removeAllListeners("modLoaded")
                } catch(e) {
                    tfe2.console.error(e.stack)
                    alert(e.stack)
                }
            } else {
                let errmsg = "Config error in "+JSON.stringify(modList[i].name)+": entrypoint "+JSON.stringify(modList[i].entrypoint)+" does not exist"
                tfe2.console.error(errmsg)
                alert(errmsg)
            }
        }
    }
    LiquidEvents.emit("allModsLoaded")
}
const modHelpers = tfe2._internalModHelpers

function getAllModsSync(then) {
    //Get all mods from %localappdata%
    const files = fs.readdirSync(modHelpers.path, { withFileTypes: true })
    
    var mods = []

    for (const dirent of files) {
        if (dirent.isDirectory())
            mods.push(dirent.name)
    }

    if (typeof then === "function") {
        then(mods)
    }

    return mods
}

// RUN MOD LOADER
const mods = {}
if (!localStorage.dontloadmodsnexttime) {
    const localMods = getAllModsSync()
    const nonmods = {}
    const localModPaths = localMods.map(e=>modHelpers.path+"\\"+e)
    const steamModPaths = modHelpers.getAllModsSteam().map(e=>e.replace("steamMod:///",""))
    const steamMods = steamModPaths.map(e=>e.match(/[^\\\/]+$/)[0])
    for (let i = 0; i < localMods.length; i++) {
        tryLoad(mods, "dev_"+localMods[i], localModPaths[i], nonmods)
    }
    for (let i = 0; i < steamMods.length; i++) {
        tryLoad(mods, steamMods[i], steamModPaths[i], nonmods)
    }
    initMods(mods)
    tfe2.console.log(localMods, mods)
}

if (localStorage.dontloadmodsnexttime) {
    delete localStorage.dontloadmodsnexttime
}

module.exports = mods