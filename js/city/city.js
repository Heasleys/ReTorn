(function() {

const noItemsMessage = "Sorry, there are currently no items around the city!";
var items;
if ($('div.captcha').length == 0) {

const observer = new MutationObserver(function(mutations) {
    if ($('div.leaflet-map-pane[style="transform: translate3d(0px, 0px, 0px);"]').length != 0) {
        //spawnItems();
        cityHeader();
        startCityItems();
        observer.disconnect();
    }
});


if (features?.pages?.city?.city_finds?.enabled) {
    sendMessage({name: "get_local", value: "re_items"})
    .then((r) => {
        console.log(r);
        if (r.status) {
            items = r?.data?.items;
            const target = document.getElementById('map');
            observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
        } else {
            cityHeader();
            $('#re_city_finds').text("There was an error loading item data. Please restart ReTorn.");
        }
    })
    .catch((e) => console.error(e))
}


}



function cityHeader() {
    insertHeader($("div.content-title"), 'after');
    $('#re_title').text("City Finds");
    $('.re_content').html(`
      <div class="re_row">
        <p id="re_city_finds"><img id="re_loader" src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" style="margin-left: -20px;"></p>
      </div>
      `);
  
    $(".re_head").click(function() {
      $('#map').toggleClass('re_city_finds');
    });
  
    if ($('div.re_content').is(":visible")) {
      $('#map').addClass('re_city_finds');
    }
}

function startCityItems() {
    var itemList = "";
    var i = 0;
    var value = 0;
  
    $('.leaflet-marker-pane img[src*="torn.com/images/items/"]').each(function() {
      i++;
      let src = $(this).attr("src");
      let itemID = src.replace(/\D/g, "");
  
      if (typeof items[itemID] != "undefined") { //check if item is in the Torn item list
        $(this).attr("src", "https://www.torn.com/images/items/"+itemID+"/large.png");
        $(this).attr("data-cfid", i);
        $(this).attr("title", items[itemID].name);
        value += items[itemID].market_value;
        if (items[itemID].market_value >= 10000000) {
          itemList += "<b><a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"' title='Worth: $"+items[itemID].market_value.toLocaleString('en-US')+"'>" + items[itemID].name + "</a></b>, ";
        } else {
          itemList += "<a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"' title='Worth: $"+items[itemID].market_value.toLocaleString('en-US')+"'>" + items[itemID].name + "</a>, ";
        }
      } else {
        itemList += "<a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"' title='Worth: N/A'>UNKNOWN_ITEM</a>, ";
      }
    });
  
    if (i > 0) {
      itemList = itemList.replace(/,\s*$/, ".");
      itemList = itemList.replace(/,\s(?![\s\S]*,\s)/, ', and ');
      let intro;
      if (i == 1) {
        intro = "Woah! There is <b>" + i + "</b> item worth <b>$" + value.toLocaleString() + "</b> in the city: ";
      } else {
        intro = "Woah! There are <b>" + i + "</b> items worth a total of <b>$"+ value.toLocaleString() +"</b> around the city: ";
      }
      $('#re_city_finds').html(intro + itemList);
    } else {
      $('#re_city_finds').html(noItemsMessage);
    }
  
    $('#re_city_finds a').hover(function() {
      let id = $(this).data('cfid');
      let item = $('.leaflet-marker-pane img[src*="torn.com/images/items/"][data-cfid="'+id+'"]');
      item.toggleClass("hovered");
    });
}

function spawnItems() { //testing function or for possible future april fools day pranks
    let num = 2500;
    var zndx = 300;
  
    for (let step = 0; step < num; step++) {
        const item = randomIntFromInterval(1, 1294);
        const x = randomIntFromInterval(10, 776);
        const y = randomIntFromInterval(10, 448);
        $('.leaflet-marker-pane').append(`
        <img src="https://www.torn.com/images/items/${item}/small.png" class="leaflet-marker-icon map-user-item-icon leaflet-zoom-hide leaflet-clickable" tabindex="0" style="transform: translate3d(${x}px, ${y}px, 0px); z-index: ${zndx}; display: none;">
        `);
        zndx++;
    }
}
  
function randomIntFromInterval(min, max) { // min and max included
return Math.floor(Math.random() * (max - min + 1) + min)
}
})();