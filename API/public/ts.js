let net;
let classifier = knnClassifier.create();

async function app() {
  console.log('Loading mobilenet..');
  $('body').css("filter", "blur(5px)").css("pointer-events", "none");;
  // Load the model.
  net = await mobilenet.load();
  $('body').css("filter", "").css("pointer-events", "");
  console.log('Successfully loaded model');
}
app();

const checkForClassifiers = (cls) => {
  if (cls.nextClassId == 0) {
    $(".classifierTable span").html("Classifier empty!")
  } else {
    showClassifier(classifier);
  }
}

const showClassifier = (cls) => {
  $(".classifierTable span").html('<pre><code>' + JSON.stringify(cls.classExampleCount) + `</pre></code>
  <button onclick="showTestPage()" class="btn btn-info">Test</button>
  <button onclick="showTeachPage()"class="btn btn-info">Teach</button>
  `);

  $(".classifierForm").submit(function (e) {
    e.preventDefault();
  });
}

const saveClassifier = () => {
  socket.emit("saveClassifier", { "classifier": classifier, "name": $("[name=classifierName]").val() });
}

const teach = (hashtag) => {
  try {
    classifier.clearClass(hashtag);
  } catch (error) {
  }
  let imgs = $("." + hashtag).find("img");
  $(imgs).each((i, img) => {
    activation = net.infer(img, 'conv_preds');
    classifier.addExample(activation, hashtag);
  });
  console.log(hashtag + " learned!");
  $(".loader").parent().append("<p>" + hashtag + " learned</p>").show().delay(4000).fadeOut();
  showClassifier(classifier);
}

const teachAll = (hashtags) => {
  $(hashtags).each((i, hashtag) => {
    teach(hashtag);
  });
}

const showTestPage = () => {
  $(".teaching").hide();
  $(".testing").show();

}

const showTeachPage = () => {
  $(".teaching").show();
  $(".testing").hide();

}

checkForClassifiers(classifier);


