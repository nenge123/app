export default class MY_VIDEO {
    maxpage = 0;
    filepath = 'my-video.sqlite3';
    tablelist = {
        data: {
            id: 'integer primary key autoincrement',
            title: 'char',
            type: 'char',
            url: 'char',
            img: 'char',
            time: 'char',
        },
        tag: {
            name: 'char',
            num: 'int'
        }
    };
    constructor(savename,elm) {
        if(savename){
            this.savename = savename;
            let playdata = localStorage.getItem(this.savename);
            this.playdata = playdata ? JSON.parse(playdata) : {};
        }
        if(elm){
            this.Elm = elm;
        }
        this.setEvent();
        this.getList();
        this.show();
    }
    getdata() {
        return this.playdata;
    }
    setdata(obj) {
        if (obj) {
            this.playdata = Object.assign(this.playdata, obj);
        } else {
            this.playdata = { page: 1 };
        }
        localStorage.setItem(this.savename, JSON.stringify(this.playdata));
        this.getList(this.playdata);
        return this.playdata;
    }
    hide(){
        this.Elm.classList.remove('show');
        document.querySelector('#start-page').hidden = false;
    }
    show(){
        this.Elm.classList.add('show');
        document.querySelector('#start-page').hidden = true;
    }
    async setEvent() {
        const V = this;
        Array.from(V.Elm.querySelectorAll('[data-method]'), elm => {
            elm.addEventListener('click',async function (event) {
                N.StopEvent(event);
                let method = this.getAttribute('data-method');
                switch (method) {
                    case 'back':
                        V.hide();
                        break;
                    case 'clear':
                        if(window.confirm('清空吗?')){
                            const worker = await V.openSQL();
                            await worker.postMethod('clear2exit');
                            V.setdata();
                        }
                        break;
                    case 'export':
                        N.postdown(V.filepath, { cache_name: 'cache-worker' });
                        break;
                    case 'import':
                        const mode = parseInt(this.getAttribute('data-mode')||0);
                        const keylist = Object.keys(V.tablelist.data);
                        const insertkeys = mode === 1 ? keylist.slice(1) : keylist;
                        N.upload(async files => {
                            V.Elm.querySelector('main').innerHTML = 'loading...';
                            V.Elm.querySelector('footer').innerHTML = 'loading...';
                            V.isActive(!0);
                            for (const file of files) {
                                const worker = await V.openSQL();
                                const mime = await file.slice(0, 2).text();
                                if (mime === 'PK') {
                                    await worker.getMessage({ method: 'importFile', result: await N.unzip(file, 'IAM18'), insertkeys })
                                } else {
                                    await worker.getMessage({ method: 'importFile', result: new Uint8Array(await file.arrayBuffer()), insertkeys });
                                }
                                worker.postMethod('exitworker');
                            }
                            V.setdata();
                        });
                        break;
                    case 'netdisk':
                        V.OpenNetDisk();
                        break;
                    case 'caiji':
                        await V.OpenCaiji();
                        let url = localStorage.getItem('video-caiji-url');
                        if (url) document.querySelector('#video-caiji-url').value = url;
                        break;
                }
            });
        });
    }
    async openSQL() {
        this.isActive(!0);
        const worker = new MyWorker({ url: self.jspath + 'Worker/WorkerAppVideo.js', name: 'SQLite-worker', install: true });
        await worker.ready;
        await worker.postMethod('setInfo', { filepath: this.filepath, tablelist: this.tablelist });
        const status = await worker.postMethod('install', true);
        if (!status) {
            await worker.postMethod('createList');
        }
        await worker.setMethod();
        return worker;
    }
    isActive(bool) {
        this.Elm.classList[bool ? 'add' : 'remove']('noevent');
    }
    async getList(arg) {
        this.Elm.querySelector('main').innerHTML = 'loading...';
        this.Elm.querySelector('footer').innerHTML = 'loading...';
        const worker = await this.openSQL();
        arg = arg ? arg : this.playdata;
        arg.maxlength = 10;
        arg.limit = 30;
        let result = await worker.postMethod('Html2Video', arg);
        this.maxpage = result.maxpage;
        this.Elm.querySelector('main').innerHTML = result.html;
        this.Elm.querySelector('footer').innerHTML = result.pageHtml;
        this.Elm.querySelector('main').scrollTop = 0;
        this.isActive();
    }
    StopEvent(arg) {
        if (arg && arg[0]) {
            arg[0].preventDefault();
            arg[0].stopPropagation();
        }
    }
    SetPage(page, arg) {
        this.StopEvent(arg);
        this.setdata({ page })
    }
    SetSearch(elm, arg) {
        this.StopEvent(arg);
        let post = new FormData(elm);
        this.setdata({ search: post.get('search'), page: 1 });
    }
    ClearSet(elm, arg) {
        this.StopEvent(arg);
        this.setdata();
    }
    SetTag(tag, arg) {
        tag = decodeURI(tag);
        this.StopEvent(arg);
        this.setdata({ tag, page: 1 });
    }
    async DelTag(tag, arg) {
        tag = decodeURI(tag);
        this.StopEvent(arg);
        const worker = await this.openSQL();
        await worker.postMethod('deleteTag', tag);
        this.setdata();
    }
    async exportTag(tag, arg) {
        tag = decodeURI(tag);
        this.StopEvent(arg);
        const worker = await this.openSQL();
        let blob = await worker.postMethod('exportTag', tag);
        const href = URL.createObjectURL(blob);
        N.downURL(href, tag + '.json');
        URL.revokeObjectURL(href);

    }
    async OpenPlay(id, arg, elm) {
        this.StopEvent(arg);
        this.isActive(!0);
        let videoplay = await N.addTemplate('assets/template/video-play.htm', !0);
        videoplay.style.zIndex = '3';
        const worker = await this.openSQL();
        videoplay.querySelector('main').innerHTML = await worker.postMethod('Html2Play', id);
        videoplay.classList.add('show');
        this.Elm.classList.add('hide');
        this.mediaTitle = elm.getAttribute('title');
        this.videoplay = videoplay;
    }
    async OpenNetDisk() {
        this.isActive(!0);
        let elm = await N.addTemplate('assets/template/video-netdisk.htm', !0);
        elm.style.zIndex = '3';
        elm.classList.add('show');
        this.Elm.classList.add('hide');
    }
    async OpenCaiji() {
        this.isActive(!0);
        let elm = await N.addTemplate('assets/template/video-caiji.htm', !0);
        elm.style.zIndex = '3';
        elm.classList.add('show');
        this.Elm.classList.add('hide');
    }
    CloseNetDisk() {
        let elm = document.querySelector('#video-netdisk');
        this.Elm.hidden = false;
        elm.classList.remove('show');
        this.Elm.classList.remove('hide');
        this.getList().then(e=>elm.remove());
    }
    CloseCaiji() {
        let elm = document.querySelector('#video-caiji');
        this.Elm.hidden = false;
        elm.classList.remove('show');
        this.Elm.classList.remove('hide');
        this.getList().then(e=>elm.remove());
    }
    ClosePlay() {
        let video = document.querySelector('#video-media');
        if (video && video.src) {
            video.removeAttribute('src');
            video.load();
        }
        if (this.hls) {
            this.hls.destroy();
            delete this.hls;
        }
        if (this.tsdown) {
            this.tsdown.postMessage('close');
            delete this.tsdown;
        }
        this.Elm.hidden = false;
        this.videoplay.classList.remove('show');
            this.Elm.classList.remove('hide');
        this.getList().then(e=>{
            this.videoplay.remove();
            delete this.videoplay;
        });
    }
    async startCaiji(elm) {
        if (elm.disabled) return;
        elm.disabled = true;
        document.querySelector('#video-end-caiji').disabled = false;
        const worker = await this.openSQL();
        worker.callMessage = function (data, port) {
            console.log(data);
            if (typeof data === 'string') {
                document.querySelector('#video-caiji-log').value += '\n' + data;
            }
        }
        document.querySelector('#video-end-caiji').addEventListener('click', async ()=>{
            await worker.postMethod('save2exit');
            this.CloseCaiji();
        });
        let url = document.querySelector('#video-caiji-url').value;
        let page = document.querySelector('#video-caiji-page').value;
        page = page ? parseInt(page) : 1;
        if (url) localStorage.setItem('video-caiji-url', url);
        alert(await worker.postMethod('caiji', { url, page }));
        this.CloseCaiji();

    }
    async exportID(mediaID) {
        if (mediaID) {
            const worker = await this.openSQL();
            let blob = await worker.postMethod('exportID', mediaID);
            const href = URL.createObjectURL(blob);
            N.downURL(href, this.mediaTitle + '.json');
            URL.revokeObjectURL(href);
        }
    }
    async deleteID(mediaID) {
        if (mediaID) {
            const worker = await this.openSQL();
            await worker.postMethod('deleteID', mediaID);
            this.ClosePlay();
            this.getList(this.playdata);
        }

    }
    async playUrl(elm, arg) {
        this.StopEvent(arg);
        let src = decodeURI(elm.getAttribute('data-src'));
        let video = document.querySelector('#video-media');
        video.hidden = false;
        video.style.background  = 'url('+video.getAttribute('poster')+') center center no-repeat cover';
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.load();
        } else {
            if (!self.Hls) await import('https://unpkg.com/hls.js@1.5.14/dist/hls.min.js');
            if (Hls.isSupported()) {
                if (!this.hls) {
                    this.hls = new self.Hls();
                    this.hls.attachMedia(video);
                }
                this.hls.loadSource(src);
                /*
                const V = this;
                video.onended = function () {
                    if (!V.hls) return;
                    let srclist = Array.from(document.querySelectorAll("#video-play [data-src]"), v => decodeURI(v.getAttribute('data-src')));
                    if (srclist.length <= 1) return;
                    let pos = srclist.indexOf(V.hls.url) + 1;
                    if (pos <= 0 || pos == srclist.length) {
                        pos = 0;
                    }
                    V.hls.loadSource(srclist[0]);
                    V.hls.attachMedia(video);
                    this.play();
                };
                */
                video.load();
            }
        }
        elm.parentNode.parentNode.parentNode.open = false;
    }
    downUrl(elm, arg) {
        const V = this;
        this.StopEvent(arg);
        if (elm.getAttribute('startdown')) return;
        elm.setAttribute('startdown', true);
        const details = document.createElement('details');
        elm.parentNode.appendChild(details);
        const summary = document.createElement('summary');
        summary.innerHTML = '视频片段';
        details.appendChild(summary);
        const showdata = document.createElement('div');
        showdata.innerHTML = '<ins>苹果手机存在异常<br>因此请等待全部内容块下载完毕再点击片段下载!!!<br>正常情况下低于30秒可能为广告!</ins>';
        details.appendChild(showdata);
        details.open = true;
        this.tsdown = new Worker(self.jspath + 'Worker/downTS.js');
        this.tsdown.addEventListener('message', function (event) {
            const data = event.data;
            if (data) {
                if (data.log) {
                    console.log(data.log);
                } else if (data.info) {
                    elm.innerHTML = data.info;
                } else if (data.result) {
                    const href = URL.createObjectURL(data.result);
                    const filename = elm.getAttribute('title') + ' 片段(' + data.PathIndex + ').ts';
                    if (data.close) {
                        return N.downURL(href, filename);
                    }
                    const duration = data.duration ? '约' + (data.duration > 60 ? Math.ceil(data.duration / 6) / 10 + '分' : Math.ceil(data.duration) + '秒') : '';
                    const textname = elm.getAttribute('title') + '-片段(' + data.PathIndex + ')';
                    const p = document.createElement('p');
                    p.innerHTML = `<span>${textname}</span><b>${duration}</b>`;
                    p.setAttribute('data-href', href);
                    p.setAttribute('data-name', filename);
                    p.classList.add('p-block');
                    p.style.margin = '15px 0px';
                    showdata.appendChild(p);
                    p.addEventListener('click', function () {
                        N.downURL(this.getAttribute('data-href'), this.getAttribute('data-name'));
                    });
                    delete data.result;
                } else if (data.close) {
                    elm.removeAttribute('startdown');
                    if (data.ready) elm.innerHTML = data.ready;
                    delete V.tsdown;
                    this.terminate();
                }
            }
        });
        this.tsdown.addEventListener('error', function (event) {
            elm.innerHTML = event.message;
        });
        let src = decodeURI(elm.getAttribute('data-down'));
        this.tsdown.postMessage(src);
    }
}