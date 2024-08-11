importScripts('./assets/js/lib/WorkerApp.js');
importScripts('./assets/js/lib/WokerService.js');
const myWorker = new WorkerService();
Object.entries({
    fetch_orgin(event){
        const request = event.request;
        let response;
        if(request.method=='POST'){
            if(request.headers.get('content-type') == 'text/plain'){
                response = this.callMethod('down_cache',request);
            }
        }else if(request.method=='GET'){
            const url = request.url.replace(location.origin,'').split('#')[0];
            switch(true){
                case url.indexOf('/assets/') !==-1:
                case request.headers.get('ajax-fetch')!=null:
                    response = this.getResponse(request,this.cache_files,false);
                    //if(location.hostname == 'local.nenge.net'){
                    //    response = fetch(request,{cache:'no-cache'});
                    //}else{
                    //    response = this.getResponse(request,this.cache_files,false);
                    //}
                break;
                case url==''||url=='/'||url=='/index.html':
                    response = this.getResponse(location.origin+'/assets/template/template-index.htm',this.cache_files,true);
                break;
            }
        }
        return response&&event.respondWith(response)||false;
    },
    async down_cache(request){
        const response = request.clone();
        const text = new URLSearchParams((await response.text()).replace(/[\r\n]+/,'&'));
        const cachename = text.get('cache_name');
        if(cachename){
            if(await caches.has(cachename)){
                const cache = await caches.open(cachename);
                const response =  await cache.match(request.url);
                console.log(request,cachename);
                if(response){
                    return response;
                }
            }
            return new Response(undefined,{status:404});
        }
        return fetch(request);
    },
    async refresh(data,port){
        if(self.navigator.onLine){
            const cache = await caches.open(this.cache_files);
            await Promise.all(Array.from(await cache.matchAll(),async response=>{
                const url = response.url.replace(location.origin,'').split('#')[0];
                switch(true){
                    case url.indexOf('/assets/css/') !==-1:
                    case url.indexOf('/assets/template/') !==-1:
                    case url.indexOf('/assets/js/')  !==-1:{
                        const modified = response.headers.get("last-modified");
                        const response2 = await fetch(response.url,{method:'HEAD',cache:'no-cache'});
                        if(response2){
                            const modified2 = response2.headers.get("last-modified");
                            if(modified!=modified2){
                                const response3 = await fetch(response.url,{cache:'no-cache'});
                                return await cache.put(response.url,response3);
                            }
                        }else{
                            return await cache.delete(response.url);
                        }
                        break;
                    }
                }
            }));
        }
        return true;
    },
    resultMethod(data,port){
        return Array.from(myWorker.methods.keys()).filter(v=>v.indexOf('_')===-1);
    },
    test(){
        throw '777';
    }
}).forEach(entry=>{
    myWorker.methods.set(entry[0],entry[1]);
})
