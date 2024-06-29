(function() {

const noItemsMessage = "Sorry, there are currently no items around the city!";
var items;
if ($('div.captcha').length == 0) {

const observer = new MutationObserver(function(mutations) {
    if ($('div.leaflet-map-pane[style="transform: translate3d(0px, 0px, 0px);"]').length != 0) {
        //spawnItems(2500, 337);
        cityHeader();
        startCityItems();
        observer.disconnect();
    }
});


if (features?.pages?.city?.city_finds?.enabled) {
    sendMessage({name: "get_local", value: "re_items"})
    .then((r) => {
        if (r.status) {
            items = r?.data?.items;
            const target = document.getElementById('map');
            observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
        } else {
            cityHeader();
            $('#re_city_finds').text("There was an error loading item data. Please refresh item data in the ReTorn Advanced Settings.");
        }
    })
    .catch((e) => console.error(e))
}


}



function cityHeader() {
  //Insert container
  if ($(`.re_container[data-feature="${CITY_FINDS}"]`).length != 0) return;
  const containerObject = {
      "feature": `${CITY_FINDS}`,
      "insertLocation": "after",
      "elementClasses": "",
      "bar": false
  }
  insertContainer($("div.content-title"), containerObject);
  const RE_CONTAINER = $(`.re_container[data-feature="${CITY_FINDS}"]`);

  RE_CONTAINER.find('.re_content').html(`
  <div class="re_row">
    <p id="re_city_finds"><img id="re_loader" src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" style="margin-left: -20px;"></p>
  </div>
  `);
  
  RE_CONTAINER.find(".re_head").click(function() {
    $('#map').toggleClass('re_city_finds');
  });
  
  if (RE_CONTAINER.find('div.re_content').is(":visible")) {
    $('#map').addClass('re_city_finds');
  }
}

function startCityItems() {
    var itemList = "";
    var i = 0;
    var value = 0;
  
    $('.leaflet-marker-pane img[src*="images/items/"]').each(function() {
      i++;
      let src = $(this).attr("src");
      let itemID = src.replace(/\D/g, "");
      $(this).attr("src", "https://www.torn.com/images/items/"+itemID+"/large.png");
      $(this).attr("data-cfid", i);

      if (typeof items[itemID] != "undefined") { //check if item is in the Torn item list
        $(this).attr("title", items[itemID].name);
        value += items[itemID].market_value;
        if (items[itemID].market_value >= 10000000) {
          itemList += "<b><a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"' title='Worth: $"+items[itemID].market_value.toLocaleString('en-US')+"'>" + items[itemID].name + "</a></b>, ";
        } else {
          itemList += "<a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"' title='Worth: $"+items[itemID].market_value.toLocaleString('en-US')+"'>" + items[itemID].name + "</a>, ";
        }
      } else {
        itemList += "<a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"' title='Worth: N/A'>UNKNOWN_ITEM_"+itemID+"</a>, ";
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

function spawnItems(num, itemID = null) { //testing function or for possible future april fools day pranks
    var zndx = 300;

  
    for (let step = 0; step < num; step++) {
        const item = !itemID ? randomIntFromInterval(1, 1383) : itemID;
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


function featureCleanup() {
  $('#map').removeClass('re_city_finds');
}