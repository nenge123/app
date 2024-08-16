import '../lib/WorkerApp.js';
/**
 * js:https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js
 * wasm:https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.wasm
 * must support SharedArrayBuffer
 * wasm-length:32609891
 */
import Module from 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js';
const AppMpeg = new class WorkerAppFFmpeg extends WorkerApp {
    ports = [];
    methods = new Map(
        Object.entries({
            async _Initialized(back,port) {
                if(this.ffmpeg){
                    //shareworker push port
                    //this.ports.push(port);
                    return back(true);
                }
                const response = await fetch('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm');
                if(!response||!response.body){
                    throw 'net error';
                }
                const total = parseInt(response.headers.get('content-length')||32129114);
                const reader  = response.body.getReader();
                const chunk = [];
                let loaded = 0;
                while(true){
                    const { done, value } = await reader.read();
                    if(done){
                        break;
                    }
                    loaded += value.byteLength;
                    port&&port.postMessage({method:'wasmload',loaded,total,speed:value.byteLength});
                    chunk.push(value);
                }
                const wasmBinary =  await (new Blob(chunk)).arrayBuffer();
                const ffmpeg = await Module({wasmBinary});
                await ffmpeg.ready;
                delete ffmpeg.wasmBinary;
                if(self.postMessage){
                    //worker
                    ffmpeg.setLogger(data=>self.postMessage({method:'log',message:data.message}));
                    ffmpeg.setProgress(data=>self.postMessage({method:'progress',progress:data.progress,time:data.time}));
                }else{
                    //shareWorker
                    ffmpeg.setLogger(data=>this.callMethod('_log',{method:'log',message:data.message}));
                    ffmpeg.setProgress(data=>this.callMethod('_progress',{method:'progress',progress:data.progress,time:data.time}));
                }
                this.ffmpeg = ffmpeg;
                this.FS = ffmpeg.FS;
                back(true);
            },
            _postMessage(msg,trf){
                if(self.postMessage){
                    self.postMessage(msg,trf);
                }else{
                    this.ports.forEach(port=>port.postMessage(msg,trf));
                }
            },
            async writeFile(data,port){
                const [file,contents] = data.result;
                this.FS.writeFile(file,contents instanceof Blob ? new Uint8Array(await contents.arrayBuffer()):contents);
                return true;
            },
            exec(data,port){
                const [args,timeout] = data.result;
                if(data.log===true){
                    this.methods.set('_log',data=>port.postMessage(data));
                    this.methods.set('_progress',data=>port.postMessage(data));
                }
                this.ffmpeg.setTimeout(timeout);
                this.ffmpeg.exec(...args);
                const ret = this.ffmpeg.ret;
                this.ffmpeg.reset();
                console.log(ret);
                return true;
            },
            readFile(data,port){
                const buf = this.FS.readFile(data.result[0]);
                return new Uint8Array(buf?buf:0);
            },
            resultMethod() {
                return Array.from(this.methods.keys()).filter(v => v.indexOf('_') === -1);
            },
    }));
    constructor() {
        super(true);
    }
}
AppMpeg.onRun();
self.AppMpeg = AppMpeg;