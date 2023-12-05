require("./loaders")
Liquid.extend = require("./extend")
Liquid.hook = require("./hook")

Liquid.extend.init(tfe2.Game.prototype, "createMainMenu")
Liquid.extend.push(tfe2.Game.prototype.createMainMenu, function() {
    tfe2.game.state.addBottomButton("Liquid Mods",()=>{
        const content = []
        for (const [modid, mod] of Object.entries(Liquid.mods)) {
            content.push({
                type: "button",
                fillWidth: true,
                onClick() {
                    const content = [
                        {
                            type: "text",
                            text: "ID: "+modid,
                            font: "Arial"
                        }
                    ]
                    if (mod.author) {
                        content.push({
                            type: "text",
                            text: "Author: "+mod.author,
                            font: "Arial"
                        })
                    }
                    content.push({
                        type: "text",
                        text: "Version: "+mod.version+"\n",
                        font: "Arial"
                    })
                    if (mod.description) {
                        content.push({
                            type: "text",
                            text: mod.description+"\n",
                            font: "Arial"
                        })
                    }
                    content.push({
                        type: "checkbox",
                        text: "Enabled",
                        isChecked() {
                            return true
                        },
                        onClick() {
                            
                        },
                    })
                    Liquid._createWindow(mod.name, content, [
                        {
                            text: "Settings",
                            action: ()=>alert(3)
                        },
                        {
                            text: "Files",
                            action: ()=>alert(3)
                        },
                    ],)
                },
                text: mod.name,
                font: "Arial"
            })
        }
        Liquid._createWindow("Liquid Mods", content)
    },null,"Arial");
    tfe2.game.state.positionUIElements()
})