
var re_jail_refresh_lock = false;
var re_shown_users = [];
var re_edu_bail_reduction = 1;


sendMessage({name: "get_local", value: "re_user_data"})
  .then((r) => {
    const edu_completed = r.data.education_completed;

    // 93:     Gain a 5% discount when buying people out of jail
    // 98:     Gain a 10% discount when buying people out of jail
    // 102:    Gain two bonuses: Busting is 50% easier and bailing is 50% cheaper

    if (edu_completed.includes(93)) {
      re_edu_bail_reduction = re_edu_bail_reduction * 0.95;
    }

    if (edu_completed.includes(98)) {
       re_edu_bail_reduction = re_edu_bail_reduction * 0.90;
    }

    if (edu_completed.includes(102)) {
        re_edu_bail_reduction = re_edu_bail_reduction * 0.50;
    }
  })
  .catch((e) => console.error(e));


//Changing jail pages
var jailPageObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes && mutation.addedNodes.length > 1) {
      if (mutation.target && mutation.target && mutation.target.className && mutation.target.className.includes('users-list')) {
        setQuickActions();
        filterJail();
        setBustBailButtons();
      }
    }
  })
});

//check for userlist wrapper and if jail header exists already
var startupObserver = new MutationObserver(function(mutations) {
  if ($(".userlist-wrapper").length == 1 && $('div.re_container').length == 0) {
    initJail();
    startupObserver.disconnect();
  }
});

//actual startup
$(document).ready(function() {
  if ($('div.captcha').length == 0 && features?.pages?.jailview?.quick_jail?.enabled) {
    startupObserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  }
});

function initJail() {
  //Insert container
  if ($(`.re_container[data-feature="${QUICK_JAIL}"]`).length != 0) return;
  const containerObject = {
      "feature": `${QUICK_JAIL}`,
      "insertLocation": "after",
      "elementClasses": "",
      "bar": false
  }
  insertContainer($("div.content-title"), containerObject);
  const RE_CONTAINER = $(`.re_container[data-feature="${QUICK_JAIL}"]`);
  disableFilterCheckbox(QUICK_JAIL);

  $(RE_CONTAINER.find('#re_disable_filters input[type=checkbox]')).change(function() {
    filterJail();
  });

  RE_CONTAINER.find('.re_head > .re_title').after(`
    <div id="re_jail_refresh" class="re_header_icon_wrap" title="Refresh jail view">
        <i class="fas fa-rotate re_header_icon" style="--fa-animation-duration: 0.5s; --fa-animation-iteration-count: 1;--fa-animation-timing: ease-in-out;"></i>
    </div>
  `);

  
  $("#re_jail_refresh").click(function(e) {
    e.stopPropagation();
    if (!re_jail_refresh_lock) {
      re_jail_refresh_lock = true;
      var icon = $(this).find('i.fa-rotate');
      icon.addClass('fa-spin');
      document.dispatchEvent(new CustomEvent('re_jail_refresh'));
      setTimeout(() => {
        icon.removeClass('fa-spin');
        re_jail_refresh_lock = false;
      }, 500); 
    }
  });

  RE_CONTAINER.find('.re_head > .re_title').after(`
    <div id="re_jail_easy_bail" class="re_header_icon_wrap" title="Bail the easiest shown player or refresh jail">
      <i class="fas fa-sack-dollar re_header_icon" style="--fa-animation-duration: 0.5s; --fa-animation-iteration-count: 1;--fa-animation-timing: ease-in-out;"></i>
    </div>

    <div id="re_jail_easy_bust" class="re_header_icon_wrap" title="Bust the easiest shown player or refresh jail">
      <i class="fas fa-soap re_header_icon" style="--fa-animation-duration: 0.5s; --fa-animation-iteration-count: 1;--fa-animation-timing: ease-in-out;"></i>
    </div>
  `);

  $("#re_jail_easy_bail").click(function(e) {
    e.stopPropagation();
    var icon = $(this).find('i.fa-sack-dollar');
    icon.addClass('fa-beat');
    setTimeout(() => {
      icon.removeClass('fa-beat');
    }, 500); 


    if (!re_shown_users.length) { // No users in filtered list, refresh
      if (!re_jail_refresh_lock) {
        re_jail_refresh_lock = true;
        document.dispatchEvent(new CustomEvent('re_jail_refresh'));
        setTimeout(() => {
          re_jail_refresh_lock = false;
        }, 500); 
      }
    } else {
      //find easiest user (by score) and try to bust
      var hiddenClassName = 'bye';
      var selectorClassName = 'bust';

      let lowest = re_shown_users.shift(); //get lowest (first entry) and remove from array

      var action_el = $(`ul.user-info-list-wrap > li > a.${hiddenClassName}[href^="jailview.php?XID=${lowest.userid}&action=rescue&step=buy"]`); //bust button for lowest player
      if (!action_el) {
        return; //failed
      }
      var $parent = action_el.parents('li');
      var messagesContainer = $parent.find(".confirm-" + selectorClassName);

      var options = {
        url: `jailview.php?XID=${lowest.userid}&action=rescue&step=buy1`,
        type: "get",
        beforeSend: function(xhr) {
          messagesContainer.find('.ajax-preloader').remove();
          $parent.find('.ajax-action').remove();
          messagesContainer.append('<span class="ajax-preloader"></span>');

          action_el.prev().removeClass('active')
          action_el.next().removeClass('active')
          if (action_el.is('.active')) {
              action_el.removeClass('active')
          } else {
              action_el.addClass('active')
          }

          action_el.closest('li')
              .addClass('active')
              .find('.confirm-' + selectorClassName)
              .toggle()
              .end()
              .find('.confirm-' + hiddenClassName)
              .hide();
          if (action_el.parents('li').find('.confirm-' + selectorClassName).is(':hidden')) {
              action_el.parents('li').removeClass('active');
          }
        },
        success: function(res) {
          try {
              var data = JSON.parse(res),
                  html = '';
              if(data.msg) html = '<div class="ajax-action">' + data.msg + '</div>';
              if(data.error) html = '<div class="ajax-action">' + data.text + '</div>';
              messagesContainer.html("");
              messagesContainer.append(html);
              messagesContainer.parents('.info-msg-cont').removeClass("green red blue").addClass(data.color);
              messagesContainer.parents('.info-msg-cont').attr('tabindex', 0);
          } catch (e) {
              data = '<div class="ajax-action">' + data + '</div>';
              messagesContainer.html("");
              messagesContainer.append(data);
          }
        }
      };

      $.ajax(options);
    }
  });

  $("#re_jail_easy_bust").click(function(e) {
    e.stopPropagation();
    var icon = $(this).find('i.fa-soap');
    icon.addClass('fa-beat');
    setTimeout(() => {
      icon.removeClass('fa-beat');
    }, 500); 


    if (!re_shown_users.length) { // No users in filtered list, refresh
      if (!re_jail_refresh_lock) {
        re_jail_refresh_lock = true;
        document.dispatchEvent(new CustomEvent('re_jail_refresh'));
        setTimeout(() => {
          re_jail_refresh_lock = false;
        }, 500); 
      }
    } else {
      //find easiest user (by score) and try to bust
      var hiddenClassName = 'bye';
      var selectorClassName = 'bust';

      let lowest = re_shown_users.shift(); //get lowest (first entry) and remove from array

      var action_el = $(`ul.user-info-list-wrap > li > a.${selectorClassName}[href^="jailview.php?XID=${lowest.userid}"]`); //bust button for lowest player
      if (!action_el) {
        return; //failed
      }
      var $parent = action_el.parents('li');
      var messagesContainer = $parent.find(".confirm-" + selectorClassName);

      var options = {
        url: `jailview.php?XID=${lowest.userid}&action=rescue&step=breakout1`,
        type: "get",
        beforeSend: function(xhr) {
          messagesContainer.find('.ajax-preloader').remove();
          $parent.find('.ajax-action').remove();
          messagesContainer.append('<span class="ajax-preloader"></span>');

          action_el.prev().removeClass('active')
          action_el.next().removeClass('active')
          if (action_el.is('.active')) {
              action_el.removeClass('active')
          } else {
              action_el.addClass('active')
          }

          action_el.closest('li')
              .addClass('active')
              .find('.confirm-' + selectorClassName)
              .toggle()
              .end()
              .find('.confirm-' + hiddenClassName)
              .hide();
          if (action_el.parents('li').find('.confirm-' + selectorClassName).is(':hidden')) {
              action_el.parents('li').removeClass('active');
          }
        },
        success: function(res) {
          try {
              var data = JSON.parse(res),
                  html = '';
              if(data.msg) html = '<div class="ajax-action">' + data.msg + '</div>';
              if(data.error) html = '<div class="ajax-action">' + data.text + '</div>';
              messagesContainer.html("");
              messagesContainer.append(html);
              messagesContainer.parents('.info-msg-cont').removeClass("green red blue").addClass(data.color);
              messagesContainer.parents('.info-msg-cont').attr('tabindex', 0);
          } catch (e) {
              data = '<div class="ajax-action">' + data + '</div>';
              messagesContainer.html("");
              messagesContainer.append(data);
          }
        }
      };

      $.ajax(options);
    }
  });

  document.addEventListener("re_jail_refresh_complete", function() {
    filterJail();
  });


  RE_CONTAINER.find('#re_title').text("Jail");

  RE_CONTAINER.find('.re_content').addClass('re_jail');

  RE_CONTAINER.find('.re_content').html(`
    <div class="re_row">
      <div class="re_col">
        <div class="grid_wrap">
          <div class="grid_box box1">
            <div class="re_checkbox fancybox">
              <input type="checkbox" id="re_jail_qbust" name='bust'>
              <label class="noselect" title="Instantly bust someone">Quick Bust</label>
            </div>
          </div>
          <div class="grid_box box2">
            <div class="re_checkbox fancybox">
              <input type="checkbox" id="re_jail_sbust" name='bust'>
              <label class="noselect" title="Sets bust icon to quick confirm button after first click">Speed Bust</label>
            </div>
          </div>
          
          <div class="grid_box box3">
            <div class="re_checkbox fancybox">
              <input type="checkbox" id="re_jail_qbail" name='bail'>
              <label class="noselect" title="Instantly bail someone">Quick Bail</label>
            </div>
          </div>
          <div class="grid_box box4">
            <div class="re_checkbox fancybox">
              <input type="checkbox" id="re_jail_sbail" name='bail'>
              <label class="noselect" title="Sets bail icon to quick confirm button after first click">Speed Bail</label>
            </div>
          </div>
          <div class="grid_box box5">
            <input id='re_jail_level' name='level' type='number' min='0' max='100' placeholder="Max level" title="Max level">
          </div>
          <div class="grid_box box6">
            <input id='re_jail_score' name='score' type='number' min='0' placeholder="Max score" title="Max score">
          </div>
          <div class="grid_box box7">
            <input id='re_jail_bail' name='bail' type='number' min='0' placeholder="Max $" title="Max Bail Amount">
          </div>
        </div>
      </div>
    </div>


    <div class="re_row re_message">
      <p>Showing <b><span id="shown">0</span></b> out of <b><span id="total">0</span></b> people.
    </div>
  `);

  //start up - set filters and checkboxes
  const jail_settings = settings?.jail;

  if (jail_settings) {
    //filters
    if (jail_settings?.filters?.level) {
      $('#re_jail_level').val(jail_settings?.filters?.level);
    }
    if (jail_settings?.filters?.score) {
      $('#re_jail_score').val(jail_settings?.filters?.score);
    }
    if (jail_settings?.filters?.bail) {
      $('#re_jail_bail').val(jail_settings?.filters?.bail);
    }

    //quick checkboxes
    if (jail_settings?.quick?.bust) {
      $('#re_jail_qbust').prop( "checked", jail_settings?.quick?.bust);
    }
    if (jail_settings?.quick?.bail) {
        $('#re_jail_qbail').prop( "checked", jail_settings?.quick?.bail);
    }

    //speed checkboxes
    if (jail_settings?.speed?.bust) {
      $('#re_jail_sbust').prop( "checked", jail_settings?.speed?.bust);
    }
    if (jail_settings?.speed?.bail) {
        $('#re_jail_sbail').prop( "checked", jail_settings?.speed?.bail);
    }

    setQuickActions();
    filterJail();
  }


  $('#re_jail_level,#re_jail_score,#re_jail_bail').on('input', function() {
    const input = $(this).val();
    const name = $(this).attr('name');
    const obj = {
      "jail": {
        "filters": {
          [name]: input
        }
      }
    }
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      if (r?.status) {
        jail_settings["filters"][name] = input;
        filterJail();
      }
    })
    .catch((e) => console.error(e))
  });

  $('#re_jail_qbust, #re_jail_qbail').change(function() {
    const checked = this.checked;
    const name = $(this).attr('name');

    const obj = {
      "jail": {
        "quick": {
          [name]: checked
        }
      }
    }
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      if (r?.status) {
        jail_settings["quick"][name] = checked;
        setQuickActions();
      }
    })
    .catch((e) => console.error(e))
  });

  $('#re_jail_sbust, #re_jail_sbail').change(function() {
    const checked = this.checked;
    const name = $(this).attr('name');
    const obj = {
      "jail": {
        "speed": {
          [name]: checked
        }
      }
    }
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      if (r?.status) {
        jail_settings["speed"][name] = checked;
      }
    })
    .catch((e) => console.error(e))
  });

  //disable filters > label
  $('.re_checkbox > label').click(function() {
    let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
    checkbox.prop("checked", !checkbox.prop("checked"));
    checkbox.trigger("change");
  });

    //mutationObserver on jail wrap
    var target = document.querySelector('div.userlist-wrapper');
    jailPageObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
}



  //Filter Jail Captives Function
  function filterJail() {
    var levelFilter = $('#re_jail_level').val();
    var scoreFilter = $('#re_jail_score').val();
    var bailFilter = $('#re_jail_bail').val();

    if ($('#re_disable_filters input[type="checkbox"]').prop("checked")) { //if disable filters checkbox is checked, set levelfilter and score filter to 0
      levelFilter = 0;
      scoreFilter = 0;
    }

    re_shown_users.length = 0; // empty the shown user array

    var total = 0;
    var shown = 0;
    //for each user in list - do filtering
    $('ul.user-info-list-wrap > li').each(function( index ) {
      total++;
      let time = 0;
      let level = 0;
      let score = 0;

      let info_wrap = $(this).find('span.info-wrap');

      if (info_wrap.length == 0) {
        return;
      }

      let href = $(this).find('a.user.name').attr('href');
      let match = href.match(/XID=(\d+)/);
      let userid = match ? match[1] : null;

      time = info_wrap.find('span.time')[0].textContent.replace(/\s+/g, '').replace('TIME:', '');
      level = parseInt(info_wrap.find('span.level')[0].textContent.replace(/\s+/g, '').replace('LEVEL:', ''));

      let hours = time.includes('h') ? parseInt(time.split('h').shift()) : 0;
      let mins = time.includes('m') ? parseInt(time.split('h').pop().replace('m', '')) : 0;

      time = ((hours * 60) + mins);
      score = time * level;

      info_wrap.attr("title", "<b>Minutes: </b>" + time.toLocaleString() + "<br><b>Score: </b>"+score.toLocaleString());
      
      // 100 * remaining Jail time in minutes * inmate level)
      const bailAmount = 100 * time * level * re_edu_bail_reduction;

      if (bailFilter && bailAmount > bailFilter && bailFilter != 0) {
        $(this).addClass("re_hide")
      } else if (levelFilter && level > levelFilter && levelFilter != 0) {
        $(this).addClass("re_hide")
      } else if (scoreFilter && score > scoreFilter && scoreFilter != 0) {
        $(this).addClass("re_hide")
      } else {
        $(this).removeClass("re_hide");

        if (userid && score) {
          re_shown_users.push({
            userid: userid,
            score: score
          });
        }
        shown++;
      }

    });

    $('#shown').text(shown);
    $('#total').text(total);

    re_shown_users.sort((a, b) => a.score - b.score); //sort by lowest score
  }


  function setQuickActions() {
    let qbust = $('#re_jail_qbust').prop("checked");
    let qbail = $('#re_jail_qbail').prop("checked");

    $('ul.user-info-list-wrap > li').each(function( index ) {
      let hrefbust = $(this).find('a.bust').attr("href");
      if (hrefbust) {
        let regex;
        if (qbust == true) { //if quick busting checkbox is checked, replace =breakout in url with =breakout1, to trigger quick busting
          regex = /breakout$/;
          hrefbust = hrefbust.replace(regex, "breakout1");
          $(this).find('a.bust').find('.bust-icon').addClass('qbust-icon').removeClass('bust-icon');
        } else {
          regex = /breakout1$/;
          hrefbust = hrefbust.replace(regex, "breakout");
          $(this).find('a.bust').find('.qbust-icon').addClass('bust-icon').removeClass('qbust-icon');
        }
        $(this).find('a.bust').attr("href", hrefbust);
      }

      let hrefbail = $(this).find('a.bye').attr("href");
      if (hrefbail) {
        let regex;
        if (qbail == true) {
          regex = /buy$/;
          hrefbail = hrefbail.replace(regex, "buy1");
          $(this).find('a.bye').find('.bye-icon').addClass('qbye-icon').removeClass('bye-icon');
        } else {
          regex = /buy1$/;
          hrefbail = hrefbail.replace(regex, "buy");
          $(this).find('a.bye').find('.qbye-icon').addClass('bye-icon').removeClass('qbye-icon');
        }
        $(this).find('a.bye').attr("href", hrefbail);
      }
    });

    setBustBailButtons();
  }

  function setBustBailButtons() {
    $('a.bust').click(function() {
      let a = $(this);
      let sbust = $('#re_jail_sbust').prop("checked");
      if (sbust == true) {
        let hrefbust = a.attr("href");
        if (hrefbust) {
          const regex = /breakout$/;
          hrefbust = hrefbust.replace(regex, 'breakout1');
          a.find('.bust-icon').addClass('qbust-icon').removeClass('bust-icon');
          //Wait 100ms because for some reason click is triggering after changing the href
          setTimeout(function() {
            a.attr("href", hrefbust);
            a.parent().find('.confirm-bust').show();
           }, 100);
        }
      }
    });

    $('a.bye').click(function() {
      let a = $(this);
      let sbail = $('#re_jail_sbail').prop("checked");
      if (sbail == true) {
        let hrefbail = a.attr("href");
        if (hrefbail) {
          const regex = /buy$/;
          hrefbail = hrefbail.replace(regex, 'buy1');
          a.find('.bye-icon').addClass('qbye-icon').removeClass('bye-icon');
          //Wait 100ms because for some reason click is triggering after changing the href
          setTimeout(function() {
            a.attr("href", hrefbail);
            a.parent().find('.confirm-bye').show();
           }, 100);
        }
      }
    });
  }



 