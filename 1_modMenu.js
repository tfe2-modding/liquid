Liquid._mainMenuButtons = []
Liquid._superInternalFunctionThatOnlyExistsBecauseICantUseModulesInModsSeriouslyThereShouldBeASettingForThatOrSomething = function(getMods) {
	const fs = require("fs")
	const path = require("path")

	const myID = Liquid.getModID()

	const mods = getMods()
	Liquid._modFiles = mods

	function rgb(r, g, b) {
		return r*65536+g*256+b
	}

	function writeJSON(p, v) {
		fs.writeFileSync(path.join(nw.App.dataPath, "modSettings", p), JSON.stringify(v, null, "\t"))
	}

	let darkmode = true

	// ripped from waterworks then modified to be specific to liquid
	function createWindow(gui, title, content, bottomButtons=null, closeText="Close", closeAction=null, icon=null, stackFunc=()=>{
		createWindow(gui, title, content, bottomButtons, closeText, closeAction, icon, stackFunc)
	}) {
		let windowSprite = "spr_9p_window"
		let scrollbarSprite = "spr_windowparts"
		let buttonSprite = "spr_button"
		gui.createWindow(null, Resources.getTexture(windowSprite), null, null, scrollbarSprite)
		gui.addWindowToStack(stackFunc)
		if (title) {
			let tex
			if (icon == null) icon = "spr_mods_icon_small"
			if (icon) {
				if (typeof icon == "string") {
					tex = Resources.getTexture(icon)
				} else {
					tex = PIXI.Texture.from(icon)
				}
			}
			gui.windowAddTitleText(title, null, tex)
		}
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
						let button = new gui_ContainerButton(gui,gui.innerWindowStage,gui.windowInner,el.onClick || (()=>{}), el.isActive || (()=>false), el.onHover || (()=>{}), el.sprite || buttonSprite)
						if (el.icon) {
							let tex
							if (typeof el.icon == "string") {
								tex = Resources.getTexture(el.icon)
							} else {
								tex = PIXI.Texture.from(el.icon)
							}
							tex.orig.width = 10
							tex.orig.height = 10
							let sprite = new PIXI.Sprite(tex)
							sprite.alpha = el.iconAlpha == null ? 1 : el.iconAlpha
							let container = new PIXI.Container()
							container.addChild(sprite)
							button.container.addChild(new gui_ContainerHolder(button, gui.innerWindowStage, container, {
								left: -0.5,
								right: 1.5,
								top: -0.5,
								bottom: 0
							}))
						}
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
			if(HxOverrides.substr(text,0,"[i#".length) == "[i#" && HxOverrides.substr(text,9,1) == "]") {
				this.get_textContainer().set_tint(thx_color_Rgb.toInt(thx_color_Rgbxa.toRgb(thx_color_Color.parse(HxOverrides.substr(text,2,7)))))
				text = HxOverrides.substr(text,"[i#123456]".length,null);
			}
			bitmapContainer.set_text(text)
			return ret
		}
	} (gui_TextElement.prototype.setTextWithoutSizeUpdate)

	let modMenuButton

	MainMenu.prototype.positionUIElements = function(orig) {
		return function(...args) {
			if (this.createdLiquidButtons == false) {
				this.createdLiquidButtons = true
				if (Liquid._mainMenuButtons.length > 0) {
					let exit, text
					if (!this.game.isMobile) {
						exit = this.bottomButtons.pop()
						// get the text
						text = exit.get_text()
						// vaporize it
						this.bottomButtonOnClick.remove(exit)
						this.bottomButtonOnRight.remove(exit)
						this.bottomButtonOnHover.remove(exit)
						this.bottomButtonAttract.remove(exit)
						exit.destroy()
					}
					let baseFont = this.game.isMobile ? "Arial18" : "Arial16"
					// add the custom liquid buttons
					for (let i = 0; i < Liquid._mainMenuButtons.length; i++) {
						let {text, onClick, showOnRight, font, onHover} = Liquid._mainMenuButtons[i]
						if (font == null) {
							font = baseFont;
						}
						this.addBottomButton(text, ()=>onClick.call(this, this.game), showOnRight, font, onHover)
					}
					if (!this.game.isMobile) {
						// re-add the exit button
						this.addBottomButton(text, function() {
							window.close()
						}, null, baseFont)
					}
				}
				modMenuButton = addMainMenuButton(this, "Installed Mods", openModsMenu.bind(this.game, this.gui), "Arial10")
				modMenuButton.set_tint(rgb(255, 196, 255))
			}
			const ret = orig.apply(this, args)
			if (modMenuButton) try {
				modMenuButton.x = this.game.rect.width - modMenuButton.width - 15
				modMenuButton.y = this.game.rect.height - modMenuButton.height - 65/this.game.scaling - 15
			} catch (e) {}
			return ret
		}
	} (MainMenu.prototype.positionUIElements)

	function addMainMenuButton(menu, text, onClick, font, onHover=_=>{}) {
		if(font == null) {
			font = menu.game.isMobile ? "Arial18" : "Arial16";
		}
		var menuButton
		menuButton = {
			theSprite: new graphics_BitmapText(text, {
				font: font,
				tint: 13684944
			}),
			onClick: onClick,
			onHover: onHover,
		}
		menu.bottomButtonStage.addChild(menuButton.theSprite)
		menu.otherButtons.push(menuButton)
		return menuButton.theSprite
	}

	function openModsMenu(gui) {
		const content = []
		let restartButton = {
			type: "button",
			text: "Restart The Game",
			onClick() {
				chrome.runtime.reload()
			}
		}
		if (NEEDSRESTART) {
			content.push("[red]You will need to restart The Final Earth 2 for changes to take effect")
			restartButton.text = "[red]Restart The Game"
		}
		content.push(restartButton, {type:"space"})
		content.push("Select a mod below for more info and configuration.", "If a mod shows up in red, Liquid was unable to figure out the mod name.", {type:"space"})
		function need_restart() {
			if (!NEEDSRESTART) {
				NEEDSRESTART = true
				content.splice(0, 0, "[red]You will need to restart The Final Earth 2 for changes to take effect")
				restartButton.text = "[red]Restart The Game"
			}
		}
		let steammods = []
		let yourmods = []
		for (const [modId, mod] of Object.entries(mods)) {
			let content = mod.workshop ? steammods : yourmods
			let icon = null
			if (modId == myID) {
				icon = "spr_dtmg_liquidmodloader_smallicon"
			} else {
				icon = mod.files["\\icon.png"]
			}
			content.push({
				type: "button",
				sprite: ModTools.modIsEnabled(modId) ? "spr_button" : "spr_transparentbutton",
				fillWidth: true,
				noSpace: true,
				icon: icon,
				iconAlpha: ModTools.modIsEnabled(modId) ? 1 : 0.3,
				onClick() {
					const content = [
						{
							type: "text",
							text: "[i#777777]ID: "+modId,
							font: "Arial"
						}
					]
					if (mod.version != null) content.push({
						type: "text",
						text: "[i#777777]Version: "+mod.version,
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
					if (!(modId == myID)) content.push({
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
										gui.goPreviousWindow()
										gui.windowCanBeClosed = false
										createWindow(gui, null, ["Loading"], null, "", null)
										gui.windowCanBeClosed = false
										greenworks.ugcUnsubscribe(modId, ()=>{
											delete mods[modId]
											need_restart()
											gui.goPreviousWindow()
											gui.goPreviousWindow()
										}, ()=>{
											gui.goPreviousWindow()
											createWindow(gui, "Error", "Not sure what happened, but I wasn't able to remove the mod. Maybe check your internet?")
										})
									}
								},
								{
									type: "button",
									fillWidth: true,
									text: "Cancel",
									onClick() {
										gui.goPreviousWindow()
									}
								}
							], null, "", null, icon)
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
												if (v.display == true) {
													return Math.floor(v.value * 100) + "%"
												} else if (Array.isArray(v.display)) {
													return v.display[(v.value - v.min) / (v.step || 0)] || v.value
												} else {
													return v.value
												}
											},
											fillLevel() {
												return (v.value-v.min)/(v.max-v.min)
											},
											setFillLevel(level) {
												let prev = v.value
												if (v.step) {
													const clickedValue = level*(v.max-v.min)+v.min
													const valueToSet = Math.round(clickedValue*(1/v.step))/(1/v.step)
													v.value = valueToSet
												} else {
													v.value = level*(v.max-v.min)+v.min
												}
												if (prev != v.value) v.callback(v.value)
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
															let prev = v.value
															v.value = e
															gui.goPreviousWindow()
															if (prev != v.value) v.callback(v.value)
															saveSettings(0)
														},
														noSpace: true,
													}
												}).concat([{type: "space"}]), null, "Back", null, icon)
											}
										})
									}
								}
								createWindow(gui, (mod.name || modId)+" Settings", settingscontent, null, "Back", null, icon)
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
									nw.Shell.openExternal(encodeURI("file:///"+path.join(mod.path, mod.documentation).replaceAll("\\","/")))
								}
							}
						})
					}
					createWindow(gui, mod.name || modId, content, bottombuttons, "Back", null, icon)
				},
				text: (mod.name ? (ModTools.modIsEnabled(modId) ? "" : "[i#777777]") + mod.name : (ModTools.modIsEnabled(modId) ? "[red]" : "[i#aa7777]") + modId),
				font: "Arial"
			}, {type:"space", size:2})
		}
		content.push(...steammods)
		content.push({type:"space"})
		if (yourmods.length > 0) {
			content.push("Your mods:")
			content.push(...yourmods)
			content.push({type:"space"})
		}
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
		], "Close", null, null, openModsMenu.bind(this, gui))
	}

	Liquid.openModsMenu = openModsMenu

	Game.prototype.createMainMenu = function(orig) {
		return function(...args) {
			const ret = orig.apply(this, args)
			this.state.createdLiquidButtons = false
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

	Liquid.getModVersion = function() {
		mods[Liquid.getModID(1)].version
	}

	delete Liquid._superInternalFunctionThatOnlyExistsBecauseICantUseModulesInModsSeriouslyThereShouldBeASettingForThatOrSomething
}
