const extend = {}

Object.defineProperty(extend, "symbol", {
    enumerable: false,
    writable: false,
    value: Symbol(),
})

extend.create = function(orig) {
    if (orig[extend.symbol]) return orig
    const func = function(...args) {
        const funcs = func[extend.symbol]
        for (let i = 0; i < funcs.length; i++) {
            funcs[i].apply(this, ...args)
        }
    }
    Object.defineProperty(func, extend.symbol, {
        enumerable: false,
        writable: false,
        value: [orig]
    })
    Object.assign(func.prototype, orig.prototype)
    return func
}

extend.init = function(obj, funcname) {
    return (obj[funcname] = extend.create(obj[funcname]))[extend.symbol]
}

extend.get = function(func) {
    return func[extend.symbol]
}

const arrkeys = Object.getOwnPropertyNames(Array.prototype)
for (let i = 0; i < arrkeys.length; i++) {
    if (typeof Array.prototype[arrkeys[i]] === "function") {
        extend[arrkeys[i]] = function(func, ...args) {
            Array.prototype[arrkeys[i]].apply(func[extend.symbol], args)
        }
    }
}

module.exports = extend