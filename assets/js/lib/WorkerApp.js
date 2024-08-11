class WorkerApp {
    feedback = new Map;
    methods = new Map;
    shareports = [];
    cache_name = 'cache-worker';
    constructor(auto) {
        if(auto!==true)this.onRun();
    }
    has(name,method){
        return this[name].has(method);
    }
    isMethod(method) {
        return this.has('methods',method);
    }
    isFeedback(method) {
        return this.has('feedback',method);
    }
    isFunc(method){
        return this.has('functions',method);
    }
    callMap(name,arg){
        arg = Array.from(arg);
        const method = arg.shift();
        if(this.has(name,method)){
            return this[name].get(method).apply(this,arg);
        }
    }
    callMethod() {
        return this.callMap('methods',arguments);
    }
    callFeedback() {
        return this.callMap('feedback',arguments);
    }
    callFunc() {
        return this.callMap('functions',arguments);
    }
    setFeedBack(id, resolve, reject) {
        this.feedback.set(id, function (data) {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.result);
            }
            this.feedback.delete(data.id);
        });
    }
    addFeedBack(id) {
        if (Promise.withResolvers) {
            const {
                promise,
                resolve,
                reject
            } = Promise.withResolvers();
            this.setFeedBack(id, resolve, reject);
            return promise;
        }
        return new Promise((resolve, reject) => this.setFeedBack(id, resolve, reject));
    }
    onRun() {
        if (self.postMessage) {
            self.onmessage = e => this.onMessage(e);
            this.callMethod('_Initialized',e=>this.callFunc('onComplete',self));
        } else {
            self.addEventListener('connect',e => this.callFunc('sharePort', e));
        }
    }
    postMethod(port, result, method) {
        return this.getMessage(port, { result, method });
    }
    getMessage(port,result, transf, id) {
        if (typeof result == 'string') result = {method: result};
        id = id ? id : this.callFunc('uuid');
        result.id = id;
        port.postMessage(result, transf);
        return this.addFeedBack(id);
    }
    onMessage(e) {
        const data = e.data;
        const port = e.source || e.target;
        if (data && data.constructor === Object) {    
            const method = data.method;        
            if (this.isMethod(method)) {
                const id = data.id;
                const result = this.callMethod(method, data, port);
                if(id){
                    if(result instanceof Promise){
                        return result.then(re=>this.onResult(port,re,id));
                    }
                    this.onResult(port,result,id);
                }
                return;
            }
            if (this.isFeedback(data.id)) {
                return this.callFeedback(data.id, data, port);
            }
        }
        if (this.callMessage instanceof Function) return this.callMessage(data, port);
    }
    onResult(port,result,id){
        if (result !== undefined) {
            const transf = [];
            if (result.byteLength) {
                transf.push(result.buffer || result);
            }
            port.postMessage({ id, result }, transf);
        }
    }
    async cache_write(name, contents, mime, cachename) {
        return await this.callFunc('cache_write', name, contents, mime, cachename);
    }
    async cache_read(name, type, cachename) {
        return await this.callFunc('cache_read', name, type, cachename);
    }
    async cache_has(name, cachename) {
        return await this.callFunc('cache_has', name, cachename);
    }
    functions = new Map(Object.entries({
        async cache_write(name, contents, mime, cachename) {
            let type;
            switch (mime) {
                case 'html':
                case 'text':
                case 'javascript':
                    type = 'text/' + mime;
                    break;
                case 'png':
                case 'webp':
                    type = 'image/' + mime;
                    break;
                case 'sqlite3':
                    type = 'application/vnd.' + mime;
                    break;
                default:
                    type = mime && mime.split('/').length > 1 ? mime : 'application/octet-stream';
                    break;
            }
            return this.callFunc('cache_put', name, new File([contents], name, { type }), cachename);
        },
        async cache_read(name, type, cachename) {
            let response = await this.callFunc('cache_response', name, cachename);
            if (response instanceof Response) {
                switch (type) {
                    case 'text':
                        return response.text();
                        break;
                    case 'json':
                        return response.json();
                        break;
                    case 'blob':
                        return response.blob();
                        break;
                    case 'buffer':
                        return response.arrayBuffer();
                        break;
                    default:
                        return new Uint8Array(await response.arrayBuffer());
                        break;
                }
            }
            return;
        },
        async cache_has(name, cachename) {
            return await this.callFunc('cache_response', name, cachename) instanceof Response ? true : false;
        },
        async cache_response(name, cachename) {
            const cache = await this.callFunc('cache_open', cachename);
            return cache && cache.match(location.origin + '/' + name);
        },
        async cache_remove(name, cachename) {
            const cache = await this.callFunc('cache_open', cachename);
            return cache ? cache.delete(location.origin + '/' + name) : false;
        },
        async cache_open(cachename, write) {
            const cacheName = cachename || this.cache_name;
            if (write || await caches.has(cacheName)) {
                return caches.open(cacheName);
            }
        },
        async cache_put(name, file, cachename) {
            const cache = await await this.callFunc('cache_open', cachename, !0);
            return await cache.put(
                location.origin + '/' + name,
                new Response(
                    file,
                    {
                        status: 200,
                        statusText: 'ok',
                        headers: {
                            'Content-Length': file.size,
                            'content-type': file.type,
                            'date':new Date().toGMTString(),
                            'last-modified':new Date().toGMTString(),
                        }
                    }
                )
            ),true;
        },
        uuid() {
            return self.crypto&&self.crypto.randomUUID&&self.crypto.randomUUID()||btoa(performance.now()+Math.random());
        },
        async sharePort(e, fn) {
            e.source.onmessage = e => this.onMessage(e);
            this.callMethod('_Initialized',()=>this.callFunc('onComplete',e.source));
        },
        onComplete(port){
            port.postMessage('complete');
        }
    }));
}
Object.defineProperty(self,'WorkerApp',{get:()=>WorkerApp});