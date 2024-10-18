const fs = require("fs")
const path = require("path")
const EventEmitter = require("events")

const LiquidLoader = require("./loaderclass")

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
// Liquid.gui = require("./gui")
// Liquid.hook = require("./hook")

const { mods, modList } = require("./modloader")
require("./morerequire")

let isLoadingResources = true
let gameloader

Liquid.extend.init(tfe2.GameLoader.prototype, "postLoad")
Liquid.extend.splice(tfe2.GameLoader.prototype.postLoad, 0, 0, function() {
    if (isLoadingResources) {
        gameloader = this
        return Liquid.extend.prevent()
    }
})

function loadMods() {
    const bigLoadList = []
    const entrypoints = []
    for (let i = 0; i < modList.length; i++) {
        const mod = mods[modList[i].id]
        const loaders = mod.init()
        for (let i = 0; i < loaders.length; i++) {
            bigLoadList.push(loaders[i])
        }
        entrypoints.push(loaders.loadEntrypoint)
    }
    const bigLoader = new LiquidLoader(bigLoadList)
    const document = tfe2.document
    tfe2.console.log(bigLoadList, bigLoader)
    let progresscontainer = document.createElement("div")
    progresscontainer.style = `
        font-family: system-ui;
        position: absolute;
        left: 10px;
        bottom: 10px;
        right: 10px;
        pointer-events: none;
    `
    let explainer = document.createElement("div")
    explainer.innerText = "Loading mods..."
    explainer.style = `
        font-size: 20px;
        padding-bottom: 10px;
        color: #777;
    `
    let bar = document.createElement("div")
    bar.style = `
        width: 100%;
        height: 32px;
        background: #7777;
        line-height: 32px;
    `
    let barprogress = document.createElement("div")
    barprogress.innerText = `0% (0/${bigLoader.toLoad})`
    barprogress.style = `
        color: #000;
        width: 0%;
        height: 100%;
        background: #fff;
    `
    bigLoader.next(function() {
        const percent = Math.floor(bigLoader.loaded / bigLoader.toLoad * 100) + "%"
        barprogress.style.width = percent
        barprogress.innerText = `${percent} (${bigLoader.loaded}/${bigLoader.toLoad})`
    })
    bigLoader.then(function() {
        isLoadingResources = false
        progresscontainer.remove()
        for (let i = 0; i < entrypoints.length; i++) {
            entrypoints[i]()
        }
        if (gameloader) gameloader.postLoad()
    })
    if (bigLoader.toLoad > 0) {
        bar.append(barprogress)
        progresscontainer.append(explainer, bar)
        document.body.append(progresscontainer)
    } else {
        isLoadingResources = false
        for (let i = 0; i < entrypoints.length; i++) {
            entrypoints[i]()
        }
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