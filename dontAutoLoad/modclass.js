
const fs = require("fs")
const path = require("path")
const LiquidEvents = require("./events")

function freezeProperty(o,p) {
    Object.defineProperty(o, p, {
        writable: false,
        enumerable: true,
        value: o[p]
    })
}

module.exports = class LiquidMod {
    #dependancyList
    #loaded
    constructor(mod) {
        this.#loaded = false
        this.entrypoint = mod.entrypoint
        freezeProperty(this, "entrypoint")
        this.id = mod.id
        freezeProperty(this, "id")
        this.name = mod.name
        freezeProperty(this, "name")
        this.author = mod.author
        freezeProperty(this, "author")
        this.path = mod.path
        freezeProperty(this, "path")
        this.description = mod.description
        freezeProperty(this, "description")
        this.dependancies = {}
        freezeProperty(this, "dependancies")
        this.#dependancyList = mod.dependancies
        this.settings = {}
        if (mod.settings) for (const [k, setting] of Object.entries(mod.settings)) {
            Object.defineProperty(this.settings, k, {
                enumerable: true,
                get() {
                    return setting.value
                },
                set(v) {
                    if (typeof v === typeof setting.value) setting.value = v
                },
            })
        }
        else this.settings = null
        freezeProperty(this, "settings")
        this.version = mod.version
        freezeProperty(this, "version")
    }
    linkDependancies(mods) {
        for (let i = 0; i < this.#dependancyList.length; i++) {
            const id = this.#dependancyList[i]
            this.dependancies[id] = mods[id] || null
        }
    }
    init() {
        if (this.#loaded) throw new Error("Cannot load a mod twice")
        this.#loaded = true
        function loadEntrypoint() {
            if (this.entrypoint) {
                if (fs.existsSync(this.entrypoint)) {
                    try {
                        require(this.entrypoint)
                        LiquidEvents.emit("modLoaded", this)
                        LiquidEvents.removeAllListeners("modLoaded")
                    } catch(e) {
                        tfe2.console.error(e.stack)
                        alert(e.stack)
                    }
                } else {
                    let errmsg = "Config error in "+JSON.stringify(this.name)+": entrypoint "+JSON.stringify(this.entrypoint)+" does not exist"
                    tfe2.console.error(errmsg)
                    alert(errmsg)
                }
            }
        }
        let totalFiles = []
        function getFilesPaths(p) {
            totalFiles = []
            const files = fs.readdirSync(p, { withFileTypes: true })
            for (const dirent of files) {
                if (dirent.isFile())
                    totalFiles.push(path.join(p, dirent.name))
                else if (dirent.isDirectory()) {
                    getFilesPaths(path.join(p, dirent.name))
                }
            }
            return totalFiles = []
        }
        const resourcesPath = path.join(this.path, "dontAutoLoad", "resources")
        const resourceFiles = getFilesPaths(resourcesPath)
    }
}