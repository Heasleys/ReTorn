(function() {
  var quicklinks;


  const target = document.getElementById('mainContainer');
  var obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};

  const qlink_base = `
  <div class="re_sidebar_block" id="re_qlinks">
    <div class="re_qlinks_block">
      <div class="re_qlinks_head">
        <span class="re_title noselect"><span class="re_logo"><span class="re_yellow">Re</span>Torn: </span><span>Quick Links</span></span>
        <div class="re_icon_wrap">
          <span class="re_icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
          </span>
        </div>
      </div>
      <div class="re_qlinks_content" id="re_qlinks_content" style="display: none;">

      </div>
    </div>
  </div>
  `;

  var qlink_link = `
  <div class="re_qlinks_link">
    <a href="/factions.php?step=profile&ID=35507#/">
      <span class="re_qlinks_icon">
        <svg xmlns="http://www.w3.org/2000/svg" class="default___3oPC0 " filter="url(#svg_sidebar_mobile)" fill="url(#sidebar_svg_gradient_regular_mobile)" stroke="transparent" stroke-width="0" width="12.47" height="17" viewBox="0 1 11.47 16"><path d="M3.46,17H9.12V12.29A6,6,0,0,0,10.59,9L9,9.06,6.61,8v1.1H5.44l2.34,1.11L6.61,13.49,6,10.79,2.32,8.46V7.83L5.44,8,6.61,6.85l-4.5-2L0,8.08l3.46,4.3Zm6.66-9,1.61-1.42-.58-1.63L9.46,7.61ZM9,6.85,10.43,4,8.81,3.21l-1,3.64ZM6.61,5.74,8.25,2.63,6.46,1.87l-.77,3ZM2.73,3.84l2,.9L5.8,1.62,4.41,1Z"></path></svg>
        </span>
      <span class="re_qlinks_name">The Nest</span>
    </a>
  </div>
  `;

  const observer = new MutationObserver(function(mutations) {
    if ($('#sidebar > div:first-child').length != 0 && $('#re_qlinks').length == 0) {
      $('#sidebar > div:first-child').after(qlink_base);

      if (settings && settings.headers && settings.headers["qlinks"] && settings.headers["qlinks"].expanded == true) {
        $(".re_qlinks_head").addClass("expanded");
        $(".re_qlinks_content").show();
      }

      $(".re_qlinks_head").click(function() {
          $(this).toggleClass("expanded");
          $(this).next("div.re_qlinks_content").slideToggle("fast");
          $(this).find("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
          let expanded = $(this).hasClass("expanded");
          chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {headers: {["qlinks"]: {expanded: expanded}}}});
      });
      if ($('.re_qlinks_content').is(":visible")) {
        $('.re_qlinks_head .re_icon').addClass('arrow_down');
      } else {
        $('.re_qlinks_head .re_icon').addClass('arrow_right');
      }

      insertQuickLinks();
      observer.disconnect();
    }
  });


function insertQuickLinks() {
  let qlStr = ``;
  for (const [key, value] of Object.entries(quicklinks)) {
    qlStr += `<div class="re_qlinks_link"><a href="${value.url}"><span class="re_qlinks_icon">${value.icon}</span><span class="re_qlinks_name">${value.name}</span></a></div>`;
  }
  $('#re_qlinks_content').append(qlStr);
}

  observer.observe(target, obsOptions);
})();
