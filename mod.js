// goal of this mod: create a loader that loads a config file out of dontAutoLoad/config.json and loads each mod based on that
{
    const fs = require("fs")
    const path = require("path")

    const MODURL = path.resolve(decodeURI(document.currentScript.src.replace("mod.js", "dontAutoLoad").replace("file:///", "")))
    global.process.on("uncaughtException", function(err) {
        console.error(err)
        alert("ERROR:\n"+err.stack)
    })
    // clear require cache of mods
	for (const [k, v] of Object.entries(require.cache)) {
		if (k.startsWith(_internalModHelpers.path) || k.indexOf(path.normalize("workshop/content/1180130")) != -1) {
			delete require.cache[k]
			console.debug("::: Cleared", k)
		} else {
            console.debug("safe", k)
        }
	}
    ModTools.onModsLoaded(function(game) {
        global.game = window.game = game
    })
    global.console = console
    global.tfe2 = window
    global.ModTools = ModTools
    window.Liquid = global.Liquid = require(path.join(MODURL, "/index.js"))
}