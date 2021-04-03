

var observer = new MutationObserver(function(mutations) {

  if ($('img[src*="step=eggImage"]').length != 0) {
    var pos = $('img[src*="step=eggImage"]').offset();
    var top = pos.top;
    var left = pos.left;

    var width = $( window ).width();

    var win_height = $( window ).height();
    var doc_height = document.body.scrollHeight;

    //console.log("Left:", left, "Top:", top);

    //console.log("Win: ", win_height, "Doc: ", doc_height);

    var wblock = Math.round(width/3);

    let mes = "";
    let view = "";

    if (top <= win_height) {
      view = "your screen";
      var hblock = Math.round(win_height/3);
    } else {
      view = "the page";
      var hblock = Math.round(doc_height/3);
    }



    if (top < hblock) { //top
      mes += "top";
    }

    if (top >= hblock && top <= (hblock * 2)) { //middle
      mes += "middle";
    }

    if (top > (hblock * 2)) { //bottom
      mes += "bottom";
    }


    if (left < wblock) { //left
      mes += " left";
    }

    if (left >= wblock && left <= (wblock * 2)) { //center
      mes += " center"
    }

    if (left > (wblock * 2)) { //right
      mes += " right";
    }

    // full center
    if (mes == "middle center") { //center
      mes = "center";
    }

    //console.log("Width: ", width, " Height: ", doc_height)
    //console.log(hblock, (hblock*2), (hblock*3));
    //console.log(wblock, (wblock*2), (wblock*3));
    //console.log(mes, view);

    alert(`Easter Egg found. Look closely at the ${mes} of ${view}!`);
    console.log(`ReTorn: Easter Egg found. Look closely at the ${mes} of ${view}!`);
    clearTimeout(egg);
    observer.disconnect();
  }

});

var egg = setTimeout(function (){

  observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});


}, 100);
