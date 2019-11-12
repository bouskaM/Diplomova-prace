let numOfImages = 0;
const handleTest = async () => {
  let testTag = $("[name=testHashtag]").val();
  let testPhotoCount = $("[name=testNumOfPhotos]").val();
  let isHeadless = $("[name=TestisHeadless]")[0].checked;
  let isFast = document.getElementsByName("testIsFast")[0].checked;
  await socket.emit("testPhotos", { testTag, testPhotoCount, isHeadless, isFast });
  $(".testLoader").show();
}


const createTable = (tableData) => {
  $("#resultTable").remove();
  var table = document.createElement('table');
  var tableHead = document.createElement('thead');
  var tableBody = document.createElement('tbody');
  table.setAttribute("class", "table");
  table.setAttribute("id", "resultTable");
  tableHead.innerHTML = `  
  <tr>
    <th scope="col" >Tag</th>
    <th scope="col" >Correctly Classified</th>
    <th scope="col" >Incorectly Classified</th>
  </tr>
  <button onclick="saveIncorrect()">Save Incorrectly Classified</button>
  `;
  tableData.forEach(function (rowData) {
    var row = document.createElement('tr');

    rowData.forEach(function (cellData) {
      var cell = document.createElement('td');
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  table.appendChild(tableHead);
  table.appendChild(tableBody);
  $(".resultCounts").append(table);
}

const showResults = () => {
  let results = [];
  let classes = [];
  classes = getClassesArr();
  $(classes).each((i, el) => {
    results.push([el, 0, 0]);
  });
  $(".testImgDiv").each((i, el) => {

    let checkedInput = $(el).find("input:checked");
    if ($(checkedInput).is("[predicted]")) {
      results[classes.indexOf(checkedInput.val())][1]++
    } else {
      results[classes.indexOf(checkedInput.val())][2]++
    }
  })
  createTable(results);
}

const saveIncorrect = async() => {
  let postsUrls = [];
  classes = getClassesArr();
  $(".testImgDiv").each((i, el) => {
    let checkedInput = $(el).find("input:checked");
    if ($(checkedInput).is("[predicted]")) {
    } else {
      postsUrls.push([$(el).find("img").attr('src'), checkedInput.attr("value")]);
    }
  });
  await socket.emit("corrections", { postsUrls });
}
const getClassesArr = () => {
  arr = [];
  for (let i = 0; i < classifier.getNumClasses(); i++) {
    arr.push(Object.keys(classifier.labelToClassId)[i]);
  }
  return arr;
}

const testImg = async (testImg) => {
  activation = net.infer(testImg, 'conv_preds');
  const result = await classifier.predictClass(activation);
  $(testImg).parent().find("pre").find("code").html(JSON.stringify(result));
  $(testImg).show();
  $(testImg).parent().find("pre").show();

  numOfImages++;

  for (let i = 0; i < classifier.getNumClasses(); i++) {
    const radio = document.createElement("input");
    radio.setAttribute("type", "radio");
    radio.setAttribute("name", numOfImages);
    radio.setAttribute("value", Object.keys(result.confidences)[i]);
    radio.setAttribute("onclick", "showResults()");
    if (result.classIndex == i) {
      radio.setAttribute("checked", "");
      radio.setAttribute("predicted", "");
    }
    $(testImg).parent().append(radio);
    $(testImg).parent().append(" " + Object.keys(result.confidences)[i] + "  ");
  }
}

socket.on('testPhotos', async (data) => {
  $(".testLoader").hide();
  await data.photoSrcs.forEach(async (element, i) => {
    //show img and result 
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
  document.querySelector('input[type="file"].testClassificatior').addEventListener('change', function () {
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