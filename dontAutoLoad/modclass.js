
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

function setGameResource(file, folder, resource) {
    tfe2.Resources[folder].h[path.basename(file)] = tfe2.Resources[folder].h[path.basename(file, path.extname(file))] = resource
}

function setRes(obj, file, resource) {
    obj[path.basename(file)] = obj[path.basename(file, path.extname(file))] = resource
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
        this.resources = {}
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
    setGameResources() {
        
    }
    init() {
        if (this.#loaded) throw new Error("Cannot load a mod twice")
        this.#loaded = true
        const _gthis = this
        function loadEntrypoint() {
            if (_gthis.entrypoint) {
                if (fs.existsSync(_gthis.entrypoint)) {
                    try {
                        require(_gthis.entrypoint)
                        LiquidEvents.emit("modLoaded", _gthis)
                        LiquidEvents.removeAllListeners("modLoaded")
                    } catch(e) {
                        tfe2.console.error(e.stack)
                        alert(e.stack)
                    }
                } else {
                    let errmsg = "Config error in "+JSON.stringify(_gthis.name)+": entrypoint "+JSON.stringify(_gthis.entrypoint)+" does not exist"
                    tfe2.console.error(errmsg)
                    alert(errmsg)
                }
            }
        }
        function getFilesPaths(p, fileList=[]) {
            try {
                const files = fs.readdirSync(p, { withFileTypes: true })
                for (const dirent of files) {
                    if (dirent.isFile())
                        fileList.push(path.join(p, dirent.name))
                    else if (dirent.isDirectory()) {
                        getFilesPaths(path.join(p, dirent.name), fileList)
                    }
                }
            } catch(e) {}
            return fileList
        }
        const resourcesPath = path.join(this.path, "dontAutoLoad", "resources")
        const resourceFiles = getFilesPaths(resourcesPath)
        let loaders = []
        loaders.loadEntrypoint = loadEntrypoint
        for (let i = 0; i < resourceFiles.length; i++) {
            const file = resourceFiles[i]
            const loader = this.load(file)
            if (loader) loaders.push(loader)
        }
        Promise.all(loaders).then(() => {
            this.setGameResources()
        })
        return loaders
    }
    load(resname) {
        const file = path.resolve(this.path, resname)
        const folder = path.basename(path.dirname(file))
        const url = "file:///"+file.replaceAll("\\","/")
        const ext = path.extname(file).replace(".","")
        console.log(ext)
        switch (ext) {
            case "js": {
                const script = tfe2.document.createElement("script")
                script.src = url
                tfe2.document.head.append(script)
                return new Promise(resolve=>{ script.onload = function() {
                    resolve()
                }})
            } break
            case "png": {
                const texture = tfe2.PIXI.Texture.fromURL(url)
                return new Promise(resolve=>{
                    texture.then((tex) => {
                        setRes(this.resources, file, tex)
                        setGameResource(file, "singleTextureCache", tex)
                        resolve()
                    })
                })
            } break
            case "json": {
                return new Promise(resolve => {
                    fs.readFile(file, "utf8", (err, dat) => {
                        if (err) {
                            throw err
                        }
                        const obj = JSON.parse(dat)
                        setRes(this.resources, file, obj)
                        setGameResource(file, "storiesInfo", obj)
                        resolve()
                    })
                })
            } break
        }
    }
}