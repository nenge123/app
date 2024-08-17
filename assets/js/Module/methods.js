export default new Map(Object.entries({
    async openVideo(elm){
        if(!this.modules.has('myVideo')){
            elm.setAttribute('data-loading',1);
            const {default:MY_VIDEO} = await  import('./my_video.js'); 
            const video = await N.addTemplate('assets/template/video-index.htm',!0);
            N.bindTransition(video);
            const myVideo = new MY_VIDEO('video-play-list',video);
            this.modules.set('myVideo',myVideo);
            self.myVideo = myVideo;
            elm.removeAttribute('data-loading');
        }else{
            this.modules.get('myVideo').show()
        }
    },
    async refresh(){
        let elm = document.querySelector('#start-page');
        elm.querySelector('main').innerHTML = '';
        elm.querySelector('main').classList.add('loading');
        let sw2 = new MyWorker({url:'/app-sw.js',mode:'service'});
        await sw2.ready;
        await sw2.postMethod('refresh');
        window.requestAnimationFrame(()=>location.reload());
    }
}));