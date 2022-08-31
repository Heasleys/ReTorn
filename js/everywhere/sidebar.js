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
        if ((screenType == "desktop" || screenType == "tablet")) {
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
                desktopSidebarObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
            }
        }
        if (screenType == "mobile") {
            if (!document.getElementById('nav-npcs')) {
                npclistComplete = false;
                insertNPCList();
                const target = document.getElementById('header-root');
                npcMobileObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
            }
            if (document.getElementById('re_qlinks')) {
                $('#re_qlinks').remove();
                qlinksComplete = false;
            }
        }
    });

    //observer to observer document and start other observers based on when things appear in the DOM
    const observerObserver = new MutationObserver(function(mutations) {
        if (getScreenType()) {
          const screenType = getScreenType();
          for (let i = 0; i < mutations.length; i++) {
            //mobile check
            if (mutations[i]?.target?.tagName == "BODY" && mutations[i]?.addedNodes?.length) {
              for (let a = 0; a < mutations[i].addedNodes.length; a++) {
                if (mutations[i].addedNodes[a].id == "header-root") {
                  if (screenType == "mobile") {
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
                  if (screenType == "desktop" || screenType == "tablet") {
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
        
        if (getScreenType() == "mobile") { //insert into small custom npc icon on topbar
        $('div.header-navigation.right > div.header-buttons-wrapper > ul.toolbar').prepend(npc_list_mobile_base);

            $('#nav-npcs > button.top_header_button').click(function() {
            $('#nav-npcs').toggleClass('active');
            })
        } 

        if (getScreenType() == "desktop" || getScreenType() == "tablet") { //insert underneath enemy/friends list
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
        let icon = "";
      
        if (url.includes("amarket.php")) {
          icon = `<i class="cql-auction-house"></i>`;
        }
      
        if (url.includes("imarket.php")) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="16" height="14.67" viewBox="0 0 18 16"><path d="M3.42,4.75,6.94,1.22A.82.82,0,0,1,7.49,1a.77.77,0,0,1,.76.77A.74.74,0,0,1,8,2.3L5.58,4.75Zm9,0h2.16L11.05,1.22a.76.76,0,0,0-1.3.55A.74.74,0,0,0,10,2.3ZM18,6.25v1.5h-.48a1,1,0,0,0-.94.59L13.5,16h-9L1.42,8.34a1,1,0,0,0-.94-.59H0V6.25Zm-11.25,3a.75.75,0,0,0-1.5,0V13a.75.75,0,0,0,1.5,0Zm3,0a.75.75,0,0,0-1.5,0V13a.75.75,0,0,0,1.5,0Zm3,0a.75.75,0,0,0-1.5,0V13a.75.75,0,0,0,1.5,0Z"></path></g><path d="M3.42,3.75,6.94.22A.82.82,0,0,1,7.49,0a.77.77,0,0,1,.76.77A.74.74,0,0,1,8,1.3L5.58,3.75Zm9,0h2.16L11.05.22a.76.76,0,0,0-1.3.55A.74.74,0,0,0,10,1.3ZM18,5.25v1.5h-.48a1,1,0,0,0-.94.59L13.5,15h-9L1.42,7.34a1,1,0,0,0-.94-.59H0V5.25Zm-11.25,3a.75.75,0,0,0-1.5,0V12a.75.75,0,0,0,1.5,0Zm3,0a.75.75,0,0,0-1.5,0V12a.75.75,0,0,0,1.5,0Zm3,0a.75.75,0,0,0-1.5,0V12a.75.75,0,0,0,1.5,0Z"></path></svg>`;
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
    
        if (url.includes('casino.php')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="18" height="18" viewBox="0 1 16 16">
          <path d="M8.25,7.51H7.73A.7.7,0,0,1,7,6.75a.72.72,0,0,1,.72-.62h.61a.49.49,0,0,1,.47.37A.13.13,0,0,0,9,6.6h.7a.13.13,0,0,0,.14-.15A1.43,1.43,0,0,0,8.47,5.17V4.48a.14.14,0,0,0-.13-.13H7.66a.14.14,0,0,0-.13.13v.69A1.64,1.64,0,0,0,6.11,7,1.7,1.7,0,0,0,7.83,8.45h.46A.71.71,0,0,1,9,9.21a.73.73,0,0,1-.73.63h-.6a.51.51,0,0,1-.48-.37A.12.12,0,0,0,7,9.36H6.32a.13.13,0,0,0-.14.16A1.44,1.44,0,0,0,7.53,10.8v.69a.15.15,0,0,0,.13.13h.68a.15.15,0,0,0,.13-.13v-.71A1.68,1.68,0,0,0,9.89,9.33,1.64,1.64,0,0,0,8.25,7.51Z" style="transform: translateY(1px);"></path><path d="M8,1a8,8,0,1,0,8,8A8,8,0,0,0,8,1Zm5,3a6.92,6.92,0,0,1,1.53,2.29l-1.4.57A5.43,5.43,0,0,0,11.94,5ZM8,1.91a7.12,7.12,0,0,1,2.71.54l-.57,1.4A5.63,5.63,0,0,0,8,3.43H8Zm-2.71.54.57,1.4A5.68,5.68,0,0,0,4,5.06L3,4A7,7,0,0,1,5.29,2.45ZM1.45,6.29l1.4.57A5.63,5.63,0,0,0,2.43,9H.91A6.76,6.76,0,0,1,1.45,6.29ZM3,14a6.81,6.81,0,0,1-1.53-2.31l1.4-.57A5.47,5.47,0,0,0,4.06,13Zm5,2.07a6.83,6.83,0,0,1-2.71-.54l.57-1.4A5.63,5.63,0,0,0,8,14.57ZM3.32,9A4.68,4.68,0,1,1,8,13.68,4.69,4.69,0,0,1,3.32,9Zm7.39,6.55-.57-1.4a5.39,5.39,0,0,0,1.8-1.21L13,14A6.58,6.58,0,0,1,10.71,15.55Zm2.46-4.41A5.63,5.63,0,0,0,13.59,9h1.52a7.12,7.12,0,0,1-.54,2.71Z"></path></svg>`
        }
    
        if (url.includes('step=pawnshop')) {
          icon = `<svg xmlns="http://www.w3.org/2000/svg" filter="url(#defaultFilter)" fill="url(#sidebar_svg_gradient_regular_desktop)" stroke="transparent" stroke-width="0" width="19" height="10" viewBox="0 0 19 10">
          <path d="M19,4.5a3.78,3.78,0,0,0-7.55,0,3.6,3.6,0,0,0,.84,2.31H10.12V6.15A.15.15,0,0,0,9.87,6L7.65,7.37a.16.16,0,0,0,0,.27L9.87,9a.16.16,0,0,0,.25-.13V8.19h5.13A3.76,3.76,0,0,0,19,4.5ZM16.31,5.94a1.31,1.31,0,0,1-.63.4c-.11,0-.17.08-.15.18v.33c0,.1,0,.15-.14.15H15a.16.16,0,0,1-.16-.17V6.58c0-.16,0-.18-.19-.2A2.36,2.36,0,0,1,14,6.19c-.16-.08-.18-.12-.12-.27s.06-.24.1-.35.09-.16.21-.08a2.22,2.22,0,0,0,.72.21.84.84,0,0,0,.47-.07A.33.33,0,0,0,15.49,5a.79.79,0,0,0-.27-.15,7.6,7.6,0,0,1-.73-.31,1,1,0,0,1-.58-.95,1.08,1.08,0,0,1,.8-1c.19-.06.21-.06.21-.26V2.17c0-.15,0-.17.18-.19h.15c.32,0,.32,0,.32.31s0,.23.23.27a1.77,1.77,0,0,1,.51.15c.08,0,.13.1.1.18s-.08.27-.12.41-.08.15-.2.09a1.47,1.47,0,0,0-.8-.15.6.6,0,0,0-.21,0A.29.29,0,0,0,15,3.8a1.06,1.06,0,0,0,.35.18c.2.09.43.17.63.27A1.13,1.13,0,0,1,16.31,5.94ZM6.73,2.19H8.88v.66A.15.15,0,0,0,9.13,3l2.22-1.34a.16.16,0,0,0,0-.27L9.13,0a.16.16,0,0,0-.25.13V.81H3.75A3.73,3.73,0,0,0,0,4.48,3.74,3.74,0,0,0,3.78,8.15,3.72,3.72,0,0,0,7.55,4.48,3.57,3.57,0,0,0,6.73,2.19ZM5.27,6.6a1.85,1.85,0,0,1-.39.15,2.76,2.76,0,0,1-1.56,0A2.05,2.05,0,0,1,2,5.53c0-.1-.08-.23-.12-.35H1.42A.14.14,0,0,1,1.27,5V4.71a.14.14,0,0,1,.15-.15h.41V4.29H1.42a.14.14,0,0,1-.15-.14V3.82a.15.15,0,0,1,.15-.15h.51l0,0a2.07,2.07,0,0,1,.74-1.07,1.9,1.9,0,0,1,1-.39,2.92,2.92,0,0,1,1.5.16s.06,0,.08,0a.18.18,0,0,1,.11.26c-.07.13-.11.25-.17.37a.2.2,0,0,1-.25.13L4.45,3a1.85,1.85,0,0,0-1,.07,1.06,1.06,0,0,0-.6.59h1A.15.15,0,0,1,4,3.82v.33a.14.14,0,0,1-.14.14H2.69v.27H3.84A.14.14,0,0,1,4,4.71V5a.14.14,0,0,1-.14.14h-1a1.07,1.07,0,0,0,.72.74,1.67,1.67,0,0,0,.94,0l.49-.12c.13,0,.21,0,.25.12a3.7,3.7,0,0,1,.17.4C5.44,6.46,5.4,6.54,5.27,6.6Z"></path>
          </svg>`
        }
      
        return icon;
    }
})();