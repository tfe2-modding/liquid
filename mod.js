// goal of this mod: create a loader that loads a config file out of dontAutoLoad/config.json and loads each mod based on that
{
    const fs = require("fs")
    const path = require("path")

    const MODURL = path.resolve(decodeURI(document.currentScript.src.replace("mod.js", "dontAutoLoad").replace("file:///", "")))
    function loadBGDevTools() {
        console.log(chrome.developerPrivate.openDevTools({
            renderViewId: -1,
            renderProcessId: -1,
            extensionId: chrome.runtime.id
        }))
    }
    global.process.on("uncaughtException", function(err) {
        console.error(err)
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
    ModTools.onModsLoaded(function(game) {
        global.game = window.game = game
    })
    global.console = console
    global.tfe2 = window
    global.ModTools = ModTools
    const Liquid = window.Liquid = global.Liquid = {}
    require(path.join(MODURL, "/index.js"))
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
    if (!localStorage.dontloadmodsnexttime) _internalModHelpers.getAllMods(function(localMods) {
        const mods = {}
        const nonmods = {}
        Liquid.mods = mods
        const localModPaths = localMods.map(e=>_internalModHelpers.path+"\\"+e)
        const steamModPaths = _internalModHelpers.getAllModsSteam().map(e=>e.replace("steamMod:///",""))
        const steamMods = steamModPaths.map(e=>e.match(/[^\\\/]+$/)[0])
        for (let i = 0; i < localMods.length; i++) {
            tryLoad(mods, "dev:"+localMods[i], localModPaths[i], nonmods)
        }
        for (let i = 0; i < steamMods.length; i++) {
            tryLoad(mods, steamMods[i], steamModPaths[i], nonmods)
        }
        initMods(mods)
    })

    if (localStorage.dontloadmodsnexttime) {
        delete localStorage.dontloadmodsnexttime
    }

    Liquid._createWindow = (title, content, bottomButtons=null, closeText="Close", closeAction=null) => {
        let gui = game.state.gui
        gui.createWindow()
        gui.addWindowToStack(()=>{
            Liquid._createWindow(title, content, bottomButtons, closeText, closeAction)
        })
        if (title) gui.windowAddTitleText(title)
        if (content) if (typeof content != "object") {
            gui.windowAddInfoText(content.toString())
        } else {
            let ids = Object.keys(content)
            let elements = Object.values(content)
            for (let i = 0; i < elements.length; i++) {
                let el = elements[i]
                if (typeof el != "object") {
                    gui.windowSimpleButtonContainer = null
                    gui.windowAddInfoText(el)
                } else {
                    if (el.type == "simpleButton") {
                        gui.windowAddSimpleButton(el.image, el.onClick, el.text, el.textUpdateFunction, el.font)
                    } else if (el.type == "text") {
                        gui.windowSimpleButtonContainer = null
                        gui.windowAddInfoText(el.text, el.textUpdateFunction, el.font)
                    } else if (el.type == "clickableText") {
                        gui.windowSimpleButtonContainer = null
                        gui.windowAddInfoTextClickable(el.onClick, el.text, el.textUpdateFunction, el.font)
                    } else if (el.type == "checkbox") {
                        gui.windowSimpleButtonContainer = null
                        gui_CheckboxButton.createSettingButton(gui,gui.innerWindowStage,gui.windowInner,el.onClick,el.isChecked || (()=>false),el.text)
                        if (!el.noSpace) gui.windowInner.addChild(new gui_GUISpacing(gui.windowInner,new common_Point(2,4)))
                    } else if (el.type == "slider") {
                        gui.windowSimpleButtonContainer = null
                        var slider = new gui_Slider(gui,gui.innerWindowStage,gui.windowInner,el.fillLevel,el.setFillLevel)
                        slider.addChild(new gui_TextElement(slider,gui.innerWindowStage,el.text,el.textUpdateFunction,el.font))
                        gui.windowInner.addChild(slider)
                        if (!el.noSpace) gui.windowInner.addChild(new gui_GUISpacing(gui.windowInner,new common_Point(2,4)))
                    } else if (el.type == "button") {
                        let button = new gui_ContainerButton(gui,gui.innerWindowStage,gui.windowInner,el.onClick || (()=>{}), el.isActive || (()=>false), el.onHover || (()=>{}))
                        let text = new gui_TextElement(button,gui.innerWindowStage,el.text,el.textUpdateFunction,el.font)
                        button.container.addChild(text)
                        button.container.padding = { left: 3, right: 3, top: 3, bottom: 0 }
                        if (el.fillWidth) button.container.fillSecondarySize = true
                        button.container.updateSize()
                        gui.windowInner.addChild(button)
                        if (!el.noSpace) gui.windowInner.addChild(new gui_GUISpacing(gui.windowInner,new common_Point(2,4)))
                    } else if (el.type == "space") {
                        gui.windowInner.addChild(new gui_GUISpacing(gui.windowInner,new common_Point(2,el.size||4)))
                    }
                }
            }
        }
        if (typeof bottomButtons == "object") gui.windowAddBottomButtons(bottomButtons, closeText, closeAction)
        else if (bottomButtons) gui.windowAddBottomButtons()
    }
}