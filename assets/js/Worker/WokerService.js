class WorkerService{
    npmcdn   = "https://registry.npmmirror.com/";
    name     = 'worker-service';
    table    = 'files';
    feedback = new Map;
    methods  = new Map;
    constructor(){
        this.root = this.getRoot()+'assets/js/';
        self.addEventListener('fetch',e=>this.onFetch(e));
        self.addEventListener('install',e=>e.waitUntil(this.onInstall(e)));
        self.addEventListener('activate',e=>e.waitUntil(this.onInstall(e)));
        self.addEventListener('message',e=>this.onMessage(e));
    }
    getRoot(){
        return self.location.href.split('/').slice(0, -2).join('/') + '/';
    }
    isMethod(method){
        return this.methods&&this.methods.has(method);
    }
    callMethod(method,...arg){
        if(this.isMethod(method)){
            return this.methods.get(method).apply(this,arg);
        }
    }
    isFeedback(method){
        return this.feedback&&this.feedback.has(method);
    }
    callFeedback(method,...arg){
        if(this.isFeedback(method)){
            return this.feedback.get(method).apply(this,arg);
        }
    }
    async onInstall(event){
        console.log(event.type);
        await this.callMethod(event.type);
        return self.skipWaiting();
    }
    onFetch(event){
        let type = event.type;
        if(this.isOrigin(event.request.url)){
            type = 'fetch_orgin';
        }else{
            type = 'fetch_cross';
        }
        return this.callMethod(type,event)||false;
    }
    async onMessage(event){
        const data = event.data;
        const source = event.source||event.target;
        if (data && data.constructor === Object) {
            if(this.onBack(data,source)) return;
        }
        console.log(data,source);
    }
    onBack(data,port){
        const workerId = data.workerId;
        const method = data.method;
        if(this.isFeedback(workerId)){
            this.callFeedback(workerId,data,port);
            this.feedback.delete(workerId);
            return true;
        }
        if(this.isMethod(method)){
            this.callMethod(method,data,port);
            return true;
        }
    }
    addFeedback(id,back,error){
        this.feedback.set(id,function(data){
            if(data.error&&error instanceof Function)return error(data.error);
            if(back instanceof Function) return back(data.result);
        });
    }
    async getFeedback(port,result,transf){
        return new Promise((back,error)=>{
            const workerId = this.uuid();
            this.addFeedback(workerId,back,error);
            result.workerId = workerId;
            port.postMessage(result,transf);
        });
    }
    async getClient(){
        return await clients.matchAll({includeUncontrolled:true});   
    }
    async postAll(str){
        Array.from(await this.getClient(),source=>this.postMsg(str,source));
    }
    async postMsg(str,source){
        return source.postMessage(str);
    }
    getModified(response){
        return response.headers.get('last-modified');
    }
    getResponseDate(response){
        return Date.parse(response.headers.get('date'));
    }
    async openCache(cachename){
        return cachename instanceof Cache ? cachename:await caches.open(cachename);
    }
    async MatchCache(request,cache,update){
        let response = await cache.match(request);
        if(self.navigator.onLine&&update&&response){
            let response2 = await fetch(request,{method:'HEAD',cache:'no-cache'});
            if(response2){
                if(response2.headers.get('last-modified')!=response.headers.get('last-modified')){
                    response = null;
                }
            }
        }
        return response;
    }
    isOrigin(url){
        return url.indexOf(location.origin) !== -1
    }
    /**
     * 
     * @param {Request|String} request 
     * @param {Cache|String} cachename 
     * @param {null|boolean} update 
     * @returns 
     */
    async getResponse(request,cachename,update){
        let cache = await this.openCache(cachename);
        let response = await this.MatchCache(request,cache,update);
        if(!response){
            let cachemode = update ? 'no-cache':undefined;
            response = await fetch(request,{cache:cachemode});
            if(response){
                if(response.status==200||(response.type=='opaque'&&!response.statusText)){
                    cache.put(request,response.clone());
                }
            }
        }
        return response;
    }
    async open(version) {
        if (this.idb instanceof Promise) return await this.idb;
        if (!this.idb) {
            this.idb = new Promise(resolve => {
                let req = indexedDB.open(this.name, version);
                req.addEventListener("upgradeneeded", e => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(this.table)) {
                        const store = db.createObjectStore(this.table);
                        store.createIndex('timestamp', 'timestamp', { "unique": false });
                    }
                }, { once: true });
                req.addEventListener('success', async e => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(this.table)) {
                        let version = db.version += 1;
                        db.close();
                        return resolve(await this.open(version));
                    }
                    return resolve(db);
                }, { once: true });
            });
        }
        return this.idb;
    }
    async ObjectStore(ReadMode) {
        const db = await this.open();
        const transaction = db.transaction([this.table], ReadMode ? undefined : "readwrite");
        return transaction.objectStore(this.table);
    }
    readOnly() {
        return this.ObjectStore(!0);
    }
    readWrite() {
        return this.ObjectStore();
    }
    async getItem(name) {
        let request = (await this.readOnly()).get(name);
        return new Promise(resolve=> request.addEventListener('success', (e) => {
            resolve(e.target.result && e.target.result.contents || e.target.result);
        }));
    }
    async setItem(name, contents) {
        let request = (await this.readWrite()).put({ contents, timestamp: new Date }, name);
        return new Promise(resolve=> request.addEventListener('success', (e) => {
            resolve(e.target.result);
        }));
    }
}