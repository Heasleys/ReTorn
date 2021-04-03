// @version      1.0.0
// @description  Add easy city finds
// @author       Heasleys4hemp [1468764]
var items;

if ($('div.captcha').length == 0) {

  chrome.runtime.sendMessage({name: "get_value", value: "re_item_data", type: "local"}, (res) => {
    if (res.status != undefined && res.status == true) {
      items = res.value.re_item_data.items;
    }
  });




  var observer = new MutationObserver(function(mutations) {
    if ($('div.leaflet-map-pane[style="transform: translate3d(0px, 0px, 0px);"]').length != 0) {
      cityHeader();

      var itemList = "";
      var i = 0;

      $('.leaflet-marker-pane img[src*="torn.com/images/items/"]').each(function() {
        i++;
        let src = $(this).attr("src");
        let itemID = src.replace(/\D/g, "");
        $(this).attr("data-cfid", i);
        $(this).attr("title", items[itemID].name);
        if (items[itemID].market_value >= 10000000) {
          itemList += "<a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"'><b>" + items[itemID].name + "</b></a>, ";
        } else {
          itemList += "<a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank' data-cfid='"+i+"'>" + items[itemID].name + "</a>, ";
        }
      });

      if (i > 0) {
        itemList = itemList.replace(/,\s*$/, ".");
        itemList = itemList.replace(/,(?=[^,]*$)/, ' and');
        let intro;
        if (i == 1) {
          intro = "Woah! There is <b>" + i + "</b> item around the city: ";
        } else {
          intro = "Woah! There are <b>" + i + "</b> items around the city: ";
        }
        $('#re_city_finds').html(intro + itemList);
      }

      $('#re_city_finds > a').hover(function() {
        let id = $(this).data('cfid');
        let item = $('.leaflet-marker-pane img[src*="torn.com/images/items/"][data-cfid="'+id+'"]');
        item.toggleClass("hovered");
      });



      observer.disconnect();
    }

  });
}

var target = document.getElementById('map');
observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});


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
