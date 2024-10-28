Liquid.getModResource = function(filepath) {
	const path = require("path")
	const fixedfilepath = path.resolve("m:", filepath).replace("m:","")
	return Liquid._modFiles[Liquid.getModID(1)].files[fixedfilepath]
}

Liquid.onInfoFiles = function(filename, callback) {
	ModTools.onModsLoaded(function(game) {
		let topinfo = []
		for (const files of Object.values(Liquid._modFiles)) {
			let info = files.filesByName[filename]
			if (info) for (let i = 0; i < info.length; i++) {
				topinfo = topinfo.concat(info[i])
			}
		}
		callback(topinfo)
	})
}