import methods  from "./methods.js";
import '../lib/MyWorker.js';
self.jspath = import.meta.url.split('/').slice(0,-2).join('/')+'/';
Object.assign(EventTarget.prototype, {
    /**
     * 绑定事件
     * @param {*} evt 
     * @param {*} fun 
     * @param {*} opt 
     * @returns 
     */
    on(evt, fun, opt) {
        return this.addEventListener(evt, fun, opt), this;
    },
    /**
     * 解绑事件
     * @param {*} evt 
     * @param {*} fun 
     * @param {*} opt 
     * @returns 
     */
    un(evt, fun, opt) {
        return this.removeEventListener(evt, fun, opt), this;
    },
    /**
     * 绑定一次事件
     * @param {*} evt 
     * @param {*} fun 
     * @param {*} opt 
     * @returns 
     */
    once(evt, fun, opt) {
        return this.on(evt, fun, Object.assign({
            passive: !1,
            once: !0,
        }, opt === true ? {
            passive: !0
        } : opt || {})), this;
    },
    /**
     * 触发自定义事件
     * @param {*} evt 
     * @param {*} detail 
     */
    toEvent(evt, detail) {
        return this.dispatchEvent(typeof evt == 'string' ? new CustomEvent(evt, {
            detail
        }) : evt), this;
    }
});
self.N = new (class NengeCommon extends EventTarget{
    callMethod(method,...arg){
        if(this.isMethod(method))return this.methods.get(method).apply(this,arg);
    }
    isMethod(method){
        return this.methods&&this.methods.has(method);
    }
    constructor(methods){
        super();
        this.methods = methods;
    }
    template(url){
        return new Promise((back,error)=>{
            const request = new XMLHttpRequest;
            request.addEventListener('readystatechange',function(e){
                if(request.readyState === request.DONE){
                    let dom = request.response;
                    back(dom.body.firstElementChild);
                }
            });
            request.addEventListener('abort',e=>error(e));
            request.open('GET',location.origin+'/'+url);
            request.responseType = 'document';
            request.setRequestHeader('ajax-fetch',1);
            request.send(null);
        });
    }
    async addTemplate(url,bool){
        const win = await N.template(url);
        const content = bool?document.body:document.querySelector('#other');
        content.appendChild(win);
        $.parser.parse(bool?undefined:'#other');
        return win;
    }
    upload(fn,accept){
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.on('change',e=>fn(e.target.files));
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
    unzip(result,password){
        let worker = new MyWorker({url:self.jspath+'Worker/WorkerAppZip.js'});
        return worker.getFeedback({
            method:'unpack',
            result,
            password
        });
    }

})(methods);