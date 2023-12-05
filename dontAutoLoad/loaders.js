const fs = require("fs")

const domparser = new DOMParser

Liquid.loadTXT = function(p) {
    const file = fs.readFileSync(global.require.resolve(p), "utf8")
    return file
}

Liquid.loadCSS = function(p) {
    const file = Liquid.loadTXT(p)
    const el = tfe2.document.head.appendChild(tfe2.document.createElement("style"))
    el.innerText = file
    return el
}

Liquid.loadXML = function(p) {
    const file = Liquid.loadTXT(p)
    const xmldocument = domparser.parseFromString(file, "application/xml")
    return xmldocument
}

Liquid.loadHTML = function(p) {
    const file = Liquid.loadTXT(p)
    const xmldocument = domparser.parseFromString(file, "text/html")
    return xmldocument
}

Liquid.loadScript = function(p) {
    const filepath = global.require.resolve(p)
    const el = tfe2.document.head.appendChild(tfe2.document.createElement("script"))
    el.src = filepath
    return el
}