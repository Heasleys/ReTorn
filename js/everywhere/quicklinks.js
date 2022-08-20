(function() {
const target = document;
const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};
const qlink_base = `
<div class="re_sidebar_block" id="re_qlinks" style="display: none;">
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
const observer = new MutationObserver(function(mutations) {
    if ($('#sidebar > div').first().length != 0 && $('#re_qlinks').length == 0) {
        insertQuickLinksHead();
        observer.disconnect();
    }
});

//check and then start quicklinks observer
if (features?.sidebar?.quick_links.enabled && settings?.quick_links.length != 0) {
    observer.observe(target, obsOptions);
}


  
  function insertQuickLinksHead() {
        $('#sidebar > div').first().after(qlink_base);
  
        if (settings?.headers["quicklinks"]?.expanded) {
          $(".re_qlinks_head").addClass("expanded");
          $(".re_qlinks_content").show();
        }
  
        $(".re_qlinks_head").click(function() {
            $(this).toggleClass("expanded");
            $(this).next("div.re_qlinks_content").slideToggle("fast");
            $(this).find("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
            let expanded = $(this).hasClass("expanded");

            const obj = {"headers": {"quicklinks": {"expanded": expanded}}}
            sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
            .then((r) => {
              //console.log(r);
            })
            .catch((e) => console.error(e))
        });

        if ($('.re_qlinks_content').is(":visible")) {
          $('.re_qlinks_head .re_icon').addClass('arrow_down');
        } else {
          $('.re_qlinks_head .re_icon').addClass('arrow_right');
        }
  
        insertQuickLinks();  
  }
  
  function insertQuickLinks() {
    let qlStr = ``;
    for (const [key, value] of Object.entries(settings?.quick_links)) {
      if (value.enabled) {
        const icon = getLinkIcon(value.url);
        qlStr += `<div class="re_qlinks_link"><a href="${value.url}"><span class="re_qlinks_icon">${icon}</span><span class="re_qlinks_name">${value.name}</span></a></div>`;
      }
    }
    if (qlStr != "") {
      $('#re_qlinks_content').append(qlStr);
      $("#re_qlinks").show();
    } else {
      $("#re_qlinks").hide();
    }
  }
  
  function getLinkIcon(url) {
    let icon = "";
  
    if (url.includes("amarket.php")) {
      icon = `<i class="cql-auction-house"></i>`;
    }
  
    if (url.includes("imarket.php")) {
      icon = `<i class="cql-item-market"></i>`;
    }
  
    if (url.includes("museum.php")) {
      icon = `<i class="cql-museum"></i>`;
    }
  
    if (url.includes("pmarket.php")) {
      icon = `<i class="cql-points-market"></i>`;
    }
  
    if (url.includes("loader.php?sid=racing")) {
      icon = `<i class="cql-raceway"></i>`;
    }
  
    if (url.includes("page.php?sid=stocks")) {
      icon = `<i class="cql-stock-market"></i>`;
    }
  
    if (url.includes("travelagency.php")) {
      icon = `<i class="cql-travel-agency"></i>`;
    }
  
    if (url.includes("properties.php#/p=options&tab=vault")) {
      icon = `<i class="property-option-vault"></i>`;
    }
  
    if (url.includes("factions.php")) {
      icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="12.47" height="17" viewBox="0 1 11.47 16"><path d="M3.46,17H9.12V12.29A6,6,0,0,0,10.59,9L9,9.06,6.61,8v1.1H5.44l2.34,1.11L6.61,13.49,6,10.79,2.32,8.46V7.83L5.44,8,6.61,6.85l-4.5-2L0,8.08l3.46,4.3Zm6.66-9,1.61-1.42-.58-1.63L9.46,7.61ZM9,6.85,10.43,4,8.81,3.21l-1,3.64ZM6.61,5.74,8.25,2.63,6.46,1.87l-.77,3ZM2.73,3.84l2,.9L5.8,1.62,4.41,1Z"></path></svg>`;
    }
  
    if (url.includes("forums.php")) {
      icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="14.67" viewBox="0 1 16 14.67"><path d="M13.08,14.74c-3.36.82-5.81-1.24-5.81-3.44s2.08-3.65,4.37-3.65S16,9.19,16,11.3a3.24,3.24,0,0,1-.74,2A5.81,5.81,0,0,0,16,15.67,10.19,10.19,0,0,1,13.08,14.74ZM5.94,11.3c0-2.75,2.55-5,5.7-5a6.21,6.21,0,0,1,1.69.23C13.32,3.32,10.16,1,6.67,1S0,3.35,0,6.57A4.9,4.9,0,0,0,1.14,9.7,8.71,8.71,0,0,1,0,13.24a16,16,0,0,0,4.43-1.41A9.91,9.91,0,0,0,6,12.07,4.9,4.9,0,0,1,5.94,11.3Z"></path></svg>`;
    }

    if (url.includes('bazaar.php')) {
      icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="15" height="16" viewBox="0 0 16 17"><path d="M6.63,1,6,4.31v.74A1.34,1.34,0,0,1,3.33,5V4.31L5.33,1Zm-2,0L2.67,4.31v.74A1.33,1.33,0,0,1,1.33,6.33,1.32,1.32,0,0,1,0,5V4.31L3.25,1ZM16,5a1.32,1.32,0,0,1-1.33,1.29A1.37,1.37,0,0,1,13.33,5V4.27L11.41,1h1.34L16,4.31ZM9.33,4.27V5A1.33,1.33,0,0,1,6.67,5V4.27L7.37,1H8.63ZM10.67,1l2,3.33v.74a1.3,1.3,0,0,1-1.33,1.26A1.36,1.36,0,0,1,10,5V4.27L9.37,1ZM.67,7.67V17H7.33V15.67H2V9H14v8h1.33V7.67Zm12,2.66h-4V17h4Z"></path><path d="M6.63,0,6,3.31v.74A1.34,1.34,0,0,1,3.33,4V3.31L5.33,0Zm-2,0L2.67,3.31v.74A1.33,1.33,0,0,1,1.33,5.33,1.32,1.32,0,0,1,0,4V3.31L3.25,0ZM16,4a1.32,1.32,0,0,1-1.33,1.29A1.37,1.37,0,0,1,13.33,4V3.27L11.41,0h1.34L16,3.31ZM9.33,3.27V4A1.33,1.33,0,0,1,6.67,4V3.27L7.37,0H8.63ZM10.67,0l2,3.33v.74a1.3,1.3,0,0,1-1.33,1.26A1.36,1.36,0,0,1,10,4V3.27L9.37,0ZM.67,6.67V16H7.33V14.67H2V8H14v8h1.33V6.67Zm12,2.66h-4V16h4Z"></path></svg>`;
    }
  
    return icon;
  }
  
})();
  