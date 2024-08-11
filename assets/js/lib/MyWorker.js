
    class MyWorker{
        constructor(options) {
            switch(options.mode){
                case 'share':
                    this.work = new SharedWorker(options.url,{type:options.type,name:options.name});
                    this.work.port.start();
                    this.port = this.work.port;
                break;
                case 'service':
                    this.ready = new Promise(back=>{
                        const sw = navigator.serviceWorker;
                        if(sw){
                            sw.addEventListener('message',event=>this.onMessage(event));
                            sw.addEventListener('messageerror',event=>this.onError(event));
                            if(options.url){
                                sw.register(options.url).then(()=>this.serviceStart(back));
                            }else{
                                this.serviceStart(back);
                            }
                        }else{
                            back(true);
                        }
                    });
                break;
                default:
                    this.port = new Worker(options.url,{type:options.type,name:options.name});
                break;
            }
            if(this.port){
                if (options.install === true) {
                    this.ready = this.addFeedBack('complete');
                }
                this.port.addEventListener('message',event=>this.onMessage(event));
                this.port.addEventListener('error',event=>this.onError(event));
            }
        }
        async serviceStart(back){
            const sw = navigator.serviceWorker;
            const reg = await sw.ready;
            this.port = reg.active;
            this.port.onerror = event=>this.onError(event);
            await this.setMethod();
            back(true);
        }
        methods = new Map();
        feedback = new Map();
        has(name,method){
            return this[name].has(method);
        }
        isMethod(method) {
            return this.has('methods',method);
        }
        isFeedback(method) {
            return this.has('feedback',method);
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
        uuid() {
            if (self.crypto && self.crypto.randomUUID) {
                return self.crypto.randomUUID();
            }
            return btoa(performance.now() + Math.random());
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
        getMessage(result, transf, id) {
            if (typeof result == 'string') result = {
                method: result
            };
            id = id ? id : this.uuid();
            result.id = id;
            this.postMessage(result, transf);
            return this.addFeedBack(id);
        }
        postMethod(method, result, transf) {
            return this.getMessage({
                method,
                result
            }, transf);
        }
        async setMethod() {
            const methods = await this.postMethod('resultMethod');
            methods && methods.forEach(method => {
                if (method == 'constructor') return;
                this.methods.set(
                    method,
                    new Function('return this.postMethod("' + method + '",Array.from(arguments))')
                );
            });
        }
        async onMessage(event) {
            const data = event.data;
            const port = event.source || event.target;
            if (data && data.constructor === Object) {
                if (this.isMethod(data.method)) {
                    return this.callMethod(data.method, data, port);
                }
                if (this.isFeedback(data.id)) {
                    return this.callFeedback(data.id, data, port);
                }
                if (data.method == 'zip_password') {
                    let password = data.result || '';
                    if (self.prompt) {
                        password = self.prompt('输入密码', password);
                    } else {
                        password = self.postMessage ? await this.postMethod('zip_password', password) : false;
                    }
                    return port.postMessage({
                        id: data.id,
                        result: password === null ? false : password
                    });
                }
            }
            if (data === 'complete' && this.isFeedback(data)) {
                return this.callFeedback(data, {
                    id: data,
                    result: true
                },port);
            }
            if (this.callMessage instanceof Function) return this.callMessage(data, port);
        }
        onError(event){
            if (self.alert) alert(event.message);
            else if(self.postMessage) self.postMessage({method:'error',result:event.message});
            console.log(event);
        }
        terminate(){
            if(this.port.terminate)this.port.terminate();
            if(this.port.close)this.port.close();
        }
        close(){
            return this.terminate();
        }
        async postMessage(message,transf){
            if(this.port) return this.port.postMessage(message,transf);
            else {
                if(await this.ready){
                    return this.postMessage(message,transf);
                }
            }
        }
    }
    Object.defineProperty(self, 'MyWorker', {
        get: () => MyWorker
    });