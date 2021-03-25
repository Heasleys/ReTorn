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
      insertHeader();
      $('#map').addClass('re_city_finds');

      var itemList = "";
      var i = 0;

      $('.leaflet-marker-pane img[src*="torn.com/images/items/"]').each(function() {
        i++;
        let src = $(this).attr("src");
        let itemID = src.replace(/\D/g, "");
        $(this).attr("title", items[itemID].name);
        if (items[itemID].market_value >= 10000000) {
          itemList += "<b><a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank'>" + items[itemID].name + "</a></b>, ";
        } else {
          itemList += "<a href='https://www.torn.com/imarket.php#/p=shop&type=" + itemID + "' target='_blank'>" + items[itemID].name + "</a>, ";
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



      observer.disconnect();
    }

  });
}

var target = document.getElementById('map');
observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});


function insertHeader() {
  if ($('div.re_container').length == 0) {
    $("div.content-title").after(`
    <div class="re_container after">
      <div class="re_head expanded">
        <span class="re_title">ReTorn: City Finds</span>
          <div class="re_icon_wrap">
            <span class="re_icon arrow_down">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
            </span>
          </div>
      </div>

      <div class="re_content">
        <div class="re_row">

          <p id="re_city_finds">Sorry, there are currently no items around the city!</p>

        </div>
      </div>
    </div>
    `);

    $(".re_head").click(function() {
        $(this).toggleClass("expanded");
        $("div.re_content").slideToggle("fast");

        $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
        $('#map').toggleClass('re_city_finds');
    });
  }
}
