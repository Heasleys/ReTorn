
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
  insertHeader($("div.content-title"), 'after', 'quick_jail');
  $('#re_title').text("Jail");
  $('.re_head .re_title').after(`<span class="re_checkbox" id="re_disable_filters">
  <label class="re_title noselect" >Disable filters</label>
    <input type="checkbox" title="Disable filters">
  </span>`)
  $('.re_content').addClass('re_jail');

  $('.re_content').html(`
    <div class="re_row">
      <div class="re_col">
        <div class="grid_wrap">
          <div class="grid_box box1">
            <div class="re_checkbox">
              <input type="checkbox" id="re_jail_qbust" name='bust'>
              <label class="noselect" title="Instantly bust someone">Quick Bust</label>
            </div>
          </div>
          <div class="grid_box box2">
            <div class="re_checkbox">
              <input type="checkbox" id="re_jail_sbust" name='bust'>
              <label class="noselect" title="Sets bust icon to quick confirm button after first click">Speed Bust</label>
            </div>
          </div>
          
          <div class="grid_box box3">
            <div class="re_checkbox">
              <input type="checkbox" id="re_jail_qbail" name='bail'>
              <label class="noselect" title="Instantly bail someone">Quick Bail</label>
            </div>
          </div>
          <div class="grid_box box4">
            <div class="re_checkbox">
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
        </div>
      </div>
    </div>


    <div class="re_row re_message">
      <p>Showing <b><span id="shown">0</span></b> out of <b><span id="total">0</span></b> people.
    </div>
  `);

  $('#re_disable_filters').click(function(event) {
    event.stopPropagation();
    let checkbox = $(this).find('input[type="checkbox"]');
    checkbox.prop("checked", checkbox.prop("checked"));
    filterJail();
  });

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


  $('#re_jail_level,#re_jail_score').on('input', function() {
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
        console.log("new jail settings", settings.jail)
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
        console.log("new jail settings", settings.jail)
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
        console.log("new jail settings", settings.jail)
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

    if ($('#re_disable_filters input[type="checkbox"]').prop("checked")) { //if disable filters checkbox is checked, set levelfilter and score filter to 0
      levelFilter = 0;
      scoreFilter = 0;
    }

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

      time = info_wrap.find('span.time')[0].textContent.replace(/\s+/g, '').replace('TIME:', '');
      level = parseInt(info_wrap.find('span.level')[0].textContent.replace(/\s+/g, '').replace('LEVEL:', ''));

      let hours = time.includes('h') ? parseInt(time.split('h').shift()) : 0;
      let mins = time.includes('m') ? parseInt(time.split('h').pop().replace('m', '')) : 0;

      time = ((hours * 60) + mins);
      score = time * level;

      info_wrap.attr("title", "<b>Minutes: </b>" + time.toLocaleString() + "<br><b>Score: </b>"+score.toLocaleString());

      if (levelFilter && level > levelFilter && levelFilter != 0) {
        $(this).hide();
      } else

      if (scoreFilter && score > scoreFilter && scoreFilter != 0) {
        $(this).hide();
      } else {
        $(this).show();
        shown++;
      }

    });

    $('#shown').text(shown);
    $('#total').text(total);


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



