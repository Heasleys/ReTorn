const quicklinks = {
  amarket: {
    name: "Auction House",
    url: "amarket.php",
    icon: '<i class="cql-auction-house"></i>'
  },
  imarket: {
    name: "Item Market",
    url: "imarket.php",
    icon: '<i class="cql-item-market"></i>'
  },
  museum: {
    name: "Museum",
    url: "museum.php",
    icon: '<i class="cql-museum"></i>'
  },
  pmarket: {
    name: "Points Market",
    url: "pmarket.php",
    icon: '<i class="cql-points-market"></i>'
  },
  racing: {
    name: "Race Track",
    url: "loader.php?sid=racing",
    icon: '<i class="cql-race-track"></i>'
  },
  stockmarket: {
    name: "Stock Market",
    url: "page.php?sid=stocks",
    icon: '<i class="cql-stock-exchange"></i>'
  },
  travelagency: {
    name: "Travel Agency",
    url: "travelagency.php",
    icon: '<i class="cql-travel-agency"></i>'
  },
  vault: {
    name: "Property Vault",
    url: "properties.php#/p=options&tab=vault",
    icon: '<i class="property-option-vault"></i>'
  }
}

$(document).ready(function() {
  var manifestData = chrome.runtime.getManifest();
  $('.version').text('ReTorn v'+manifestData.version);


chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
  if (response.status == true) {
    const settings = response.value.re_settings;
    initNotificationTab(settings);
    initTornStatsTab(settings);
  }
});


  initLogger();
  initChatUserHighlights();
  initQuickLinksList();

  $(document).click(function(event) {
      if (!$(event.target).closest(".dropdown-menu, .dropdown .nav-link").length) {
          $(".dropdown-menu").hide();
      }
      if ($(event.target).closest(".mainview, ul.tabs.show > li").length) {
          $("ul.tabs.show").removeClass("show");
      }
  });

  /* Initialize Sidebar List */
  $('ul.tabs > li').first().addClass('active');
  $('.tab_container').first().addClass('show');
  $('ul.tabs li:not(.disabled,:disabled)').click(function(){
      var t = $(this).data('tab');

      if($(this).hasClass('active')){

      } else {
        $('ul.tabs > li').removeClass('active');
        $(this).addClass('active');
      }
      $('.tab_container').removeClass('show');
      $('.tab_container#'+ t).addClass('show');
   });

   $('button.mobile').click(function() {
     $('ul.tabs').toggleClass('show');
   });


   //Tab Menus functionality
   $('ul.nav > li.nav-item > a.nav-link, ul.dropdown-menu > li > a.dropdown-item').click(function() {
     let tab_target = $(this).closest(".nav").attr("tab-target");
     let target = $(this).data("target");
     $(tab_target+" > .tab-pane").removeClass("active");
     $(tab_target+" "+target).addClass("active");
     $('.nav-link').removeClass("active");
     $(this).closest(".nav-item").find(".nav-link").addClass("active");
     $(".dropdown-menu").hide();
   });

   $('ul.nav > li.nav-item.dropdown > a.nav-link').off("click").click(function() {
     let menu = $(this).parent(".dropdown").find("ul.dropdown-menu");
     if (menu.is(":visible")) {
       menu.hide();
     } else {
       $('ul.dropdown-menu').hide();
       menu.show();
     }
   });

  chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
      if (response.status == true && response.value.re_settings != undefined) {
        settings = response.value.re_settings;
        if (settings.darkmode != undefined && settings.darkmode == true) {
          $("html").removeClass('light');
          $("html").addClass('dark');
          $('#darkmode').prop("checked", true);
        } else {
          $("html").removeClass('dark');
          $("html").addClass('light');
          $('#darkmode').prop("checked", false);
        }



        if (settings.npclist != undefined && settings.npclist.enabled && settings.npclist.enabled == true) {
          $('#npclist').prop("checked", true);
        } else {
          $('#npclist').prop("checked", false);
        }

        if (settings.tsevents != undefined && settings.tsevents == true) {
          $('#tsevents').prop("checked", true);
        } else {
          $('#tsevents').prop("checked", false);
        }

        if (settings.leftalign != undefined && settings.leftalign == true) {
          $('#leftalign').prop("checked", true);
        } else {
          $('#leftalign').prop("checked", false);
        }

        if (settings.torn3d != undefined && settings.torn3d == true) {
          $('#torn3d').prop("checked", true);
        } else {
          $('#torn3d').prop("checked", false);
        }

        if (settings.chatuserhighlight != undefined && settings.chatuserhighlight == true) {
          $('#chatuserhighlight').prop("checked", true);
          $('#highlightUsers').show();
        } else {
          $('#chatuserhighlight').prop("checked", false);
          $('#highlightUsers').hide();
        }

        if (settings.header_color != undefined) {
          $('#header_color').val(settings.header_color);
          document.querySelector('#header_color').jscolor.fromString(settings.header_color);

          $('.re_head').css("background-color", settings.header_color);
        }

        $('div#events input#eastereggs').val(settings.events["eastereggs"].enabled);
        if (settings.events["eastereggs"].enabled == true) {
          $('div#events input#eastereggs').prop("checked", true);
        } else {
          $('div#events input#eastereggs').prop("checked", false);
        }

        $('div#events input#eastereggs').change(function() {
          let value = $(this).val() == "false" ? true : false;
          chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {events: {eastereggs: {enabled: value}}}}, (response) => {
            $(this).val(value);
          });
         });


      }
  });





  $('#darkmode').change(function() {
     let v = $(this).is(":checked");
     chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"darkmode": v}}, (response) => {
          if ($(this).is(':not(:checked)')) {
            $("html").removeClass('dark');
            $("html").addClass('light');

          } else {
            $("html").removeClass('light');
            $("html").addClass('dark');
          }
      });
  });

  $('#leftalign').change(function() {
     let v = $(this).is(":checked");
       chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"leftalign": v}}, (response) => {
       });
  });

  $('#npclist').change(function() {
     let v = $(this).is(":checked");
     chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
        if (response.value.re_settings.tornstats) {
         chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"npclist": {enabled: v}}}, (response) => {
         });
       } else {
         $('#npclist').prop("checked", false);
         if (v) {
           alert("TornStats Integration must be set to use this feature.");
         }
       }
      });
  });
  $('#tsevents').change(function() {
     let v = $(this).is(":checked");
     chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
       if (response.value.re_settings.tornstats) {
         chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"tsevents": v}}, (response) => {
         });
       } else {
         $('#tsevents').prop("checked", false);
         if (v) {
           alert("TornStats Integration must be set to use this feature.");
         }
       }
     });
   });


  $('#header_color').change(function() {
    let color = $(this).val();
    $('.re_head').css("background-color", color);
    chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"header_color": color}}, (response) => {
    });
  });

  $("button#tornstats").click(function() {
      // Enable Tornstats
      if ($(this).val() == 0) {
        let key = $("#ts_apikey").val();
        if (key != undefined && key.length == 16) {
          if (confirm('By accepting, you are agreeing to allow your Torn API key to be transmitted to Torn Stats.')) {
            chrome.runtime.sendMessage({name: "integrate_tornstats", apikey: key}, (response) => {
              if (response.status != undefined) {
                message(response, "ts_message", response.status);
                if (response.status == true) {
                  $('#ts_status').text("Enabled");
                  $(this).html("Unlink account");
                  $('button#tornstats').val(1);
                  $('#tornstats_features').show();
                  $('#ts_link_wrap').hide();
                } else {
                  $('#ts_status').text("Disabled");
                  $(this).html("Link account");
                  $('button#tornstats').val(0);
                  $('#tornstats_features').hide();
                  $('#ts_link_wrap').show();
                }
              } else {
                message("Unknown error.", "ts_message", false);
              }
            });
        }
        } else {
          message({message: "API Key field is empty."}, "ts_message", false);
        }
      }

      // Disabled TornStats
      if ($(this).val() == 1) {
        chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"tornstats": false, "tornstats_apikey": ""}}, (response) => {
          message(response, "ts_message", response.status);
          if (response.status == true) {
            $('#ts_status').text("Disabled");
            $(this).html("Link account");
            $('button#tornstats').val(0);
            $('#tornstats_features').hide();
            $('#ts_link_wrap').show();
          } else {
            $('#ts_status').text("Enabled");
            $(this).html("Unlink account");
            $('button#tornstats').val(1);
            $('#tornstats_features').show();
            $('#ts_link_wrap').hide();
          }
        });
      }

    });


  $("button#reset").click(function() {
    // Full reset of ReTorn Settings
      if (confirm('This will completely reset your settings and ReTorn data, including sync settings and local ReTorn storage. There is no going back from this. Are you sure you would like to fully reset ReTorn?')) {

        chrome.runtime.sendMessage({name: "full_reset"});
        setTimeout(function(){
           window.location.reload();
        }, 250);
      }

  });

  $("button#force_torn_items").click(function() {
    // force api or items list doc to refill local items storage
    chrome.runtime.sendMessage({name: "force_torn_items"});
    alert("Items Cache have been refreshed.")
  });

}); //Document.ready

function chatUserHighlight(parent) {
    let v = parent.find('input[type="checkbox"]').is(":checked");
    var value = parent.find('input[type="text"]:disabled').val();
    let c = parent.find('input[type="color"]').val();

    if (value && c && v != undefined) {
      chrome.runtime.sendMessage({name: "set_value", value_name: "re_chatuserhighlight", value: {[value]: {enabled: v, color: c}}}, (response) => {
        initChatUserHighlights();
      });
    }
}

function initChatUserHighlights() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_chatuserhighlight"}, (response) => {
    if (response.status && response.status == true && response.value) {
      if (response.value.re_chatuserhighlight && !jQuery.isEmptyObject(response.value.re_chatuserhighlight)) {
        var userHighlights = response.value.re_chatuserhighlight;
        $('#highlightUsers').empty();
        Object.keys(userHighlights).forEach(userid => {
          $('#highlightUsers').append(`<div data-id="`+userid+`">
            <input type="checkbox">
            <input type="text" class="numOnly" value="`+userid+`" disabled>
            <input type="color" value="`+userHighlights[userid].color+`">
            <input type="button" class="delChatUserHighlight" value="-">
            </div>`);
            $('#highlightUsers > div[data-id='+userid+'] > input[type=checkbox]').prop("checked", userHighlights[userid].enabled);
        });
        $('#highlightUsers').append(`<div>
          <input type="checkbox">
          <input type="text" class="numOnly" value="">
          <input type="color" value="#E0CE00">
          <input type="button" class="addChatUserHighlight" value="+">
          </div>`);
      } else {
        $('#highlightUsers').html(`<div>
          <input type="checkbox">
          <input type="text" class="numOnly" value="">
          <input type="color" value="#E0CE00">
          <input type="button" class="addChatUserHighlight" value="+">
          </div>`);
      }

      $('input#chatuserhighlight[type=checkbox]').change(function() {
         let v = $(this).is(":checked");
         chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"chatuserhighlight": v}}, (response) => {

         });

         if (v == true) {
           initChatUserHighlights();
           $('#highlightUsers').show();
         } else {
           $('#highlightUsers').hide();
         }
      });


      $('input.numOnly[type="text"]').change(function() {
        var value = $(this).val();
        let id = $(this).attr('id');
        if (!/^[0-9]*$/.test(value)) {
          $(this).val($(this).data('prev'));
        }
      });

      $('input.numOnly[type="text"]').focus(function() {
        $(this).select();
        $(this).data('prev', $(this).val());
      });

      $('#highlightUsers input[type="checkbox"], #highlightUsers input[type="color"]').change(function() {
          var parent = $(this).parent();
          chatUserHighlight(parent);
      });

      $('#highlightUsers input.delChatUserHighlight[type="button"]').click(function() {
          var parent = $(this).parent();
          let uid = parent.data('id');
          chrome.runtime.sendMessage({name: "del_value", value: "re_chatuserhighlight", key: [uid]}, (response) => {
            initChatUserHighlights();
          });
      });

      $('#highlightUsers input.addChatUserHighlight[type="button"]').click(function() {
          var parent = $(this).parent();
          if (!parent.find('input[type="text"]').val()) {
            parent.find('input[type="text"]').addClass('alerts-border');
            setTimeout(
                function() { parent.find('input[type="text"]').removeClass('alerts-border'); },
                3000
            );
          } else {
            parent.find('input[type="text"]').prop('disabled', true);
            chatUserHighlight(parent);
          }
      });
    }
  });

}


function message(response, me, status) {
  if (status == false) {
    $(".re_message#"+me).removeClass('success');
    $(".re_message#"+me).addClass('error');
  } else {
    $(".re_message#"+me).removeClass('error');
    $(".re_message#"+me).addClass('success');
  }
  if (response.value != undefined) {
    $(".re_message#"+me).text(response.message + " {" + response.value + "}");
  } else {
    $(".re_message#"+me).text(response.message);
  }
  $(".re_message#"+me).attr('hidden', false);
}


function initQuickLinksList() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_quicklinks", type: "sync"}, (response) => {

    $("#quicklinks").empty(); //Empty list

    //Propogate quick links list with enough select boxes for each plus one
    for (var i = 0; i <= Object.keys(response.value.re_quicklinks).length; i++) {
      appendQuickLinks();
    }
    let optionStr = ``;
    //fill each select box with all of the options available from quicklinks const
    for (const [key, value] of Object.entries(quicklinks)) {
      optionStr += `<option value="${value.url}">${value.name}</option>`;
    }
    $('.quicklinks').append(optionStr);

    //set each select box to the correct option
    if (response.value.re_quicklinks && Object.keys(response.value.re_quicklinks).length != 0) {
      for (const [key, value] of Object.entries(response.value.re_quicklinks)) {
        let qlink_wrap = $("#quicklinks > .switch_wrap").eq(key);
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

    //set change events to all inputs for quicklinks
    $("#quicklinks input[type='checkbox'], #quicklinks .quicklinks, #quicklinks input[type='text']").off('change').change(function(e) {
      let qlink_wrap = $(this).parent('.switch_wrap');
      let enabled = qlink_wrap.find("input[type=checkbox]").is(":checked");
      let index = $("#quicklinks .switch_wrap").index(qlink_wrap);
      let value = qlink_wrap.find('.quicklinks').val();
      let name;
      let url;
      let type;

      if (value == "custom") {
        type = "custom";
        qlink_wrap.find('input[type=text]').show();
        name = qlink_wrap.find('input[type=text][name=name]').val();
        url = encodeURI(qlink_wrap.find('input[type=text][name=url]').val());
      } else {
        type = "default";
        name  = qlink_wrap.find(".quicklinks option:selected").text();
        url = encodeURI(value);
      }


      // if everything is in place and not undefined or blank, then send message to add to quick links
      if (index != undefined && type != undefined && enabled != undefined && name != undefined && url != undefined && name != "" && url != "") {
        chrome.runtime.sendMessage({name: "set_value", value_name: "re_quicklinks", value: {[index]: {type: type, enabled: enabled, name: name, url: url}}}, (response) => {
          initQuickLinksList();
        });
      }

      // if checkbox changed and select box is set to custom and is not the last child and checkbox is set to false, then delete quicklinks entry
      if ($(this).is(':checkbox') && enabled == false && value == 'custom' && !$(qlink_wrap).is(':last-child') && name == "" && url == "") {
        chrome.runtime.sendMessage({name: "del_value", value: "re_quicklinks", key: [index]}, (response) => {
          initQuickLinksList();
        });
      }
    });
  });
}


//function to insert base of quick links wrap
function appendQuickLinks() {
  $("#quicklinks").append(`
    <div class="switch_wrap">
      <input type="checkbox">
      <select class="quicklinks">
        <option value="custom" selected>Custom...</option>
      </select>
      <input type="text" name="name" placeholder="Name">
      <input type="text" name="url" placeholder="URL">
    </div>
    `)
}

function initNotificationTab(settings) {
  const notifications = ["notifications", "energy", "nerve", "happy", "life", "events", "messages", "drugs", "boosters", "medical", "education", "travel"];
  notifications.forEach((notif, i) => {
    var checkbox = $('div#general_notifications input#' + notif);

    checkbox.val(settings.notifications[notif].enabled);
    if (settings.notifications[notif].enabled == true) {
      checkbox.prop("checked", true);
    } else {
      checkbox.prop("checked", false);
    }

    if (!settings.notifications["notifications"].enabled) {
      $('span[for="all_notifications"').attr('tooltip', "All notifications disabled");
      $('div#general_notifications input:not(#notifications)').closest('.switch-holder').hide();
    } else {
      $('span[for="all_notifications').attr('tooltip', "All notifications enabled");
      $('div#general_notifications input:not(#notifications)').closest('.switch-holder').show();
    }

    if (settings.notifications[notif].value != undefined) {
      var textbox = $('div#general_notifications input#' + notif + '_value');
      let val = settings.notifications[notif].value;
      textbox.val(val);
      if (val.includes("<")) {
        $('span[for='+  notif + '_value]').attr("tooltip", "Notify when "+notif+" drops below "+ val.replace('<',''));
      }
      if (val.includes(">")) {
        $('span[for='+  notif + '_value]').attr("tooltip", "Notify when "+notif+" increases above "+ val.replace('>',''));
      }
      if (!val.includes(">") && !val.includes("<")) {
        if (val == "100%") {
          $('span[for='+  notif + '_value]').attr("tooltip", "Notify when "+notif+" is full");
        } else {
          $('span[for='+  notif + '_value]').attr("tooltip", "Notify when "+notif+" equals "+ val);
        }
      }

      textbox.change(function() {
        var value = $(this).val();
        let id = $(this).attr('id');
        if (value == "" || /(?!^)[\<\>]|[\%](?!$)|[^0-9\>\<\%]/.test(value)) {
          $(this).val($(this).data('prev'));
        } else {
          chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {notifications: {[notif]: {value: value}}}}, (response) => {
            if (value.includes("<")) {
              $('span[for='+  id  +']').attr("tooltip", "Notify when "+notif+" drops below "+ value.replace('<',''));
            }
            if (value.includes(">")) {
              $('span[for='+  id  +']').attr("tooltip", "Notify when "+notif+" increases above "+ value.replace('>',''));
            }
            if (!value.includes(">") && !value.includes("<")) {
              if (value == "100%") {
                $('span[for='+  id  +']').attr("tooltip", "Notify when "+notif+" is full");
              } else {
                $('span[for='+  id  +']').attr("tooltip", "Notify when "+notif+" equals "+ value);
              }
            }
          });
        }
      });

      textbox.focus(function() {
        $(this).data('prev', $(this).val());
      });
    }

    checkbox.change(function() {
      let value = $(this).val() == "false" ? true : false;
      chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {notifications: {[notif]: {enabled: value}}}}, (response) => {
        $(this).val(value);
      });
      if (notif == "notifications") {
        if (!value) {
          $('span[for="all_notifications"').attr('tooltip', "All notifications disabled");
          $('div#general_notifications input:not(#notifications)').closest('.switch-holder').hide();
        } else {
          $('span[for="all_notifications').attr('tooltip', "All notifications enabled");
          $('div#general_notifications input:not(#notifications)').closest('.switch-holder').show();
        }
      }
     });

  });





  if (settings.notifications.chain) {
    $("#chaintime_value").val(settings.notifications.chain.alerts.time);
    $("#chainhit_value").val(settings.notifications.chain.alerts.hit);

    if (settings.notifications.chain.hit) {
      $('#chainhit').prop("checked", true);
    } else {
      $('#chainhit').prop("checked", false);
    }

    if (settings.notifications.chain.time) {
      $('#chaintime').prop("checked", true);
    } else {
      $('#chaintime').prop("checked", false);
    }

    $('#chainhit, #chaintime').change(function() {
      let id = $(this).attr('id').replace("chain", "");
      let v = $(this).is(":checked");
      chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"notifications": {"chain": {[id]: v}}}});
    });

    $('input#chainhit_value, input#chaintime_value').change(function() {
      var input = $(this);
      let id = input.attr('id').replace("chain", "").replace("_value", "");
      let v = input.val();
      if (v == "" || /[^0-9\,\s].*/.test(v)) {
        input.val(input.data('prev'));
        input.addClass('alerts-border');
        setTimeout(
            function() {   input.removeClass('alerts-border'); },
            1750
        );
      } else {
        input.data('prev', v);
        chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"notifications": {"chain": {"alerts": {[id]: v}}}}});
      }
    });

    $('input#chainhit_value, input#chaintime_value').focus(function() {
      $(this).data('prev', $(this).val());
    });
  }
}

function initTornStatsTab(settings) {
  if (settings.tornstats != undefined && settings.tornstats == true) {
    $('#ts_status').text("Enabled");
    $('button#tornstats').html("Unlink account");
    $('button#tornstats').val(1);
    $('#tornstats_features').show();
    $('#ts_link_wrap').hide();
  } else {
    $('#ts_status').text("Disabled");
    $('button#tornstats').html("Link account");
    $('button#tornstats').val(0);
    $('#tornstats_features').hide();
    $('#ts_link_wrap').show();
  }
}

function initLogger() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_logs", type: "local"}, (response) => {
    if (response.status == true) {
      let logs = response.value.re_logs;
      for (const [type, subtype] of Object.entries(logs)) {
        for (const key of Object.keys(subtype)) {
          $('#logs-tabContent').append(`<div class="tab-pane" id="logs-`+type+`-`+key+`">
                              <h3>`+type+` `+key+`</h3>
                              <div class="log-wrap"></div>
                            </div>`)
        }
      }
      $('#logs-error-api').addClass('active');
      updateLogger();
    }
  });
}

function updateLogger() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_logs", type: "local"}, (response) => {
    if (response.status == true) {
      let logs = response.value.re_logs;
      if (logs.error) {
        for (const subtype of Object.keys(logs.error)) {
          if (logs.error[subtype]) {
            let table = `<table class="log-list"><tr><th class="num">#</th><th>Message</th><th>Error</th><th>Timestamp</th></tr>`;
            if (Object.keys(logs.error[subtype]).length) {
              for (const [key, value] of Object.entries(logs.error[subtype]).reverse()) {
                let log = value.log;
                if (subtype == "api") {
                  table += `<tr class="log-item"><td class="num">`+key+`</td><td>`+value.message+`</td><td>Error Code: `+log.code+` - `+log.error+`</td><td class="log-timestamp">`+new Date(log.timestamp).toLocaleString()+`</td></tr>`;
                } else {
                  table += `<tr class="log-item"><td class="num">`+key+`</td><td colspan="2">`+value.message+`</td><td class="log-timestamp">`+new Date(log.timestamp).toLocaleString()+`</td></tr>`;
                }
              }
            } else {
              table += `<tr><td colspan=4>No log data</td></tr>`;
            }
            table += `</table>`;
            $('#logs-error-'+subtype+' > div').html(table);
          }
        }
      }

      if (logs.data) {
        for (const subtype of Object.keys(logs.data)) {
          if (logs.data[subtype]) {
            let table = `<table class="log-list"><tr><th class="num">#</th><th>Message</th><th>Timestamp</th></tr>`;
            if (Object.keys(logs.data[subtype]).length) {
              for (const [key, value] of Object.entries(logs.data[subtype]).reverse()) {
                let log = value.log;
                let time_diff = new Date() - new Date(log.timestamp);
                table += `<tr class="log-item"><td class="num">`+key+`</td><td>`+value.message+`</td><td class="log-timestamp" tooltip="`+time_diff+`" flow="up">`+new Date(log.timestamp).toLocaleString()+`</td></tr>`;
              }
            } else {
              table += `<tr><td colspan=4>No log data</td></tr>`;
            }
            table += `</table>`;
            $('#logs-data-'+subtype+' > div').html(table);
          }
        }
      }

      if (logs.notifications) {
        for (const subtype of Object.keys(logs.notifications)) {
          if (logs.notifications[subtype]) {
            let table = `<table class="log-list"><tr><th class="num">#</th><th>Title</th><th>Message</th><th>Timestamp</th></tr>`;
            if (Object.keys(logs.notifications[subtype]).length) {
              for (const [key, value] of Object.entries(logs.notifications[subtype]).reverse()) {
                let log = value.log;
                let time_diff = new Date() - new Date(log.timestamp);
                table += `<tr class="log-item"><td class="num">`+key+`</td><td>`+value.message+`</td><td>`+log.message+`</td><td class="log-timestamp" tooltip="`+time_diff+`" flow="up">`+new Date(log.timestamp).toLocaleString()+`</td></tr>`;
              }
            } else {
              table += `<tr><td colspan=4>No log data</td></tr>`;
            }
            table += `</table>`;
            $('#logs-notifications-'+subtype+' > div').html(table);
          }
        }
      }

      if (logs.api) {
        for (const subtype of Object.keys(logs.api)) {
          if (logs.api[subtype]) {
            if (subtype == "torn") {
              let table = `<table class="log-list"><tr><th class="num">#</th><th>Message</th><th class="ellipsis">API URL</th><th>Timestamp</th></tr>`;
              if (Object.keys(logs.api[subtype]).length) {
                for (const [key, value] of Object.entries(logs.api[subtype]).reverse()) {
                  let log = value.log;
                  table += `<tr class="log-item"><td class="num">`+key+`</td><td>`+value.message+`</td><td class="ellipsis" data-text="https://api.torn.com/`+log.type+`/`+log.id+`?selections=`+log.selection+`">https://api.torn.com/`+log.type+`/`+log.id+`?selections=`+log.selection+`</td><td class="log-timestamp">`+new Date(log.timestamp).toLocaleString()+`</td></tr>`;
                }
              } else {
                table += `<tr><td colspan=4>No log data</td></tr>`;
              }
              table += `</table>`;
              $('#logs-api-'+subtype+' > div').html(table);
            }
            if (subtype == "tornstats") {
              let table = `<table class="log-list"><tr><th class="num">#</th><th>Status</th><th>Message</th><th class="ellipsis">API URL</th><th>Timestamp</th></tr>`;
              if (Object.keys(logs.api[subtype]).length) {
                for (const [key, value] of Object.entries(logs.api[subtype]).reverse()) {
                  let log = value.log;
                  table += `<tr class="log-item"><td class="num">`+key+`</td><td>`+log.status+`</td><td>`+log.message+`</td><td class="ellipsis" data-text="https://www.tornstats.com/api/v1/KEY/`+log.selection+`">https://www.tornstats.com/api/v1/KEY/`+log.selection+`</td><td class="log-timestamp">`+new Date(log.timestamp).toLocaleString()+`</td></tr>`;
                }
              } else {
                table += `<tr><td colspan=4>No log data</td></tr>`;
              }
              table += `</table>`;
              $('#logs-api-'+subtype+' > div').html(table);
            }
          }
        }
      }
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.name == "log") {
    updateLogger();
  }
});


$('#torn3d').change(function() {
   let v = $(this).is(":checked");
     chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"torn3d": v}}, (response) => {
     });
});
