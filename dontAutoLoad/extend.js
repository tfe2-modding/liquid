const extend = {}

Object.defineProperty(extend, "symbol", {
    enumerable: false,
    writable: false,
    value: Symbol(),
})

extend.create = function(orig) {
    if (orig[extend.symbol]) return orig
    console.log(this, new Error)
    const func = function(...args) {
        const funcs = func[extend.symbol]
        let ret
        for (let i = 0; i < funcs.length; i++) {
            let res = funcs[i].apply(this, args)
            if (funcs[i] == orig) ret = res
        }
        return ret
    }
    Object.defineProperty(func, extend.symbol, {
        enumerable: false,
        writable: false,
        value: [orig]
    })
    Object.assign(func.prototype, orig.prototype)
    Object.assign(func.__proto__, orig.__proto__)
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