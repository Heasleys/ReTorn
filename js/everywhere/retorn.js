  /* Send Mesages to background.js - Example Usage */
  /*
    sendMessage({"name": "merge_sync", "key": "notifications", "object": obj})
    .then((r) => {
    console.log(r);
    })
    .catch((e) => console.error(e))

    sendMessage({name: "get_sync", value: "settings"})
    .then((r) => {
    console.log(r);
    })
    .catch((e) => console.error(e))
  */
 const sendMessage = (msg) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(msg, (data) => {
        return resolve(data);
      });
    });
  };
  var settings;
  var features;
  const href = window.location.href;   //locationURL is the page name of url (ex: jailview, factions, newspaper, stocks, missions)
  const locationURL = (href.includes('page.php') || href.includes('loader.php')) ? href.split('.com/').pop().split('sid=').pop().split(/[&#]+/).shift().trim().toLowerCase() : window.location.href.split('.com/').pop().split('.php').shift().trim().toLowerCase();

  /* Inject FetchIntercept via js/everywhere/interceptFetch.js into Torn page */
  var ss = document.createElement("script");
  ss.src = chrome.runtime.getURL("/js/everywhere/interceptFetch.js");
  (document.head || document.documentElement).appendChild(ss);

//button or link click event to open options page for ReTorn
$(document).on('click', '#re_options', function(event){
  event.stopPropagation();
  event.preventDefault();
  
  sendMessage({"name": "open_options"})
  .catch((e) => console.error(e))
});



  Promise.all([sendMessage({name: "get_sync", value: "settings"}),sendMessage({name: "get_sync", value: "features"})])
  .then((r) => {
    console.log(r);
    settings = r[0].data;
    features = r[1].data;
  })
  .then(() =>  {
    /* Create customEvent to communicate with interceptFetch.js/extension */
    ss.onload = function(){
      const interceptFetchEvent = new CustomEvent('re_fetchInject', { detail: {settings: settings, features: features }}); //send settings and features with event details
      document.dispatchEvent(interceptFetchEvent);
    };

    init();
  })
  .catch((e) => console.error('[ReTorn]: Error | ', e));


  function init() {
    const root = document.documentElement;
    if (settings.header_color) {
      const color = settings.header_color;
      let color_lighter;
      let color_darker;
      if (wc_hex_is_light(color)) {
        color_lighter = color;
        color_darker = pSBC(-0.64, color);
      } else {
        color_lighter = pSBC(0.13, color);
        color_darker = color;
      }
      root.style.setProperty('--re-header-color', color_lighter);
      root.style.setProperty('--re-header-color-two', color_darker);
    }

    if (features?.general?.left_align?.enabled) {
      root.style.setProperty('--re-leftalign', "20px");
    }

    if (settings.torn3d) {
      $( document ).ready(function() {
        var ss = document.createElement("script");
        ss.src = chrome.runtime.getURL("/js/everywhere/torn3d.js");
        (document.head || document.documentElement).appendChild(ss);
      });
    }
  } 



function insertHeader(element, where, feature, classes = "") {
  if ($('div.re_container').length == 0) {
    const title = feature.replaceAll('_', ' ');

    var header = `
    <div class="re_container ${classes}" data-feature="${feature}">
      <div class="re_head">
        <span class="re_title noselect"><span id="re_title">${title}</span></span>
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

    const remove_me_button = `<li id="re_remove_feature"><span class="re_menu_item"><i class="fa-solid fa-trash-can"></i><span class="re_menu_item_text">Remove feature</span></span></li>`
    const settings_view = `<div class="re_menu_block noselect"><div class="re_menu"><ul id="re_features_settings_view">${remove_me_button}</ul></div></div>`

    $('.re_head .re_title').after(`<span class="re_settings_icon"><i class="fas fa-gear" id="re_feature_settings" title="Feature Settings"></i>${settings_view}</span>`);

    $(document).on('click', function(e) { //hide feature menu if it's open when clicking anywhere else
      $('#re_feature_settings').removeClass('re_active');
    })
    $('#re_feature_settings, .re_menu_block').click(function(e) { //open feature menu when clicking on cog icon or cog icon gradient
      e.stopPropagation();
      $('#re_feature_settings').toggleClass('re_active');
    });
    // $('.re_menu').click(function(e) { //don't hide menu or do any other click event when clicking on the menu
    //   e.stopPropagation();
    // })
    $('#re_remove_feature').click(function(e) {
      const feature = $(this).closest('.re_container').data('feature');
      
      if (feature && locationURL) {
        const obj = {
          "pages": {
            [locationURL]: {
              [feature]: {
                "enabled": false
              }
            }
          }
        }
        sendMessage({"name": "merge_sync", "key": "features", "object": obj})
        .then((r) => {
          if (r?.status) {
            features["pages"][locationURL][feature]["enabled"] = false;
            $(`.re_container[data-feature="${feature}"`).remove();
            if (typeof featureCleanup === 'function') {
              featureCleanup(feature);
            }
          }
        })
      }
    });



    if (settings?.headers[locationURL]?.expanded) {
      $(".re_head").addClass("expanded");
      $("div.re_content").show();
    }


    $(".re_head").click(function() {
        $(this).toggleClass("expanded");
        $(this).next("div.re_content").slideToggle("fast");
        $(this).find("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
        let expanded = $(this).hasClass("expanded");
        const obj = {"headers": {[locationURL]: {"expanded": expanded}}}
        sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
        .catch((e) => console.error(e))      
    });

    if ($('div.re_content').is(":visible")) {
      $('span.re_icon').addClass('arrow_down');
    } else {
      $('span.re_icon').addClass('arrow_right');
    }
  }
}


async function getTornStats(selection, cacheHours = 8, forced = false) { //default cached time to 8 hours
  const storageSelection = selection.replaceAll('/', '_');
  
  const local = await sendMessage({name: "get_local", value: "torn_stats"})
  .then((r) => {
    if (forced) return; //Force update data, regardless of previous cache data
    const cache_until = r?.data[storageSelection]?.cache_until;
    const timestamp = r?.data[storageSelection]?.timestamp;
    if (r?.status && timestamp && cache_until) {
      if ((Date.now()/1000) >= cache_until) return;
      return r?.data[storageSelection];
    }
    return;
  })
  .catch((e) => console.error(e))

  if (local == undefined) {
    const ts = await sendMessage({"name": "get_torn_stats", "selection": selection})
    .then((r) => {
      return r;
    })
    .catch((e) => console.error(e))

    if (ts?.status) {
      let obj = {
        [storageSelection]: ts
      }
      obj[storageSelection].timestamp = Math.round(Date.now()/1000);
      obj[storageSelection].cache_until = Math.round((Date.now()/1000)+(cacheHours*3600));

      await sendMessage({"name": "merge_local", "key": "torn_stats", "object": obj})
      .catch((e) => console.error(e))
    }

    return ts;
  } else {
    return local;
  }
}



//function for inserting error message into error message area
function displayError(message) {
  $('#re_loader').remove();
  $('#re_message').html(`<span class="re_error">${message}</span>`);
  $('#re_message').show();
}

function fixIndexAfterDelete(index, object) {
  Object.keys(object).forEach(function(k) {
    if (parseInt(k) > parseInt(index)) {
      let newkey = parseInt(k);
      newkey--;
      object[newkey] = object[k];
      delete object[k];
    }
  });
  return object;
}

function getScreenType() {
  const pixels = window.innerWidth;
  const body = document.body;

  if (body) {
    if (!body.classList.contains('r')) {
      return "desktop"; //report back as desktop if manual desktop mode is on
    }

    if (pixels > 1000) {
      return "desktop";
    }
    if (pixels <= 1000 && pixels >= 387) {
      return "tablet";
    }
    if (pixels <= 601) {
      return "mobile";
    }
  }
  return; //if body element doesn't exist yet, then return nothing
}
function secondsToHms(d) {
    d = Number(d);
    var days = Math.floor(d / 86400);
    var h = Math.floor(d % 86400 / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var dayDisplay = days > 0 ? days + (days == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dayDisplay + hDisplay + mDisplay + sDisplay;
}
function secondsToHmsShort(d) {
    d = Number(d);
    var days = Math.floor(d / 86400);
    var h = Math.floor(d % 86400 / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var dayDisplay = days > 0 ? days + (days == 1 ? "d " : "d ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? "h " : "h ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? "m " : "m ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";

    if (days > 1) {
      return days + " days";
    }

    return dayDisplay + hDisplay + mDisplay + sDisplay;
}

function timeDifference(current, previous) {

  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;

  if (elapsed < msPerMinute) {
       return Math.round(elapsed/1000) + ' seconds ago';
  }

  else if (elapsed < msPerHour) {
       return Math.round(elapsed/msPerMinute) + ' minutes ago';
  }

  else if (elapsed < msPerDay ) {
       return Math.round(elapsed/msPerHour ) + ' hours ago';
  }

  else if (elapsed < msPerMonth) {
      return '' + Math.round(elapsed/msPerDay) + ' days ago';
  }

  else if (elapsed < msPerYear) {
      return '' + Math.round(elapsed/msPerMonth) + ' months ago';
  }

  else {
      return '' + Math.round(elapsed/msPerYear ) + ' years ago';
  }
}

//Function to return colors darker/lighter/blended - https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
//Version 4.0
//This is for the secondary color in headers
const pSBC=(p,c0,c1,l)=>{
	let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
	if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
	if(!this.pSBCr)this.pSBCr=(d)=>{
		let n=d.length,x={};
		if(n>9){
			[r,g,b,a]=d=d.split(","),n=d.length;
			if(n<3||n>4)return null;
			x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
		}else{
			if(n==8||n==6||n<4)return null;
			if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
			d=i(d.slice(1),16);
			if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
			else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
		}return x};
	h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
	if(!f||!t)return null;
	if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
	else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
	a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
	if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
	else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}
function wc_hex_is_light(color) {
    const hex = color.replace('#', '');
    const c_r = parseInt(hex.substr(0, 2), 16);
    const c_g = parseInt(hex.substr(2, 2), 16);
    const c_b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
    return brightness > 82; //originally 155
}


//mostly stolen from cthulhu modal
function ReTornModalWindow(text) {
  $(`<div class="re-modal" style="top: 20%;">
      <div class="re-modal-body">
          ${text}
          <button class="re_torn_button">OKAY</button>
      </div>
  </div>`).appendTo('body');
  $('.re-modal').animate({'opacity': 1}, 500);
  $('.re-modal .re_torn_button, .re-modal .re-modal-body-link').click(function (e) {
      e.preventDefault();
      const parent = $(this).closest('.re-modal');
      const btn = parent.find('.re_torn_button');
      btn.prop('disabled', true);

      if (parent.find('[data-eventid').length) {
        const eventid = parent.find('[data-eventid').data('eventid');
        const obj = {
          events: {
            events: {
              [eventid]: {
                seen: 1
              }
            }
          }
        }
        sendMessage({"name": "merge_local", "key": "torn_stats", "object": obj})
        .catch((e) => console.error(e))
      }

      parent.fadeOut(200);
  });

}