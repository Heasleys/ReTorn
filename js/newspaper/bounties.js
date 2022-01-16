var hide_unavailable;

var startupObserver = new MutationObserver(function(mutations) {
  if ($(".bounties-wrap").length == 1 && $('div.re_container').length == 0) {
    insertHead();
    startupObserver.disconnect();
  }
});

var bountyPageObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(function(node) {
        if (node && node.className && node.className.includes("newspaper-wrap")) {
          bountyPageObserver.disconnect();
          insertHead();
        }
      });
    }
  })
});


function insertHead() {
  let checked = "";
  if (hide_unavailable != undefined && hide_unavailable == true) {
    checked = "checked";
  }
  $('.bounties-wrap').before(`
    <div class="re_head expanded flat-top">
      <span class="re_title"><span class="re_logo"><span class="re_yellow">Re</span>Torn</span></span>
      <span class="re_checkbox">
        <label class="re_title noselect" >Hide unavailable</label>
        <input type="checkbox" id="re_bounty_hide_unavailable" name="unavailable" ${checked}>
      </span>
    </div>
  `);

  if (hide_unavailable == undefined) {
    chrome.runtime.sendMessage({name: "get_value", value: "re_bounty"}, (response) => {
      if (response.status) {
        if (response.value && response.value.re_bounty) {
          if (response.value.re_bounty.hide && response.value.re_bounty.hide.unavailable) {
            $('#re_bounty_hide_unavailable').prop( "checked", response.value.re_bounty.hide.unavailable);
            filterBounties(response.value.re_bounty.hide.unavailable);
          }
        }
      }
    });
  } else {
    filterBounties(hide_unavailable);
  }

  $('#re_bounty_hide_unavailable').change(function() {
    let checked = this.checked;
    let name = $(this).attr('name');
    chrome.runtime.sendMessage({name: "set_value", value_name: "re_bounty", value: {hide: {[name]: checked}}}, (response) => {
      hide_unavailable = checked;
      filterBounties(checked);
    });
  });

  //mutationObserver on bounty wrap
  var target = document.querySelector('div.content-wrapper');
  bountyPageObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
}


function filterBounties(checked) {
  $('ul.bounties-list > li:not(.clear)').each(function() {
    let status = $(this).find('.status');
    if (!status.text().includes('Okay')) {
      if (checked) {
        $(this).hide();
      } else {
        $(this).show();
      }
    }
  })
}


$(document).ready(function() {
  if ($('div.captcha').length == 0) {
    var target = document.querySelector('div.content-wrapper');
    startupObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
  }
});
