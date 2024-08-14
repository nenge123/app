importScripts('../lib/WorkerApp.js');
importScripts('../lib/WorkerAppSQLite.js');
importScripts('../lib/SQLite3.js');
importScripts('https://registry.npmmirror.com/sql.js/1.11.0/files/dist/sql-wasm.js');
const AppSQL = new class extends WorkerAppSQLite {
    wasmfile = 'https://registry.npmmirror.com/sql.js/1.11.0/files/dist/sql-wasm.wasm';
    constructor() {
        super();
        Object.entries({
            Html2Video(data, port) {
                let { page, tag, search, limit, order, maxlength } = data.result;
                let listHTML = '<form class="video-search" onsubmit="N.runModule(\'myVideo\',\'SetSearch\',this,arguments);"><input type="text" class="textbox" name="search" value="' + (search ? search : '') + '"><button type="submit" class="l-btn">搜索</button><button type="button" class="l-btn" onclick="N.runModule(\'myVideo\',\'ClearSet\',this,arguments)">清除筛选</button></form>';
                let sql = '';
                let sqlarr = [];
                let sqlparme = [];
                limit = limit ? limit : 27;
                maxlength = maxlength ? maxlength : 8;
                if (tag) {
                    sqlarr.push('`type` = ?');
                    sqlparme.push(tag);
                }
                if (search) {
                    sqlarr.push('`title` LIKE ?');
                    sqlparme.push('%' + search + '%');
                }
                if (sqlarr.length) {
                    sql += ' WHERE ' + sqlarr.join(' AND ');
                }
                const total = this.database.selectCountSQL('data', sql, sqlparme) || 0;
                let maxpage = Math.ceil(total / limit) || 1;
                page = page > maxpage ? maxpage : parseInt(page > 0 ? page : 1);
                if (total) {
                    sql += ' ORDER BY `id` ' + (order == 'ASC' ? 'ASC' : 'DESC') + ' LIMIT ' + (limit * (page - 1)) + ',' + limit;
                    let list = this.database.selectSQL('data', sql, sqlparme);
                    if (list && list.length) {
                        listHTML += '<h3 class="video-list-h3">视频列表</h3><ul class="video-list-ul">';
                        list.forEach(item => {
                            listHTML += `<li class="video-item btn-block"><div onclick="N.runModule(\'myVideo\',\'OpenPlay\','${item.id}',arguments,this)" title="${item.title.replace('"', "&quot;	")}">`;
                            listHTML += `<div><img src="${item.img}" onerror="this.src='/assets/images/zan.jpg'"/></div><p>${item.title}</p>`;
                            if (item.time) {
                                let time = new Date(parseInt(item.time * 1000));
                                let tagehtml = item.type.split(',')[0];
                                listHTML += `<p><span class="btn-blue">${tagehtml}:</span><span class="btn-pink">${time.toLocaleDateString()}</span></p>`;
                            }
                            listHTML += `</div></li>`;
                        });
                        listHTML += '</ul>';
                    }
                } else {
                    listHTML += '<h3 class="video-list-h3">没找到数据,请导入数据或者清除筛选!<code>{id:1,url:"xxxx.m3u8",img:"",title:"",type:""}</code></h3>';
                }
                let taglist = this.database.selectSQL('tag', ' ORDER BY `num` desc', []);
                if (taglist && taglist.length) {
                    listHTML += '<h3 class="video-tag-h3">标签云</h3><ul class="ul-grid nolist">';
                    let listHTML2 = '<h3 class="video-tag-h3">标签云管理</h3><ul class="ul-grid nolist">';
                    let listHTML3 = '<h3 class="video-tag-h3">标签云导出</h3><ul class="ul-grid nolist">';
                    taglist.forEach(item => {
                        listHTML += `<li><p class="p-block"><b>只看:</b><span onclick="N.runModule(\'myVideo\',\'SetTag\','${encodeURI(item.name)}',arguments)">${item.name}(${item.num})</span></p></li>`;
                        listHTML2 += `<li onclick="N.runModule(\'myVideo\',\'DelTag\','${encodeURI(item.name)}',arguments)"><p class="p-block"><b>删除全部</b><span>${item.name}</span></p></li>`;
                        listHTML3 += `<li onclick="N.runModule(\'myVideo\',\'exportTag\','${encodeURI(item.name)}',arguments)"><p class="p-block"><b>导出全部:</b><span>${item.name}(${item.num})</span></p></li>`;
                    });
                    listHTML2 +='</ul>';
                    listHTML3 +='</ul>';
                    listHTML += '</ul><br><br><br><br><br><br><br><br><br>'+listHTML3+listHTML2;
                }
                port.postMessage({
                    id: data.id,
                    result: {
                        total,
                        limit,
                        maxpage,
                        page,
                        html: listHTML,
                        pageHtml: this.callMethod('page_pagination', page, maxpage,total, maxlength)
                    }
                });
                this.callMethod('exit_close');
            },
            html_page_pagination(pagelist,page,maxpage,total){
                let html = '<div class="first"><button type="button" class="l-btn" onclick="N.runModule(\'myVideo\',\'SetPage\',1,arguments)" ' + (page === 1 ? 'class="active"' : '') + '>顶页</button>';
                if (pagelist.length) {
                    html += '&nbsp;&nbsp;<select onchange="N.runModule(\'myVideo\',\'SetPage\',this.value);">';
                    pagelist.forEach(p => {
                        html += '<option value="' + p + '" ' + (p === page ? 'selected' : '') + '>' + p + '</option>';
                    });
                    html += '</select>';
                }
                html += '&nbsp;&nbsp;<button type="button" class="l-btn" onclick="N.runModule(\'myVideo\',\'SetPage\',' + maxpage + ',arguments)" ' + (page === maxpage ? 'class="active"' : '') + '>末页</button>&nbsp;&nbsp;<from><label>跳转:<input class="textbox" style="width: 80px;" type="number" value="' + page + '" onchange="N.runModule(\'myVideo\',\'SetPage\',this.value,arguments)"></label></from></div>';
                return `<div class="flex-left-right">${html}<p class="p-block"><b>1-${maxpage}</b><span>页</span><b>${total}</b><span>条数据</span></p></div>`;

            },
            Html2Play(data, port) {
                let item = this.database.selectOne('data', { id: data.result });
                let html = '<h2>' + item.title + '</h2>';
                let html2 = '<h3>尝试下载,苹果用户需要所有下载文件块下载完毕,非常消耗内存,因此下载一次建议重开页面!</h3><ol>';
                html += '<h3 class="video-play-h3">视频列表</h3><ol class="ul-grid">';
                item.url.split('#').forEach((urlstr, index) => {
                    const urlarr = urlstr.split('$');
                    const url = urlarr.pop();
                    const textname = urlarr.pop() || '第' + (index + 1) + '集';
                    if (url) {
                        html += `<li><p class="p-block"><b>播放:</b><span onclick="N.runModule(\'myVideo\',\'playUrl\','${encodeURI(url)}',arguments)">${textname}</span></p></li>`;
                        html2 += `<li style="margin:10px auto;"><p class="p-block" onclick="N.runModule(\'myVideo\',\'downUrl\','${encodeURI(url)}',arguments,this)" title="${item.title.replace('"', "&quot;	")} - ${index + 1}"><b>下载:</b><span>${textname}</span></p></li>`;
                    }
                });
                html2 += '</ol>';
                html += '</ol>';
                html += '<div><video id="video-media" controls poster="'+item.img+'" hidden></video></div>';
                html += html2;
                html += `<br><br><br><br><div class="ul-grid">
                <p class="p-block"><span onclick="N.runModule('myVideo','exportID',${item.id})">导出数据</span></p><p class="p-block"><b onclick="N.runModule('myVideo','deleteID',${item.id})">删除数据</b><p></div>`;
                port.postMessage({
                    id: data.id,
                    result: html
                });
                this.callMethod('exit_close')
            },
            async caiji(data,port){
                console.log(data);
                const {url,page} = data.result;
                let caijisize = 0;
                let errorsize = 0;
                port.postMessage('采集开始');
                for(const i = parseInt(page);;i++){
                    let newurl =  url.replace('{page}',i);
                    port.postMessage('采集第'+i+'页:'+newurl);
                    let response = await fetch(newurl).catch(e=>e.message);
                    if(!(response instanceof Response)){
                        errorsize+=1;
                        port.postMessage('采集失败,网络错误:'+response);
                        break;
                    }
                    port.postMessage('采集成功,正在分析数据');
                    let json = await  response.json();
                    if(!json.list||!json.list){
                        port.postMessage('分析成功,但无数据可用,终止后续');
                        break;
                    }
                    port.postMessage('分析成功,含有'+json.list.length+'条数据');
                    for(const item of json.list){
                        if(!item['type_id'] || !item['type_name']){
                            continue;
                        }
                        let data = this.database.selectOne('data',{id:item['vod_id']});
                        if(data){
                            if(data['url']==item['vod_play_url']){
                                port.postMessage('数据重复:'+item['vod_name']);
                            }else{
                                this.database.updateJson('data',{
                                    title:item['vod_name'],
                                    img:item['vod_pic'],
                                    url:item['vod_play_url'],
                                    type:item['type_name'],
                                    time:item['vod_time_add'],
                                },{id:item['vod_id']});
                                port.postMessage('更新数据:'+item['vod_name']);
                                caijisize+=1;
                            }
                        }else{
                            this.database.insertJson('data',{
                                id:item['vod_id'],
                                title:item['vod_name'],
                                img:item['vod_pic'],
                                url:item['vod_play_url'],
                                type:item['type_name'],
                                time:item['vod_time_add'],
                            });
                            port.postMessage('写入书数据:'+item['vod_name']);
                            let type_name = item['type_name'].trim();
                            let type_num = this.database.selectColumnSQL('tag', 'WHERE `name` = ?', [type_name], '`num`');
                            if (!type_num) {
                                this.database.insertJson('tag', { name:type_name, num: 1 });
                            } else {
                                this.database.updateSQL('tag', ' `num` = `num` + ?  WHERE `name` = ? ;', [1, type_name]);
                            }
                            caijisize+=1;
                        }
                    }
                    await this.callMethod('savedata');
                    port.postMessage('第'+i+'页数据写入完成!');
                }
                port.postMessage({
                    id:data.id,
                    result:'操作完毕!采集了'+caijisize+'条数据,失败:'+errorsize+'个页面'
                });
                self.close();
            }
        }).forEach(entry=>this.methods.set(entry[0],entry[1]));
        this.onRun();
    }
}