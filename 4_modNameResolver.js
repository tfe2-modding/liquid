// try to resolve unknown properties from the workshop
Liquid._resolveModNames = async function () {
	Liquid._modNameResolveStarted = true
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
			const mod = Liquid._modFiles[workshopMod.publishedFileId]
			if (mod) {
				if (mod.id == null) {
					mod.id = workshopMod.publishedFileId
				}
				mod.utime = new Date(workshopMod.timeUpdated*1000)
				if (mod.utime.getTime() > mod.mtime.getTime()) {
					Liquid._anyModNeedsUpdate = true
					if (Liquid.modMenuButton) Liquid.modMenuButton.texture = Resources.getTexture("spr_logo_liquid_needsupdate")
				}
				if (mod.version == null) {
					mod.version = mod.utime.toDateString()
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
	Liquid._onModNamesResolved()
}

ModTools.onModsLoaded(Liquid._resolveModNames)