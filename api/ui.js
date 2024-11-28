Liquid.addMainMenuButton = function(text, onClick, showOnRight, font, onHover) {
	const obj = {
		text: text,
		onClick: onClick,
		showOnRight: showOnRight,
		font: font,
		onHover: onHover,
	}
	Liquid._mainMenuButtons.push(obj)
	return obj
}

Liquid._cityGUIButtons = []

Liquid.addGeneralStatsButton = function(onClick, text, spriteName, position, isActive, onHover, keybind) {
	Liquid._cityGUIButtons.push({
		type: "stat",
		onClick: onClick,
		text: typeof text === "string" ? ()=>text : text,
		spriteName: spriteName,
		position: position == null ? 0 : position,
		onHover: onHover == null ? ()=>{} : onHover,
		isActive: isActive == null ? _=>false : isActive,
		keybind: keybind,
	})
}

Liquid.addQuickActionButton = function(onClick, spriteName, position, isActive, onHover, keybind) {
	Liquid._cityGUIButtons.push({
		type: "action",
		onClick: onClick,
		spriteName: spriteName,
		position: position == null ? 0 : position,
		onHover: onHover == null ? ()=>{} : onHover,
		isActive: isActive == null ? _=>false : isActive,
		keybind: keybind,
	})
}

gui_CityGUI.prototype.addGeneralStatistics = function(orig) {
    return function () {
        orig.call(this)
        const city = this.city
        const generalStatistics = this.cityInfo.children[this.cityInfo.children.length - 1]
        const actionButtons = this.cityInfo.children[0]
		for (let i = 0; i < Liquid._cityGUIButtons.length; i++) {
			const b = Liquid._cityGUIButtons[i]
			let button
			let parent
			if (b.type == "stat") {
				parent = generalStatistics
				button = this.createInfoButton(() => b.onClick(city), () => b.onHover(city), () => b.text(city), b.spriteName, generalStatistics, 20, () => b.isActive(city))
			} else if (b.type == "action") {
				const tex = Resources.getTexture(b.spriteName)
				parent = actionButtons
				button = new gui_ImageButton(this, this.stage, parent, () => b.onClick(city), tex, () => b.isActive(city), () => b.onHover(city), null, this.miniButtonToUse(), (14 - tex.width) / 2)
			}
			if (b.keybind) button.keyboardButton = Keyboard.getLetterCode(b.keybind)
			if (b.position < 0) {
				parent.insertChild(button, generalStatistics.children.length + b.position)
			} else {
				parent.insertChild(button, b.position)
			}
		}
    }
} (gui_CityGUI.prototype.addGeneralStatistics)

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