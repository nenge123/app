class MyWorker extends Worker{
    constructor(options){
        const {url,type,name} = options;
        super(url,{type,name});
        if(options.install===true){
            this.ready = this.initMessage();
        }else{
            this.addMessage(options.message);
        }
    }
    methods = new Map();
    feedback = new Map();
    isFeedback(method){
        return this.feedback&&this.feedback.has(method);
    }
    callFeedback(method,...arg){
        if(this.isFeedback(method)){
            return this.feedback.get(method).apply(this,arg);
        }
    }
    isMethod(method){
        return this.methods&&this.methods.has(method);
    }
    callMethod(method,...arg){
        if(this.isMethod(method)){
            return this.methods.get(method).apply(this,arg);
        }
    }
    uuid(){
        return self.crypto&&self.crypto.randomUUID&&self.crypto.randomUUID()||btoa(performance.now()+Math.random());
    }
    addFeedback(id,back,error){
        this.feedback.set(id,function(data){
            if(data.error&&error)return error(data.error);
            back(data.result);
            this.feedback.delete(data.id);
        });
    }
    async getFeedback(result,transf){
        return new Promise((back,error)=>{
            const id = this.uuid();
            this.addFeedback(id,back,error);
            result.id = id;
            this.postMessage(result,transf);
        });
    }
    async postMethod(method,result,transf){
        return this.getFeedback({method,result},transf);
    }
    async publicMethod(){
        const methods = await this.postMethod('publicMethod');
        methods&&methods.forEach(v=>{
            if(v=='constructor')return;
            this.methods.set(v,new Function('...result','return this.postMethod("'+v+'",result)'))
        });
    }
    async addMessage(){
        this.addEventListener('message',async function(event){
            const data = event.data;
            const port = event.source || event.target;
            if (data && data.constructor === Object) {
                if(this.isMethod(data.method)){
                    return this.callMethod(data.method,data,port);
                }
                if(this.isFeedback(data.id)){
                    return this.callFeedback(data.id,data,port);
                }
                if(data.method=='zip_password'){
                    let password = data.password||'';
                    password = self.prompt instanceof Function?self.prompt('输入密码',password):false;
                    return port.postMessage({
                        id:data.id,
                        result:password===null?false:password
                    });
                }
            }
            if (this.callMessage instanceof Function) return this.callMessage(data, port);
        });
        this.addEventListener('error',function(event){
            alert(event.message);
        });
    }
    setMessage(fn,message,transf){
        if(fn instanceof Function) this.callMessage = fn;
        this.addMessage(message,transf);
    }
    initMessage(){
        return new Promise((resolve,reject)=>{
            const error = e=>reject(e.message);
            this.addEventListener('message',async function(event){
                const data = event.data;
                if(data === 'complete'){
                    this.removeEventListener('error',error);
                    this.addMessage();
                    resolve(this);
                }
            },{once:true});
            this.addEventListener('error',error,{once:true});

        });
    }
}
Object.defineProperty(self,'MyWorker',{get:()=>MyWorker});