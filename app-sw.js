importScripts('./assets/js/Worker/WokerService.js');
const myWorker = new WorkerService();
myWorker.downurl = '';
myWorker.methods = new Map(
    Object.entries({
        fetch_cross(event){
            const request = event.request;
            if(request.method!='GET') return;
            const url = request.url
            switch(true){
                case /\/registry\.npmmirror\.com\//.test(url):
                case /\/unpkg\.com\//.test(url):
                    return event.respondWith(this.getResponse(request,'cdn-files',false));
                break;
            }
        },
        fetch_orgin(event){
            const request = event.request;
            let response;
            if(request.method=='POST'){
                if(request.headers.get('content-type') == 'text/plain'){
                    response = this.callMethod('downcache',request);
                }
            }else if(request.method=='GET'){
                const url = request.url.replace(location.origin,'').split('#')[0];
                switch(true){
                    case /^\/assets\/\images\//.test(url):
                    case /^\/assets\/vendor\//.test(url):
                        response = this.getResponse(request,'cache-files',false);
                    break;
                    case /^\/assets\/css/.test(url):
                    case /^\/assets\/js/.test(url):
                    case request.headers.get('ajax-fetch')!=null:
                        response = this.getResponse(request,'cache-files',true);
                    break;
                    case url==''||url=='/'||url=='/index.html':
                        response = this.getResponse(location.origin+'/assets/template/template-index.htm','cache-files',true);
                    break;
                }
            }
            return response&&event.respondWith(response)||false;
        },
        adddownurl(data){
            const url = data.url;
            if(url){
                this.downurl = url;
            }
        },
        async downcache(request){
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
        }

    })
);
