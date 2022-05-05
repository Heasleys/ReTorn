// @version      1.0.0
// @description  Add quick busts, quick bail, jail filter, law firm speed busts
// @author       Heasleys4hemp [1468764]

//Changing jail pages
var jailPageObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes && mutation.addedNodes.length > 1) {
      //console.log(mutation);
      if (mutation.target && mutation.target && mutation.target.className && mutation.target.className.includes('users-list')) {
        setQuickActions();
        filterJail();
        setBustBailButtons();
      }
    }
  })
});

var startupObserver = new MutationObserver(function(mutations) {
  if ($(".userlist-wrapper").length == 1 && $('div.re_container').length == 0) {
    initJail();
    startupObserver.disconnect();
  }
});

$(document).ready(function() {
  if ($('div.captcha').length == 0) {
    startupObserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  }
});

function initJail() {
  insertHeader($("div.content-title"), 'after');
  $('#re_title').text("Jail");
  $('.re_head .re_title').after(`<span class="re_checkbox" id="re_disable_filters">
  <label class="re_title noselect" >Disable filters</label>
    <input type="checkbox">
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
  chrome.runtime.sendMessage({name: "get_value", value: "re_jail"}, (response) => {
    if (response.status) {
      if (response.value && response.value.re_jail) {
        if (response.value.re_jail.filters) {
          if (response.value.re_jail.filters.level) {
            $('#re_jail_level').val(response.value.re_jail.filters.level);
          }
          if (response.value.re_jail.filters.score) {
            $('#re_jail_score').val(response.value.re_jail.filters.score);
          }
        }
        if (response.value.re_jail.quick) {
          if (response.value.re_jail.quick.bust) {
              $('#re_jail_qbust').prop( "checked", response.value.re_jail.quick.bust);
          }
          if (response.value.re_jail.quick.bail) {
              $('#re_jail_qbail').prop( "checked", response.value.re_jail.quick.bail);
          }
        }
        if (response.value.re_jail.speed) {
          if (response.value.re_jail.speed.bust) {
              $('#re_jail_sbust').prop( "checked", response.value.re_jail.speed.bust);
          }
          if (response.value.re_jail.speed.bail) {
              $('#re_jail_sbail').prop( "checked", response.value.re_jail.speed.bail);
          }
        }
      }
      setQuickActions();
      filterJail();
    }

  });


  $('#re_jail_level,#re_jail_score').on('input', function() {
    let input = $(this).val();
    let name = $(this).attr('name');
    chrome.runtime.sendMessage({name: "set_value", value_name: "re_jail", value: {filters: {[name]: parseInt(input)}}}, (response) => {
      filterJail();
    });
  });

  $('#re_jail_qbust, #re_jail_qbail').change(function() {
    let checked = this.checked;
    let name = $(this).attr('name');
    chrome.runtime.sendMessage({name: "set_value", value_name: "re_jail", value: {quick: {[name]: checked}}}, (response) => {
      setQuickActions();
    });
  });

  $('#re_jail_sbust, #re_jail_sbail').change(function() {
    let checked = this.checked;
    let name = $(this).attr('name');
    chrome.runtime.sendMessage({name: "set_value", value_name: "re_jail", value: {speed: {[name]: checked}}});
  });

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

      let hours = parseInt(time.split('h').shift());
      let mins = parseInt(time.split('h').pop().replace('m', ''));

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



