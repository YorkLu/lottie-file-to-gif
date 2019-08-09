/**
 * Created by YorkLu on 2019/7/4.
 */


// 浏览器UA信息
function getUAInfo() {
        var u = navigator.userAgent, app = navigator.appVersion;
        return {         //移动终端浏览器版本信息
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //IOS终端
            android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或uc浏览器
            iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1, //是否iPad
            webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
        };
}

// onload
function init() {
    var ua = getUAInfo();
    // 再见IE
    if(ua.trident){
        alert("为避免不兼容，建议使用非IE浏览器打开，如：Firefox、Chrome、Opera，或搜狗高速模式、QQ浏览器等");
    }
    if(ua.mobile){
        alert("为避免不兼容，建议在PC端用非IE浏览器打开 : )");
    }
}

// 前往设计按钮
$("#goToEmotion").bind('click', function () {
    window.open("https://design.alipay.com/emotion");
});

// 上传文件按钮
$("#fileUploader").bind('click', function (event) {
    $('#inputFile').click();
    event.stopPropagation();
});

// 导出按钮
$("#exportBtn").bind('click', function () {
    //动画已初始化且未完成录制
    if(animator_init&&!gif_recording_finish){
        animatorControlerInit();
        //点击背景后不隐藏模态框
        $('#animatorNotInitErr,#gifRenderModalFooter,#downloadGIF,#animator2GifResult').hide();
        $('#gifRenderIsWorking').show();
        $('#gifRenderModal').attr('data-backdrop','static');
        $('#gifRenderModal').modal();
        frameRecord();
    }
    //已完成录制
    else if(animator_init&&gif_recording_finish){
        $('#gifRenderModal').modal();
    }
    //未上传
    else{
        $('#gifRenderModal').modal();
    }
});

/* 文件处理部分开始 */
// 阻止冒泡
$("#inputFile").bind('click', function (event) {
    event.stopPropagation();
});

// 校验并获取文件内容
function selectFile(target) {
    if (target.value == "") {
        alert("请选择文件");
        return false;
    }

    var files = target.files;//获取文件列表
    if (files.length == 0) {
        alert('请选择文件');
    }
    else {
        console.log(files[0].size); //文件字节数
        var reader = new FileReader();//新建一个FileReader
        reader.readAsText(files[0], "UTF-8");//读取文件
        reader.onload = function (evt) { //读取完文件之后会回来这里
            var fileString = evt.target.result; // 读取文件内容
            console.log(fileString)
        }
        var objFileURL = URL.createObjectURL(files[0]);
        creatAnimator(objFileURL);
    }
}
/* 文件处理部分结束 */

/* 动画处理部分开始 */
// 全局变量
var animator;                           //动画对象
var animator_init = false;              //是否已初始化
var animator_at_frame = 0;              //当前处于第几帧
var animator_container = document.getElementById('animator_container');
var animator_duration;                  //动画持续时间，单位毫秒
var animator_frames;                    //动画帧数
var animator_jump_to = 0;               //动画跳转至该时间，单位毫秒
var animator_canvas;                    //canvas对象
var gif;                                //gif对象
var gif_frame_delay;                    //gif帧延迟
var gif_recording_finish = false;       //gif是否完成录制

//通过lottie-web从json文件生成动画
function creatAnimator(path) {
    //如果已初始化
    if (animator_init) {
        //重置播放控制器
        animatorControlerInit();

        //销毁前一个动画
        animator.destroy();

        //重置变量
        animator_init = false;
        animator_jump_to = 0;
        gif_recording_finish = false;
        animator_at_frame = 0;
    }

    //初始化
    animator = lottie.loadAnimation(
        {
            container: animator_container, // the dom element that will contain the animator
            renderer: 'canvas',
            loop: true,
            autoplay: true,
            path: path// the path to the animator json
        }
    );
    animator_init = true;

    //监听：动画json文件加载完毕触发
    animator.addEventListener('data_ready', function () {
        console.log("Data Ready");
    });

    //监听：动画相关的dom已经被添加到html后触发
    animator.addEventListener('DOMLoaded', function () {
        //获取canvas对象
        animator_canvas = document.getElementsByTagName('canvas')[0];
        //获取时长
        animator_duration = parseInt(animator.getDuration() * 1000);
        //获取帧数
        animator_frames = parseInt(animator.getDuration(true));
        //每帧时长
        gif_frame_delay = parseInt(animator_duration / animator_frames);
        console.log("Duration:" + animator_duration + "\n");
        console.log("Frames:" + animator_frames + "\n");

        gif = new GIF({
            repeat: 0,
            workers: 2,
            quality: 1,
            workerScript: './js/gif.worker.js',
            width: animator_canvas.width,
            height: animator_canvas.height
        });

        window.location.hash = "#animator_controler";
    });

    //监听：data_failed，文件无法加载时触发
    animator.addEventListener('data_failed', function () {
        alert("无法加载动画文件，请检查是否为犸良导出的json动画");
    });

    //监听：loopComplete，一次循环播放完成触发
    animator.addEventListener('loopComplete', function () {
        animator_at_frame = 0;
        setProgress(Math.floor(0,"0/0"));
    });

    //监听：enterFrame，逐帧触发
    /*
    * TODO：对于部分文件，每帧触发不止两次，需要继续调试
    * TODO：百分比有校验合法性，描述文字没有，可能出现129/128
    * */

    animator.addEventListener('enterFrame', function () {
        //在lottie.js打印log发现，每帧会触发两次，enterFrame这个事件其实并不准确
        animator_at_frame +=0.5;
        setProgress(Math.floor(animator_at_frame/animator_frames*100),Math.floor(animator_at_frame)+"/"+animator_frames);
    });
}
/* 动画处理部分结束 */

/* 动画控制部分开始 */
//播放与暂停
$("#playBtn").bind('click',function () {
   if(animator_init){
       //点击播放按钮，暂停->播放
       if($("#playBtn").children("span:first-child").hasClass("glyphicon-play")){
           $("#playBtn").children("span:first-child").removeClass("glyphicon-play");
           $("#playBtn").children("span:first-child").addClass("glyphicon-pause");
           animator.play();
       }
       //点击暂停按钮，播放->暂停
       else {
           $("#playBtn").children("span:first-child").removeClass("glyphicon-pause");
           $("#playBtn").children("span:first-child").addClass("glyphicon-play");
           animator.pause();
       }
   }
});

//停止
$("#stopBtn").bind('click',function () {
    if(animator_init){
        animatorControlerInit();
    }
});

//播放控制器重置
function animatorControlerInit() {
    //停止动画
    animator.stop();
    //重置播放按钮
    if($("#playBtn").children("span:first-child").hasClass("glyphicon-pause")){
        $("#playBtn").children("span:first-child").removeClass("glyphicon-pause");
        $("#playBtn").children("span:first-child").addClass("glyphicon-play");
    }
    //重置进度及进度条
    animator_at_frame = 0;
    setProgress(0,"0/0");
}

/* 动画控制部分结束 */

// 进度条控制函数
function setProgress(progressNum,progressText) {
    console.log(progressNum+" "+progressText);
    if(isNaN(progressNum)){
        console.log("进度必须传数字");
    }
    else if(progressNum<0 || progressNum>100){
        console.log("进度必须在0~100范围内");
    }
    else{
        $("#progressBar").attr("aria-valuenow",progressNum);
        $("#progressBar").width(progressNum+"%");
        $("#progressBar").text(progressText);
    }
}

// gif录制函数：逐帧播放lottie动画并添加到gif中
function frameRecord() {
    if (!gif_recording_finish) {
        //animator_jump_to是动画时间
        animator.goToAndStop(animator_jump_to);
        gif.addFrame(animator_canvas.getContext("2d"), {
            delay: gif_frame_delay,
            copy: true
        });
        animator_jump_to += parseInt(gif_frame_delay);
        console.log("Add Frame");

        //启动渲染
        if (animator_jump_to >= animator_duration) {
            gif_recording_finish = true;
            //渲染图片
            gif.render();

            //合成图片成功后触发
            gif.on('finished', function (blob) {
                //恢复模态框底栏
                $('#gifRenderModalFooter').show();
                //隐藏提示
                $('#gifRenderIsWorking').hide();
                //显示图片及下载按钮
                $('#downloadGIF').attr('href',URL.createObjectURL(blob));
                var timestamp =  (new Date()).valueOf();
                $('#downloadGIF').attr('download',timestamp+".gif");
                $('#animator2GifResult').attr('src',URL.createObjectURL(blob));
                $('#downloadGIF,#animator2GifResult').show();

                window.open(URL.createObjectURL(blob));
            });
        }
        setTimeout("frameRecord()", 150);
    }
    else
        return;
}
