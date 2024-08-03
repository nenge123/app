export default class MY_READER{
    sqlfile = 'my-reader.sqlite3';
    configname = 'reader-config';
    constructor(){
        let configdata = localStorage.getItem(this.configname);
        this.configdata = configdata?JSON.parse(configdata):{};
    }
    getConfig(name,val){
        if(name)return this.configdata[name]||val;
        return this.configdata;
    }
    setConfig(name,value){
        this.configdata[name] = value;
        localStorage.setItem(this.configname,JSON.stringify(this.configdata));
    }
    async start(){
        const R = this;
        this.VoiceList = await this.getVoices()||[];
        const list = [];
        this.VoiceList.forEach((v,index)=>{
            let text = v.name;
            this.voiceReplace.forEach(t=>{
                if(t)text = text.replace(t[0],t[1]);
            });
            list.push({value:index,text});
        });
        let index = this.getConfig('voiceIndex',0);
        if(!this.VoiceList[index]){
            index = 0;
            this.setConfig('voiceIndex',index);
        }
        $('#reader-voice').combobox('loadData',list);
        $('#reader-voice').combobox('options').onSelect = event=>{
            if(event.value!==this.configdata.voiceIndex)this.setConfig('voiceIndex',event.value);
            this.readText('欢迎使用小说阅读');
            console.log(event);
        }
        $('#reader-voice').combobox('setValue',index);
    }
    readText(text){
        const voice = new SpeechSynthesisUtterance(text);
        voice.voice = this.VoiceList[this.getConfig('voiceIndex',0)];
        try{
            speechSynthesis.speak(voice);
        }catch(e){
            speechSynthesis.resume();
        }
    }
    voiceReplace = [
        ['Microsoft ',''],
        ['- Chinese (Simplified, PRC)',' 普通话'],
        ['- Chinese (Cantonese Traditional)',' 广州话'],
        ['- Chinese (Taiwanese Mandarin)',' 台湾话'],
        ['- Chinese (Northeastern Mandarin)',' 东北话'],
        ['- Chinese (Zhongyuan Mandarin Shaanxi)',' 中原话'],
        ['- Chinese (Traditional, Hong Kong S.A.R.)','繁体香港话'],
        ['- Chinese (Mainland)',' 中国大陆'],
        ['- Chinese (Hong Kong)',' 中国香港'],
        ['- Chinese (Taiwan)',' 中国台湾'],
        ['Huihui','慧慧'],
        ['Kangkang','康康'],
        ['Yaoyao','瑶瑶'],
        ['HiuGaai','晓佳爱'],
        ['HiuMaan','晓马安'],
        ['WanLung','汪伦'],
        ['Xiaobei','小北'],
        ['Xiaoni','小妮'],
        ['HsiaoYu','小宇'],
        ['HsiaoChen','小陈'],
        ['Yunjian','云健'],
        ['Yunxia','云夏'],
        ['Yunxi','云溪'],
        ['Yunyang','云阳'],
        ['YunJhe','云洁河'],
        ['Xiaoxiao','小小'],
        ['Xiaoyi','小艺'],
        ['Online (Natural)','(线上)'],
        ['- Chinese','汉语'],
    ];
    getVoices(){
        return new Promise(back=>{
            let func = callback => {
                console.log(callback);
                let voice = self.speechSynthesis.getVoices().filter(v=>/zh\-/i.test(v.lang));
                if(!voice.length){
                    return window.requestAnimationFrame(func);
                }
                back(voice);
            };
            requestAnimationFrame(func);
        });
    }
}