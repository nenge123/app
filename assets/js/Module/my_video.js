export default class MY_VIDEO{
    sqlfile = 'my-video.sqlite3';
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
                N.postdown(this.sqlfile,{cache_name:'cache-worker'});
                $.messager.progress('close');
            break;
            case 'import':
                N.upload(async files => {
                    $.messager.progress();
                    for(const file of files){
                        const worker = await this.openSQL();
                        await worker.getFeedback({
                            method:'importFile',
                            result:file,
                            mode:event.mode,
                            password:'IAM18',
                            tablelist:this.tablelist,
                        })
                        worker.postMethod('exitworker');
                    }
                    $.messager.progress('close');
                    this.setdata();
                });
            break;
            case 'netdisk':
                let win = document.querySelector('#video-window');
                if(!win){
                    win = await N.addTemplate('assets/template/video-window.htm');
                }
                $('#video-window').window('open');
            break;
        }
    }
    async openSQL() {
        const worker = await new MyWorker({url:self.jspath + 'Worker/WorkerAppSQLite.js',name: 'SQLite-worker',install:true}).ready;
        await worker.postMethod('setInfo',{datafile:this.sqlfile,tablelist:this.tablelist});
        if (!(await worker.postMethod('install', true))) {
            await worker.postMethod('createList');
        }
        await worker.publicMethod();
        return worker;
    }
    async getList(arg){
        const bodyElm = $('#video').navpanel('body')[0];
        const footerElm = $('#video').navpanel('footer')[0];
        bodyElm.style.opacity = '0.1';
        const worker = await this.openSQL();
        arg = arg?arg:this.playdata;
        arg.maxlength = 8;
        let result = await worker.postMethod('Html2Video',arg);
        bodyElm.innerHTML = result.html;
        footerElm.innerHTML = result.pageHtml;
        worker.terminate();
        bodyElm.style.opacity = '';
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
    async OpenPlay(id,arg,elm){
        this.StopEvent(arg);
        $('#video').navpanel('body')[0].classList.add('noevent');
        let videoplay = document.querySelector('#video-play');
        if(!videoplay){
            //https://registry.npmmirror.com/hls.js/1.5.13/files/dist/hls.min.js
            //await import('../hls.js');
            await import('https://registry.npmmirror.com/hls.js/1.5.13/files/dist/hls.min.js');
            let videoplay = await N.template('assets/template/video-play.htm');
            document.body.appendChild(videoplay);
            $.parser.parse();
        }
        const bodyElm = $('#video-play').navpanel('body')[0];
        bodyElm.style.opacity = '0.1';
        const worker = await this.openSQL();
        bodyElm.innerHTML = await worker.postMethod('Html2Play',id);
        bodyElm.style.opacity = '';
        this.mediaID = id;
        this.mediaTitle = elm.getAttribute('title');
        $('#video').navpanel('body')[0].classList.remove('noevent');
        $.mobile.nav('#video','#video-play');
    }
    ClosePlay(){
        if(this.hls){
            this.hls.destroy();
            delete this.hls;
        }
        if(this.tsdown){
            this.tsdown.postMessage('close');
            delete this.tsdown;
        }
        $('#video-play').navpanel('body')[0].innerHTML = '<div class="panel-loading">Loading...</div>';
        $.mobile.nav('#video-play','#video','slide','right');
    }
    closeVideo(){
        $.mobile.nav('#video','#mainpage','slide','right');
    }
    async exportJSON(){
        if(this.mediaID){
            const worker = await this.openSQL();
            let blob  = await worker.postMethod('exportJSON',this.mediaID);
            const href = URL.createObjectURL(blob);
            N.downURL(href,this.mediaTitle+'.json');
            URL.revokeObjectURL(href);
        }
    }
    playUrl(url,arg){
        this.StopEvent(arg);
        let src = decodeURI(url);
        let video = document.querySelector('#video-media');
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('canplay', function () {this.play();},{once:true});
        }else{
            if(Hls.isSupported()){
                this.hls = new self.Hls(); 
                this.hls.loadSource(src);
                this.hls.attachMedia(video);
                video.addEventListener('canplay', function () {this.play();},{once:true});
            }
        }
        video.hidden = false;
    }
    downUrl(url,arg,elm){
        const V = this;
        this.StopEvent(arg);
        if(elm.getAttribute('startdown'))return;
        elm.setAttribute('startdown',true);
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
                    let a = document.createElement('a');
                    a.href = href;
                    a.download = elm.getAttribute('title')+'-片段('+data.PathIndex+').ts';
                    a.target = '_blank';
                    a.innerHTML = '片段('+data.PathIndex+')';
                    if(data.close){
                        return a.click();
                    }
                    elm.parentNode.appendChild(a);
                    delete data.result;
                }else if(data.close){
                    elm.removeAttribute('startdown');
                    if(data.ready)elm.innerHTML = data.ready;
                    delete V.tsdown;
                    this.terminate();
                }
            }
        });
        this.tsdown.postMessage(src);
    }
}