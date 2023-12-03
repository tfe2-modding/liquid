// goal of this mod: create a loader that loads a config file out of dontAutoLoad/config.json and loads each mod based on that
{
    const fs = require("fs")
    const path = require("path")

    const MODURL = path.resolve(decodeURI(document.currentScript.src.replace("mod.js", "dontAutoLoad").replace("file:///", "")))
    function loadDevTools() {
        chrome.developerPrivate.openDevTools({
            renderViewId: -1,
            renderProcessId: -1,
            extensionId: chrome.runtime.id
        })
    }
    // clear require cache of mods
	for (const [k, v] of Object.entries(require.cache)) {
		if (k.startsWith(_internalModHelpers.path) || k.indexOf(path.normalize("workshop/content/1180130")) != -1) {
			delete require.cache[k]
			console.debug("Clearead", k)
		}
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
    global.tfe2 = window
    global.ModTools = ModTools
    const Liquid = global.Liquid = {}
    require(path.join(MODURL, "/index.js"))
    function tryLoad(mods, modId, modPath) {
        let configFile
        try {
            configFile = fs.readFileSync(path.join(modPath, "/dontAutoLoad/config.json"), "utf8")
        } catch (e) {}
        if (!configFile) return false
        let config
        try {
            config = JSON.parse(configFile)
        } catch (e) {
            let errmsg = "Config file error in mod "+modId+":\n"+e.stack
            console.error(errmsg)
            alert(errmsg)
        }
        if (config) {
            return mods[modId] = {
                id: modId,
                path: path.join(modPath, "/dontAutoLoad"),
                name: verifyValue(config.name, "string", modId),
                description: verifyValue(config.description, "string", null),
                version: verifyValue(config.version, "number", "Unknown"),
                entrypoint: verifyValue(config.entrypoint, "string", null),
                dependancies: verifyValue(config.dependancies, "array:string", [])
            }
        }
        return false
    }
    function makeLoadOrder(mods) {
        // check dependancies
        let modList = []
        for (const [modId, mod] of Object.entries(mods)) {
            for (let i = 0; i < mod.dependancies.length; i++) {
                if (!mods[mod.dependancies[i]]) {
                    if (confirm("In order for "+JSON.stringify(mod.name)+" to function properly, you need to subscribe to "+mod.dependancies[i]+". Would you like to view the mod now?")) window.open("https://steamcommunity.com/sharedfiles/filedetails/?id="+mod.dependancies[i])
                }
            }
            modList.push(mod)
        }
        return modList
    }
    function initMods(mods) {
        console.log(mods)
        const modList = makeLoadOrder(mods)
        for (let i = 0; i < modList.length; i++) {
            console.log(modList[i])
            if (modList[i].entrypoint) {
                if (fs.existsSync(modList[i].entrypoint)) {
                    require(modList[i].entrypoint)
                } else {
                    let errmsg = "Config error in "+JSON.stringify(modList[i].name)+": entrypoint "+JSON.stringify(modList[i].entrypoint)+" does not exist"
                    console.error(errmsg)
                    alert(errmsg)
                }
            }
        }
    }
    // RUN MOD LOADER
    _internalModHelpers.getAllMods(function(localMods) {
        const mods = {}
        const localModPaths = localMods.map(e=>_internalModHelpers.path+"\\"+e)
        const steamModPaths = _internalModHelpers.getAllModsSteam().map(e=>e.replace("steamMod:///",""))
        const steamMods = steamModPaths.map(e=>e.match(/[^\\\/]+$/)[0])
        for (let i = 0; i < localMods.length; i++) {
            tryLoad(mods, "dev:"+localMods[i], localModPaths[i])
        }
        for (let i = 0; i < steamMods.length; i++) {
            tryLoad(mods, steamMods[i], steamModPaths[i])
        }
        initMods(mods)
    })
}