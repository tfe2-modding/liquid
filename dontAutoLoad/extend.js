const extend = {}

Object.defineProperty(extend, "symbol", {
    enumerable: false,
    writable: false,
    value: Symbol(),
})

let isprevented = false

extend.create = function(orig) {
    try {
        if (orig[extend.symbol]) return orig
        const func = function(...args) {
            isprevented = false
            const funcs = func[extend.symbol]
            let ret
            for (let i = 0; i < funcs.length; i++) {
                let res = funcs[i].apply(this, args)
                if (funcs[i] == orig) ret = res
                if (isprevented) {
                    isprevented = false
                    break
                }
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
    } catch(e) {
        throw e
    }
}

extend.init = function(obj, funcname) {
    return (obj[funcname] = extend.create(obj[funcname]))[extend.symbol]
}

extend.get = function(func) {
    return func[extend.symbol]
}

extend.prevent = function() {
    isprevented = true
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