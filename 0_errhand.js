// define liquid
window.Liquid = {}
Liquid._onModNamesResolved = function() {}
{
	const
		ERR_MOD = 0,
		ERR_GAME = 1,
		ERR_DEV = 2
	let gamePrefix = String.raw `chrome-extension:\/\/\w+`
	let yourModsPrefix = encodeURI("file:///"+nw.App.dataPath).replaceAll("%5C","/").replace(/[-[\]{}()*+?.,\\^$|#\s\/]/g, '\\$&')
	let modsPrefix = encodeURI((_internalModHelpers.getAllModsSteam()[0].split("1180130")[0]+"1180130\\").replace("steamMod", "file")).replaceAll("%5C","/").replace(/[-[\]{}()*+?.,\\^$|#\s\/]/g, '\\$&')
	let noErrors = true
	let doctext = ""
	function fixFileNames(msg) {
		return msg
			.replace(new RegExp(gamePrefix, "gm"), "")
			.replace(new RegExp(yourModsPrefix, "gm"), "")
			.replace(new RegExp(modsPrefix, "gm"), "steamMod:")
			.replace(/steamMod:(\d+)/gm, function(m, d) {
				if (Liquid._modFiles[d].name) {
					return "["+Liquid._modFiles[d].name+"]"
				}
				return d
			})
	}
	window.onerror = function(message, filename, lineno, colno, error) {
		if (noErrors) {
			noErrors = false
			doctext += `
	<style>
		:root {
			color-scheme: dark;
		}
		html {
			color: white;
			background: black;
			font-family: system-ui;
			margin: 30px;
		}
		hr {
			border: none;
			border-bottom: 1px solid currentColor;
		}
		pre {
			background: #333;
			user-select: all;
			padding: 10px;
		}
		i {
			color: #aaa;
		}
	</style>
	<h1>Oops, something went wrong!</h1>
	<p>The following errors were recorded. Please report these to the mod developers.</p>
`
		}
		let errtype
		let whosAtFault = "Unknown Error"
		if (filename.match(new RegExp("^"+gamePrefix))) {
			errtype = ERR_GAME
			whosAtFault = "Internal Game Error"
		}
		if (filename.match(new RegExp("^"+yourModsPrefix))) {
			errtype = ERR_DEV
			let mod = fixFileNames(filename).match(/mods\/[^\/]+/) + ""
			whosAtFault = `Your mod: <a href="javascript:void(0)" onclick="nw.Shell.openExternal('${filename.split(mod)[0]+mod}')">`+mod.replace("mods/")+"</a>"
		}
		if (filename.match(new RegExp("^"+modsPrefix))) {
			errtype = ERR_MOD
			let id = filename.replace(new RegExp(modsPrefix, "gm"), "").match(/^\d+/)+""
			let mod = Liquid._modFiles[id]
			if (mod.name) {
				whosAtFault = `Mod: <a href="javascript:void(0)" onclick="nw.Shell.openExternal('steam://url/CommunityFilePage/'+${id})">${mod.name}</a>`
			} else {
				whosAtFault = `Mod: <a href="javascript:void(0)" onclick="nw.Shell.openExternal('steam://url/CommunityFilePage/'+${id})" class="modName" id="${id}">${id}</a>`
			}
		}
		doctext += `
	<hr>
	<h3>Error in ${filename}: line ${lineno} column ${colno}</h3>
	<p>${message}</p>
	<i>${whosAtFault}</i>
	<p>Full error (click below to select all of it):</p>
	<pre>Source: ${filename}:${lineno}:${colno}
${error.stack}</pre>
`
		document.firstElementChild.innerHTML = fixFileNames(doctext)
		Liquid._onModNamesResolved = function() {
			document.firstElementChild.innerHTML = fixFileNames(doctext)
			let els = document.getElementsByClassName("modName")
			for (let i = 0; i < els.length; i++) {
				els[i].innerText = Liquid._modFiles[els[i].id].name || els[i].id
			}
		}
		if (!Liquid._modNameResolveStarted) {
			Liquid._resolveModNames()
		}
	}
}