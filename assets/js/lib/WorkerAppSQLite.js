class WorkerAppSQLite extends self.WorkerApp {
    filepath = 'data.sqlite3';
    constructor() {
        super(true);
        Object.entries({
            async _Initialized(back,port) {
                const wasmBinary =  await this.callFunc('loadBuffer',this.wasmfile,port,652953);
                initSqlJs({wasmBinary});
                const sqlite3 = await initSqlJsPromise;
                delete sqlite3.wasmBinary;
                self.SQLite3  = self.getSQLite3(sqlite3);
                this.sqlite3 = sqlite3;
                back(true);
            },
            async setInfo(data, port) {
                this.filepath = data.result.filepath;
                this.tablelist = data.result.tablelist;
                return true;
            },
            async createList() {
                Array.from(Object.entries(this.tablelist) || [], e => this.database.createTable(e[0], e[1]));
                return await this.callMethod('savedata');
            },
            async hasFile(data,port) {
                return await this.cache_has(data.result);
            },
            async install(data) {
                if(this.database) return true;
                this.callMethod('__setMethod');
                const result = data.result;
                switch(true){
                    case result === true:{
                        let u8 = await this.cache_read(this.filepath);
                        if (u8 instanceof Uint8Array && u8.byteLength > 1) {
                            let mime2 = new TextDecoder().decode(u8.slice(0, 6));
                            if (mime2 != 'SQLite') {
                                u8 = undefined;
                            }
                        } else {
                            u8 = undefined;
                        }
                        this.database = new self.SQLite3(u8);
                        return !u8?false:true;
                        break;
                    };
                    case result && typeof result === 'string':{
                        let response = await fetch(result).catch(e => undefined);
                        if (response && response.status == 200) response = new Uint8Array(await response.arrayBuffer());
                        this.database = new self.SQLite3(response);
                        return response instanceof Uint8Array ? true : false;
                        break;
                    };
                    case result instanceof Uint8Array:{
                        this.database = new self.SQLite3(result);
                        return true;
                        break;
                    };
                    default:{
                        this.database = new self.SQLite3();
                        return false;
                        break;
                    }
                }
            },
            __setMethod() {
                ['run', 'exec'].concat(Reflect.ownKeys(self.SQLite3.prototype)).forEach(v => {
                    if (v => v.indexOf('_') === -1 && v != 'constructor') {
                        this.methods.set('SQL:'+v, new Function('data', 'port', 'return this.database.' + v + '.apply(this.database,data.result instanceof Array?data.result:[data.result])'));
                    }
                })
            },
            resultMethod() {
                return Array.from(this.methods.keys()).filter(v => v.indexOf('_') === -1);
            },
            async closeworker(data, port) {
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            async savedata() {
                return await this.cache_write(this.filepath, this.database.export(), 'sqlite3') ? true : false;
            },
            async save2exit(data, port) {
                await this.callMethod('savedata');
                this.callMethod('database_close');
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
            },
            database_close() {
                this.database && this.database.close();
                delete this.database;
            },
            exit_close() {
                this.callMethod('database_close');
                self.close();
            },
            exit_result(port,id,result){
                port.postMessage({id,result});
                this.callMethod('exit_close');
            },
            async exitworker(data, port) {
                this.callMethod('database_close');
                port && port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
            },
            async clear2exit(data, port) {
                await this.callFunc('cache_remove', this.filepath);
                this.callMethod('database_close');
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
            },
            async importFile(data, port) {
                const file = data.result;
                const insertkeys = data.insertkeys;
                if (file instanceof Map) {
                    for (let newbuf of file) {
                        if (!newbuf[1].byteLength) continue;
                        let result = await this.callMethod('read_and_insert_buf', newbuf[1], insertkeys);
                        if (result) return result;
                    }
                } else if (file instanceof Uint8Array) {
                    let result = await this.callMethod('read_and_insert_buf', file, insertkeys);
                    if (result) return result;
                }
                return await this.callMethod('savedata');
            },
            async read_and_insert_buf(buf, keylist) {
                let mime = new TextDecoder().decode(buf.slice(0, 6));
                if (mime == 'SQLite') {
                    return await this.callFunc('cache_write', this.filepath, buf, 'sqlite3');
                } else if (mime.charAt(0) == '{' || mime.charAt(0) == '[') {
                    let json = JSON.parse(new TextDecoder().decode(buf));
                    if (json && json.constructor === Object) {
                        json = Object.values(json);
                    }
                    this.callMethod('insert_data_and_tag', json, keylist);
                }

            },
            insert_data_and_tag(json, keys) {
                for (let item of json) {
                    let updatedata = Object.fromEntries(keys.map(v=>[v,item[v]||'']));
                    if (updatedata['id']) {
                        //存在数据更新
                        const result = this.database.selectOne('data',{id:updatedata['id']});
                        if(result&&result['id']){
                            this.database.updateJson('data',updatedata,{id:result['id']});
                            continue;
                        }
                    }
                    this.database.insertJson('data',updatedata);
                    if (updatedata.type) {
                        let type_name = item.type.trim();
                        let type_num = this.database.selectColumnJson('tag',{name:type_name}, '`num`');
                        if (!type_num) {
                            this.database.insertJson('tag', { name:type_name, num: 1 });
                        } else {
                            this.database.updateJson('tag',{num:type_num+1},{name:type_name});
                        }
                    }
                }
            },
            page_pagination(page, maxpage,total, maxlength) {
                maxlength = maxlength ? maxlength : 8;
                const len = maxlength;
                let leftnavs = [];
                let rightnavs = [];
                for (let i = 0; i <= len; i++) {
                    if (i == 0 || page + i < maxpage) {
                        if (page + i == maxpage || page + i == 1) {
                            continue;
                        }
                        let num = page + i;
                        rightnavs.push(num);
                        maxlength--;
                    }
                    if (maxlength < 0) break;
                    if (i > 0 && page - i > 1) {
                        let num = page - i;
                        leftnavs.unshift(num);
                        maxlength--;
                    }
                    if (maxlength < 0) break;
                }
                const pagelist = leftnavs.concat(rightnavs);
                return this.callMethod('html_page_pagination',pagelist,page,maxpage,total);
            },
            exportID(data, port) {
                this.callMethod('exit_result',port,data.id,new Blob([JSON.stringify([this.database.selectOne('data', { id: data.result })])]));
            },
            async deleteID(data, port) {
                //console.log(data);
                this.database.deleteJson('data', { id: parseInt(data.result) });
                await this.callMethod('savedata');
                port.postMessage({
                    id: data.id,
                    result: true
                });
                this.callMethod('exit_close');
            },
            async deleteTag(data,port){
                this.database.deleteJson('data', { type:data.result});
                this.database.deleteJson('tag', { name:data.result});
                await this.callMethod('savedata');
                return true;
            },
            exportTag(data,port){
                const result = this.database.selectAll('data',{type:data.result});
                this.callMethod('exit_result',port,data.id,new Blob([JSON.stringify(result)]));
            }
        }).forEach(entry=>{
            this.methods.set(entry[0],entry[1]);
        });
    }
}
Object.defineProperties(self,{WorkerAppSQLite:{get:()=>WorkerAppSQLite}});