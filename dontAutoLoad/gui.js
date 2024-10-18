const gui = {}

// ripped from waterworks
// if you REALLY want me to, i can add this to the Liquid object
// but this function kinda sucks and wasnt designed to be an external api so im very opposed to it
function createWindow(title, content, bottomButtons=null, closeText="Close", closeAction=null) {
	let stategui = tfe2.game.state.gui
	stategui.createWindow()
	stategui.addWindowToStack(()=>{
		createWindow(title, content, bottomButtons, closeText, closeAction)
	})
	if (title) stategui.windowAddTitleText(title)
	if (content) if (typeof content != "object") {
		stategui.windowAddInfoText(content.toString())
	} else {
		let ids = Object.keys(content)
		let elements = Object.values(content)
		for (let i = 0; i < elements.length; i++) {
			let el = elements[i]
			if (typeof el != "object") {
				stategui.windowSimpleButtonContainer = null
				stategui.windowAddInfoText(el)
			} else {
				if (el.type == "simpleButton") {
					stategui.windowAddSimpleButton(el.image, el.onClick, el.text, el.textUpdateFunction, el.font)
				} else if (el.type == "text") {
					stategui.windowSimpleButtonContainer = null
					stategui.windowAddInfoText(el.text, el.textUpdateFunction, el.font)
				} else if (el.type == "clickableText") {
					stategui.windowSimpleButtonContainer = null
					stategui.windowAddInfoTextClickable(el.onClick, el.text, el.textUpdateFunction, el.font)
				} else if (el.type == "checkbox") {
					stategui.windowSimpleButtonContainer = null
					gui_CheckboxButton.createSettingButton(stategui,stategui.innerWindowStage,stategui.windowInner,el.onClick,el.isChecked || (()=>false),el.text)
					if (!el.noSpace) stategui.windowInner.addChild(new tfe2.gui_GUISpacing(stategui.windowInner,new tfe2.common_Point(2,4)))
				} else if (el.type == "slider") {
					stategui.windowSimpleButtonContainer = null
					var slider = new tfe2.gui_Slider(stategui,stategui.innerWindowStage,stategui.windowInner,el.fillLevel,el.setFillLevel)
					slider.addChild(new tfe2.gui_TextElement(slider,stategui.innerWindowStage,el.text,el.textUpdateFunction,el.font))
					stategui.windowInner.addChild(slider)
					if (!el.noSpace) stategui.windowInner.addChild(new tfe2.gui_GUISpacing(stategui.windowInner,new tfe2.common_Point(2,4)))
				} else if (el.type == "button") {
					let button = new tfe2.gui_ContainerButton(stategui,stategui.innerWindowStage,stategui.windowInner,el.onClick || (()=>{}), el.isActive || (()=>false), el.onHover || (()=>{}), el.sprite || null)
					let text = new tfe2.gui_TextElement(button,stategui.innerWindowStage,el.text,el.textUpdateFunction,el.font)
					button.container.addChild(text)
					button.container.padding = { left: 3, right: 3, top: 3, bottom: 0 }
					if (el.fillWidth) button.container.fillSecondarySize = true
					button.container.updateSize()
					stategui.windowInner.addChild(button)
					if (!el.noSpace) stategui.windowInner.addChild(new tfe2.gui_GUISpacing(stategui.windowInner,new tfe2.common_Point(2,4)))
				} else if (el.type == "space") {
					stategui.windowInner.addChild(new tfe2.gui_GUISpacing(stategui.windowInner,new tfe2.common_Point(2,el.size||4)))
				}
			}
		}
	}
	if (typeof bottomButtons == "object") stategui.windowAddBottomButtons(bottomButtons, closeText, closeAction)
	else if (bottomButtons) stategui.windowAddBottomButtons()
}

gui.createWindow = createWindow

const domparser = new DOMParser

class XWindow {
	constructor(xmldoc) {
		if (typeof xmldoc === "string") {
			const doc = domparser.parseFromString(xmldoc, "application/xml")
			const parsererror = doc.querySelector("parsererror")
			if (parsererror) throw parsererror.innerText
			this.document = doc
		} else if (xmldoc) {
			this.document = xmldoc
		} else {
			this.document = document.implementation.createDocument(null, "window")
		}
	}
	push() {
		const stategui = tfe2.game.state.gui
		stategui.createWindow()
		stategui.addWindowToStack(()=>{
			this.push()
		})
		let icon = null
		let title = null
		if (this.document.attributes.icon) {
			icon = tfe2.Resources.getTexture(this.document.attributes.icon.value)
		}
		if (this.document.attributes.title) {
			title = this.document.attributes.title.value
		}
		if (icon || title) {
			stategui.windowAddTitleText(title || "", null, icon, true)
		}
	}
}

gui.XWindow = XWindow

module.exports = gui