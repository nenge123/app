importScripts('../lib/WorkerApp.js');
//importScripts('../lib/MyWorker.js');
importScripts('./SQLite3.js');
const AppSQL = new class WorkerAppSQLite extends WorkerApp {
    constructor() {
        super('sql-lite');
        const App = this;
        App.datafile = 'data.sqlite3';
        App.functions.set('onInitialized', async function (back) {
            await SQLite3Ready;
            back(true);
        });
        App.onRun();
    }
    methods = new Map(
        Object.entries({
            isCreate(data, port) {
                return this.database instanceof self.SQLite3;
            },
            async setFile(data, port) {
                this.datafile = data.result;
                return await this.callMethod('isFile');
            },
            async isFile() {
                return await this.cache_has(this.datafile);

            },
            async install(data) {
                this.callMethod('SQLite_setMethod');
                if (data.result === true) {
                    let u8 = await this.cache_read(this.datafile);
                    if (u8 instanceof Uint8Array && u8.byteLength>1) {
                        let mime2 = new TextDecoder().decode(u8.slice(0, 6));
                        if (mime2 != 'SQLite') {
                            u8 = undefined;
                        }
                    }else{
                        u8 = undefined;
                    }
                    this.database = new self.SQLite3(u8);
                    if (!u8) return false;
                } else if (data.result && typeof data.result === 'string') {
                    let response = await fetch(data.result).catch(e => undefined);
                    if (response && response.status == 200) response = new Uint8Array(await response.arrayBuffer());
                    this.database = new self.SQLite3(response);
                    return response ? true : false;
                } else {
                    this.database = new self.SQLite3(data.result);
                    return data.result ? true : false;
                }
                return true;
            },
            async reInstall(data) {
                this.callMethod('database_close');
                if (data.result && data.result.byteLength) {
                    this.database = new self.SQLite3(data.result);
                } else {
                    let u8 = await this.cache_read(this.datafile);
                    this.database = new self.SQLite3(u8);
                }
                return true;
            },
            SQLite_setMethod() {
                ['run', 'exec'].concat(Reflect.ownKeys(self.SQLite3.prototype)).forEach(v => {
                    if(v=>v.indexOf('_')===-1&&v!='constructor'){
                        this.methods.set(v, new Function('data', 'port', 'return this.database.' + v + '.apply(this.database,data.result instanceof Array?data.result:[data.result])'));
                    }
                })
            },
            publicMethod() {
                return Array.from(this.methods.keys()).filter(v=>v.indexOf('_')===-1);
            },
            async closeworker(data, port) {
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            async savedata(){
                return await this.cache_write(this.datafile, this.database.export(), 'sqlite3')?true:false;
            },
            database_close(){
                this.database&&this.database.close();
            },
            async save2exit(data, port) {
                await this.callMethod('savedata');
                this.callMethod('database_close');
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            async exitworker(data, port) {
                this.callMethod('database_close');
                port&&port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            async clear2exit(data, port) {
                await this.callFunc('cache_remove', this.datafile);
                this.callMethod('database_close');
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            async importFile(data, port) {
                const file = data.result;
                const mode = data.mode;
                const tablelist = data.tablelist;
                const password = data.password;
                const mime = await (file.slice(0,2).text());
                const keylist = Object.keys(tablelist.data);
                if (mime == 'PK') {
                    const datas = await this.unzip(file,password);
                    if (datas && datas.size) {
                        for (let item of datas) {
                            await this.callMethod('import_read_buf', item[1], mode, keylist);
                        }
                    }
                } else {
                    await this.callMethod('import_read_buf', new Uint8Array(await file.arrayBuffer()), mode, keylist);
                }
                return await this.callMethod('savedata');
            },
            async import_read_buf(buf, mode, keylist) {
                let mime = new TextDecoder().decode(buf.slice(0, 6));
                if (mime == 'SQLite') {
                    await this.cache_write(sqlfile, file, 'sqlite3');
                } else if (mime.charAt(0) == '{' || mime.charAt(0) == '[') {
                    let json = JSON.parse(new TextDecoder().decode(buf));
                    if (json && json.constructor === Object) {
                        json = Object.values(json);
                    }
                    this.callMethod('import_readwrite_json', json, mode, keylist);
                }

            },
            import_readwrite_json(json, mode, keylist) {
                let keys = mode === 1 ? keylist.slice(1) : keylist;
                let sqlstr = 'INSERT INTO `data` (' + keys.map(v => '`' + v + '`').join(',') + ') VALUES (' + (keys.map(v => '?').join(',')) + ')';
                for (let item of json) {
                    const sqlarr = [];
                    keys.forEach(v => {
                        sqlarr.push(item[v] || '')
                    });
                    if (mode === 0 && item['id']) {
                        this.database.run('DELETE FROM `data` WHERE `id` = ?', [item['id']]);
                    }
                    this.database.run(sqlstr, sqlarr);
                    if(item.type){
                        item.type.split(',').forEach(v=>{
                            v = v.trim();
                            let num = this.database.selectColumnSQL('tag','WHERE `name` = ?',[v],'`num`');
                            if(!num){
                                this.database.insertJson('tag',{name:v,num:1});
                            }else{
                                this.database.updateSQL('tag',' `num` = `num` + ?  WHERE `name` = ? ;',[1,v]);
                            }
                        });

                    }
                }
            },
            Html2Video(data,port){
                let {page,tag,search,limit,order,maxlength} = data.result;
                let listHTML = '<form class="video-search" onsubmit="myVideo.SetSearch(this,arguments);"><input type="text" class="textbox" name="search" value="'+(search?search:'')+'"><button type="submit" class="l-btn">搜索</button><button type="button" class="l-btn" onclick="myVideo.ClearSet(this,arguments)">清除筛选</button></form>';
                let sql = '';
                let sqlarr = [];
                let sqlparme = [];
                limit = limit?limit:27;
                maxlength = maxlength?maxlength:8;
                if(tag){
                    sqlarr.push('`type` LIKE ? ');
                    sqlparme.push('%'+tag+'%');
                }
                if(search){
                    sqlarr.push('`title` LIKE ?');
                    sqlparme.push('%'+search+'%');
                }
                if(sqlarr.length){
                    sql+= ' WHERE '+sqlarr.join(' AND ');
                }
                const total = this.database.selectCountSQL('data',sql,sqlparme)||0;
                let maxpage = Math.floor(total/limit);
                page = page>maxpage?maxpage:parseInt(page>0?page:1);
                if(total){
                    sql+= ' ORDER BY `id` '+(order=='ASC'?'ASC':'DESC')+' LIMIT '+(limit*(page - 1))+','+limit;
                    let list = this.database.selectSQL('data',sql,sqlparme);
                    if(list&&list.length){
                        listHTML += '<h3 class="video-list-h3">视频列表</h3><ul class="video-list-ul">';
                        list.forEach(item=>{
                            listHTML += `<li class="video-item l-btn"><div onclick="myVideo.OpenPlay('${item.id}',arguments,this)" title="${item.title.replace('"',"&quot;	")}">`;
                            listHTML += `<div><img src="${item.img}"/></div><p>${item.title}</p>`;
                            if(item.time){
                                let time = new Date(parseInt(item.time*1000));
                                listHTML += `<p>${time.toLocaleDateString()}</p>`;
                            }
                            listHTML += `</div></li>`;
                        });
                        listHTML+='</ul>';
                    }
                }else{
                    listHTML +='<h3 class="video-list-h3">没找到数据,请导入数据或者清除筛选!<code>{id:1,url:"xxxx.m3u8",img:"",title:"",type:""}</code></h3>';
                }
                let taglist = this.database.selectSQL('tag',' ORDER BY `num` desc',[]);
                if(taglist&&taglist.length){
                    listHTML +='<h3 class="video-tag-h3">标签云</h3><ul class="video-tag-ul">';
                    taglist.forEach(item=>{
                        listHTML+=`<li class="video-tag-item"><span onclick="myVideo.SetTag('${encodeURI(item.name)}',arguments)">${item.name}(${item.num})</span></li>`;
                    });
                    listHTML +='</ul>';
                }
                port.postMessage({
                    id:data.id,
                    workerId:data.workerId,
                    result:{
                        total,
                        limit,
                        maxpage,
                        page,
                        html:listHTML,
                        pageHtml:this.callMethod('html_page_pagination',page,maxpage,maxlength)
                    }
                });
                this.callMethod('exitworker');
            },
            html_page_pagination(page,maxpage,maxlengh){
                maxlengh = maxlengh?maxlengh:8;
                let leftnavs = [];
                let rightnavs = [];
                for(let i=0;i<=8;i++){
                    if(i==0||page+i<maxpage){
                        if(page+i==maxpage||page+i==1){
                            continue;
                        }
                        let num = page+i;
                        rightnavs.push(num);
                        maxlengh--;
                    }
                    if (maxlengh < 0) break;
                    if(i>0&&page-i>1){
                        let num = page-i;
                        leftnavs.unshift(num);
                        maxlengh--;
                    }
                    if (maxlengh < 0) break;
                }
                let html = '<nav class="video-pagination"><span class="l-btn" onclick="myVideo.SetPage(1,arguments)" '+(page===1?'class="active"':'')+'>顶页</span>';
                leftnavs.concat(rightnavs).forEach(p=>{
                    html += '<span class="l-btn" onclick="myVideo.SetPage('+p+',arguments)" '+(page===p?'class="active"':'')+'>'+p+'</span>';
                });
                html +='<span class="l-btn" onclick="myVideo.SetPage('+maxpage+',arguments)" '+(page===maxpage?'class="active"':'')+'>末页</span></nav>';
                return html;
            },
            Html2Play(data,port){
                let item = this.database.selectOne('data',{id:data.result});
                let html = '<h2>'+item.title+'</h3><video id="video-media" controls hidden></video><h3 class="video-play-h3">视频列表</h3><ul class="video-play-ul">';
                item.url.split('||').forEach((url,index)=>{
                    html += `<li><span onclick="myVideo.playUrl('${encodeURI(url)}',arguments)">第${index+1}集</span></li>`;
                });
                html +='</ul><h3 class="video-play-h3">尝试下载(iPhone11+ios16,安卓11测试通过)</h3><p>下载视频将会是MPEG编码的TS视频,请使用多功能播放器播放!手机可能存在播放条时间异常(不能选段播放)!</p><ul class="video-play-ul2">';
                item.url.split('||').forEach((url,index)=>{
                    html += `<li><span onclick="myVideo.downUrl('${encodeURI(url)}',arguments,this)" title="${item.title.replace('"',"&quot;	")} - ${index+1}">下载第${index+1}集</span></li>`;
                });
                html +='</ul>';
                port.postMessage({
                    id:data.id,
                    workerId:data.workerId,
                    result:html
                });
                this.callMethod('exitworker')
            },
            exportJSON(data,port){
                console.log(data);
                let json = this.database.selectOne('data',{id:data.result});
                console.log(json);
                return new Blob(['['+JSON.stringify(json)+']'],{type:'application/json'});
            }
        })
    );
}