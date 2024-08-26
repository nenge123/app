class WorkerService extends WorkerApp {
    npmcdn = "https://unpkg.com/";
    name = 'worker-service';
    cache_files = 'cache-files';
    cache_cdn = 'cdn-files';
    no_cache = { 'Cache-Control': 'no-cache,max-age=0,must-revalidate' };
    onRun() {
        self.addEventListener('fetch', e => this.onFetch(e));
        self.addEventListener('install', e => e.waitUntil(this.onInstall(e)));
        self.addEventListener('activate', e => e.waitUntil(this.onInstall(e)));
        self.addEventListener('message', e => this.onMessage(e));
        self.addEventListener('messageerror', e => console.log(e.message));
        self.addEventListener('error', e => console.log(e.message));
        this.methods.set('fetch_cross', function (event) {
            const request = event.request;
            if (request.method != 'GET') return;
            const urlinfo = new URL(request.url);
            switch (true) {
                case urlinfo.hostname == "registry.npmmirror.com":
                case urlinfo.hostname == "unpkg.com":
                case urlinfo.hostname == 'lishijieacg.co':
                case urlinfo.hostname == 'www.ikdmjx.com':
                case urlinfo.origin == this.npmcdn:
                    return event.respondWith(this.MatchCache(request, this.cache_cdn));
                    break;
                default:
                    return this.callMethod('fetch_cross_other', event, urlinfo.hostname, urlinfo.origin) || false;
                    break;
            }
        })
    }
    async onInstall(event) {
        console.log(event.type);
        await this.callMethod(event.type);
        return self.skipWaiting();
    }
    onFetch(event) {
        let type = event.type;
        if (event.request.url.indexOf(location.origin) !== -1) {
            type = 'fetch_orgin';
        } else {
            type = 'fetch_cross';
        }
        return this.callMethod(type, event) || false;
    }
    async getClient() {
        return await clients.matchAll({ includeUncontrolled: true });
    }
    async postAll(str) {
        Array.from(await this.getClient(), source => this.postMsg(str, source));
    }
    async postMsg(str, source) {
        return source.postMessage(str);
    }
    readModified(response) {
        return response.headers.get('last-modified');
    }
    formatTime(response) {
        return Date.parse(response.headers.get('date'));
    }
    async openCache(cachename) {
        return cachename instanceof Cache ? cachename : await caches.open(cachename);
    }
    async MatchCache(request, cachename) {
        const isorigin = cachename === this.cache_files;
        if (request instanceof Request) {
            if (!isorigin && request.mode == 'no-cors') {
                cachename += '-include';
            }
        }
        const cache = await caches.open(cachename);
        let response = await cache.match(request);
        if (!response) {
            if (isorigin) {
                response = await fetch(request, { headers: this.no_cache });
                if (response && response.status == 200) {
                    cache.put(request, response.clone());
                }
            } else {
                response = await fetch(request);
                if (response) {
                    const status = response.status;
                    switch (true) {
                        case status === 200:
                        case status === 0 && response.type == 'cors':
                        case status === 0 && response.type == 'opaque':
                            cache.put(request, response.clone());
                            break;
                    }
                }
            }
        }
        return response || new Response(undefined, { status: 404, statusText: 'not found' });
    }
}
Object.defineProperties(self, { WorkerService: { get: () => WorkerService } });