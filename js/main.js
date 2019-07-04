/**
 * Created by YorkLu on 2019/7/4.
 */
var copyrightText = document.getElementById("copyritht");
var coNameUnicode = "©2019 "+"\u4e2d\u79fb\u5728\u7ebf\u670d\u52a1\u6709\u9650\u516c\u53f8\u5e7f\u4e1c\u5206\u516c\u53f8\u0020";
copyrightText.innerHTML = coNameUnicode;

var anima_container =  document.getElementById('anima_container');
const animation = lottie.loadAnimation({
    container: anima_container, // the dom element that will contain the animation
    renderer: 'canvas',
    loop: true,
    autoplay: true,
    path: 'data.json' // the path to the animation json
});

animation.addEventListener('DOMLoaded',function(){
    var anima_canvas = document.getElementsByTagName('canvas')[0];
    alert(anima_canvas.nodeName);

    var gif = new GIF({
        workers: 2,
        quality: 10,
        width: anima_canvas.width,
        height: anima_canvas.height
    });

    //添加一个canvas对象的像素到当前帧
    gif.addFrame(document.getElementsByTagName('canvas')[0], {
        delay: 200
    });
    gif.addFrame(document.getElementsByTagName('canvas')[0], {
        delay: 200
    });
    gif.addFrame(document.getElementsByTagName('canvas')[0], {
        delay: 200
    });

//合成图片成功后
    gif.on('finished', function(blob) {
        window.open(URL.createObjectURL(blob));
    });
//渲染图片
    gif.render();
});

