// define liquid
let Liquid = {}
Liquid.version = 2.01
// modID getter
Liquid.getModID = function(backamount=0) {
    const err = new Error()
    Error.prepareStackTrace = (_, stack) => stack
    const stack = err.stack
    Error.prepareStackTrace = undefined
    const path = stack[1+backamount].getFileName()
    const localMatch = path.match(/Default[\/\\]mods[\/\\]([^\/\\]+)/)
    const steamMatch = path.match(/workshop[\/\\]content[\/\\]1180130[\/\\]([^\/\\]+)/)
    if (localMatch) return localMatch[1]
    if (steamMatch) return steamMatch[1]
    throw new Error("No mod detected")
}
// hook the reload function since tfe2 leaks a bit of memory on each reload
nw.Window.get().reload = chrome.runtime.reload