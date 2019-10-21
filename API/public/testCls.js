const handleTest = async () => {
  let testTag = $("[name=testHashtag]").val();
  let testPhotoCount = $("[name=testNumOfPhotos]").val()
  let isHeadless = $("[name=TestisHeadless]")[0].checked
  await socket.emit("testPhotos", { testTag, testPhotoCount, isHeadless });
  $(".testLoader").show();
}

const testImg = async (testImg) => {
  activation = net.infer(testImg, 'conv_preds');
  const result = await classifier.predictClass(activation);
  $(testImg).parent().find("pre").find("code").html(JSON.stringify(result));
  $(testImg).show();
  $(testImg).parent().find("pre").show();
}

socket.on('testPhotos', async (data) => {
  $(".testLoader").hide();
  await data.photoSrcs.forEach(async (element, i) => {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () { testImg(this); }
    img.src = element;
    img.id = i;
    var div = document.createElement("div");
    div.setAttribute("class", "testImgDiv");
    var pre = document.createElement("pre");
    var code = document.createElement("code");
    $(pre).append(code);
    $(div).append(img);
    $(div).append(pre);
    $(".testPhotos").append(div);
  });
});

window.addEventListener('load', function () {
  document.querySelector('input[type="file"]').addEventListener('change', function () {
    if (this.files && this.files[0]) {
      var img = document.getElementById('myTestImg');
      img.src = URL.createObjectURL(this.files[0]);
      img.onload = function () { testImg(this); }
    }
  });
});

$(document).ready(() => {
  $("#photoTestForm").submit(function (e) {
    e.preventDefault();
  });
})