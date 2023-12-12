const fs = require("fs")
const path = require("path")

const extend = require("./extend")
const { mods, modSettings, nonLiquidMods } = require("./modloader")

const MODDIR = path.resolve(__dirname.replace("dontAutoLoad", ""))

function rgb(r, g, b) {
    return r*65536+g*256+b
}

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

function createWindow(title, content, bottomButtons=null, closeText="Close", closeAction=null) {
    with (tfe2) { // i know this is bad practice just excuse it for now
        let gui = game.state.gui
        gui.createWindow()
        gui.addWindowToStack(()=>{
            createWindow(title, content, bottomButtons, closeText, closeAction)
        })
        if (title) gui.windowAddTitleText(title)
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
}

let NEEDSRESTART = false
extend.init(tfe2.gui_TextElement.prototype, "setTextWithoutSizeUpdate")
extend.push(tfe2.gui_TextElement.prototype.setTextWithoutSizeUpdate, function() {
    let bitmapContainer = this.get_textContainer()
    let text = bitmapContainer.internalText.text
    if (text.startsWith("[gray]")) {
        text = text.replace("[gray]","")
        bitmapContainer.alpha = 0.5
    }
    bitmapContainer.set_text(text)
})

extend.init(tfe2.Game.prototype, "update")
extend.init(tfe2.MainMenu.prototype, "positionUIElements")

let ishovered = false
let washovered = false

extend.push(tfe2.Game.prototype.update, function() {
    washovered = ishovered
    ishovered = false
})

let modMenuButton
const modButtonPadding = 5

extend.push(tfe2.MainMenu.prototype.positionUIElements, function() {
    if (modMenuButton) {
        modMenuButton.x = game.rect.width - modMenuButton.width - 15 - modButtonPadding
        modMenuButton.y = game.rect.height - modMenuButton.height - 65/game.scaling - 15 - modButtonPadding
        const letters = getLettersInterface(modMenuButton)
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i]
            delete letter.yv
            delete letter.startY
            if (letter.interval) clearInterval(letters[i].interval)
            delete letter.interval
        }
    }
})

function showDirectory(p) {
    require('child_process').exec(`start "" "${p}"`)
}

function addMainMenuButton(text,onClick,showOnRight,font,onHover) {
    if(font == null) {
        font = "Arial16";
    }
    if(showOnRight == null) {
        showOnRight = false;
    }
    const menu = tfe2.game.state
    var bottomButton = new tfe2.graphics_BitmapText(text,{ font : showOnRight ? "Arial" : font, tint : showOnRight ? 13684944 : 16777215});
    menu.bottomButtonStage.addChild(bottomButton);
    menu.bottomButtons.push(bottomButton);
    menu.bottomButtonOnClick.set(bottomButton,onClick);
    menu.bottomButtonOnHover.set(bottomButton,onHover);
    menu.bottomButtonOnRight.set(bottomButton,showOnRight);
    menu.bottomButtonAttract.set(bottomButton,false);
    return bottomButton;
}
const disabled_mods = readJSON("disabled_mods.json", {})
extend.init(tfe2.Game.prototype, "createMainMenu")
extend.push(tfe2.Game.prototype.createMainMenu, function() {
    let animating = 0
    modMenuButton = addMainMenuButton("Liquid Mods",()=>{
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
        content.push("Select a mod below for more info and configuration", {type:"space"})
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
            const settings = modSettings[modId]
            content.push({
                type: "button",
                fillWidth: true,
                noSpace: true,
                onClick() {
                    const content = [
                        {
                            type: "text",
                            text: "[gray]ID: "+modId,
                            font: "Arial"
                        }
                    ]
                    content.push({
                        type: "text",
                        text: "[gray]Version: "+mod.version,
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
                    if (mod.entrypoint) content.push({
                        type: "checkbox",
                        text: "Enabled",
                        isChecked() {
                            return !disabled_mods[modId]
                        },
                        onClick() {
                            need_restart()
                            if (disabled_mods[modId]) delete disabled_mods[modId]
                            else disabled_mods[modId] = true
                            writeJSON("disabled_mods.json", disabled_mods)
                        },
                    })
                    const bottombuttons = []
                    let saveTimeout
                    function saveSettings(delay=500) {
                        need_restart()
                        clearTimeout(saveTimeout)
                        saveTimeout = setTimeout(()=>{
                            const modSettings = {}
                            for (const [k, v] of Object.entries(mod.settings)) {
                                modSettings[k] = v
                            }
                            writeJSON(modId+".json", modSettings)
                        }, delay)
                    }
                    if (mod.settings) bottombuttons.push({
                        text: "Settings",
                        action: function() {
                            const settingscontent = [
                                
                            ]
                            for (const [k, v] of Object.entries(settings)) {
                                if (v.type == "checkbox") {
                                    settingscontent.push({
                                        type: "checkbox",
                                        text: v.label,
                                        isChecked() {
                                            return v.value
                                        },
                                        onClick() {
                                            v.value = !v.value
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
                                            createWindow(v.label, v.options.map(e=>{
                                                return {
                                                    type: "checkbox",
                                                    text: e,
                                                    isChecked() {
                                                        return e == v.value
                                                    },
                                                    onClick() {
                                                        v.value = e
                                                        tfe2.game.state.gui.goPreviousWindow()
                                                        saveSettings()
                                                    },
                                                    noSpace: true,
                                                }
                                            }).concat([{type: "space"}]), null, "Back")
                                        }
                                    })
                                }
                            }
                            createWindow(mod.name+" Settings", settingscontent, null, "Back")
                        }
                    })
                    bottombuttons.push({
                        text: "Files",
                        action: function() {
                            showDirectory(mod.path)
                        }
                    })
                    createWindow(mod.name, content, bottombuttons, "Back")
                },
                text: mod.name,
                font: "Arial"
            }, {type:"space", size:2})
        }
        if (Object.keys(nonLiquidMods).length > 0) {
            content.push({type:"space"}, "The following mods are not mods Liquid recognizes. Click a mod to view it's files.", {type:"space"})
        }
        for (const [modId, path] of Object.entries(nonLiquidMods)) {
            content.push({
                type: "button",
                fillWidth: true,
                noSpace: true,
                text: "[gray]"+modId,
                onClick() {
                    showDirectory(path)
                },
                isActive() {
                    return true
                }
            }, {type:"space", size:2})
        }
        content.push({type:"space"})
        createWindow("Liquid Mods", content, [
            {
                text: "Mod Files",
                action: function() {
                    showDirectory(tfe2._internalModHelpers.path)
                }
            },
            {
                text: "Game Files",
                action: function() {
                    showDirectory(global.__dirname)
                }
            },
        ])
    },true,"Arial",async function() {
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
            const distance = 12.425
            e.yv = -70 * ((e.y - e.startY)/5 + distance)/distance
            e.yv = Math.max(Math.min(e.yv, 70), -70)
            let speed = 1
            if (e.interval) clearInterval(e.interval)
            e.interval = setInterval(()=>{
                e.y += e.yv/(400/tfe2.game.scaling*speed)
                time ++
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
                if (Math.floor(e.y*tfe2.game.scaling)/tfe2.game.scaling == e.startY && Math.floor(e.yv*tfe2.game.scaling) == 0) {
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
            const distance = Math.abs(tfe2.game.mouse.position.x*tfe2.game.scaling - (letter.x + letter.width/2))
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
    tfe2.game.state.positionUIElements()
    modMenuButton.set_tint(rgb(255, 196, 255))
    modMenuButton.internalText.children[0].blendMode = 1
    modMenuButton.internalText.children[0].transform.position.x = modButtonPadding
    modMenuButton.internalText.children[0].transform.position.y = modButtonPadding
    modMenuButton.internalText._textWidth += modButtonPadding*2
    modMenuButton.internalText._textHeight += modButtonPadding*2
    console.log(modMenuButton)
    setTimeout(()=>{
        /*
        let vy
        let vx
        let origVertexData = [...modMenuButton.internalText.children[0].vertexData]
        console.log(origVertexData)
        setInterval(()=>modMenuButton.internalText.children[0].vertexData.forEach((e,i,arr)=>{
            if (i%8 == 0) {
                vy = (0.5-Math.random())*2
                vx = (0.5-Math.random())*2
            }
            if (i%2 == 0) {
                arr[i] = origVertexData[i] + vx
            }
            if (i%2 == 1) {
                arr[i] = origVertexData[i] + vy
            }
        }))
        */
    }, 100)
})