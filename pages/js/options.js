$(document).ready(function() {

chrome.runtime.sendMessage({name: "get_value", value: "re_user"}, (response) => {
  if (response.status == true) {
    const user = response.value.re_user;
  }
});

chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
  if (response.status == true) {
    const settings = response.value.re_settings;
    initNotificationTab(settings);
    initTornStatsTab(settings);
  }
});


  initChatUserHighlights();

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
    chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"header_color": color}}, (response) => {
    });
  });

  $("button#tornstats").click(function() {
      // Enable TornStats
      if ($(this).val() == 0) {
        if (confirm('By accepting, you are agreeing to allow your Torn API key to be transmitted to Torn Stats.')) {

          chrome.runtime.sendMessage({name: "integrate_tornstats"}, (response) => {
            if (response.status != undefined) {
              message(response, "ts_message", response.status);
              if (response.status == true) {
                $('#ts_status').text("Enabled");
                $(this).html("Unlink account");
                $('button#tornstats').val(1);
                $('#tornstats_features').show();
              } else {
                $('#ts_status').text("Disabled");
                $(this).html("Link account");
                $('button#tornstats').val(0);
                $('#tornstats_features').hide();
              }
            } else {
              message("Unknown error.", "ts_message", false);
            }
          });

        }
      }

      // Disabled TornStats
      if ($(this).val() == 1) {
        chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"tornstats": false}}, (response) => {
          message(response, "ts_message", response.status);
          if (response.status == true) {
            $('#ts_status').text("Disabled");
            $(this).html("Link account");
            $('button#tornstats').val(0);
            $('#tornstats_features').hide();
          } else {
            $('#ts_status').text("Enabled");
            $(this).html("Unlink account");
            $('button#tornstats').val(1);
            $('#tornstats_features').show();
          }
        });
      }
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
        if (typeof user !== 'undefined' && user.player_id) {
          var u = user.player_id;
        } else {
          var u = "";
        }
        $('#highlightUsers').html(`<div>
          <input type="checkbox">
          <input type="text" class="numOnly" value="`+u+`">
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
      $('div#general_notifications input:not(#notifications)').closest('.switch-holder').hide();
    } else {
      $('div#general_notifications input:not(#notifications)').closest('.switch-holder').show();
    }

    if (settings.notifications[notif].value != undefined) {
      var textbox = $('div#general_notifications input#' + notif + '_value');
      let val = settings.notifications[notif].value;
      textbox.val(val);
      if (val.includes("<")) {
        $('label[for='+  notif + '_value]').attr("tooltip", "Notify when "+notif+" drops below "+ val.replace('<',''));
      }
      if (val.includes(">")) {
        $('label[for='+  notif + '_value]').attr("tooltip", "Notify when "+notif+" increases above "+ val.replace('>',''));
      }
      if (!val.includes(">") && !val.includes("<")) {
        if (val == "100%") {
          $('label[for='+  notif + '_value]').attr("tooltip", "Notify when "+notif+" is full");
        } else {
          $('label[for='+  notif + '_value]').attr("tooltip", "Notify when "+notif+" equals "+ val);
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
              $('label[for='+  id  +']').attr("tooltip", "Notify when "+notif+" drops below "+ value.replace('<',''));
            }
            if (value.includes(">")) {
              $('label[for='+  id  +']').attr("tooltip", "Notify when "+notif+" increases above "+ value.replace('>',''));
            }
            if (!value.includes(">") && !value.includes("<")) {
              if (value == "100%") {
                $('label[for='+  id  +']').attr("tooltip", "Notify when "+notif+" is full");
              } else {
                $('label[for='+  id  +']').attr("tooltip", "Notify when "+notif+" equals "+ value);
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
          $('div#general_notifications input:not(#notifications)').closest('.switch-holder').hide();
        } else {
          $('div#general_notifications input:not(#notifications)').closest('.switch-holder').show();
        }
      }
     });

  });
}

function initTornStatsTab(settings) {
  if (settings.tornstats != undefined && settings.tornstats == true) {
    $('#ts_status').text("Enabled");
    $('button#tornstats').html("Unlink account");
    $('button#tornstats').val(1);
    $('#tornstats_features').show();
  } else {
    $('#ts_status').text("Disabled");
    $('button#tornstats').html("Link account");
    $('button#tornstats').val(0);
    $('#tornstats_features').hide();
  }
}
