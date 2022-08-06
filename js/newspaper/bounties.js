var hide_unavailable;

var startupObserver = new MutationObserver(function(mutations) {
  if ($(".bounties-wrap").length > 0 && $('div.re_container').length == 0) {
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

  hide_unavailable = settings?.bounty?.hide?.unavailable;

  filterBounties(hide_unavailable);

  $('#re_bounty_hide_unavailable').change(function() {
    const checked = this.checked;
    const name = $(this).attr('name');

    const obj = {"bounty": {"hide": {"unavailable": checked}}}
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      hide_unavailable = checked;
      filterBounties(checked);
    })
    .catch((e) => console.error(e))
  });

  $('.re_checkbox > label').click(function() {
    let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
    checkbox.prop("checked", !checkbox.prop("checked"));
    checkbox.trigger("change");
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
  if (features?.pages?.bounties?.bounty_filter?.enabled) {
    if ($('div.captcha').length == 0) {
      startupObserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
    }
  }
});
