function removePadding(i){const t=i.byteLength,e=t&&new DataView(i).getUint8(t-1);return e?i.slice(0,t-e):i}function AESDecryptor(){return{constructor(){this.rcon=[0,1,2,4,8,16,32,64,128,27,54],this.subMix=[new Uint32Array(256),new Uint32Array(256),new Uint32Array(256),new Uint32Array(256)],this.invSubMix=[new Uint32Array(256),new Uint32Array(256),new Uint32Array(256),new Uint32Array(256)],this.sBox=new Uint32Array(256),this.invSBox=new Uint32Array(256),this.key=new Uint32Array(0),this.initTable()},uint8ArrayToUint32Array_(i){let t=new DataView(i),e=new Uint32Array(4);for(let i=0;i<4;i++)e[i]=t.getUint32(4*i);return e},initTable(){let i=this.sBox,t=this.invSBox,e=this.subMix,r=e[0],n=e[1],s=e[2],o=e[3],h=this.invSubMix,y=h[0],a=h[1],w=h[2],u=h[3],d=new Uint32Array(256),v=0,A=0,l=0;for(l=0;l<256;l++)d[l]=l<128?l<<1:l<<1^283;for(l=0;l<256;l++){let e=A^A<<1^A<<2^A<<3^A<<4;e=e>>>8^255&e^99,i[v]=e,t[e]=v;let h=d[v],l=d[h],S=d[l],U=257*d[e]^16843008*e;r[v]=U<<24|U>>>8,n[v]=U<<16|U>>>16,s[v]=U<<8|U>>>24,o[v]=U,U=16843009*S^65537*l^257*h^16843008*v,y[e]=U<<24|U>>>8,a[e]=U<<16|U>>>16,w[e]=U<<8|U>>>24,u[e]=U,v?(v=h^d[d[d[S^h]]],A^=d[d[A]]):v=A=1}},expandKey(i){let t=this.uint8ArrayToUint32Array_(i),e=!0,r=0;for(;r<t.length&&e;)e=t[r]===this.key[r],r++;if(e)return;this.key=t;let n=this.keySize=t.length;if(4!==n&&6!==n&&8!==n)throw new Error("Invalid aes key size="+n);let s,o,h,y,a=this.ksRows=4*(n+6+1),w=this.keySchedule=new Uint32Array(a),u=this.invKeySchedule=new Uint32Array(a),d=this.sBox,v=this.rcon,A=this.invSubMix,l=A[0],S=A[1],U=A[2],x=A[3];for(s=0;s<a;s++)s<n?h=w[s]=t[s]:(y=h,s%n==0?(y=y<<8|y>>>24,y=d[y>>>24]<<24|d[y>>>16&255]<<16|d[y>>>8&255]<<8|d[255&y],y^=v[s/n|0]<<24):n>6&&s%n==4&&(y=d[y>>>24]<<24|d[y>>>16&255]<<16|d[y>>>8&255]<<8|d[255&y]),w[s]=h=(w[s-n]^y)>>>0);for(o=0;o<a;o++)s=a-o,y=3&o?w[s]:w[s-4],u[o]=o<4||s<=4?y:l[d[y>>>24]]^S[d[y>>>16&255]]^U[d[y>>>8&255]]^x[d[255&y]],u[o]=u[o]>>>0},networkToHostOrderSwap:i=>i<<24|(65280&i)<<8|(16711680&i)>>8|i>>>24,decrypt(i,t,e,r){let n,s,o,h,y,a,w,u,d,v,A,l,S,U,x=this.keySize+6,c=this.invKeySchedule,f=this.invSBox,k=this.invSubMix,b=k[0],g=k[1],B=k[2],M=k[3],T=this.uint8ArrayToUint32Array_(e),p=T[0],z=T[1],K=T[2],D=T[3],I=new Int32Array(i),_=new Int32Array(I.length),m=this.networkToHostOrderSwap;for(;t<I.length;){for(d=m(I[t]),v=m(I[t+1]),A=m(I[t+2]),l=m(I[t+3]),y=d^c[0],a=l^c[1],w=A^c[2],u=v^c[3],S=4,U=1;U<x;U++)n=b[y>>>24]^g[a>>16&255]^B[w>>8&255]^M[255&u]^c[S],s=b[a>>>24]^g[w>>16&255]^B[u>>8&255]^M[255&y]^c[S+1],o=b[w>>>24]^g[u>>16&255]^B[y>>8&255]^M[255&a]^c[S+2],h=b[u>>>24]^g[y>>16&255]^B[a>>8&255]^M[255&w]^c[S+3],y=n,a=s,w=o,u=h,S+=4;n=f[y>>>24]<<24^f[a>>16&255]<<16^f[w>>8&255]<<8^f[255&u]^c[S],s=f[a>>>24]<<24^f[w>>16&255]<<16^f[u>>8&255]<<8^f[255&y]^c[S+1],o=f[w>>>24]<<24^f[u>>16&255]<<16^f[y>>8&255]<<8^f[255&a]^c[S+2],h=f[u>>>24]<<24^f[y>>16&255]<<16^f[a>>8&255]<<8^f[255&w]^c[S+3],S+=3,_[t]=m(n^p),_[t+1]=m(h^z),_[t+2]=m(o^K),_[t+3]=m(s^D),p=d,z=v,K=A,D=l,t+=4}return r?removePadding(_.buffer):_.buffer},destroy(){this.key=void 0,this.keySize=void 0,this.ksRows=void 0,this.sBox=void 0,this.invSBox=void 0,this.subMix=void 0,this.invSubMix=void 0,this.keySchedule=void 0,this.invKeySchedule=void 0,this.rcon=void 0}}};
/*! @name m3u8-parser @version 4.3.0 @license Apache-2.0 */
!function(t,e){!function(t){"use strict";class e{constructor(){this.listeners={}}on(t,e){this.listeners[t]||(this.listeners[t]=[]),this.listeners[t].push(e)}off(t,e){if(!this.listeners[t])return!1;var i=this.listeners[t].indexOf(e);return this.listeners[t].splice(i,1),i>-1}trigger(t){var e,i,a,r=this.listeners[t];if(r)if(2===arguments.length)for(i=r.length,e=0;e<i;++e)r[e].call(this,arguments[1]);else for(a=Array.prototype.slice.call(arguments,1),i=r.length,e=0;e<i;++e)r[e].apply(this,a)}dispose(){this.listeners={}}pipe(t){this.on("data",(function(e){t.push(e)}))}}class i extends e{constructor(){super(),this.buffer=""}push(t){var e;for(this.buffer+=t,e=this.buffer.indexOf("\n");e>-1;e=this.buffer.indexOf("\n"))this.trigger("data",this.buffer.substring(0,e)),this.buffer=this.buffer.substring(e+1)}}function a(){return new RegExp("(?:^|,)("+("(?:"+"[^=]*"+")=(?:"+'"[^"]*"|[^,]*'+")")+")")}function r(t){for(var e,i=t.split(a()),r={},s=i.length;s--;)""!==i[s]&&((e=/([^=]*)=(.*)/.exec(i[s]).slice(1))[0]=e[0].replace(/^\s+|\s+$/g,""),e[1]=e[1].replace(/^\s+|\s+$/g,""),e[1]=e[1].replace(/^['"](.*)['"]$/g,"$1"),r[e[0]]=e[1]);return r}class s extends e{constructor(){super(),this.customParsers=[],this.tagMappers=[]}push(t){var e,i,a=this;0!==(t=t.trim()).length&&("#"===t[0]?this.tagMappers.reduce((function(e,i){var a=i(t);return a===t?e:e.concat([a])}),[t]).forEach((function(t){for(var s=0;s<a.customParsers.length;s++)if(a.customParsers[s].call(a,t))return;if(0===t.indexOf("#EXT"))if(t=t.replace("\r",""),e=/^#EXTM3U/.exec(t))a.trigger("data",{type:"tag",tagType:"m3u"});else{if(e=/^#EXTINF:?([0-9\.]*)?,?(.*)?$/.exec(t))return i={type:"tag",tagType:"inf"},e[1]&&(i.duration=parseFloat(e[1])),e[2]&&(i.title=e[2]),void a.trigger("data",i);if(e=/^#EXT-X-TARGETDURATION:?([0-9.]*)?/.exec(t))return i={type:"tag",tagType:"targetduration"},e[1]&&(i.duration=parseInt(e[1],10)),void a.trigger("data",i);if(e=/^#ZEN-TOTAL-DURATION:?([0-9.]*)?/.exec(t))return i={type:"tag",tagType:"totalduration"},e[1]&&(i.duration=parseInt(e[1],10)),void a.trigger("data",i);if(e=/^#EXT-X-VERSION:?([0-9.]*)?/.exec(t))return i={type:"tag",tagType:"version"},e[1]&&(i.version=parseInt(e[1],10)),void a.trigger("data",i);if(e=/^#EXT-X-MEDIA-SEQUENCE:?(\-?[0-9.]*)?/.exec(t))return i={type:"tag",tagType:"media-sequence"},e[1]&&(i.number=parseInt(e[1],10)),void a.trigger("data",i);if(e=/^#EXT-X-DISCONTINUITY-SEQUENCE:?(\-?[0-9.]*)?/.exec(t))return i={type:"tag",tagType:"discontinuity-sequence"},e[1]&&(i.number=parseInt(e[1],10)),void a.trigger("data",i);if(e=/^#EXT-X-PLAYLIST-TYPE:?(.*)?$/.exec(t))return i={type:"tag",tagType:"playlist-type"},e[1]&&(i.playlistType=e[1]),void a.trigger("data",i);if(e=/^#EXT-X-BYTERANGE:?([0-9.]*)?@?([0-9.]*)?/.exec(t))return i={type:"tag",tagType:"byterange"},e[1]&&(i.length=parseInt(e[1],10)),e[2]&&(i.offset=parseInt(e[2],10)),void a.trigger("data",i);if(e=/^#EXT-X-ALLOW-CACHE:?(YES|NO)?/.exec(t))return i={type:"tag",tagType:"allow-cache"},e[1]&&(i.allowed=!/NO/.test(e[1])),void a.trigger("data",i);if(e=/^#EXT-X-MAP:?(.*)$/.exec(t)){if(i={type:"tag",tagType:"map"},e[1]){var n=r(e[1]);if(n.URI&&(i.uri=n.URI),n.BYTERANGE){var u=n.BYTERANGE.split("@"),g=u[0],o=u[1];i.byterange={},g&&(i.byterange.length=parseInt(g,10)),o&&(i.byterange.offset=parseInt(o,10))}}a.trigger("data",i)}else if(e=/^#EXT-X-STREAM-INF:?(.*)$/.exec(t)){if(i={type:"tag",tagType:"stream-inf"},e[1]){if(i.attributes=r(e[1]),i.attributes.RESOLUTION){var d=i.attributes.RESOLUTION.split("x"),c={};d[0]&&(c.width=parseInt(d[0],10)),d[1]&&(c.height=parseInt(d[1],10)),i.attributes.RESOLUTION=c}i.attributes.BANDWIDTH&&(i.attributes.BANDWIDTH=parseInt(i.attributes.BANDWIDTH,10)),i.attributes["PROGRAM-ID"]&&(i.attributes["PROGRAM-ID"]=parseInt(i.attributes["PROGRAM-ID"],10))}a.trigger("data",i)}else{if(e=/^#EXT-X-MEDIA:?(.*)$/.exec(t))return i={type:"tag",tagType:"media"},e[1]&&(i.attributes=r(e[1])),void a.trigger("data",i);if(e=/^#EXT-X-ENDLIST/.exec(t))a.trigger("data",{type:"tag",tagType:"endlist"});else if(e=/^#EXT-X-DISCONTINUITY/.exec(t))a.trigger("data",{type:"tag",tagType:"discontinuity"});else{if(e=/^#EXT-X-PROGRAM-DATE-TIME:?(.*)$/.exec(t))return i={type:"tag",tagType:"program-date-time"},e[1]&&(i.dateTimeString=e[1],i.dateTimeObject=new Date(e[1])),void a.trigger("data",i);if(e=/^#EXT-X-KEY:?(.*)$/.exec(t))return i={type:"tag",tagType:"key"},e[1]&&(i.attributes=r(e[1]),i.attributes.IV&&("0x"===i.attributes.IV.substring(0,2).toLowerCase()&&(i.attributes.IV=i.attributes.IV.substring(2)),i.attributes.IV=i.attributes.IV.match(/.{8}/g),i.attributes.IV[0]=parseInt(i.attributes.IV[0],16),i.attributes.IV[1]=parseInt(i.attributes.IV[1],16),i.attributes.IV[2]=parseInt(i.attributes.IV[2],16),i.attributes.IV[3]=parseInt(i.attributes.IV[3],16),i.attributes.IV=new Uint32Array(i.attributes.IV))),void a.trigger("data",i);if(e=/^#EXT-X-START:?(.*)$/.exec(t))return i={type:"tag",tagType:"start"},e[1]&&(i.attributes=r(e[1]),i.attributes["TIME-OFFSET"]=parseFloat(i.attributes["TIME-OFFSET"]),i.attributes.PRECISE=/YES/.test(i.attributes.PRECISE)),void a.trigger("data",i);if(e=/^#EXT-X-CUE-OUT-CONT:?(.*)?$/.exec(t))return i={type:"tag",tagType:"cue-out-cont"},e[1]?i.data=e[1]:i.data="",void a.trigger("data",i);if(e=/^#EXT-X-CUE-OUT:?(.*)?$/.exec(t))return i={type:"tag",tagType:"cue-out"},e[1]?i.data=e[1]:i.data="",void a.trigger("data",i);if(e=/^#EXT-X-CUE-IN:?(.*)?$/.exec(t))return i={type:"tag",tagType:"cue-in"},e[1]?i.data=e[1]:i.data="",void a.trigger("data",i);a.trigger("data",{type:"tag",data:t.slice(4)})}}}else a.trigger("data",{type:"comment",text:t.slice(1)})})):this.trigger("data",{type:"uri",uri:t}))}addParser(t){var e=this,i=t.expression,a=t.customType,r=t.dataParser,s=t.segment;"function"!=typeof r&&(r=function(t){return t}),this.customParsers.push((function(t){if(i.exec(t))return e.trigger("data",{type:"custom",data:r(t),customType:a,segment:s}),!0}))}addTagMapper(t){var e=t.expression,i=t.map,a=function(t){return e.test(t)?i(t):t};this.tagMappers.push(a)}}class n extends e{constructor(t){super();const e=this;e.lineStream=new i,e.parseStream=new s,e.lineStream.pipe(e.parseStream);var a,r,n=[],u={},g=function(){},o={AUDIO:{},VIDEO:{},"CLOSED-CAPTIONS":{},SUBTITLES:{}},d=0;e.manifest={allowCache:!0,discontinuityStarts:[],segments:[]},e.parseStream.on("data",(function(t){var i,s;({tag:function(){({"allow-cache":function(){this.manifest.allowCache=t.allowed,"allowed"in t||(this.trigger("info",{message:"defaulting allowCache to YES"}),this.manifest.allowCache=!0)},byterange:function(){var e={};"length"in t&&(u.byterange=e,e.length=t.length,"offset"in t||(this.trigger("info",{message:"defaulting offset to zero"}),t.offset=0)),"offset"in t&&(u.byterange=e,e.offset=t.offset)},endlist:function(){this.manifest.endList=!0},inf:function(){"mediaSequence"in this.manifest||(this.manifest.mediaSequence=0,this.trigger("info",{message:"defaulting media sequence to zero"})),"discontinuitySequence"in this.manifest||(this.manifest.discontinuitySequence=0,this.trigger("info",{message:"defaulting discontinuity sequence to zero"})),t.duration>0&&(u.duration=t.duration),0===t.duration&&(u.duration=.01,this.trigger("info",{message:"updating zero segment duration to a small value"})),this.manifest.segments=n},key:function(){t.attributes?"NONE"!==t.attributes.METHOD?t.attributes.URI?(t.attributes.METHOD||this.trigger("warn",{message:"defaulting key method to AES-128"}),r={method:t.attributes.METHOD||"AES-128",uri:t.attributes.URI},void 0!==t.attributes.IV&&(r.iv=t.attributes.IV)):this.trigger("warn",{message:"ignoring key declaration without URI"}):r=null:this.trigger("warn",{message:"ignoring key declaration without attribute list"})},"media-sequence":function(){isFinite(t.number)?this.manifest.mediaSequence=t.number:this.trigger("warn",{message:"ignoring invalid media sequence: "+t.number})},"discontinuity-sequence":function(){isFinite(t.number)?(this.manifest.discontinuitySequence=t.number,d=t.number):this.trigger("warn",{message:"ignoring invalid discontinuity sequence: "+t.number})},"playlist-type":function(){/VOD|EVENT/.test(t.playlistType)?this.manifest.playlistType=t.playlistType:this.trigger("warn",{message:"ignoring unknown playlist type: "+t.playlist})},map:function(){a={},t.uri&&(a.uri=t.uri),t.byterange&&(a.byterange=t.byterange)},"stream-inf":function(){this.manifest.playlists=n,this.manifest.mediaGroups=this.manifest.mediaGroups||o,t.attributes?(u.attributes||(u.attributes={}),Object.assign(u.attributes,t.attributes)):this.trigger("warn",{message:"ignoring empty stream-inf attributes"})},media:function(){if(this.manifest.mediaGroups=this.manifest.mediaGroups||o,t.attributes&&t.attributes.TYPE&&t.attributes["GROUP-ID"]&&t.attributes.NAME){var e=this.manifest.mediaGroups[t.attributes.TYPE];e[t.attributes["GROUP-ID"]]=e[t.attributes["GROUP-ID"]]||{},i=e[t.attributes["GROUP-ID"]],(s={default:/yes/i.test(t.attributes.DEFAULT)}).default?s.autoselect=!0:s.autoselect=/yes/i.test(t.attributes.AUTOSELECT),t.attributes.LANGUAGE&&(s.language=t.attributes.LANGUAGE),t.attributes.URI&&(s.uri=t.attributes.URI),t.attributes["INSTREAM-ID"]&&(s.instreamId=t.attributes["INSTREAM-ID"]),t.attributes.CHARACTERISTICS&&(s.characteristics=t.attributes.CHARACTERISTICS),t.attributes.FORCED&&(s.forced=/yes/i.test(t.attributes.FORCED)),i[t.attributes.NAME]=s}else this.trigger("warn",{message:"ignoring incomplete or missing media group"})},discontinuity:function(){d+=1,u.discontinuity=!0,this.manifest.discontinuityStarts.push(n.length)},"program-date-time":function(){void 0===this.manifest.dateTimeString&&(this.manifest.dateTimeString=t.dateTimeString,this.manifest.dateTimeObject=t.dateTimeObject),u.dateTimeString=t.dateTimeString,u.dateTimeObject=t.dateTimeObject},targetduration:function(){!isFinite(t.duration)||t.duration<0?this.trigger("warn",{message:"ignoring invalid target duration: "+t.duration}):this.manifest.targetDuration=t.duration},totalduration:function(){!isFinite(t.duration)||t.duration<0?this.trigger("warn",{message:"ignoring invalid total duration: "+t.duration}):this.manifest.totalDuration=t.duration},start:function(){t.attributes&&!isNaN(t.attributes["TIME-OFFSET"])?this.manifest.start={timeOffset:t.attributes["TIME-OFFSET"],precise:t.attributes.PRECISE}:this.trigger("warn",{message:"ignoring start declaration without appropriate attribute list"})},"cue-out":function(){u.cueOut=t.data},"cue-out-cont":function(){u.cueOutCont=t.data},"cue-in":function(){u.cueIn=t.data}}[t.tagType]||g).call(e)},uri:function(){u.uri=t.uri,n.push(u),this.manifest.targetDuration&&!("duration"in u)&&(this.trigger("warn",{message:"defaulting segment duration to the target duration"}),u.duration=this.manifest.targetDuration),r&&(u.key=r),u.timeline=d,a&&(u.map=a),u={}},comment:function(){},custom:function(){t.segment?(u.custom=u.custom||{},u.custom[t.customType]=t.data):(this.manifest.custom=this.manifest.custom||{},this.manifest.custom[t.customType]=t.data)}})[t.type].call(e)})),t&&this.push(t)}push(t){this.lineStream.push(t)}end(){this.lineStream.push("\n")}addParser(t){this.parseStream.addParser(t)}addTagMapper(t){this.parseStream.addTagMapper(t)}}Object.assign(t,{m3u8parser:n})}(t)}(this);

let urlmap;
let origin;
let chunks = [];
let PathIndex = 1;
const KeyBufferList = {};
const AESLIST = {};
function read_path(url){
    let urlInfo = new URL(url);
    urlmap = url.split('/').slice(0,-1).join('/')+'/';
    origin = urlInfo.origin;

}
function get_path(str) {
    if (str.indexOf('http') === 0 || str.indexOf('//') === 0) {
        if(str.indexOf('//') === 0)str = 'https:'+str;
        read_path(str);
    }else if(str.charAt(0)==='/'){
        str = (origin||location.origin)+str; 
    }else if(urlmap){
        str = urlmap+str; 
    }
    return str;
}
function ajax(url,istext,progress){
    return new Promise(back=>{
        let request = new XMLHttpRequest;
        request.addEventListener('readystatechange',function(event){
            if(request.readyState===request.DONE){
                back(request.response);
            }
        });
        let speed = 0;
        progress instanceof Function&&request.addEventListener('progress',function(e){
            if(!speed)speed = e.loaded;
            else speed = e.loaded - speed;
            progress(e.loaded, e.total,speed);
        });
        request.responseType = istext?istext=='json'?'json':'text':'arraybuffer';
        request.open('GET',url);
        request.send();
    });
}

function createInitializationVector(segmentNumber) {
    var uint8View = new Uint8Array(16);
    for (var i = 12; i < 16; i++) {
      uint8View[i] = segmentNumber >> 8 * (15 - i) & 0xff;
    }
    return uint8View;
  }
self.addEventListener('message',async function(event){
    if(event.data=='close'){
        if(chunks.length){
            postMessage({
                close:true,
                PathIndex,
                ready:'下载完成',
                result:new Blob(chunks,{type:'video/mp2t'})
            });
        }
        return self.close();
    }else if(typeof event.data !='string'){
        return;
    }
    let url = event.data;
    const list = [];
    postMessage({
        info:'解析文件中',
    });
    url = get_path(url);
    console.log(url);;
    let m3u8Text = await ajax(url,!0);
    if(!m3u8Text){
        postMessage({
            info:'解析失败',
        });
        self.close();
        return;
    }
    let parser = new m3u8parser(m3u8Text);
    if (!parser.manifest.segments.length) {
        postMessage({
            info:'解析成功!分析索引',
        });
        if(parser.manifest.playlists&&parser.manifest.playlists.length){                    
            for(let item of parser.manifest.playlists){
                //if (item.attributes) Object.assign(ATTR, item.attributes);
                let m3u8Url = get_path(item.uri);
                let nextParser = new m3u8parser(await ajax(m3u8Url, !0));
                if (nextParser.manifest.segments.length) {
                    list.push(...nextParser.manifest.segments.map(v => {
                        v.uri = get_path(v.uri);
                        if (v.key &&typeof v.key.uri ==='string') {
                            if (v.key.uri.charAt(0) == '/') {
                                v.key.href = get_path(v.key.uri);
                            }
                        }
                        return v;
                    }));
                }

            }
        }else if(parser.lineStream&&parser.lineStream.buffer){
            let m3u8Url = get_path(parser.lineStream.buffer);
            m3u8Url = get_path(m3u8Url);
            let nextParser = new m3u8parser(await ajax(m3u8Url, !0));
            if (nextParser.manifest.segments.length) {
                list.push(...nextParser.manifest.segments.map(v => {
                    v.uri = get_path(v.uri);
                    if (v.key &&typeof v.key.uri ==='string') {
                        if (v.key.uri.charAt(0) == '/') {
                            v.key.href = get_path(v.key.uri);
                        }
                    }
                    return v;
                }));
            }

        }
    }else{
        postMessage({
            info:'解析成功!分析影片序列',
        });
        list.push(...parser.manifest.segments.map(v => {
            v.uri = get_path(v.uri);
            if (v.key && typeof v.key.uri === 'string') {
                if (v.key.uri.charAt(0) == '/') {
                    v.key.href = get_path(v.key.uri);
                }
            }
            return v;
        }));
    }
    postMessage({
        info:'解析完毕,进行下载',
    });
    let index = 0;
    let length = 0;
    let nowbuff;
    let AesIndex = {};
    let AesKEY = {};
    //postMessage({log:list});
    for(let frag of list){
        let databuf = await ajax(frag.uri,null,(loadsize,fullsize,chunksize)=>{
            let sd = '当前速率'+(chunksize/1024).toFixed(0)+'KB';
            let cp = fullsize>0?',当前进度'+(loadsize*100/fullsize).toFixed(2)+'%':'';
            postMessage({
                info:'下载中:'+(length+1)+'/'+list.length+sd+cp,
            });
        });
        if(databuf&&databuf.byteLength){
            if (frag.key&&frag.key.href) {
                if(nowbuff!=frag.key.href&&chunks.length){
                    let result = new Blob(chunks,{type:'video/mp2t'});
                    postMessage({
                        ready:'下载完成',
                        PathIndex,
                        result
                    });
                    chunks = [];
                    PathIndex+=1;
                }
                nowbuff = frag.key.href;
                let iv = createInitializationVector(length).buffer;
                if(0&&self.crypto){
                    if(!AesKEY[frag.key.href]){
                        AesKEY[frag.key.href] = await crypto.subtle.importKey('raw',await (await fetch(frag.key.href)).arrayBuffer(),"AES-CBC",false,['decrypt','encrypt']);
                    }
                    databuf = await crypto.subtle.decrypt({name:'AES-CBC',iv},AesKEY[frag.key.href],databuf);

                }else{
                    if(!AESLIST[frag.key.href]){
                        let buf = await (await fetch(frag.key.href)).arrayBuffer();
                        let aes = new AESDecryptor();
                        aes.constructor();
                        aes.expandKey(buf);
                        AESLIST[frag.key.href] = aes;
                    }
                    databuf = AESLIST[frag.key.href].decrypt(databuf,0,iv,true);

                }
            }
            length++;
            chunks.push(databuf);
        }
    }
    if(!chunks.length) {
        postMessage({
            info:'下载失败',
        });
        self.close();
        return
    };
    chunks.length&&postMessage({
        PathIndex,
        result:new Blob(chunks,{type:'video/mp2t'})
    });
    chunks.length&&postMessage({
        ready:'下载完成',
        close:true
    });
    self.close();
});