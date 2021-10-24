// @version      1.0.0
// @description  Add easy city finds
// @author       Heasleys4hemp [1468764]
var items;

if ($('div.captcha').length == 0) {

  var observer = new MutationObserver(function(mutations) {
    if ($('div.leaflet-map-pane[style="transform: translate3d(0px, 0px, 0px);"]').length != 0) {
      cityHeader();

      var itemList = "";
      var i = 0;
      var value = 0;

      $('.leaflet-marker-pane img[src*="torn.com/images/items/"]').each(function() {
        i++;
        let src = $(this).attr("src");
        let itemID = src.replace(/\D/g, "");
        $(this).attr("src", "https://www.torn.com/images/items/"+itemID+"/large.png");
        $(this).attr("data-cfid", i);
        $(this).attr("title", items[itemID].name);
        value += items[itemID].market_value;
        if (items[itemID].market_value >= 10000000) {
          itemList += "<b><a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"' title='Worth: $"+items[itemID].market_value.toLocaleString('en-US')+"'>" + items[itemID].name + "</a></b>, ";
        } else {
          itemList += "<a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"' title='Worth: $"+items[itemID].market_value.toLocaleString('en-US')+"'>" + items[itemID].name + "</a>, ";
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
      }

      $('#re_city_finds a').hover(function() {
        let id = $(this).data('cfid');
        let item = $('.leaflet-marker-pane img[src*="torn.com/images/items/"][data-cfid="'+id+'"]');
        item.toggleClass("hovered");
      });



      observer.disconnect();
    }

  });
  }

  chrome.runtime.sendMessage({name: "get_value", value: "re_item_data", type: "local"}, (res) => {
    if (res.status != undefined && res.status == true) {
      items = res.value.re_item_data.items;
      var target = document.getElementById('map');
      observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
    } else {
        cityHeader();
        $('#re_city_finds').text("There was an error loading item data. Please restart ReTorn.");
        chrome.runtime.sendMessage({name: "set_logger", type: "error", subtype: "page", message: "There was an error loading item data for city map.", log: {timestamp: Date.now()}});
    }
  });



function cityHeader() {
  insertHeader($("div.content-title"), 'after');
  $('#re_title').text("City Finds");
  $('.re_content').html(`
    <div class="re_row">
      <p id="re_city_finds">Sorry, there are currently no items around the city!</p>
    </div>
    `);

  $(".re_head").click(function() {
    $('#map').toggleClass('re_city_finds');
  });

  if ($('div.re_content').is(":visible")) {
    $('#map').addClass('re_city_finds');
  }
}
