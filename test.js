self.jspath = location.origin+'/assets/js/';
function upload(fn,accept){
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change',e=>fn(e.target.files));
    input.click();
}
function convert(){
    upload(async files=>{
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
        console.log(await worker.ready);
        await worker.callMethod('writeFile','0.mp4',new Uint8Array(await files[0].arrayBuffer()));
        await worker.callMethod('exec',['-i','0.mp4','a.mov'],-1);
        const file = await worker.callMethod('readFile','a.mov');
        worker.terminate();
        this.downURL(URL.createObjectURL(new Blob([file])),'a.mov');

    });
}

function convert2(){
    upload(async files=>{
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
        console.log(await worker.ready);
        await worker.callMethod('writeFile','0.mp4',new Uint8Array(await files[0].arrayBuffer()));
        await worker.callMethod('exec',['-i','0.mp4','a.mov'],-1);
        const file = await worker.callMethod('readFile','a.mov');
        worker.terminate();
        this.downURL(URL.createObjectURL(new Blob([file])),'a.mov');
    });
}