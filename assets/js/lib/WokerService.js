class WorkerService extends WorkerApp{
    npmcdn   = "https://registry.npmmirror.com/";
    name     = 'worker-service';
    cache_files = 'cache-files';
    cache_cdn   = 'cdn-files';
    no_cache = {'Cache-Control':'no-cache,max-age=0,must-revalidate'};
    onRun(){
        self.addEventListener('fetch',e=>this.onFetch(e));
        self.addEventListener('install',e=>e.waitUntil(this.onInstall(e)));
        self.addEventListener('activate',e=>e.waitUntil(this.onInstall(e)));
        self.addEventListener('message',e=>this.onMessage(e));
        self.addEventListener('messageerror',e=>console.log(e.message));
        self.addEventListener('error',e=>console.log(e.message));
        this.methods.set('fetch_cross',function(event){
            const request = event.request;
            if(request.method!='GET') return;
            const urlinfo = new URL(request.url);
            switch(true){
                case urlinfo.hostname == "registry.npmmirror.com":
                case urlinfo.hostname == "unpkg.com":
                case urlinfo.hostname == 'lishijieacg.co':
                case urlinfo.hostname == 'www.ikdmjx.com':
                case urlinfo.origin == this.npmcdn:
                    return event.respondWith(this.getResponse(request,this.cache_cdn,false));
                break;
                default:
                    return this.callMethod('fetch_cross_other',event,urlinfo.hostname,urlinfo.origin)||false;
                break;
            }
        })
    }
    async onInstall(event){
        console.log(event.type);
        await this.callMethod(event.type);
        return self.skipWaiting();
    }
    onFetch(event){
        let type = event.type;
        if(event.request.url.indexOf(location.origin) !== -1){
            type = 'fetch_orgin';
        }else{
            type = 'fetch_cross';
        }
        return this.callMethod(type,event)||false;
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
    readModified(response){
        return response.headers.get('last-modified');
    }
    formatTime(response){
        return Date.parse(response.headers.get('date'));
    }
    async openCache(cachename){
        return cachename instanceof Cache ? cachename:await caches.open(cachename);
    }
    async MatchCache(request,cache,update){
        let response = await cache.match(request);
        if(update&&!response){
            response = await fetch(request,{headers:this.no_cache});
            await cache.put(request,response.clone());
        }
        return response;
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
            response = await fetch(request).catch(e=>new Response(undefined,{status:404,statusText:'not found'}));
            if(response&&(response.status==200||(response.type=='opaque'&&!response.statusText))){
                cache.put(request,response.clone());
            }
        }
        return response;
    }
}
Object.defineProperties(self,{WorkerService:{get:()=>WorkerService}});