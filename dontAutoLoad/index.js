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

const mods = require("./modloader")

require("./modmenu")

Liquid.extend.init(tfe2.nw.Window.get(), "reload")
Liquid.extend.splice(tfe2.nw.Window.get().reload, 0, 1, function() {
    tfe2.chrome.runtime.reload()
})

module.exports = Liquid