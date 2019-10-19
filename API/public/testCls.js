async function app() {
    console.log('Loading mobilenet..');
    $('body').css("filter", "blur(5px)").css("pointer-events", "none");;
    // Load the model.
    net = await mobilenet.load();
    $('body').css("filter", "").css("pointer-events", "");
    console.log('Successfully loaded model');
  }
  
  app();

  let net;