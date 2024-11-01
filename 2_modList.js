Liquid._superInternalFunctionThatOnlyExistsBecauseICantUseModulesInModsSeriouslyThereShouldBeASettingForThatOrSomething(function() {
	const fs = require("fs")
	const path = require("path")
	
	function readJSON(p, fallback) {
		try {
			return JSON.parse(fs.readFileSync(path.join(global.__dirname, "mod_data", p), "utf8"))
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
	const mods = {}
	for (let i = 0; i < localMods.length; i++) {
		const id = localMods[i]
		mods[id] = {
			path: path.join(_internalModHelpers.path, localMods[i]),
			id: localMods[i],
			files: {},
			filesByName: {},
		}
	}
	for (let i = 0; i < steamModPaths.length; i++) {
		const id = steamModPaths[i].match(/[^\\\/]+$/)[0]
		mods[id] = {
			path: steamModPaths[i],
			id: id,
			files: {},
			filesByName: {},
			workshop: true,
		}
	}
	// loop through mods
	for (const [id, mod] of Object.entries(mods)) {
		// attempt to load the file
		let file
		try {
			file = fs.readFileSync(path.join(mod.path, "modInfo.json"), "utf8")
		} catch(e) {
			console.warn(mod.id, "didn't have modInfo.json")
			continue
		}
		// attempt to parse the file
		let conf
		try {
			conf = JSON.parse(file)
		} catch(e) {
			console.error(mod.id, "had incorrect JSON in modInfo.json:")
			console.error(e)
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
		mod.currentSettings = readJSON(id+".json", {})
	}
	// hook the mod loader
	modding_ModLoader.loadAllModsPhase2 = function(orig) {
		const fs = require("fs")
		const path = require("path")
		// setup
		let modsPath = _internalModHelpers.path+"\\"
		let steamModsPath = _internalModHelpers.getAllModsSteam()[0].replace("steamMod:///","").replace(/\d+$/,"")
		
		function readJSON(p, fallback) {
			try {
				return JSON.parse(fs.readFileSync(path.join(global.__dirname, "mod_data", p), "utf8"))
			} catch(e) {
				if (typeof fallback !== "undefined") {
					return fallback
				} else {
					throw e
				}
			}
		}
		// extend
		return function(loaders, then, startI) {
			orig.call(this, loaders, then, startI)
			for (let i = startI; i < loaders.length; i++) {
				const wrapper = loaders[i]
				wrapper.loader.use(function(res, next) {
					const id = res.url.replace(modsPath, "").replace(steamModsPath, "").split(/\/|\\/)[0]
					let mod = mods[id]
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
	// try to resolve unknown properties from the workshop
	ModTools.onModsLoaded(async function () {
		let i = 0
		while (true) {
			i++
			let workshopMods = await new Promise(resolve => {
				getInstalledMods(i, resolve)
			})
			if (workshopMods.length == 0) {
				break
			}
			for (let index = 0; index < workshopMods.length; index++) {
				let workshopMod = workshopMods[index]
				const mod = mods[workshopMod.publishedFileId]
				if (mod) {
					if (mod.id == null) {
						mod.id = workshopMod.publishedFileId
					}
					if (mod.version == null) {
						mod.version = (new Date(workshopMod.timeUpdated*1000)).toDateString()
					}
					if (mod.name == null) {
						mod.name = workshopMod.title
					}
					if (mod.description == null) {
						mod.description = workshopMod.description
					}
				}
			}
		}
	})
	return mods
})