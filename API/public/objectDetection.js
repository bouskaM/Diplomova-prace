function Draw(imgID, bbox) {
    var img = document.getElementById(imgID);
    var cnvs = document.createElement("canvas")
    $(cnvs).height($(img).height() + 20);
    $(cnvs).width($(img).width() + 20);
    $(cnvs).css({ "top": img.offsetTop, "left": img.offsetLeft, position: "absolute" });
    $(cnvs).insertAfter(img);

    var ctx = cnvs.getContext("2d");
    ctx.beginPath();
    ctx.rect();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00ff00';
    ctx.stroke();
}