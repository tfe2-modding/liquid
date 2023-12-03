const fs = require("fs")

Liquid.loadTXT = function(p) {
    const file = fs.readFileSync(p, "utf8")
    return file
}

Liquid.loadCSS = function(p) {
    const file = Liquid.loadTXT(p)
    const el = tfe2.document.head.appendChild(tfe2.document.createElement("style"))
    el.innerText = file
    return el
}

Liquid.loadJS = function(p) {
    const file = Liquid.loadTXT(p)
    const el = tfe2.document.head.appendChild(tfe2.document.createElement("script"))
    el.innerText = file
    return el
}