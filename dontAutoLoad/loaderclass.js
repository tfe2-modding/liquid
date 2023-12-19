module.exports = class {
    constructor(promises) {
        this.toLoad = promises.length
        this.loaded = 0
        this.onThen = []
        this.onNext = []
        this.values = new Array(this.toLoad)
        let resolve
        this.promise = new Promise(res=>{
            resolve = res
        })
        for (let i = 0; i < this.toLoad; i++) {
            const index = i
            promises[index].then(res => {
                this.loaded++
                this.values[index] = res
                for (let i = 0; i < this.onNext.length; i++) {
                    this.onNext[i](res)
                }
                if (this.loaded == this.toLoad) { // we are done
                    for (let i = 0; i < this.onThen.length; i++) {
                        this.onThen[i](this.values)
                        resolve(this.values)
                    }
                }
            })
        }
    }
    then(func) {
        this.onThen.push(func)
        return this
    }
    next(func) {
        this.onNext.push(func)
        return this
    }
}