const fs = require("fs")
const path = require("path")
const EventEmitter = require("events")

try {
    fs.mkdirSync("mod_data")
} catch(e) {}

const LiquidEvents = require("./events")

const Liquid = {}

Liquid.on = LiquidEvents.on.bind(LiquidEvents)
Liquid.off = LiquidEvents.off.bind(LiquidEvents)
Liquid.once = LiquidEvents.once.bind(LiquidEvents)

require("./morerequire")

Liquid.extend = require("./extend")
// Liquid.hook = require("./hook")

const { mods, modList } = require("./modloader")

let isLoadingResources

Liquid.extend.init(tfe2.GameLoader.prototype, "postLoad")
Liquid.extend.splice(tfe2.GameLoader.prototype.postLoad, 0, 0, function() {
    return Liquid.extend.prevent()
})

function loadMods() {
    let promises = []
    for (let i = 0; i < modList.length; i++) {
        const mod = mods[modList[i].id]
        promises.push(mod.init())
    }
    LiquidEvents.emit("allModsLoaded")
}

Liquid.getMod = function() {
    const err = new Error()
    Error.prepareStackTrace = (_, stack) => stack
    const stack = err.stack
    Error.prepareStackTrace = undefined
    const path = stack[1].getFileName()
    return getModByPath(path)
}

function getModByPath(path) {
    const localMatch = path.match(/Default[\/\\]mods[\/\\]([^\/\\]+)/)
    const steamMatch = path.match(/workshop[\/\\]content[\/\\]1180130[\/\\]([^\/\\]+)/)
    if (localMatch) return mods["dev_"+localMatch[1]]
    if (steamMatch) return mods[steamMatch[1]]
    throw new Error("No mod matches the specified path")
}

require("./modmenu")

// hook the reload to restart the entire chrome renderer
// since tfe2 leaks memory each time it restarts
Liquid.extend.init(tfe2.nw.Window.get(), "reload")
Liquid.extend.splice(tfe2.nw.Window.get().reload, 0, 1, function() {
    tfe2.chrome.runtime.reload()
})

module.exports.Liquid = Liquid
module.exports.loadMods = loadMods