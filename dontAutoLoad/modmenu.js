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
Liquid.extend.init(tfe2.Game.prototype, "update")
let ishovered = false
let washovered = false
Liquid.extend.push(tfe2.Game.prototype.update, function() {
    washovered = ishovered
    ishovered = false
})

function showDirectory(p) {
    require('child_process').exec(`start "" "${p}"`)
}

Liquid.extend.init(tfe2.Game.prototype, "createMainMenu")
Liquid.extend.push(tfe2.Game.prototype.createMainMenu, function() {
    let animating = 0
    const modMenuButton = tfe2.game.state.addBottomButton("Liquid Mods",()=>{
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
    },null,"Arial",async function() {
        ishovered = true
        if (!(ishovered && ishovered != washovered) || animating) return
        const letters = getLettersInterface(modMenuButton)
        async function forAll(arr, cb, delay=100, stopcondition=()=>{}) {
            for (let i = 0; i < arr.length; i++) {
                cb(arr[i], i, arr)
                await new Promise(resolve=>{
                    setTimeout(resolve, delay)
                })
                if (stopcondition()) break
            }
        }
        animating++
        await forAll(letters, (e, i, arr) => {
            let yv = -70
            let time = 0
            let startY = e.absoluteY
            let speed = 1
            const interval = setInterval(()=>{
                e.absoluteY += yv/(200/tfe2.game.scaling*speed)
                time ++
                if (e.absoluteY > startY) {
                    yv -= 1/speed
                }
                if (e.absoluteY < startY) {
                    yv += 1/speed
                }
                if (time == 140) {
                    speed = 8
                    yv /= 2
                }
                if (!washovered) {
                    clearInterval(interval)
                    e.absoluteY = startY
                }
            })
        }, 35, ()=>!washovered)
        animating--
    });
    tfe2.game.state.positionUIElements()
    modMenuButton.set_tint(16762111)
    modMenuButton.children[0].children[0].blendMode = 1
    console.log(modMenuButton)
    function getLettersInterface(bitmapText) {
        const vertexData = bitmapText.children[0].children[0].vertexData
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
            Object.defineProperty(letter, "absoluteX", {
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
            Object.defineProperty(letter, "absoluteY", {
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
            interface.push(letter)
        }
        return interface
    }
    setTimeout(()=>{
        /*
        let vy
        let vx
        let origVertexData = [...modMenuButton.children[0].children[0].vertexData]
        console.log(origVertexData)
        setInterval(()=>modMenuButton.children[0].children[0].vertexData.forEach((e,i,arr)=>{
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