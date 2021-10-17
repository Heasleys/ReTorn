var settings; // global variable for other files to use
var loc = window.location.href.split('.com/').pop().split('.php').shift().trim().toLowerCase();


chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
  if (response.status == true) {
    if (response.value.re_settings) {
      settings = response.value.re_settings;
      let root = document.documentElement;
      if (settings.header_color != undefined) {
        let color = settings.header_color;
        root.style.setProperty('--re-header-color', color);
      }

      if (settings.leftalign != undefined && settings.leftalign == true) {
        root.style.setProperty('--re-leftalign', "20px");
      }

      if (settings.torn3d != undefined && settings.torn3d == true) {
        $( document ).ready(function() {
          var ss = document.createElement("script");
          ss.src = chrome.runtime.getURL("/js/everywhere/torn3d.js");
          (document.head || document.documentElement).appendChild(ss);
        });
      }

    }
  }
});

function insertHeader(element, where, classes) {
  if ($('div.re_container').length == 0) {
    var header = `
    <div class="re_container `+classes+`">
      <div class="re_head">
        <span class="re_title noselect"><span class="re_logo"><span class="re_yellow">Re</span>Torn: </span><span id="re_title"></span></span>
          <div class="re_icon_wrap">
            <span class="re_icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
            </span>
          </div>
      </div>
      <div class="re_content" style="display: none;">

      </div>
    </div>`;
    switch (where) {
      case 'append':
        element.append(header);
      break;
      case 'prepend':
        element.prepend(header);
      break;
      case 'after':
        element.after(header);
      break;
      case 'before':
        element.before(header);
      break;
    }

    if (loc != 'gym') {
      if (settings && settings.headers && settings.headers[loc] && settings.headers[loc].expanded == true) {
        $(".re_head").addClass("expanded");
        $("div.re_content").show();
      }
    }


    $(".re_head").click(function() {
        $(this).toggleClass("expanded");
        $("div.re_content").slideToggle("fast");
        $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
        let expanded = $(this).hasClass("expanded");
        if (loc != "gym") { //disable saving for header on gym because tornstats graph
          chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {headers: {[loc]: {expanded: expanded}}}});
        }
    });

    if ($('div.re_content').is(":visible")) {
      $('span.re_icon').addClass('arrow_down');
    } else {
      $('span.re_icon').addClass('arrow_right');
    }
  }
}


/* Inject FetchIntercept via js/everywhere/interceptFetch.js into Torn page */
var ss = document.createElement("script");
ss.src = chrome.runtime.getURL("/js/everywhere/interceptFetch.js");
(document.head || document.documentElement).appendChild(ss);

/* Create customEvent to communicate with content script/extension */
ss.onload = function(){
  var url=chrome.runtime.getURL("/js/everywhere/interceptFetch.js");
  var evt=document.createEvent("CustomEvent");
  evt.initCustomEvent("re_fetchInject", true, true, url);
  document.dispatchEvent(evt);
};
