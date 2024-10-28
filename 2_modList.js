Liquid._superInternalFunctionThatOnlyExistsBecauseICantUseModulesInModsSeriouslyThereShouldBeASettingForThatOrSomething(function() {
	const mods = {
		[Liquid.getModID()]: {
			"name": "Liquid",
			"author": "DT",
			"description": "The mod that controls this mod menu and provides the Liquid API.",
			"version": Liquid.version,
			"documentation": "https://tfe2-modding.github.io/liquid/"
		}
	}
	// hook the mod loader
	modding_ModLoader.loadAllModsPhase2 = function(orig) {
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
					let mod
					// define mod if it doesn't already exist
					if (!(mod = mods[id])) {
						mod = mods[id] = {
							id: id,
							path: res.url.split(id)[0]+id,
							files: {},
							filesByName: {},
						}
						if (res.url.indexOf(steamModsPath) >= 0) {
							mod.workshop = true
						}
						mod.currentSettings = readJSON(id+".json", {})
					}
					const respath = res.url.replace(mod.path, "")
					mod.files[respath] = res.data
					if (!mod.filesByName[res.name]) {
						mod.filesByName[res.name] = []
					}
					mod.filesByName[res.name].push(res.data)
					// modInfo
					if (res.name == "modInfo.json") {
						let conf = res.data
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
					}
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