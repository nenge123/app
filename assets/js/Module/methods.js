export default new Map(Object.entries({
    async openVideo(){
        let video = document.querySelector('#video-main');
        if(!video){
            const {default:MY_VIDEO} = await  import('./my_video.js'); 
            const myVideo = new MY_VIDEO('video-play-list');
            video = await N.addTemplate('assets/template/video-index.htm',!0);
            $('#video-import').menubutton('disable');
            await myVideo.getList();
            $('#video-import').menubutton('enable');
            this.modules.set('myVideo',myVideo);
            self.myVideo = myVideo;
        }
        $.mobile.nav('#mainpage','#video-main');
    },
    async openReader(){
        let reader = document.querySelector('#reader');
        if(!reader){
            const {default:MY_READER} = await import('./my_reader.js'); 
            self.myReader = new MY_READER;
            reader = await N.addTemplate('assets/template/reader-index.htm',!0);
            self.myReader.start();
        }
        $.mobile.nav('#mainpage','#reader');
    },
    async refresh(){
        $.messager.progress();
        let sw2 = new MyWorker({url:'/app-sw.js',mode:'service'});
        await sw2.ready;
        await sw2.postMethod('refresh');
        window.requestAnimationFrame(()=>location.reload());
    }
}));