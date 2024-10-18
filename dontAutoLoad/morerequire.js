function requireExt(ext, func) {
    require.extensions["."+ext] = func
}

const fs = require("fs")
const path = require("path")

const domparser = new DOMParser

requireExt("txt", function(module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8')
})

requireExt("xml", function(module, filename) {
    const doc = domparser.parseFromString(fs.readFileSync(filename, 'utf8'), "application/xml")
    const parsererror = doc.querySelector("parsererror")
    if (parsererror) throw parsererror.innerText+"\n\t in "+filename
    module.exports = doc
})

requireExt("xhtml", function(module, filename) {
    const doc = domparser.parseFromString(fs.readFileSync(filename, 'utf8'), "application/xhtml+xml")
    const parsererror = doc.querySelector("parsererror")
    if (parsererror) throw parsererror.innerText+"\n\t in "+filename
    module.exports = doc
})

requireExt("html", function(module, filename) {
    module.exports = domparser.parseFromString(fs.readFileSync(filename, 'utf8'), "text/html")
})