Liquid.modMenu = function(getMods) {
	const fs = require("fs")
	const path = require("path")

	const mods = getMods()

	function rgb(r, g, b) {
		return r*65536+g*256+b
	}

	function writeJSON(p, v) {
		fs.writeFileSync(path.join(global.__dirname, "mod_data", p), JSON.stringify(v, null, "\t"))
	}

	let letterInterfaces = new Map
	function getLettersInterface(bitmapText) {
		if (letterInterfaces.get(bitmapText)) return letterInterfaces.get(bitmapText)
		const vertexData = bitmapText.internalText.children[0].vertexData
		const interface = []
		for (let i = 0; i < vertexData.length; i += 8) {
			const letter = {}
			const x1 = i
			const y1 = i+1
			const x2 = i+2
			const y2 = i+3
			const x3 = i+4
			const y3 = i+5
			const x4 = i+6
			const y4 = i+7
			let offsetX = 0
			let offsetY = 0
			Object.defineProperty(letter, "x", {
				get() {
					return vertexData[x1]
				},
				set(v) {
					const change = v - vertexData[x1]
					vertexData[x1] += change
					vertexData[x2] += change
					vertexData[x3] += change
					vertexData[x4] += change
				},
				enumerable: true
			})
			Object.defineProperty(letter, "y", {
				get() {
					return vertexData[y1]
				},
				set(v) {
					const change = v - vertexData[y1]
					vertexData[y1] += change
					vertexData[y2] += change
					vertexData[y3] += change
					vertexData[y4] += change
				},
				enumerable: true
			})
			Object.defineProperty(letter, "width", {
				get() {
					return vertexData[x2] - vertexData[x1]
				},
				set(v) {
					const change = v - (vertexData[x2] - vertexData[x1])
					vertexData[x2] += change
					vertexData[x3] += change
				},
				enumerable: true
			})
			Object.defineProperty(letter, "height", {
				get() {
					return vertexData[y4] - vertexData[y1]
				},
				set(v) {
					const change = v - (vertexData[y4] - vertexData[y1])
					vertexData[y4] += change
					vertexData[y3] += change
				},
				enumerable: true
			})
			interface.push(letter)
		}
		letterInterfaces.set(bitmapText, interface)
		return interface
	}

	function closeWindow(gui) {
		gui.closeWindow()
		gui.prevWindowStack.pop()
		gui.prevWindowStack.pop()()
	}

	// ripped from waterworks
	// if you REALLY want me to, i can add this to the Liquid object
	// but this function kinda sucks and wasnt designed to be an external api so im very opposed to it
	function createWindow(gui, title, content, bottomButtons=null, closeText="Close", closeAction=null) {
		gui.createWindow()
		gui.addWindowToStack(()=>{
			createWindow(gui, title, content, bottomButtons, closeText, closeAction)
		})
		if (title) gui.windowAddTitleText(title, null, Resources.getTexture("spr_mods_icon_small"))
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
						let button = new gui_ContainerButton(gui,gui.innerWindowStage,gui.windowInner,el.onClick || (()=>{}), el.isActive || (()=>false), el.onHover || (()=>{}), el.sprite || null)
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

	let NEEDSRESTART = false
	gui_TextElement.prototype.setTextWithoutSizeUpdate = function(orig) {
		return function(...args) {
			const ret = orig.apply(this, args)
		let bitmapContainer = this.get_textContainer()
		let text = bitmapContainer.internalText.text
		if (text.startsWith("[faint]")) {
			text = text.replace("[faint]","")
			bitmapContainer.alpha = 0.5
		}
		bitmapContainer.set_text(text)
			return ret
		}
	} (gui_TextElement.prototype.setTextWithoutSizeUpdate)


	let ishovered = false
	let washovered = false

	Game.prototype.update = function(orig) {
		return function(...args) {
			const ret = orig.apply(this, args)
		washovered = ishovered
		ishovered = false
			return ret
		}
	} (Game.prototype.update)

	let modMenuButton
	const modButtonPadding = 5

	MainMenu.prototype.positionUIElements = function(orig) {
		return function(...args) {
			const ret = orig.apply(this, args)
			if (modMenuButton) try {
				modMenuButton.x = this.game.rect.width - modMenuButton.width - 15 - modButtonPadding
				modMenuButton.y = this.game.rect.height - modMenuButton.height - 65/this.game.scaling - 15 - modButtonPadding
				const letters = getLettersInterface(modMenuButton)
				for (let i = 0; i < letters.length; i++) {
					const letter = letters[i]
					delete letter.yv
					delete letter.startY
					if (letter.interval) clearInterval(letters[i].interval)
					delete letter.interval
				}
			} catch (e) {}
			return ret
		}
	} (MainMenu.prototype.positionUIElements)

	function addMainMenuButton(text,onClick,showOnRight,font,onHover) {
		if(font == null) {
			font = "Arial16";
		}
		if(showOnRight == null) {
			showOnRight = false;
		}
		const menu = this.state
		var bottomButton = new graphics_BitmapText(text,{ font : showOnRight ? "Arial" : font, tint : showOnRight ? 13684944 : 16777215});
		menu.bottomButtonStage.addChild(bottomButton);
		menu.bottomButtons.push(bottomButton);
		menu.bottomButtonOnClick.set(bottomButton,onClick);
		menu.bottomButtonOnHover.set(bottomButton,onHover);
		menu.bottomButtonOnRight.set(bottomButton,showOnRight);
		menu.bottomButtonAttract.set(bottomButton,false);
		return bottomButton;
	}
	function openModsMenu(gui) {
		const content = []
		if (NEEDSRESTART) {
			content.push("[red]You will need to restart The Final Earth 2 for changes to take effect", {
				type: "button",
				text: "[red]Restart",
				onClick() {
					chrome.runtime.reload()
				}
			}, {type:"space"})
		}
		content.push("Select a mod below for more info and configuration.", "If a mod shows up in red, Liquid was unable to figure out the mod name.", {type:"space"})
		function need_restart() {
			if (!NEEDSRESTART) {
				NEEDSRESTART = true
				content.splice(0, 0, "[red]You will need to restart The Final Earth 2 for changes to take effect", {
					type: "button",
					text: "[red]Restart",
					onClick() {
						chrome.runtime.reload()
					}
				}, {type:"space"})
			}
		}
		for (const [modId, mod] of Object.entries(mods)) {
			content.push({
				type: "button",
				fillWidth: true,
				noSpace: true,
				onClick() {
					const content = [
						{
							type: "text",
							text: "[faint]ID: "+modId,
							font: "Arial"
						}
					]
					if (mod.version != null) content.push({
						type: "text",
						text: "[faint]Version: "+mod.version,
						font: "Arial"
					})
					if (mod.author) {
						content.push({
							type: "text",
							text: "Author: "+mod.author,
							font: "Arial"
						})
					}
					content.push({type:"space"})
					if (mod.description) {
						content.push({
							type: "text",
							text: mod.description,
							font: "Arial"
						}, {type:"space"})
					}
					if (!(modId == 3290771180 || modId == "liquid")) content.push({
						type: "checkbox",
						text: "Enabled",
						isChecked() {
							return ModTools.modIsEnabled(modId)
						},
						onClick() {
							need_restart()
							ModTools.setModEnabled(modId, !ModTools.modIsEnabled(modId))
						},
					})
					if (mod.workshop) content.push({
						type: "button",
						sprite: "spr_button_windowheader",
						fillWidth: true,
						text: "Uninstall",
						onClick() {
							createWindow(gui, "Are you sure?", [
								"Are you sure you want to uninstall "+(mod.name || modId)+"? You will not be able to reinstall it without going into the steam workshop page.",
								{
									type: "button",
									sprite: "spr_button_windowheader",
									fillWidth: true,
									text: "Uninstall "+(mod.name || modId)+"",
									onClick() {
										closeWindow(gui)
										gui.windowCanBeClosed = false
										createWindow(gui, null, ["Loading"], null, "", null)
										gui.windowCanBeClosed = false
										greenworks.ugcUnsubscribe(modId, ()=>{
											need_restart()
											closeWindow(gui)
											closeWindow(gui)
										}, ()=>{
											closeWindow(gui)
											createWindow(gui, "Error", "Not sure what happened, but I wasn't able to remove the mod. Maybe check your internet?")
										})
									}
								},
								{
									type: "button",
									fillWidth: true,
									text: "Cancel",
									onClick() {
										closeWindow(gui)
									}
								}
							], null, "", null)
						}
					})
					const bottombuttons = []
					let saveTimeout
					function saveSettings(delay=500) {
						// need_restart()
						clearTimeout(saveTimeout)
						saveTimeout = setTimeout(()=>{
							const modSettings = {}
							for (const [k, v] of Object.entries(mod.settings)) {
								modSettings[k] = v.value
							}
							writeJSON(modId+".json", modSettings)
						}, delay)
					}
					if (mod.settings) {
						bottombuttons.push({
							text: "Settings",
							action: function() {
								const settingscontent = []
								for (const [k, v] of Object.entries(mod.settings)) {
									if (v.type == "checkbox") {
										settingscontent.push({
											type: "checkbox",
											text: v.label,
											isChecked() {
												return v.value
											},
											onClick() {
												v.value = !v.value
												v.callback(v.value)
												saveSettings(0)
											}
										})
									} else if (v.type == "slider") {
										settingscontent.push(v.label)
										settingscontent.push({
											type: "slider",
											textUpdateFunction() {
												return v.value
											},
											fillLevel() {
												return (v.value-v.min)/(v.max-v.min)
											},
											setFillLevel(level) {
												if (v.step) {
													const clickedValue = level*(v.max-v.min)+v.min
													const valueToSet = Math.round(clickedValue*(1/v.step))/(1/v.step)
													v.value = valueToSet
												} else {
													v.value = level*(v.max-v.min)+v.min
												}
												v.callback(v.value)
												saveSettings()
											}
										})
									} else if (v.type == "menu") {
										settingscontent.push(v.label)
										settingscontent.push({
											type: "button",
											fillWidth: true,
											text: "A",
											textUpdateFunction() {
												return "[+] "+v.value
											},
											onClick() {
												createWindow(gui, v.label, v.options.map(e=>{
													return {
														type: "checkbox",
														text: e,
														isChecked() {
															return e == v.value
														},
														onClick() {
															v.value = e
															gui.goPreviousWindow()
															v.callback(v.value)
															saveSettings(0)
														},
														noSpace: true,
													}
												}).concat([{type: "space"}]), null, "Back")
											}
										})
									}
								}
								createWindow(gui, mod.name+" Settings", settingscontent, null, "Back")
							}
						})
					}
					bottombuttons.push({
						text: "Files",
						action: function() {
							nw.Shell.openExternal(mod.path)
						}
					})
					if (mod.documentation != null) {
						bottombuttons.push({
							text: "Documentation",
							action: function() {
								if (mod.documentation.startsWith("http://") || mod.documentation.startsWith("https://")) {
									nw.Shell.openExternal(mod.documentation)
								} else {
									nw.Shell.openExternal(path.join(mod.path, mod.documentation))
								}
							}
						})
					}
					createWindow(gui, mod.name, content, bottombuttons, "Back")
				},
				text: mod.name ? mod.name : "[red][faint]" + modId,
				font: "Arial"
			}, {type:"space", size:2})
		}
		content.push({type:"space"})
		content.push({
			type: "button",
			onClick() {
				greenworks.activateGameOverlayToWebPage("http://steamcommunity.com/app/1180130/workshop")
			},
			text: "[blue]"+common_Localize.lo("open_workshop")
		})
		content.push({type:"space"})
		createWindow(gui, "Mods", content, [
			{
				text: "Mod Files",
				action: function() {
					nw.Shell.openExternal(_internalModHelpers.path)
				}
			},
			{
				text: "Game Files",
				action: function() {
					nw.Shell.openExternal(global.__dirname)
				}
			},
		])
	}
	Game.prototype.createMainMenu = function(orig) {
		return function(...args) {
			const ret = orig.apply(this, args)
			let animating = 0
			modMenuButton = addMainMenuButton.call(this,"Installed Mods",openModsMenu.bind(this, this.state.gui),true,"Arial",async () => {
				ishovered = true
				if (washovered) return
				const letters = getLettersInterface(modMenuButton)
				async function forAll(arr, cb, delay=100, stopcondition=()=>{}, startDelay=0, start=0, step=1) {
					if (startDelay) await new Promise(resolve=>{
						setTimeout(resolve, startDelay)
					})
					for (let i = start; i < arr.length && i >= 0; i += step) {
						cb(arr[i], i, arr)
						await new Promise(resolve=>{
							setTimeout(resolve, delay)
						})
						if (stopcondition()) break
					}
				}
				animating++
				const loopFunc = (e, i, arr) => {
					let time = 0
					e.startY ??= e.y
					const distance = 6
					e.yv = -70 * ((e.y - e.startY)/5 + distance)/distance
					e.yv = Math.max(Math.min(e.yv, 70), -70)
					let speed = 0.5
					if (e.interval) clearInterval(e.interval)
					e.interval = setInterval(()=>{
						e.y += e.yv/(400/this.scaling*speed)
						time += 2
						if (e.y > e.startY) {
							e.yv -= 1/speed
						}
						if (e.y < e.startY) {
							e.yv += 1/speed
						}
						if (time >= 140) {
							e.yv /= 1.006
							speed += 7/1024
						}
						if (Math.floor(e.y*this.scaling)/this.scaling == e.startY && Math.floor(e.yv*this.scaling) == 0) {
							clearInterval(e.interval)
							e.y = e.startY
							delete e.yv
							delete e.startY
						}
					})
				}
				let startPos = Math.floor(Math.random()*letters.length)
				let startPosDistance = Infinity
				for (let i = 0; i < letters.length; i++) {
					const letter = letters[i]
					const distance = Math.abs(this.mouse.position.x*this.scaling - (letter.x + letter.width/2))
					if (distance < startPosDistance) {
						startPosDistance = distance
						startPos = i
					}
				}
				await Promise.all([
					forAll(letters, loopFunc, 25, ()=>!true, 0, startPos, 1),
					forAll(letters, loopFunc, 25, ()=>!true, 25, startPos-1, -1)
				])
				animating--
			});
			this.state.positionUIElements()
			modMenuButton.set_tint(rgb(255, 196, 255))
			modMenuButton.internalText.children[0].blendMode = 1
			modMenuButton.internalText.children[0].transform.position.x = modButtonPadding
			modMenuButton.internalText.children[0].transform.position.y = modButtonPadding
			modMenuButton.internalText._textWidth += modButtonPadding*2
			modMenuButton.internalText._textHeight += modButtonPadding*2
			return ret
		}
	} (Game.prototype.createMainMenu)

	gui_GameMenu.create = function(orig) {
		return function(gui,city) {
			const windowAddBottomButtons = gui.windowAddBottomButtons
			gui.windowAddBottomButtons = ()=>{}
			orig.call(this, gui,city)
			gui.windowAddBottomButtons = windowAddBottomButtons
			gui.windowAddBottomButtons([
				{
					text: common_Localize.lo("back_to_title"),
					action : function() {
						city.game.createMainMenu()
					},
				},
				{
					text: "Mods",
					action : function() {
						openModsMenu(gui)
					},
				},
			])
		}
	} (gui_GameMenu.create)

	Liquid._addSetting = function(modId, name, obj) {
		if (mods[modId].settings == null) {
			mods[modId].settings = {}
		}
		mods[modId].settings[name] = obj
		if (mods[modId].settings[name].value != mods[modId].currentSettings[name] && mods[modId].currentSettings[name] != null) {
			mods[modId].settings[name].value = mods[modId].currentSettings[name]
			obj.callback(mods[modId].settings[name].value)
		}
	}

	delete Liquid.modMenu
}