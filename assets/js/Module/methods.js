export default new Map(Object.entries({
    async openVideo(){
        let video = document.querySelector('#video');
        if(!video){
            const {default:MY_VIDEO} = await  import('./my_video.js'); 
            self.myVideo = new MY_VIDEO('video-play-list');
            video = await N.addTemplate('assets/template/video-index.htm',!0);
            self.myVideo.getList();
        }
        $.mobile.nav('#mainpage','#video');
    },
    async openReader(){
        let reader = document.querySelector('#reader');
        if(!reader){
            const {default:MY_READER} = await import('./my_reader.js'); 
            self.myReader = new MY_READER('video-play-list');
            reader = await N.addTemplate('assets/template/reader-index.htm',!0);
            self.myReader.start();
            const synth = window.speechSynthesis;
            console.log(synth.pending,synth.getVoices());
        }
        $.mobile.nav('#mainpage','#reader');
    }
}));