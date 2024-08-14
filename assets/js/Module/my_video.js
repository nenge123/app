export default class MY_VIDEO{
    maxpage = 0;
    filepath = 'my-video.sqlite3';
    tablelist =  {
        data: {
            id: 'integer primary key autoincrement',
            title: 'char',
            type: 'char',
            url: 'char',
            img: 'char',
            time:'char',
        },
        tag: {
            name: 'char',
            num: 'int'
        }
    };
    constructor(savename) {
        this.savename = savename;
        let playdata = localStorage.getItem(this.savename);
        this.playdata = playdata?JSON.parse(playdata):{};
    }
    getdata(){
        return this.playdata;
    }
    setdata(obj){
        if(obj){
            this.playdata = Object.assign(this.playdata,obj);
        }else{
            this.playdata = {page:1};
        }
        localStorage.setItem(this.savename,JSON.stringify(this.playdata));
        this.getList(this.playdata);
        return this.playdata;
    }
    async ManageEvent(event){
        const method = event&&event.method;
        switch(method){
            case 'clear':
                $.messager.progress();
                const worker = await this.openSQL();
                await worker.postMethod('clear2exit');
                $.messager.progress('close');
                this.setdata();
            break;
            case 'export':
                $.messager.progress();
                N.postdown(this.filepath,{cache_name:'cache-worker'});
                $.messager.progress('close');
            break;
            case 'import':
                const keylist = Object.keys(this.tablelist.data);
                const insertkeys = event.mode === 1 ? keylist.slice(1) : keylist;
                N.upload(async files => {
                    $.messager.progress();
                    for(const file of files){
                        const worker = await this.openSQL();
                        const mime = await file.slice(0,2).text();
                        if(mime==='PK'){
                            await worker.getMessage({method:'importFile',result:await N.unzip(file,'IAM18'),insertkeys})
                        }else{
                            await worker.getMessage({method:'importFile',result:new Uint8Array(await file.arrayBuffer()),insertkeys});
                        }
                        worker.postMethod('exitworker');
                    }
                    $.messager.progress('close');
                    this.setdata();
                });
            break;
            case 'netdisk':
                const win = await N.addTemplate('assets/template/video-window.htm');
                $(win).window('open');
            break;
            case 'caiji':
                this.caiji = await N.addTemplate('assets/template/video-caiji.htm',!0);
                $.mobile.nav('#video','#video-caiji');
                let url = localStorage.getItem('video-caiji-url');
                if(url)$('#video-caiji-url').val(url)
            break;
        }
    }
    async openSQL() {
        const worker = new MyWorker({url:self.jspath + 'Worker/WorkerAppVideo.js',name: 'SQLite-worker',install:true});
        await worker.ready;
        await worker.postMethod('setInfo',{filepath:this.filepath,tablelist:this.tablelist});
        const status = await worker.postMethod('install', true);
        if (!status) {
            await worker.postMethod('createList');
        }
        await worker.setMethod();
        return worker;
    }
    async getList(arg){
        const bodyElm = $('#video').navpanel('body')[0];
        const footerElm = $('#video').navpanel('footer')[0];
        bodyElm.style.opacity = '0.1';
        const worker = await this.openSQL();
        arg = arg?arg:this.playdata;
        arg.maxlength = 10;
        arg.limit = 30;
        let result = await worker.postMethod('Html2Video',arg);
        this.maxpage = result.maxpage;
        bodyElm.innerHTML = result.html;
        footerElm.innerHTML = result.pageHtml;
        bodyElm.style.opacity = '';
        $('#video')[0].scrollTop = 0;
    }
    StopEvent(arg){
        if(arg&&arg[0]){
            arg[0].preventDefault();
            arg[0].stopPropagation();
        }
    }
    SetPage(page,arg){
        this.StopEvent(arg);
        this.setdata({page})
    }
    SetSearch(elm,arg){
        this.StopEvent(arg);
        let post = new FormData(elm);
        this.setdata({search:post.get('search'),page:1});
    }
    ClearSet(elm,arg){
        this.StopEvent(arg);
        this.setdata();
    }
    SetTag(tag,arg){
        tag = decodeURI(tag);
        this.StopEvent(arg);
        this.setdata({tag,page:1});
    }
    async DelTag(tag,arg){
        tag = decodeURI(tag);
        this.StopEvent(arg);
        const worker = await this.openSQL();
        await worker.postMethod('deleteTag',tag);
        this.setdata();
    }
    async exportTag(tag,arg){
        tag = decodeURI(tag);
        this.StopEvent(arg);
        const worker = await this.openSQL();
        let blob = await worker.postMethod('exportTag',tag);
        const href = URL.createObjectURL(blob);
        N.downURL(href,tag+'.json');
        URL.revokeObjectURL(href);

    }
    async OpenPlay(id,arg,elm){
        this.StopEvent(arg);
        $('#video').navpanel('body')[0].classList.add('noevent');
        let videoplay = await N.addTemplate('assets/template/video-play.htm',!0);
        const bodyElm = $(videoplay).navpanel('body')[0];
        bodyElm.style.opacity = '0.1';
        const worker = await this.openSQL();
        bodyElm.innerHTML = await worker.postMethod('Html2Play',id);
        bodyElm.style.opacity = '';
        this.mediaTitle = elm.getAttribute('title');
        $('#video').navpanel('body')[0].classList.remove('noevent');
        $.mobile.nav('#video','#video-play');
    }
    ClosePlay(){
        let video = document.querySelector('#video-media');
        if(video&&video.paused){
            video.pause();
            video.remove();
        }
        if(this.hls){
            this.hls.destroy();
            delete this.hls;
        }
        if(this.tsdown){
            this.tsdown.postMessage('close');
            delete this.tsdown;
        }
        $.mobile.nav('#video-play','#video','slide','right');
        $('#video-play').navpanel('destroy');
    }
    closeVideo(){
        $.mobile.nav('#video','#mainpage','slide','right');
    }
    closeCaiji(){
        $.mobile.nav('#video-caiji','#video','slide','right');
        $('#video-caiji').navpanel('destroy')
    }
    async startCaiji(elm){
        if(elm.disabled)return;
        elm.disabled = true;
        $('#video-end-caiji')[0].disabled = false;
        const worker = await this.openSQL();
        worker.callMessage = function(data,port){
            console.log(data);
            if(typeof data === 'string'){
                $('#video-caiji-log')[0].value += '\n'+data;
            }
        }
        $('#video-end-caiji').on('click',async function(){
            await worker.postMethod('save2exit');
            $.mobile.nav('#video-caiji','#video','slide','right');
            $('#video-caiji').navpanel('destroy')
        });
        let url = $('#video-caiji-url').val();
        let page = $('#video-caiji-page').val();
        page = page?parseInt(page):1;
        if(url)localStorage.setItem('video-caiji-url',url);
        alert(await worker.postMethod('caiji',{url,page}));
        this.closeCaiji();

    }
    async exportID(mediaID){
        if(mediaID){
            const worker = await this.openSQL();
            let blob  = await worker.postMethod('exportID',mediaID);
            const href = URL.createObjectURL(blob);
            N.downURL(href,this.mediaTitle+'.json');
            URL.revokeObjectURL(href);
        }
    }
    async deleteID(mediaID){
        if(mediaID){
            const worker = await this.openSQL();
            await worker.postMethod('deleteID',mediaID);
            this.ClosePlay();
            this.getList(this.playdata);
        }

    }
    async playUrl(elm,arg){
        this.StopEvent(arg);
        let src = decodeURI(elm.getAttribute('data-src'));
        let video = document.querySelector('#video-media');
        video.hidden = false;
        video.oncanplay = function(){this.play()};
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.onended = function(){
                let srclist = Array.from(document.querySelectorAll("#video-play [data-src]"),v=>decodeURI(v.getAttribute('data-src')));
                if(srclist.length<=1)return;
                let pos = srclist.indexOf(this.src) + 1;
                if(pos<0||pos==srclist.length){
                    pos = 0;
                }
                this.src = srclist[0];
                this.play();
            };
            video.play();
        }else{
            if(!self.Hls)await import('https://registry.npmmirror.com/hls.js/1.5.13/files/dist/hls.min.js');
            if(Hls.isSupported()){
                if(!this.hls){
                    this.hls = new self.Hls();
                    this.hls.attachMedia(video);
                }
                this.hls.loadSource(src);
                const V = this;
                video.onended = function(){
                    if(!V.hls) return;
                    let srclist = Array.from(document.querySelectorAll("#video-play [data-src]"),v=>decodeURI(v.getAttribute('data-src')));
                    if(srclist.length<=1)return;
                    let pos = srclist.indexOf(V.hls.url) + 1;
                    if(pos<=0||pos==srclist.length){
                        pos = 0;
                    }
                    V.hls.loadSource(srclist[0]);
                    V.hls.attachMedia(video);
                    this.play();
                };
                video.play();
            }
        }
    }
    downUrl(url,arg,elm){
        const V = this;
        this.StopEvent(arg);
        if(elm.getAttribute('startdown'))return;
        elm.setAttribute('startdown',true);
        const tips = document.createElement('h3');
        tips.innerHTML = '苹果手机存在异常<br>因此请等待全部内容块下载完毕再点击片段下载!!!<br>正常情况下低于30秒可能为广告!';
        elm.parentNode.appendChild(tips);
        let src = decodeURI(url);
        this.tsdown = new Worker(self.jspath + 'Worker/downTS.js');
        this.tsdown.addEventListener('message',function(event){
            const data = event.data;
            if(data){
                if(data.log){
                    console.log(data.log);
                }else if(data.info){
                    elm.innerHTML = data.info;
                }else if(data.result){
                    const href = URL.createObjectURL(data.result);
                    const p = document.createElement('p');
                    const a = document.createElement('a');
                    console.log(data.duration);
                    const duration = data.duration? '约'+(data.duration>60?Math.ceil(data.duration/6)/10+'分':Math.ceil(data.duration)+'秒'):'';
                    elm.parentNode.appendChild(p);
                    p.appendChild(a);
                    a.href = href;
                    a.download = elm.getAttribute('title')+'-片段('+data.PathIndex+').ts';
                    a.target = '_blank';
                    a.innerHTML = '片段('+data.PathIndex+')'+duration;
                    if(data.close){
                        return a.click();
                    }
                    delete data.result;
                }else if(data.close){
                    elm.removeAttribute('startdown');
                    if(data.ready)elm.innerHTML = data.ready;
                    delete V.tsdown;
                    this.terminate();
                }
            }
        });
        this.tsdown.addEventListener('error',function(event){
            elm.innerHTML = event.message;
        });
        this.tsdown.postMessage(src);
    }
}