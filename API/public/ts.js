let net;
const classifier = knnClassifier.create();

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
  }
}


const showClassifier = (cls) => {

  $(".classifierTable span").html('<pre><code>' + JSON.stringify(cls.classExampleCount) + `</pre></code> 
  <form>
  <input class="form-control col-3 p-2" type="text" name="classifierName" required />
  <input type="submit" value="Save this Classifier!" class="saveClassifier btn btn-info" onclick="saveClassifier()" />
  <form>
  `)
  $(".saveClassifier").submit(function(e){
    e.preventDefault();
  });
  const saveClassifier = (e) => {
   
    socket.emit("saveClassifier", { "classifier": classifier, "name": $("[name=classifierName]").val() });
  }
}
const teach = (hashtag) => {
  let imgs = $("." + hashtag).find("img");
  $(imgs).each((i, img) => {
    activation = net.infer(img, 'conv_preds');
    classifier.addExample(activation, hashtag);
  });
  console.log(hashtag + " tought!");

}
const teachAll = (hashtags) => {
  $(hashtags).each((i, hashtag) => {
    teach(hashtag);
  });
  showClassifier(classifier);
}


checkForClassifiers(classifier);


