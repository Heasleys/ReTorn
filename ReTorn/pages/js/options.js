var browser = browser || chrome;

const manifestData = browser.runtime.getManifest();
const default_quick_links = {
  amarket: {
    name: "Auction House",
    url: "amarket.php"
  },
  bazaar: {
    name: "Bazaar",
    url: "bazaar.php"
  },
  imarket: {
    name: "Item Market",
    url: "imarket.php"
  },
  museum: {
    name: "Museum",
    url: "museum.php"
  },
  pmarket: {
    name: "Points Market",
    url: "pmarket.php"
  },
  racing: {
    name: "Race Track",
    url: "loader.php?sid=racing"
  },
  stockmarket: {
    name: "Stock Market",
    url: "page.php?sid=stocks"
  },
  travelagency: {
    name: "Travel Agency",
    url: "travelagency.php"
  },
  vault: {
    name: "Property Vault",
    url: "properties.php#/p=options&tab=vault"
  },
  remove: {
    name: "Remove...",
    url: ""
  }
}

function fix_case_acronyms(text) {
  //"""Replaces "oc", "ocs", "npc", "npcs", "api", or "apis" with "OC", "OCs", "NPC", "NPCs", "API", or "APIs", but not within a word."""
  const regex = /(?<!\w)(oc|ocs|npc|npcs|api|apis)(?!\w)/gi;
  const found = text.match(regex);
  if (found) {
    text = text.replace(regex, found[0].toUpperCase()).replace("S", "s");
  }

  return text;
}

function titleCase(str) {
  var splitStr = str.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
      // Assign it back to the array
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
  }
  // Directly return the joined string
  return splitStr.join(' '); 
}
function isEmpty(obj) { //function for easily checking if an object is empty
  if (obj != undefined) {
    return Object.keys(obj).length === 0;
  }
  return true;
}
const sendMessage = (msg) => {
  return new Promise((resolve) => {
    browser.runtime.sendMessage(msg, (data) => {
      resolve(data);
    });
  });
};

$(document).ready(function() {
  $('.version').text('ReTorn v'+manifestData.version);

  Promise.all([initSidebar(), initTornStatsTab(), createNotificationsList(), createFeaturesList(), initSettings()])
  initInputs();
});


async function createNotificationsList() {
  sendMessage({name: "get_sync", value: "notifications"})
  .then((n) => {
    const d = n.data;
    $('#notifications_card').append(`<div class="category"></div>`)

    for (const [key, val] of Object.entries(d)) {
      if (key != 'tooltip' && key != 'enabled' && key != 'order' && key != 'value') {
        if (val.value) {
          $('#notifications_card .category').append(switchWrap(key, val.tooltip, val.enabled, val.order, val.value))
        } else {
          $('#notifications_card .category').append(switchWrap(key, val.tooltip, val.enabled, val.order))
        }
      }
    }
  })
  .catch((e) => {
    console.error(e)
  })
}
async function createFeaturesList() {
  const iterateFeatures = (obj) => {
    for (const [key, val] of Object.entries(obj)) {
    if (key != 'description' && key != 'enabled') {
      if (val.description) {
        if ($(`#features_card .category`).last().find('.block').last().length) {
          $(`#features_card .category`).last().find('.block').last().append(switchWrap(key,val.description,val.enabled))
        } else {
          $(`#features_card .category`).last().append(switchWrap(key,val.description,val.enabled))
        } 
      } else {
        $('#features_card .category').last().append(`<div class="block" data-page="${key}"><h5>${fix_case_acronyms(key)}:</h5></div>`);
        if (typeof val === 'object' && val !== null) {
          iterateFeatures(val);
        }
      }
    }
    }
  }


  sendMessage({name: "get_sync", value: "features"})
  .then((f) => {
    const d = f.data;
    Object.keys(d).forEach(key => {
      $('#features_card').append(`<div class="category" data-category="${key}"><h4 class="capitalize">${key}:</h4></div>`)
      iterateFeatures(d[key]);
    })
  })
  .catch((e) => {
    console.error(e)
  })
}


function switchWrap(key,desc,toggle,order=0,value=0) {
  let checked = "", inputElement = "", orderText = "";

  if (toggle) checked = "checked";
  if (value) inputElement = `<input type="text" id="${key}_value" value="${value}">`;
  if (order) orderText = `style="order: ${order}"`

  return `
  <div class="switch-holder" ${orderText}>
    <input type="checkbox" id="${key}" ${checked}/><label class="switch-label" for="${key}">Toggle</label>
    <span for="${key}" class="tooltip-right" data-tooltip="${desc}">${fix_case_acronyms(titleCase(key.replaceAll('_'," ")))}</span>
    ${inputElement}
  </div>
  `;
}
async function initSidebar() {
    /* Initialize Sidebar List */
    $('ul.tabs > li').first().addClass('active');
    $('.tab_container').first().addClass('show');
    $('ul.tabs li:not(.disabled,:disabled)').click(function(){
        const t = $(this).data('tab');
        if(!$(this).hasClass('active')){
          $('ul.tabs > li').removeClass('active');
          $(this).addClass('active');
        }
        $('.tab_container').removeClass('show');
        $('.tab_container#'+ t).addClass('show');
     });
}
function initInputs() {
  $('button.mobile').click(function() {
    $('ul.tabs').toggleClass('show');
  });

  $('body').on('change', '#energy_value, #nerve_value, #happy_value, #life_value', function() {
    let v = $(this).val();
    let id = $(this).attr('id').replace('_value', '');
    if (v == "" || /(?!^)[\<\>]|[\%](?!$)|[^0-9\>\<\%]/.test(v)) {
      $(this).val($(this).data('prev'));
    } else {
      const obj = {[id]: {value: v}}
      if (!isEmpty(obj)) {
        sendMessage({"name": "merge_sync", "key": "notifications", "object": obj})
        .then((r) => {
          notificationTooltips(v,id);
        })
        .catch((e) => console.error(e))
      }
    }
  });

  $('body').on('change', '#chain_time_value, #chain_hit_value', function() {
    var input = $(this);
    let id = input.attr('id').replace("_value", "");
    let v = input.val();
    if (v == "" || /[^0-9\,\s].*/.test(v)) {
      input.val(input.data('prev'));
    } else {
      input.data('prev', v);
      const obj = {[id]: {value: v}}
      if (!isEmpty(obj)) {
        sendMessage({"name": "merge_sync", "key": "notifications", "object": obj})
        .then((r) => {

        })
        .catch((e) => console.error(e))
      }
    }
  });
  $('body').on('focus', '#energy_value, #nerve_value, #happy_value, #life_value, #chain_time_value, #chain_hit_value', function() {
    $(this).data('prev', $(this).val());
  });

  $('body').on('change', '.switch-holder input[type=checkbox]', function() {
    let obj = {}
    let key = $(this).closest('.tab_container').attr('id');
    const category = $(this).closest('[data-category]').data('category');
    const type = $(this).attr('id');
    const enabled = this.checked;
    const value = $(this).siblings('input[type=text]').val();

    if (key == 'notifications') {
      obj[type] = {};
      obj[type]["enabled"] = enabled;
      if (value) obj[type]["value"] = value;
    }

    if (key == 'features') {
      obj[category] = {};
      if (category == 'pages') {
        const page = $(this).closest('[data-page]').data('page');
        obj[category][page] = {};
        obj[category][page][type] = {};
        obj[category][page][type]["enabled"] = enabled;
      } else {
        obj[category][type] = {};
        obj[category][type]["enabled"] = enabled;
      }
    }

    if (key == 'settings' || key == 'beyond') {
      key = 'settings';
      obj[type] = enabled;
    }

    if (!isEmpty(obj)) {
      sendMessage({"name": "merge_sync", "key": key, "object": obj})
      .then((r) => {

      })
      .catch((e) => console.error(e))
    }
  });
  //click event for switch labels (clicking on label will click the switch)
  $('body').on('click', '.switch-holder span', function() {
    const checkbox = $(this).parent('.switch-holder').find('input[type="checkbox"]');
    checkbox.prop("checked", !checkbox.prop("checked"));
    checkbox.trigger("change");
  });

  $('body').on('click', 'button.color_code', function() {
    const c = $(this).data('color');
    $('#header_color').val(c);
    $('#header_color')[0].jscolor.fromString(c);
    $('#header_color').trigger("change");
  })
  $('body').on('change', '#header_color', function() {
    let color = $(this).val();
    setHeaderColor(color);
    const obj = {header_color: color}
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      
    })
    .catch((e) => console.error(e))
  })
  //set change events to all inputs for quicklinks
  $('body').on('change', '#quicklinks input[type=checkbox], #quicklinks .quicklinks, #quicklinks input[type=text]', function() {
    sendQuickLinks($(this));
  });
  //set change events to all inputs for chat highlights
  $('body').on('change', "#chat_highlights input[type='checkbox'], #chat_highlights input[type='text']", function() {
    let wrap = $(this).parent('.switch_wrap');
    let enabled = wrap.find("input[type=checkbox]").is(":checked");
    let index = $("#chat_highlights .switch_wrap").index(wrap);
    let value = wrap.find("input[name='text']").val();
    let color = wrap.find("input[name='color']").val();

    // if everything is in place and not undefined or blank, then send message to add to chat highlights
    if (index != undefined && enabled != undefined && value != undefined && value != "" && color != "") {
      const obj = {chat_highlights: {[index]: {enabled: enabled, value: value, color: color}}}

      sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
      .then((r) => {
        //Only reload list if it's not the color input
        if (!$(this).is(wrap.find("input[name='color']"))) {
          initChatHighlights();
        }
      })
      .catch((e) => console.error(e))
    }

    // if checkbox changed and select box is set to custom and is not the last child and checkbox is set to false, then delete quicklinks entry
    if (enabled == false && value == "" && !$(wrap).is(':last-child')) {
      deleteIndexFromObject(index, "chat_highlights", initChatHighlights);
    }
  });
  //retorn darkmode
  $('#darkmode').click(() => {
      $("html").toggleClass('dark light');
  });
  //recognize all new color inputs
  jscolor.install();


  //hide dropdowns if click anywhere else on screen
  $(document).click(function(event) {
    if (!$(event.target).closest(".dropdown-menu, .dropdown .nav-link").length) {
        $(".dropdown-menu").hide();
    }
    if ($(event.target).closest(".mainview, ul.tabs.show > li").length) {
        $("ul.tabs.show").removeClass("show");
    }
  });


  //button to integrate tornstats
  ///*
  $("button#tornstats").click(function() {
    // Enable Tornstats
    if ($(this).val() == 0) {
      const key = $("#ts_apikey").val();

      if (key && key.length >= 16 && key.length <= 19) {
        if (confirm('By accepting, you agree to allow the api key you entered to be transmitted to tornstats.com.')) {
          sendMessage({name: "set_torn_stats_api", apikey: key})
          .then((r) => {
            if (r.status) {
              $('#ts_status').text("Enabled");
              $(this).html("Unlink account");
              $('button#tornstats').val(1);
              $('#ts_link_wrap').hide();
            } else {
              $('#ts_status').text("Disabled");
              $(this).html("Link account");
              $('button#tornstats').val(0);
              $('#ts_link_wrap').show();
            }
            TornStatsMessage(r); 
          })
          .catch((error) => TornStatsMessage(error));
        }
      } else {
        TornStatsMessage({status: false, message: "Torn Stats api key is invalid."});
      }
    }

    // Disabled TornStats
    if ($(this).val() == 1) {
      sendMessage({name: "remove_value", key: "re_torn_stats_apikey", location: "local"})
      .catch((e) => {
        console.error(e)
      })
      $('#ts_status').text("Disabled");
      $(this).html("Link account");
      $('button#tornstats').val(0);
      $('#ts_link_wrap').show();
    }

  });
  //*/
  


  //button to fully reset ReTorn
  $("button#reset").click(function() {
    // Full reset of ReTorn Settings
      if (confirm('This will completely reset your settings and ReTorn data, including sync settings and local ReTorn storage. There is no going back from this. Are you sure you would like to fully reset ReTorn?')) {

        sendMessage({"name": "full_reset"})
        setTimeout(function(){
           window.location.reload();
        }, 250);
      }

  });


  $("button#test_notification").click(function() {
    sendMessage({name: "get_sync", value: "notifications"})
    .then((r) => {
      if (r?.status) {
        if (r?.data?.all_notifications?.enabled) {
          let tts = r?.data?.text_to_speech?.enabled;
          sendMessage({name: "test_notification", tts: tts});
        } else {
          alert("You have notifications turned off.")
        }
      } else {
        alert("Something went wrong retrieving notification data!");
      }
    })
    .catch((e) => {
      console.error(e)
    })
  });
  
  $("button#force_torn_items").click(function() {
    // // force api or items list doc to refill local items storage
    sendMessage({"name": "force_torn_items"})
    .then(() => {
      alert("Items Cache have been refreshed.")
    })
  });

  $("button#copy_sync_to_clipboard").click(function() {
    sendMessage({name: "get_sync", value: null})
    .then((r) => {
      if (!r?.status) {
        console.error(r);
        return;
      }
      console.log(r);
      copy_internal(JSON.stringify(r?.data, null, 2));
    })
  });

  $("button#copy_local_to_clipboard").click(function() {
    sendMessage({name: "get_local", value: null})
    .then((r) => {
      if (!r?.status) {
        console.error(r);
        return;
      }
      copy_internal(JSON.stringify(r?.data, null, 2));
    })
  });
}

function initSettings() {
  sendMessage({name: "get_sync", value: "settings"})
  .then((r) => {
    const d = r.data;
    //populate elements with settings

    //darkmode
    $('#darkmode').prop('checked', d.darkmode)
    if (!d.darkmode) $("html").toggleClass('dark light');
    //torn3d
    $('#torn3d').prop('checked', d.torn3d)
    //header color
    if (d.header_color) {
      setHeaderColor(d.header_color);
      
      $('#header_color').val(d.header_color);
      document.querySelector('#header_color').jscolor.fromString(d.header_color);
    }
    //quick links
    initQuickLinksList();

    //chat highlights
    initChatHighlights();

  })
  .then(() => {
    const notifs = ['energy', 'nerve', 'happy', 'life'];
    notifs.forEach(function(nE) {
      let nV = $('#'+nE+'_value').val();
      notificationTooltips(nV, nE);
    });
  })
  .catch((e) => {
    console.error(e)
  })


  
}

//initialize torn stats tab
async function initTornStatsTab() {
  sendMessage({name: "get_local", value: "re_torn_stats_apikey"})
  .then((r) => {
    if (r?.status) {
      $('#ts_status').text("Enabled");
      $('button#tornstats').html("Unlink account");
      $('button#tornstats').val(1);
      $('#ts_link_wrap').hide();
    } else {
      $('#ts_status').text("Disabled");
      $('button#tornstats').html("Link account");
      $('button#tornstats').val(0);
      $('#ts_link_wrap').show();
    }
  })
  .catch((e) => {
    console.error(e)
  })
}

function TornStatsMessage(m) {
  const ts = $('#ts_message');
  ts.text(m.message);
  ts.show();
}

//initialize quick links (also recursive for repopulating list after changes)
function initQuickLinksList() {
  sendMessage({name: "get_sync", value: "settings"})
  .then((r) => {
    const ql = r.data?.quick_links;
    $("#quicklinks").empty(); //Empty list

    //Propogate quick links list with enough select boxes for each plus one
    for (var i = 0; i <= Object.keys(ql).length; i++) {
      appendQuickLinks();
    }

    let optionStr = ``;
    //fill each select box with all of the options available from quicklinks const
    for (const [key, value] of Object.entries(default_quick_links)) {
      optionStr += `<option value="${value.url}">${value.name}</option>`;
    }
    $('.quicklinks').append(optionStr);

    //initialize sortable feature for quick links
    $( "#quicklinks" ).sortable({axis: "y", items: "> li:not(:last-child)", handle: ".fa-li", deactivate: function( event, ui ) {
      let obj = {"quick_links": {}};

      $('#quicklinks > li:not(:last-child) .switch_wrap').each(function() {
        const li = createQuickLinksObj($(this));
        if (!isEmpty(li)) Object.assign(obj.quick_links, li);
      });

      sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
      .then((r) => {
        initQuickLinksList();
      })
      .catch((e) => console.error(e))

    }});

    //set each select box to the correct option
    if (Object.keys(ql).length) {
      for (const [key, value] of Object.entries(ql)) {
        const qlink_wrap = $("#quicklinks .switch_wrap").eq(key);
        qlink_wrap.find("input[type='checkbox']").prop("checked", value.enabled);

        if (value.type == "default") {
          qlink_wrap.find(`option:contains("${value.name}")`).prop('selected', true);
          qlink_wrap.find('input[type=text]').hide();
        }
        if (value.type == "custom") {
          qlink_wrap.find(`option:contains("Custom...")`).prop('selected', true);
          qlink_wrap.find('input[type=text][name=name]').val(value.name);
          qlink_wrap.find('input[type=text][name=url]').val(value.url);
        }
      }
    }
  })
  .catch((e) => {
    console.error(e)
  })
}
//function to insert base of quick links wrap
function appendQuickLinks() {
  $("#quicklinks").append(`
    <li><span class="fa-li"><i class="fas fa-grip-lines"></i></span><div class="switch_wrap">
      <input type="checkbox">
      <select class="quicklinks">
        <option value="custom" selected>Custom...</option>
      </select>
      <input type="text" name="name" placeholder="Name" autocomplete="off">
      <input type="text" name="url" placeholder="URL" autocomplete="off">
    </div></li>
    `)
}
//function to send message to background to save quicklinks changes
function sendQuickLinks(el) {
  const obj = {quick_links: {}}
  obj.quick_links = createQuickLinksObj(el);
  // if everything is in place and not undefined or blank, then send message to add to quick links
  if (!isEmpty(obj.quick_links)) {
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      initQuickLinksList();
    })
    .catch((e) => console.error(e))
  }


}
//function for creating a single quicklinks object 
function createQuickLinksObj(element) {
  const qlink_wrap = element[0].className.includes('switch_wrap') ? element : element.parent('.switch_wrap');
  const enabled = qlink_wrap.find("input[type=checkbox]").is(":checked");
  const index = $("#quicklinks .switch_wrap").index(qlink_wrap);
  const value = qlink_wrap.find('.quicklinks').val();
  let type;
  let name;
  let url;

  if (value == "custom") {
    qlink_wrap.find('input[type=text]').show();

    type = "custom";
    name = qlink_wrap.find('input[type=text][name=name]').val();
    url = encodeURI(qlink_wrap.find('input[type=text][name=url]').val());
  } else {
    type = "default";
    name  = qlink_wrap.find(".quicklinks option:selected").text();
    url = encodeURI(value);
  }

  if (name == "Remove...") {
    deleteIndexFromObject(index, "quick_links", initQuickLinksList);
  }

  if (name != "" && url != "") {
    return {[index]: {type: type, enabled: enabled, name: name, url: url}}
  } else {
    return {}
  }
}


//initialize chat highlights
function initChatHighlights() {
  sendMessage({name: "get_sync", value: "settings"})
  .then((r) => {
    const s = r.data;
    const h = s.chat_highlights;
    $("#chat_highlights").empty(); //Empty list

    //Propogate quick links list with enough select boxes for each plus one
    for (var i = 0; i <= Object.keys(h).length; i++) {
      appendChatHighlights();
    }

    //recognize all new color inputs
    jscolor.install();

    //propogate chat Highlights
    if (!isEmpty(h)) {
      for (const [key, value] of Object.entries(h)) {
        let wrap = $("#chat_highlights > .switch_wrap").eq(key);
        wrap.find("input[type='checkbox']").prop("checked", value.enabled);
        wrap.find("input[name='text']").val(value.value);
        wrap.find("input[name='color']").val(value.color);
        wrap.find("input[name='color']").show();
        wrap.find("input[name='color']")[0].jscolor.fromString(value.color);
      }
    }
  })
.catch((e) => console.error(e));
}
//function to insert base of chat highlights wrap
function appendChatHighlights() {
  $("#chat_highlights").append(`
    <div class="switch_wrap">
      <input type="checkbox">
      <input type="text" name="text" placeholder="@username or words">
      <input type="text" name="color" data-jscolor="{}" value="#E0CE00" style="display: none;">
    </div>
    `)
}


//function for updating the notification tooltips
function notificationTooltips(v, id) {
  if (v.includes("<")) {
    $('span[for='+  id + ']').attr("data-tooltip", "Notify when "+id+" drops below "+ v.replace('<',''));
  }
  if (v.includes(">")) {
    $('span[for='+  id + ']').attr("data-tooltip", "Notify when "+id+" increases above "+ v.replace('>',''));
  }
  if (!v.includes(">") && !v.includes("<")) {
    if (v == "100%") {
      $('span[for='+  id + ']').attr("data-tooltip", "Notify when "+id+" is full");
    } else {
      $('span[for='+  id + ']').attr("data-tooltip", "Notify when "+id+" equals "+ v);
    }
  }
}

//function for deleting an index from settings location
function deleteIndexFromObject(index, s, callback) {
  sendMessage({name: "del_settings_index", key: index, setting: s})
  .then((r) => {
    callback();
  })
  .catch((e) => console.error(e))
}

function setHeaderColor(color) {
  const root = document.documentElement;
  if (color) {
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
//copy to clipboard function taken from internet -> https://pastebin.com/ikVzSiq9
async function copy_internal(text) {
  if (!navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  // fall back if clipboard api does not exist
  let textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}