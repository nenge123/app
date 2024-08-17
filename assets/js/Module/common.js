import methods  from "./methods.js";
import '../lib/MyWorker.js';
self.jspath = import.meta.url.split('/').slice(0,-2).join('/')+'/';
self.N = new class NengeCommon{
    template(url){
        return new Promise((back,error)=>{
            const request = new XMLHttpRequest;
            request.addEventListener('readystatechange',function(e){
                if(request.readyState === request.DONE){
                    let dom = request.response;
                    back(Array.from(dom.body.children));
                }
            });
            request.addEventListener('abort',e=>error(e));
            request.open('GET',location.origin+'/'+url);
            request.responseType = 'document';
            request.setRequestHeader('ajax-fetch',1);
            request.send(null);
        });
    }
    async addTemplate(url){
        const elms = await N.template(url);
        const content = document.body;
        elms.forEach(elm=>{
            content.appendChild(elm);
        });
        //$.parser.parse();
        return elms[0];
    }
    upload(fn,accept){
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.addEventListener('change',e=>fn(e.target.files));
        input.click();
    }
    postdown(action,param){
        let elm = document.createElement('form');
        elm.hidden = true;
        elm.action = action;
        elm.name = 'postdown';
        elm.method = 'POST';
        elm.enctype = 'text/plain';
        //elm.target = '_blank';
        elm.innerHTML = Object.entries(param).map(entry=>`<input type="hidden" name="${entry[0]}" value="${entry[1]}">`).join('');
        document.body.appendChild(elm);
        elm.submit();
        //elm.remove();
    }
    downURL(url,name){
        let a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        a.remove();
    }
    showWin(title,content){
        let elm = document.createElement('div');
        return $(elm).window({
            title,
            content,
            closed:false,
            closable:false,
            collapsible:false,
            minimizable:false,
            maximizable:false,
            width:300,    
            height:200,    
        });
    }
    convert(){
        this.upload(async files=>{
            const worker = new MyWorker({url:self.jspath+'Worker/WorkerAppFFmpeg.js',type:'module',install:true});
            worker.methods.set('log',function(data,port){
                console.log(data.message);
            });
            worker.methods.set('wasmload',function(data,port){
                console.log(data);
            });
            worker.methods.set('progress',function(data,port){
                console.log(data);
            });
            await worker.setMethod();
            await worker.ready;
            console.log(worker);
            //
            await worker.callMethod('writeFile','0.mp4',new Uint8Array(await files[0].arrayBuffer()));
            await worker.callMethod('exec',['-i','0.mp4','-preset','ultrafast','a.mov'],-1);
            const file = await worker.callMethod('readFile','a.mov');
            console.log(file);
            worker.terminate();
            if(file.length)this.downURL(URL.createObjectURL(new Blob([file])),'a.mov');

        });
    }
    /**
     * 

    unzip(result,password){
        let worker = new MyWorker({url:self.jspath+'Worker/WorkerAppZip.js'});
        return worker.getMessage({
            method:'unpack',
            result,
            password,
            close:true,
        });
    }
    
     */
    async unzip(result,password){
        await import('https://unpkg.com/@zip.js/zip.js@2.7.48/dist/zip.min.js');
        let ReaderList = await new zip.ZipReader(
            new zip.BlobReader(result instanceof Blob?result:new Blob([result]))
        ).getEntries().catch(e=>false);
        if(!ReaderList||!ReaderList.length) return false;
        [].shift
        const getData = (entry)=>{
            let rawPassword;
            if(password){
                rawPassword = password instanceof Uint8Array?password:new TextEncoder().encode(password);
            }
            return entry.getData(new zip.Uint8ArrayWriter(), {rawPassword:entry.encrypted?rawPassword:undefined}).catch(async e=>{
                let msg = e.message;
                if(password===false)return;
                if(msg == zip.ERR_INVALID_PASSWORD||msg==zip.ERR_ENCRYPTED){
                    password = window.prompt('输入密码',password instanceof Uint8Array ? new TextDecoder('gbk').decode(password):password);
                    if(password){
                        return await getData(entry);
                    }else{
                        password = false;
                    }
                }
            });
        }
        if(ReaderList&&ReaderList.length){
            let list = new Map();
            for await(let entry of ReaderList){
                if(entry.directory)continue;
                let data = await getData(entry);
                if(data){
                    list.set(entry.filename,data);
                }
            }
            return list;
        }
        return false;
    }
    methods = new Map;
    modules = new Map();
    has(name,method){
        return this[name].has(method);
    }
    isMethod(method) {
        return this.has('methods',method);
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
    runModule(module,method,...arg){
        if(this.modules.has(module)){
            return this.modules.get(module)[method](...arg);
        }
    }
    bindMethod(elm){
        Array.from(elm.querySelectorAll('[data-method]'),elm=>{
            elm.addEventListener('click',function(event){
                if(this.getAttribute('data-loading')) return;
                N.StopEvent(event);
                let method = this.getAttribute('data-method');
                N.callMethod(method,this,event);    
            });
        });
    }
    StopEvent(event){
        if(event instanceof Event){
            event.preventDefault();
            event.stopPropagation();
        }
    }
    hide(){
        document.querySelector('#start-page').classList.add('hide');
    }
    show(){
        document.querySelector('#start-page').classList.remove('hide');
    }

};
self.N.methods = methods;
window.onresize = function(event){
    document.body.style.setProperty('--inner-width',window.innerWidth+'px');
    document.body.style.setProperty('--inner-height',window.innerHeight+'px');
};
window.onresize();
N.bindMethod(document.querySelector('#start-page '));