Liquid._superInternalFunctionThatOnlyExistsBecauseICantUseModulesInModsSeriouslyThereShouldBeASettingForThatOrSomething(function() {
	const fs = require("fs")
	const path = require("path")
	
	function readJSON(p, fallback) {
		try {
			return JSON.parse(fs.readFileSync(path.join(nw.App.dataPath, "modSettings", p), "utf8"))
		} catch(e) {
			if (typeof fallback !== "undefined") {
				return fallback
			} else {
				throw e
			}
		}
	}

	// get all local mods
	const files = fs.readdirSync(_internalModHelpers.path, { withFileTypes: true })
	var localMods = []
	for (const dirent of files) {
		if (dirent.isDirectory())
			localMods.push(dirent.name)
	}
	// get all steam mods
	const steamModPaths = _internalModHelpers.getAllModsSteam().map(e=>e.replace("steamMod:///",""))
	// create mods object
	let modList = []
	const mods = {}
	const modsByAssignedID = {}
	for (let i = 0; i < localMods.length; i++) {
		const id = localMods[i]
		modList.push({
			path: path.join(_internalModHelpers.path, localMods[i]),
			id: id,
			files: {},
			filesByName: {},
			type: "auto",
		})
	}
	for (let i = 0; i < steamModPaths.length; i++) {
		const id = steamModPaths[i].match(/[^\\\/]+$/)[0]
		modList.push({
			path: steamModPaths[i],
			id: id,
			files: {},
			filesByName: {},
			type: "auto",
			workshop: true,
		})
	}
	// loop through mods
	for (let i = 0; i < modList.length; i++) {
		const mod = modList[i]
		modsByAssignedID[mod.id] = mod
		mod.mtime = new Date(fs.statSync(mod.path).mtime)
		mod.utime = new Date(0)
		// attempt to load the file
		let file
		try {
			file = fs.readFileSync(path.join(mod.path, "modInfo.json"), "utf8")
		} catch(e) {
			console.warn(mod.id, "didn't have modInfo.json")
			mods[mod.id] = mod
			continue
		}
		// attempt to parse the file
		let conf
		try {
			conf = JSON.parse(file)
		} catch(e) {
			console.error(mod.id, "had incorrect JSON in modInfo.json:")
			console.error(e)
			mods[mod.id] = mod
			continue
		}
		// add conf properties to the mod
		if (typeof conf.name === "string") {
			mod.name = conf.name
		}
		if (typeof conf.description === "string") {
			mod.description = conf.description
		}
		if (typeof conf.author === "string") {
			mod.author = conf.author
		}
		if (conf.version != null) {
			mod.version = conf.version.toString()
		}
		if (typeof conf.loadPriority === "number") {
			mod.loadPriority = conf.loadPriority
		}
		if (typeof conf.documentation === "string") {
			mod.documentation = conf.documentation
		}
		if (typeof conf.modID === "string") {
			// mod.id = conf.modID
		}
		if (typeof conf.type === "string") {
			mod.type = conf.type
		}
		mod.currentSettings = readJSON(mod.id+".json", {})
		mods[mod.id] = mod
	}
	// fixy fixy
	function normalizeURL(url) {
		return decodeURIComponent(url).replace(/^c/,"C").replaceAll("/","\\")
	}
	// hook the mod loader
	let L = { progress: 0 }
	modding_ModLoader.loadAllModsPhase2 = function(orig) {
		const fs = require("fs")
		const path = require("path")
		// setup
		let modsPath = _internalModHelpers.path+"\\"
		let steamModsPath = _internalModHelpers.getAllModsSteam()[0].replace("steamMod:///","").replace(/\d+$/,"")

		// extend
		return function(loaders, then, startI) {
			orig.call(this, loaders, then, startI)
			for (let i = startI; i < loaders.length; i++) {
				const wrapper = loaders[i]
				const baseProgress = i / loaders.length
				const progressScale = 1 / loaders.length
				wrapper.loader.pre(function(res, next) {
					L.progress = (wrapper.loader.progress * progressScale + baseProgress) * 100
					res.url = normalizeURL(res.url)
					const assignedID = res.url.replace(modsPath, "").replace(steamModsPath, "").split(/\/|\\/)[0]
					console.log(res.url, assignedID)
					let mod = modsByAssignedID[assignedID]
					const respath = res.url.replace(mod.path, "")
					let loadingExplainer = document.getElementsByClassName("loadingExplainer")[0]
					try {
						loadingExplainer.style.opacity = "100% !important"
						loadingExplainer.style.animation = "none"
						loadingExplainer.innerText = `Loading ${mod.name || mod.id}: ${respath}`
					} catch(e) {}
					next()
				})
				wrapper.loader.use(function(res, next) {
					const assignedID = res.url.replace(modsPath, "").replace(steamModsPath, "").split(/\/|\\/)[0]
					let mod = modsByAssignedID[assignedID]
					const respath = res.url.replace(mod.path, "")
					if (!mod.filesByName[res.name]) {
						mod.filesByName[res.name] = []
					}
					// audio
					const audios = [".ogg", ".wav", ".mp3"]
					if (audios.includes(path.extname(res.name)) && res.data instanceof ArrayBuffer && res.data.byteLength == 0) {
						res.data = PIXI.sound.Sound.from({ url : res.url, preload : true, singleInstance : true, loaded : function() {
							next()
						}})
						mod.filesByName[res.name].push(res.data)
						mod.files[respath] = res.data
						return
					}
					mod.filesByName[res.name].push(res.data)
					mod.files[respath] = res.data
					next()
				})
			}
			modding_ModLoader.loadAllModsPhase2 = orig
		}
	} (modding_ModLoader.loadAllModsPhase2)
	// GameLoader hook for accurate progress bar
	GameLoader.prototype.update = function(orig) {
		return function(drawRectangle, scaling) {
			if (this.loader.progress == 100) {
				this.loader = L
				GameLoader.prototype.update = orig
			}
			orig.call(this, drawRectangle, scaling)
		}
	} (GameLoader.prototype.update)
	return mods
})