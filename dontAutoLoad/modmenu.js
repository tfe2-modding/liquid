Liquid.extend.init(tfe2.gui_TextElement.prototype, "setTextWithoutSizeUpdate")
Liquid.extend.push(tfe2.gui_TextElement.prototype.setTextWithoutSizeUpdate, function() {
    let bitmapContainer = this.get_textContainer()
    let text = bitmapContainer.children[0].text
    if (text.startsWith("[gray]")) {
        text = text.replace("[gray]","")
        bitmapContainer.set_tint(7829367)
    }
    bitmapContainer.set_text(text)
})

function showDirectory(p) {
    require('child_process').exec(`start "" "${p}"`)
}

Liquid.extend.init(tfe2.Game.prototype, "createMainMenu")
Liquid.extend.push(tfe2.Game.prototype.createMainMenu, function() {
    tfe2.game.state.addBottomButton("Liquid Mods",()=>{
        const content = ["Select a mod below for more info and configuration", {type:"space"}]
        for (const [modid, mod] of Object.entries(Liquid.mods)) {
            content.push({
                type: "button",
                fillWidth: true,
                onClick() {
                    const content = [
                        {
                            type: "text",
                            text: "[gray]ID: "+modid,
                            font: "Arial"
                        }
                    ]
                    if (mod.liquid) {
                        content.push({
                            type: "text",
                            text: "[gray]Version: "+mod.version,
                            font: "Arial"
                        })
                    }
                    if (mod.author) {
                        content.push({
                            type: "text",
                            text: "Author: "+mod.author,
                            font: "Arial"
                        })
                    }
                    if (mod.liquid) content.push({type:"space"})
                    if (mod.description) {
                        content.push({
                            type: "text",
                            text: mod.description,
                            font: "Arial"
                        }, {type:"space"})
                    }
                    if (mod.liquid) content.push({
                        type: "checkbox",
                        text: "Enabled",
                        isChecked() {
                            return true
                        },
                        onClick() {
                            
                        },
                    })
                    const bottombuttons = []
                    if (mod.settings) bottombuttons.push({
                        text: "Settings",
                        action: function() {
                            const settingscontent = [
                                
                            ]
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
                                                v.value = Math.round(level*(v.max-v.min)/v.step)*v.step+v.min
                                            } else {
                                                v.value = level*(v.max-v.min)+v.min
                                            }
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
                                            Liquid._createWindow(v.label, v.options.map(e=>{
                                                return {
                                                    type: "checkbox",
                                                    text: e,
                                                    isChecked() {
                                                        return e == v.value
                                                    },
                                                    onClick() {
                                                        v.value = e
                                                        tfe2.game.state.gui.goPreviousWindow()
                                                    },
                                                    noSpace: true,
                                                }
                                            }).concat([{type: "space"}]), null, "Back")
                                        }
                                    })
                                }
                            }
                            Liquid._createWindow(mod.name+" Settings", settingscontent, null, "Back")
                        }
                    })
                    bottombuttons.push({
                        text: "Files",
                        action: function() {
                            showDirectory(mod.path)
                        }
                    })
                    Liquid._createWindow(mod.name, content, bottombuttons, "Back")
                },
                text: mod.name,
                font: "Arial"
            })
        }
        Liquid._createWindow("Liquid Mods", content, [
            {
                text: "Mod Files",
                action: function() {
                    showDirectory(tfe2._internalModHelpers.path)
                }
            },
            {
                text: "Game Files",
                action: function() {
                    const path = require("path")
                    showDirectory(global.__dirname)
                }
            },
        ])
    },null,"Arial");
    tfe2.game.state.positionUIElements()
})