const fs = require("fs")
const path = require("path")

const LiquidEvents = require("./events")
const LiquidMod = require("./modclass")

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
function tryLoad(mods, modId, modPath, nonmods, modsettings) {
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
        const settings = verifyValue(config.settings, "object:any", null)
        modsettings[modId] = settings
        return mods[modId] = new LiquidMod({
            id: modId,
            path: modPath,
            name: verifyValue(config.name, "string", modId),
            description: verifyValue(config.description, "string", null),
            author: verifyValue(config.author, "string", null),
            version: verifyValue(config.version, "number", "Unknown"),
            entrypoint: verifyValue(config.entrypoint, "string", null),
            dependancies: verifyValue(config.dependancies, "array:string", []),
            settings: settings,
        })
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
                mod.settings[k] = v
            }
        } catch(e) {
            const defaultSettings = {}
            for (const [k, v] of Object.entries(mod.settings)) {
                defaultSettings[k] = v
            }
            writeJSON(modId+".json", defaultSettings)
        }
        mod.enabled = !DISABLED_MODS[modId]
        if (!mod.enabled) continue
        let insertAt = Infinity
        mod.linkDependancies(mods)
        for (const [dependancyId, dependancy] of Object.entries(mod.dependancies)) {
            if (!dependancy) {
                if (confirm("In order for "+JSON.stringify(mod.name)+" to function properly, you need to subscribe to "+dependancyId+". Would you like to view the mod now?")) window.open("https://steamcommunity.com/sharedfiles/filedetails/?id="+dependancyId)
                insertAt = null
            } else {
                const index = modList.indexOf(mods[dependancyId])
                if (index != -1) {
                    if (index < insertAt) insertAt = index
                }
            }
        }
        if (insertAt != null) modList.splice(insertAt, 0, mod)
    }
    return modList
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
const modSettings = {}
const nonLiquidMods = {}
if (!localStorage.dontloadmodsnexttime) {
    const localMods = getAllModsSync()
    const localModPaths = localMods.map(e=>modHelpers.path+"\\"+e)
    const steamModPaths = modHelpers.getAllModsSteam().map(e=>e.replace("steamMod:///",""))
    const steamMods = steamModPaths.map(e=>e.match(/[^\\\/]+$/)[0])
    for (let i = 0; i < localMods.length; i++) {
        tryLoad(mods, "dev_"+localMods[i], localModPaths[i], nonLiquidMods, modSettings)
    }
    for (let i = 0; i < steamMods.length; i++) {
        tryLoad(mods, steamMods[i], steamModPaths[i], nonLiquidMods, modSettings)
    }
}

if (localStorage.dontloadmodsnexttime) {
    delete localStorage.dontloadmodsnexttime
}

exports.mods = mods
exports.modList = makeLoadOrder(mods)
exports.modSettings = modSettings
exports.nonLiquidMods = nonLiquidMods