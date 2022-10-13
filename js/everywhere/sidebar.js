(function() {
    var npclistComplete,qlinksComplete = false;
    var intervals = [];
    var LOOT;
    const LOOT_TIMES = ["hosp_out", "loot_2", "loot_3", "loot_4", "loot_5"]
    const npc_list_base = `
    <div class="list_parent" id="nav-npcs">
    <div class="list_header noshow">
    <a class="re_npcButton">
    <span class="svg">
        <svg xmlns="http://www.w3.org/2000/svg" stroke="transparent" stroke-width="0" width="20" height="16" viewBox="0 1 16 16">
        <g>
            <path d="M13.88,13.06c-2.29-.53-4.43-1-3.39-2.94C13.63,4.18,11.32,1,8,1S2.36,4.3,5.51,10.12c1.07,2-1.15,2.43-3.39,2.94C.13,13.52,0,14.49,0,16.17V17H16v-.83C16,14.49,15.87,13.52,13.88,13.06Z"></path>
        </g>
        </svg>
    </span>
    <span class="link_title">NPCs</span>
    </a>
    <div role="button" tabindex="0" class="button re_npcButton">
    <span class="amount">-</span>
    <span class="arrow"></span>
    </div>
    </div>

    <div class="npc_area" style="display: none;">
    <div class="npc_content">
    <ul class="npc_list"></ul>
    </div>
    </div>
    </div>
    `;
    const npc_list_mobile_base = `
    <li id="nav-npcs" class="">
    <button type="button" class="top_header_button" aria-label="Open NPC List">
    <svg xmlns="http://www.w3.org/2000/svg" stroke="transparent" stroke-width="0" width="28" height="28" viewBox="-6 -4 28 28">
    <g>
    <path d="M13.88,13.06c-2.29-.53-4.43-1-3.39-2.94C13.63,4.18,11.32,1,8,1S2.36,4.3,5.51,10.12c1.07,2-1.15,2.43-3.39,2.94C.13,13.52,0,14.49,0,16.17V17H16v-.83C16,14.49,15.87,13.52,13.88,13.06Z"></path>
    </g>
    </svg>
    </button>
    <div class="re-npclist-tooltip">
    <ul class="npc_list"></ul>
    </div>
    </li>
    `;
    const qlink_base = `
    <div class="re_sidebar_block" id="re_qlinks">
        <div class="re_qlinks_block">
        <div class="re_qlinks_head">
            <span class="re_title noselect"><span>Quick Links</span></span>
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

    //event listener to do stuff when the screen size changes
    window.addEventListener('resize', event => {
        const screenType = getScreenType();
        //remove the top npc list if screen type is now desktop or tablet, then insert into sidebar
        if ((screenType == "desktop")) {
            if ($('li#nav-npcs').length) {
                $('li#nav-npcs').remove();
                npclistComplete = false;
            }
            
            if (!document.getElementById('re_qlinks')) {
                qlinksComplete = false;
                insertQuickLinksHead();
            }

            if (!document.getElementById('nav-npcs')) {
                npclistComplete = false;
                const target = document.getElementById('sidebarroot');
                if (target) {
                  desktopSidebarObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
                }
            }
        }
        if ((screenType == "mobile") || (screenType == "tablet")) {
            if (!document.getElementById('nav-npcs')) {
                npclistComplete = false;
                insertNPCList();
                const target = document.getElementById('header-root');
                if (target) {
                  npcMobileObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
                }
            }
            if (document.getElementById('re_qlinks')) {
                $('#re_qlinks').remove();
                qlinksComplete = false;
            }
        }
    });

    //observer to observer document and start other observers based on when things appear in the DOM
    const observerObserver = new MutationObserver(function(mutations) {
      const screenType = getScreenType();  
      if (screenType) {
        for (let i = 0; i < mutations.length; i++) {
          //mobile check
          if (mutations[i]?.target?.tagName == "BODY" && mutations[i]?.addedNodes?.length) {
            for (let a = 0; a < mutations[i].addedNodes.length; a++) {
              if (mutations[i].addedNodes[a].id == "header-root") {
                if (screenType == "mobile" || screenType == "tablet") {
                  const target = document.getElementById('header-root');
                  npcMobileObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
                  observerObserver.disconnect();
                }
              }
            }
          }
  
          //desktop/tablet check
          if (mutations[i]?.target?.id == "mainContainer" && mutations[i]?.addedNodes?.length) {
            for (let a = 0; a < mutations[i].addedNodes.length; a++) {
              if (mutations[i].addedNodes[a].id == "sidebarroot") {
                if (screenType == "desktop") {
                  const target = document.getElementById('sidebarroot');
                  desktopSidebarObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
                  observerObserver.disconnect();
                }
              }
            }
          }
  
        }
      }
      });
    
      const npcMobileObserver = new MutationObserver(function(mutations) {
          if (document.querySelector('div.header-navigation.right > div.header-buttons-wrapper > ul.toolbar')) {
            if (!document.getElementById('nav-npcs')) {
              insertNPCList();
            }
          }

          if (npclistComplete) {
            npcMobileObserver.disconnect();
          }
      });
    
      const desktopSidebarObserver = new MutationObserver(function(mutations) {
        if (document.querySelector('#sidebar div:last-child div[class^="toggle-content"]')) {
            insertNPCList();
        }
        if (document.querySelector('#sidebar:not([class*="mobile_"]) > div:first-of-type')) {
            insertQuickLinksHead();
        }

        if (qlinksComplete && npclistComplete) desktopSidebarObserver.disconnect();
      });
    
      //observer document to start other observers
      observerObserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});




    // function to insert NPC list
    function insertNPCList() {
        if (!features?.sidebar?.npc_list?.enabled || (document.getElementById('nav-npcs'))) {
            npclistComplete = true;
            return;
        }
        const screenType = getScreenType();
        if (screenType == "mobile" || screenType == "tablet") { //insert into small custom npc icon on topbar
            $('div.header-navigation.right > div.header-buttons-wrapper > ul.toolbar').prepend(npc_list_mobile_base);
            $('#nav-npcs > button.top_header_button').click(function() {
            $('#nav-npcs').toggleClass('active');
            })
        } 

        if (screenType == "desktop") { //insert underneath enemy/friends list
        // find enemy/friend/staff lists and insert NPCs list at bottom of list of lists
        $('h2[class^="header"]:contains("Lists")').siblings('div[class^="toggle-content"]').append(npc_list_base);

        // When NPC button is clicked, expand it for viewing
        $('.re_npcButton').click(function() {
            let expanded = !$('.npc_area').is(':visible');
            $('.npc_area').slideToggle("fast");
            $('.list_header').toggleClass('noshow');

            // Save that the NPC is either expanded or not in ReTorn settings
            const obj = {"headers": {"npc_list": {"expanded": expanded}}}
            sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
            .catch((e) => console.error(e))
        });

        // check settings to see if NPC lists was last expanded, if so, set list to expanded
        if (settings?.headers["npc_list"]?.expanded) {
            $('.npc_area').show();
            $('.list_header').removeClass('noshow');
        }

        }

        if (document.getElementById('nav-npcs')) {
            npclistComplete = true;
            getTornStats("loot", 0.08333)//get torn stats loot data, cache for 5 minutes
            .then((r) => {
                LOOT = r;
                setNPCs();
            })
            .catch((e) => {
                console.error(e);
            })
        }
        
    }
    //loop function to set each NPC
    function setNPCs() {
        let npc_list = ``;
        let i = 0;
        Object.entries(LOOT).forEach(([key, value]) => {
            if (value?.torn_id != undefined) {
                npc_list += addNPC(value);
                i++;
            }
        });
        $('ul.npc_list').append(npc_list);
        $('div.re_npcButton > span.amount').text(i);
        setAttackTimeClick();
    }
    //addNPC to npc list and start intervals
    function addNPC(npc) {
        let attack_time;
        let loot_time;
        let npc_list;

        if (settings?.npc_list[npc.torn_id] && settings.npc_list[npc.torn_id].loot_time) {
            loot_time = settings?.npc_list[npc.torn_id].loot_time;
        } else {
            loot_time = "loot_4";
        }

        let npc_time = npc[loot_time];

        var d = npc_time - ((Math.floor(Date.now() / 1000)));
        if (d < 0) {
            attack_time = "now";
        } else {
            attack_time = new Date(d * 1000).toISOString().substring(11, 19);
        }
        npc_list = `
        <li id="npc_`+npc.torn_id+`" data-tornid="`+npc.torn_id+`">
            <a href="/loader.php?sid=attack&user2ID=`+npc.torn_id+`">`+npc.name+`</a>
            <span class="attack_time" title="Time until `+loot_time.replace("_", " ")+`" data-loot_time="`+loot_time+`">`+loot_time.replace("_", " ").replace("hosp out", "loot 1") + ": " +attack_time+`</span>
        </li>
        `;

        if (intervals[npc.torn_id]) {
            clearInterval(intervals[npc.torn_id]);
        }

        var t = 0;
        intervals[npc.torn_id] = setInterval(function() {
            t++;
            let attack_time = "";
            if ((d-t) > 0) {
            attack_time = new Date((d-t) * 1000).toISOString().substring(11, 19);
            } else {
            attack_time = "now";
            }
            if ((d-t) < (10*60) && !$('li#npc_'+npc.torn_id).hasClass('highlight')) {
            $('li#npc_'+npc.torn_id).addClass('highlight');
            $('#nav-npcs').addClass('highlight');
            }

            $('li#npc_'+npc.torn_id+' span.attack_time').text(loot_time.replace("_", " ").replace("hosp out", "loot 1") + ": " + attack_time);
        }, 1000);

        return npc_list;
    }
    //Set the click event functions for attack timer
    function setAttackTimeClick() {
    $('ul.npc_list .attack_time').off('click').click(function() {
        let loot_time;
        let cur_loot_time = $(this).data('loot_time');
        let npc_id = $(this).parent('li').data('tornid');
        //get index in loot_times array
        index = LOOT_TIMES.indexOf(cur_loot_time);
        //get the next loot_time in array, else get the first one (hosp_out)
        if(index >= 0 && index < LOOT_TIMES.length - 1) {
        loot_time = LOOT_TIMES[index + 1]
        } else {
        loot_time = LOOT_TIMES[0];
        }

        //set loot_time timer for specific npc
        if (npc_id && loot_time) {
        const obj = {
            "npc_list": {
            [npc_id]: {
                "loot_time": loot_time
            }
            }
        }
        sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
        .then((r) => {
            if (r?.status) {
            //update global variable
            settings["npc_list"][npc_id] = {
                "loot_time": loot_time
            }
            let npc_li = addNPC(LOOT[npc_id]);
            $('#npc_'+npc_id).replaceWith(npc_li);
            setAttackTimeClick();
            }
        })
        .catch((e) => console.error(e))
        }

    });
    }

    //function to insert the quick links header and base
    function insertQuickLinksHead() {
        if ((features?.sidebar?.quick_links?.enabled == false) || (Object.keys(settings?.quick_links).length === 0) || (document.getElementById('re_qlinks'))) {
            qlinksComplete = true;
            return;
        }


        $('#sidebar:not([class*="mobile_"]) > div[class*="sidebar-block_"').first().after(qlink_base);

        if (document.getElementById('re_qlinks')) {
            qlinksComplete = true;
        
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
                .catch((e) => console.error(e))
            });
    
            if ($('.re_qlinks_content').is(":visible")) {
                $('.re_qlinks_head .re_icon').addClass('arrow_down');
            } else {
                $('.re_qlinks_head .re_icon').addClass('arrow_right');
            }
        
            insertQuickLinks();  
        }
    }
    //function to insert each quick link
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
        }
    }
    //function for getting the correct link icon to add to the quick link
    function getLinkIcon(url) {
        let icon = "<i></i>";
      
        if (url.includes("amarket.php")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="16" viewBox="0 0 16 16"><path d="M13.78,13.35H1.16A1.23,1.23,0,0,0,0,14.66H0A1.26,1.26,0,0,0,1.16,16H13.78a1.34,1.34,0,0,0,0-2.65Zm1.88-3-7-3.87L8,7.68l7,3.83a.53.53,0,0,0,.35.1.74.74,0,0,0,.61-.34.7.7,0,0,0-.27-.91ZM5,2.51,2.71,6.67l3.9,2.16L8.94,4.68ZM5,1.73,9.62,4.31A.84.84,0,0,0,10.77,4V4l.07-.13a.86.86,0,0,0,.07-.65.91.91,0,0,0-.41-.51L5.91.1A1,1,0,0,0,5.5,0a.88.88,0,0,0-.75.44L4.68.58a.84.84,0,0,0-.07.64A.91.91,0,0,0,5,1.73Zm-3.89,7,4.64,2.59A.85.85,0,0,0,6.88,11h0L7,10.8A.86.86,0,0,0,7,10.15a.88.88,0,0,0-.41-.5L3.28,7.78,2,7.06A1,1,0,0,0,1.57,7a.91.91,0,0,0-.75.44l-.07.14a.86.86,0,0,0-.07.65.81.81,0,0,0,.41.51Z"></path></svg>`;
        }
      
        if (url.includes("imarket.php")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="14.67" viewBox="0 0 18 16"><path d="M3.42,4.75,6.94,1.22A.82.82,0,0,1,7.49,1a.77.77,0,0,1,.76.77A.74.74,0,0,1,8,2.3L5.58,4.75Zm9,0h2.16L11.05,1.22a.76.76,0,0,0-1.3.55A.74.74,0,0,0,10,2.3ZM18,6.25v1.5h-.48a1,1,0,0,0-.94.59L13.5,16h-9L1.42,8.34a1,1,0,0,0-.94-.59H0V6.25Zm-11.25,3a.75.75,0,0,0-1.5,0V13a.75.75,0,0,0,1.5,0Zm3,0a.75.75,0,0,0-1.5,0V13a.75.75,0,0,0,1.5,0Zm3,0a.75.75,0,0,0-1.5,0V13a.75.75,0,0,0,1.5,0Z"></path></g><path d="M3.42,3.75,6.94.22A.82.82,0,0,1,7.49,0a.77.77,0,0,1,.76.77A.74.74,0,0,1,8,1.3L5.58,3.75Zm9,0h2.16L11.05.22a.76.76,0,0,0-1.3.55A.74.74,0,0,0,10,1.3ZM18,5.25v1.5h-.48a1,1,0,0,0-.94.59L13.5,15h-9L1.42,7.34a1,1,0,0,0-.94-.59H0V5.25Zm-11.25,3a.75.75,0,0,0-1.5,0V12a.75.75,0,0,0,1.5,0Zm3,0a.75.75,0,0,0-1.5,0V12a.75.75,0,0,0,1.5,0Zm3,0a.75.75,0,0,0-1.5,0V12a.75.75,0,0,0,1.5,0Z"></path></svg>`;
        }
      
        if (url.includes("museum.php")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="15" viewBox="0 0 16 15"><path d="M1,7v8H4V7H6V8H5v7H6V9h4v6h1V8H10V7h2v8h3V7h1V6H0V7ZM0,4V5H16V4ZM2,2V3H14V2ZM4,0V1h8V0Z"></path></svg>`;
        }
      
        if (url.includes("pmarket.php")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="14.67" viewBox="0 0 18 17.2"><path d="M9.9,8.1H8.1V6.3H9.9ZM6.3,4.5v7.2H8.1V9.9H9.9a1.81,1.81,0,0,0,1.8-1.8V6.3A1.81,1.81,0,0,0,9.9,4.5Zm8.25,6.3A6.18,6.18,0,0,1,3.09,9.9h-2a8.1,8.1,0,0,0,15.54.9H18L15.75,7.2,13.5,10.8ZM3.45,5.4a6.18,6.18,0,0,1,11.46.9h2A8.1,8.1,0,0,0,1.36,5.4H0L2.25,9,4.5,5.4Z"></path></svg>`;
        }
      
        if (url.includes("loader.php?sid=racing")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="15.01" height="14" viewBox="0 0 15.01 14"><path d="M14,11.5a7.83,7.83,0,0,0-1.21-9.25A7.38,7.38,0,0,0,2.38,2.07l-.18.18A7.73,7.73,0,0,0,0,7.69,7.78,7.78,0,0,0,2.37,13.3l.73.7,1.37-1.5-.73-.7a6.41,6.41,0,0,1-.64-.74l1.22-.73L3.67,9.19l-1.22.72a5.82,5.82,0,0,1,0-4.45l1.22.73L4.32,5,3.1,4.32A5.44,5.44,0,0,1,6.85,2.1V3.54H8.14V2.1A5.48,5.48,0,0,1,11.9,4.32l-1.22.73.65,1.14,1.22-.72a5.75,5.75,0,0,1-.28,5c-.06.1-.12.21-.19.31l-1.14-.88.49,3.5,3.41-.49L13.69,12Q13.87,11.77,14,11.5Zm-6.51-5A1.17,1.17,0,0,0,6.32,7.66,1.15,1.15,0,0,0,7.45,8.84,1.14,1.14,0,0,0,8.63,7.72v0l2-1.88L8,6.67a1.07,1.07,0,0,0-.52-.14Z"></path></svg>`;
        }
      
        if (url.includes("page.php?sid=stocks")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="15" height="16" viewBox="0 0 15 16"><path d="M6.82,13.33H8.18V16H6.82Zm1.94,0L11.1,16h1.79l-2.33-2.67ZM2.1,16H3.89l2.33-2.67H4.42ZM7.28,6l1,1,2.31-2.25.57.55.41-2L9.54,3.7l.59.57L8.3,6.06l-1-1L4.78,7.47l.48.47Zm4.31,2.68H4.09V3.33H3.41v6h8.18ZM15,2h-.68V12H.68V2H0V0H15ZM13,2H2v8.67H13Z"></path></svg>`;
        }
      
        if (url.includes("travelagency.php")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="15.99" height="14.93" viewBox="0 0 15.99 14.93"><path d="M15.2.05a1.29,1.29,0,0,0-1,.35L11.09,3.05a1.3,1.3,0,0,1-1.16.2L9.18,3a.52.52,0,0,1-.34-.65.51.51,0,0,1,.09-.16l.53-.78a.22.22,0,0,0,0-.32h0a.89.89,0,0,0-.8-.15,1.34,1.34,0,0,0-.4.27l-.54.59a1.37,1.37,0,0,1-1.14.38L5.28,1.89c-.37-.07-.51-.35-.31-.62L5.34.78A.6.6,0,0,0,5.48.36C5.45.11,5-.06,4.7,0a2.45,2.45,0,0,0-1,.71L3.64.86a1.67,1.67,0,0,1-1.14.49l-1.07,0c-.38,0-.85-.16-1.08-.14A.37.37,0,0,0,0,1.41a.7.7,0,0,0,0,.38c.06.21.52.43.85.61,1.47.8,4.62,2.46,5.94,3.15a.44.44,0,0,1,.25.57.39.39,0,0,1-.16.2L3.13,9.67A1.48,1.48,0,0,1,2,10l-.39-.1a2.27,2.27,0,0,0-1-.1,1.29,1.29,0,0,0-.58.68c-.07.33.46.72.81.86A3.44,3.44,0,0,1,2.06,12a4,4,0,0,1,.8,1.37c.13.35.35.88.62.84A.84.84,0,0,0,3.91,14l.21-.24a1.17,1.17,0,0,0,.06-.9l-.06-.24a1.17,1.17,0,0,1,.37-1.1L8.8,7.93a.48.48,0,0,1,.69,0,.42.42,0,0,1,.11.18l2.72,6.23c.15.34.69.81.81.45a2.69,2.69,0,0,0,0-1.13l-.07-.61a1.37,1.37,0,0,1,.47-1l.88-.7a1.14,1.14,0,0,0,.36-.53c.1-.34-.18-.8-.4-.77a5.81,5.81,0,0,0-.92.4c-.3.14-.57-.05-.6-.42l0-.69a1.26,1.26,0,0,1,.53-1.05l.23-.14a2.34,2.34,0,0,0,.91-1h0A.72.72,0,0,0,14,6.33a4.88,4.88,0,0,0-1.13.26.56.56,0,0,1-.7-.38.59.59,0,0,1,0-.13l0-.35a1.53,1.53,0,0,1,.43-1.14l2.73-2.5A2.35,2.35,0,0,0,16,1a.66.66,0,0,0,0-.14A.88.88,0,0,0,15.2.05Z"></path></svg>`;
        }
      
        if (url.includes("properties.php#/p=options&tab=vault")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16.01" height="14" viewBox="0 0 16.01 14"><path d="M11.88,3.75c.13.12.25.24.37.37l-.63.63-.18-.19-.19-.18.63-.63ZM10.44,2.9a4.19,4.19,0,0,1,.49.2l-.35.82L10.3,3.8l-.2-.07.35-.83Zm-1.7-.24h.53v.9H8.74Zm-1.15.23.34.83L7.7,3.8l-.26.12L7.1,3.1a4.19,4.19,0,0,1,.49-.2ZM8,6.59,8.55,6l-.8-.79a2.16,2.16,0,1,1-.56.58ZM6.12,3.75l.64.63-.2.18-.18.19-.63-.63ZM4.89,8.41l.83-.34.08.23.12.26L5.1,8.9A4.25,4.25,0,0,1,4.89,8.41Zm1.16,1.91L5.67,10l.71-.71.18.2.19.18Zm1.51.78a4.25,4.25,0,0,1-.49-.21l.35-.82.28.13.2.08Zm1.7.23H8.74v-.89h.52Zm1.15-.22-.34-.83.23-.08.26-.12.34.83-.48.2Zm1.46-.86-.63-.63.19-.18.18-.2.63.63a3.24,3.24,0,0,1-.36.38Zm1-1.33-.83-.34.13-.28.08-.21.82.35a4,4,0,0,1-.2.48Zm.44-1.66h-.89V6.74h.89v.52ZM12.28,5.93,12.2,5.7l-.12-.26.82-.34a4.19,4.19,0,0,1,.2.49l-.83.34ZM9,0A7,7,0,0,0,2.08,6H0L2.67,10,5.33,6H3.43a5.67,5.67,0,1,1,.79,4l-.8,1.18A7,7,0,1,0,9,0Z"></path></svg>`;
        }
      
        if (url.includes("factions.php")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="12.47" height="17" viewBox="0 1 11.47 16"><path d="M3.46,17H9.12V12.29A6,6,0,0,0,10.59,9L9,9.06,6.61,8v1.1H5.44l2.34,1.11L6.61,13.49,6,10.79,2.32,8.46V7.83L5.44,8,6.61,6.85l-4.5-2L0,8.08l3.46,4.3Zm6.66-9,1.61-1.42-.58-1.63L9.46,7.61ZM9,6.85,10.43,4,8.81,3.21l-1,3.64ZM6.61,5.74,8.25,2.63,6.46,1.87l-.77,3ZM2.73,3.84l2,.9L5.8,1.62,4.41,1Z"></path></svg>`;
        }
      
        if (url.includes("forums.php")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="14.67" viewBox="0 1 16 14.67"><path d="M13.08,14.74c-3.36.82-5.81-1.24-5.81-3.44s2.08-3.65,4.37-3.65S16,9.19,16,11.3a3.24,3.24,0,0,1-.74,2A5.81,5.81,0,0,0,16,15.67,10.19,10.19,0,0,1,13.08,14.74ZM5.94,11.3c0-2.75,2.55-5,5.7-5a6.21,6.21,0,0,1,1.69.23C13.32,3.32,10.16,1,6.67,1S0,3.35,0,6.57A4.9,4.9,0,0,0,1.14,9.7,8.71,8.71,0,0,1,0,13.24a16,16,0,0,0,4.43-1.41A9.91,9.91,0,0,0,6,12.07,4.9,4.9,0,0,1,5.94,11.3Z"></path></svg>`;
        }
    
        if (url.includes('bazaar.php')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="15" height="16" viewBox="0 0 16 17"><path d="M6.63,0,6,3.31v.74A1.34,1.34,0,0,1,3.33,4V3.31L5.33,0Zm-2,0L2.67,3.31v.74A1.33,1.33,0,0,1,1.33,5.33,1.32,1.32,0,0,1,0,4V3.31L3.25,0ZM16,4a1.32,1.32,0,0,1-1.33,1.29A1.37,1.37,0,0,1,13.33,4V3.27L11.41,0h1.34L16,3.31ZM9.33,3.27V4A1.33,1.33,0,0,1,6.67,4V3.27L7.37,0H8.63ZM10.67,0l2,3.33v.74a1.3,1.3,0,0,1-1.33,1.26A1.36,1.36,0,0,1,10,4V3.27L9.37,0ZM.67,6.67V16H7.33V14.67H2V8H14v8h1.33V6.67Zm12,2.66h-4V16h4Z"></path></svg>`;
        }
    
        if (url.includes('casino.php')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="16" viewBox="0 0 16 16"><path d="M0,8a8,8,0,1,1,8,8A8,8,0,0,1,0,8Zm5.29,6.55A7,7,0,0,0,8,15.09V13.57a5.63,5.63,0,0,1-2.14-.42Zm4.85-1.4.57,1.4A6.72,6.72,0,0,0,13,13l-1.08-1.06a5.49,5.49,0,0,1-1.8,1.21ZM1.45,10.71A6.9,6.9,0,0,0,3,13L4.06,12a5.57,5.57,0,0,1-1.21-1.82ZM3.32,8A4.68,4.68,0,1,0,8,3.32H8A4.67,4.67,0,0,0,3.32,8Zm9.85,2.14,1.4.57A7.4,7.4,0,0,0,15.11,8H13.59a5.63,5.63,0,0,1-.42,2.14ZM.91,8H2.42a5.64,5.64,0,0,1,.43-2.14l-1.4-.57A6.83,6.83,0,0,0,.91,8Zm11-4a5.53,5.53,0,0,1,1.21,1.81l1.4-.57A7,7,0,0,0,13,3ZM3,3,4,4.06A5.68,5.68,0,0,1,5.86,2.85l-.57-1.4A7.15,7.15,0,0,0,3,3Zm5-.58a5.64,5.64,0,0,1,2.14.43l.57-1.4A7,7,0,0,0,8,.91Zm-.34,9.21a.15.15,0,0,1-.13-.14V10.8A1.43,1.43,0,0,1,6.18,9.52a.13.13,0,0,1,.11-.15H7a.15.15,0,0,1,.14.1.49.49,0,0,0,.47.38h.6A.73.73,0,0,0,9,9.21a.7.7,0,0,0-.64-.75H7.83A1.71,1.71,0,0,1,6.11,7a1.65,1.65,0,0,1,1.42-1.8V4.48a.15.15,0,0,1,.13-.14h.68a.15.15,0,0,1,.13.14v.69A1.43,1.43,0,0,1,9.82,6.45a.13.13,0,0,1-.11.15H9a.13.13,0,0,1-.14-.1.49.49,0,0,0-.47-.37H7.76A.73.73,0,0,0,7,6.76a.7.7,0,0,0,.64.75h.57A1.65,1.65,0,0,1,9.9,9.13c0,.07,0,.13,0,.2a1.67,1.67,0,0,1-1.42,1.45v.71a.13.13,0,0,1-.13.13Z"></path></svg>`
        }
    
        if (url.includes('step=pawnshop')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="19" height="10" viewBox="0 0 19 10">
          <path d="M19,4.5a3.78,3.78,0,0,0-7.55,0,3.6,3.6,0,0,0,.84,2.31H10.12V6.15A.15.15,0,0,0,9.87,6L7.65,7.37a.16.16,0,0,0,0,.27L9.87,9a.16.16,0,0,0,.25-.13V8.19h5.13A3.76,3.76,0,0,0,19,4.5ZM16.31,5.94a1.31,1.31,0,0,1-.63.4c-.11,0-.17.08-.15.18v.33c0,.1,0,.15-.14.15H15a.16.16,0,0,1-.16-.17V6.58c0-.16,0-.18-.19-.2A2.36,2.36,0,0,1,14,6.19c-.16-.08-.18-.12-.12-.27s.06-.24.1-.35.09-.16.21-.08a2.22,2.22,0,0,0,.72.21.84.84,0,0,0,.47-.07A.33.33,0,0,0,15.49,5a.79.79,0,0,0-.27-.15,7.6,7.6,0,0,1-.73-.31,1,1,0,0,1-.58-.95,1.08,1.08,0,0,1,.8-1c.19-.06.21-.06.21-.26V2.17c0-.15,0-.17.18-.19h.15c.32,0,.32,0,.32.31s0,.23.23.27a1.77,1.77,0,0,1,.51.15c.08,0,.13.1.1.18s-.08.27-.12.41-.08.15-.2.09a1.47,1.47,0,0,0-.8-.15.6.6,0,0,0-.21,0A.29.29,0,0,0,15,3.8a1.06,1.06,0,0,0,.35.18c.2.09.43.17.63.27A1.13,1.13,0,0,1,16.31,5.94ZM6.73,2.19H8.88v.66A.15.15,0,0,0,9.13,3l2.22-1.34a.16.16,0,0,0,0-.27L9.13,0a.16.16,0,0,0-.25.13V.81H3.75A3.73,3.73,0,0,0,0,4.48,3.74,3.74,0,0,0,3.78,8.15,3.72,3.72,0,0,0,7.55,4.48,3.57,3.57,0,0,0,6.73,2.19ZM5.27,6.6a1.85,1.85,0,0,1-.39.15,2.76,2.76,0,0,1-1.56,0A2.05,2.05,0,0,1,2,5.53c0-.1-.08-.23-.12-.35H1.42A.14.14,0,0,1,1.27,5V4.71a.14.14,0,0,1,.15-.15h.41V4.29H1.42a.14.14,0,0,1-.15-.14V3.82a.15.15,0,0,1,.15-.15h.51l0,0a2.07,2.07,0,0,1,.74-1.07,1.9,1.9,0,0,1,1-.39,2.92,2.92,0,0,1,1.5.16s.06,0,.08,0a.18.18,0,0,1,.11.26c-.07.13-.11.25-.17.37a.2.2,0,0,1-.25.13L4.45,3a1.85,1.85,0,0,0-1,.07,1.06,1.06,0,0,0-.6.59h1A.15.15,0,0,1,4,3.82v.33a.14.14,0,0,1-.14.14H2.69v.27H3.84A.14.14,0,0,1,4,4.71V5a.14.14,0,0,1-.14.14h-1a1.07,1.07,0,0,0,.72.74,1.67,1.67,0,0,0,.94,0l.49-.12c.13,0,.21,0,.25.12a3.7,3.7,0,0,1,.17.4C5.44,6.46,5.4,6.54,5.27,6.6Z"></path>
          </svg>`
        }

        if (url.includes('bounties.php')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="18" height="18" viewBox="0 0 18 18"><path d="M9,0a9,9,0,1,0,9,9h0A9,9,0,0,0,9,0Zm7.5,8.25H15A6,6,0,0,0,9.83,3.07V1.57A7.59,7.59,0,0,1,16.5,8.25Zm-3.08,1.5a4.46,4.46,0,0,1-3.67,3.68V11.25H8.25v2.18A4.46,4.46,0,0,1,4.58,9.75H6.75V8.25H4.58A4.46,4.46,0,0,1,8.25,4.57V6.75h1.5V4.57a4.46,4.46,0,0,1,3.67,3.68H11.25v1.5ZM8.25,1.57v1.5A6,6,0,0,0,3.08,8.25H1.58A7.44,7.44,0,0,1,8.25,1.57ZM1.58,9.75h1.5a6,6,0,0,0,5.17,5.18v1.5A7.3,7.3,0,0,1,1.58,9.75ZM9.75,16.5V15a6,6,0,0,0,5.17-5.18h1.5A7.43,7.43,0,0,1,9.75,16.5Z"></path></svg>`;
        }

        if (url.includes('sid=attack')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="18.01" height="12.7" viewBox="0 0 18.01 12.7"><path d="M6.63,4.6v.56a.78.78,0,0,0,.77.77L9.28,6a.79.79,0,0,0,.77-.77A1.23,1.23,0,0,0,10,4.6a.21.21,0,0,0-.07.14h0a.08.08,0,0,1,.07.07h0c0,.07,0,.07-.07.07a1.46,1.46,0,0,1-.7,1,.07.07,0,0,1-.07-.07H9.07c-.14,0-.07-.21-.07-.21l.27-.84A2.61,2.61,0,0,0,9,4L7.4,3.83a.78.78,0,0,0-.77.77ZM.22.42.5.07H.64l.2.35H15.2L15.34,0h.28l.14.42h.49a.31.31,0,0,1,.28.21V2.09l-.07.07v.49a.31.31,0,0,1,.14.28c0,.21-.14.21-.14.21a2.62,2.62,0,0,0-.63.14c-.63.21-.7.83-.56,1.74a5,5,0,0,0,.63,1.67c-.07,0-.07,0-.07.07s.07.07.14.07L16,6.9C16,6.9,16,6.9,16,7S16,7,16.11,7l.07.07c-.07,0-.07,0-.07.07s.07.07.14.07l.07.07c-.07,0-.07,0-.07.07a.21.21,0,0,0,.13.07l.07.07c-.07,0-.07,0-.07.07a.27.27,0,0,0,.14.07l.07.14c-.07,0-.07,0-.07.07a.27.27,0,0,0,.14.07l.07.07-.07.07.07.07.07.14a.08.08,0,0,0-.07.07h0l.07.07.07.14h0a.07.07,0,0,0,.07.07h0l.07.14h0a.07.07,0,0,0,.07.07h0l.07.14h0a.08.08,0,0,0,.07.07h0l.07.14h0a.08.08,0,0,0,.07.07h0l.07.14h0l.07.07a.27.27,0,0,0,.07.13h0v.07c0,.07.07.07.07.14h0l.07.07c0,.07,0,.07.07.14h0l.07.07c0,.07,0,.07.07.14h0l.07.07v.42a1.29,1.29,0,0,1-.07.7c-.14.28-.7.49-.7.49h-.56V12a1.05,1.05,0,0,1,.28.49c0,.27-.41.2-.41.2H13.74c-.63,0-.56-.41-.56-.41l-.07-.42a2.5,2.5,0,0,1-.35-.21.78.78,0,0,1-.14-.42v-.49a3.38,3.38,0,0,0-.28-.83.8.8,0,0,0-.41-.42c-.14-.07-.07-.14-.07-.14a.81.81,0,0,0,0-.77c-.14-.28-.21-.48-.42-.55s-.14-.21-.14-.21.21-.28-.07-1c-.21-.42-.42-.56-.7-.56a1.68,1.68,0,0,0-.7.21A3.41,3.41,0,0,1,9,6.56L6.28,6.42l-.07-.14.07-.14a2.28,2.28,0,0,0,.13-1,3.46,3.46,0,0,0-.07-.91,1.91,1.91,0,0,0-.55-.42s-4.53-.13-5-.2S.28,3.29.28,3.29.21,2.8.21,2.66V2.38H.14V2h0L.07,1.89A1.61,1.61,0,0,1,0,1.4.9.9,0,0,1,.14.92V.78C.14.71.21.78.21.64A.13.13,0,0,1,.34.5h0L.21.43Z"></path></svg>`
        }

        if (url.includes('bank.php')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="16" viewBox="0 0 16 16"><path d="M7.89,0,0,4.44H16Zm6.88,4.8H1.21v8.89H.14V16h15.7V13.69H14.77ZM5.32,13.69H3.53V7.29a.9.9,0,0,1,1.79,0Zm3.56,0H7.1V7.29a.89.89,0,0,1,1.78,0Zm3.57,0H10.67V7.29a.89.89,0,1,1,1.78,0Z"></path></svg>`
        }

        if (url.includes('wiki.torn') || url.includes('torn.com/wiki')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="30.016" height="23.462" viewBox="-6.01 -5.06 30.016 23.462"><path d="M9.24,6.49q-.15.28-.3.54c-.77,1.4-1.54,2.79-2.3,4.19a.28.28,0,0,1-.2.17.25.25,0,0,1-.31-.18h0L2.4,2.66c-.18-.41-.37-.82-.58-1.21A1.89,1.89,0,0,0,.24.45.25.25,0,0,1,0,.19.15.15,0,0,1,0,.08.16.16,0,0,1,.17,0h1A15.28,15.28,0,0,0,3.31,0,10.017,10.017,0,0,0,4.65-.06c.12,0,.15,0,.17.15s0,.06,0,.09c0,.21,0,.2-.2.21A1.38,1.38,0,0,0,3.9.7a.71.71,0,0,0-.3.83c.08.23.17.45.27.67q1.51,3.51,3.06,7v.03C7.63,8.1,8.24,7,8.86,5.81a.13.13,0,0,0,0-.12l-1.92-4c-.1-.2-.23-.39-.35-.58a1.26,1.26,0,0,0-1-.61H5.43A.18.18,0,0,1,5.3.31a.27.27,0,0,1,0-.26.13.13,0,0,1,.12,0H7.79A9.182,9.182,0,0,0,9.26-.03c.15,0,.19,0,.2.19v.1c0,.16,0,.17-.19.2A2.57,2.57,0,0,0,8.72.6a.47.47,0,0,0-.34.58s0,0,0,.06a3.43,3.43,0,0,0,.22.56L9.74,4.08a.43.43,0,0,1,0,.07h0c.39-.73.79-1.45,1.17-2.18a1.43,1.43,0,0,0,.2-.75.65.65,0,0,0-.37-.57A1.32,1.32,0,0,0,10.12.5c-.14,0-.15,0-.17-.17s.06-.29.25-.28l1.2.08a9.65,9.65,0,0,0,1.42,0h.8c.07,0,.12,0,.12.1a.43.43,0,0,1,0,.16c0,.13-.06.16-.19.18a5.59,5.59,0,0,0-.56.12,1.44,1.44,0,0,0-.75.56,10.82,10.82,0,0,0-.65,1c-.5.89-1,1.8-1.46,2.69a.17.17,0,0,0,0,.17c.67,1.34,1.33,2.7,2,4.05l.06.1c.1-.25.2-.48.3-.72l2.74-6.38a2,2,0,0,0,.18-.67.75.75,0,0,0-.6-.88h0a2.63,2.63,0,0,0-.39-.06c-.12,0-.14,0-.16-.15V.23c0-.19,0-.24.23-.23l1.2.08a7.61,7.61,0,0,0,1.35,0h.76C18,0,18,0,18,.14a.26.26,0,0,1-.22.31h0a1.58,1.58,0,0,0-1.31.89c-.24.44-.45.89-.65,1.34Q13.9,7,12,11.24a.263.263,0,0,1-.48.01l-.42-.89L9.3,6.6A.54.54,0,0,1,9.24,6.49Z"></path></svg>`;
        }
      
        return icon;
    }
})();