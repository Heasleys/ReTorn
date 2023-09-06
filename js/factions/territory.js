function territoryWar() {
    //stop and ignore if ranked war box is open
    if ($('.faction-war-info[class*="factionWarInfo_"]').length > 0) {
      return;
    }
    //stop and ignore on raids
    if ($('.desc-wrap.raid-members-list').length > 0) {
      return;
    }
  
    //remove other headers
    $(`.re_container[data-feature="${RW_FILTER}"]`).remove();
    $(`.re_container[data-feature="${RAID_FILTER}"]`).remove();

    //Insert container
    if ($(`.re_container[data-feature="${TT_STATS}"]`).length == 0) {
        const containerObject = {
            "feature": `${TT_STATS}`,
            "insertLocation": "before",
            "elementClasses": "",
            "bar": true
        }
        insertContainer($("ul.f-war-list"), containerObject);
        const RE_CONTAINER = $(`.re_container[data-feature="${TT_STATS}"]`);

  
        //insert button into header menu to refresh Torn Stats spy data manually
        insertSettingsSpyRefresh(TT_STATS);
        //refresh spy click event
        RE_CONTAINER.find('.re_spy_refresh').click(function() {
            loadTerritoryWar(true); //Force refresh spy data
        });
    }
  
    loadTerritoryWar();
  }
  
  function loadTerritoryWar(forced = false) {
    // Territory container must exist before proceeding
    const RE_CONTAINER = $(`.re_container[data-feature="${TT_STATS}"]`);
    if (RE_CONTAINER.length == 0) return;
  
    const a = $('.faction-war-info a[href*="step=profile&ID="');
    //obtain factionIDs for each faction in the territory war
    if (a.length != 2) {
        showError(TT_STATS, "Could not find both faction IDs", true);
        return;
    }

    var promises = [];
    $.each(a, function(i,e) {
    const factionID = $(e).attr('href').match(/\d+/);
    if (forced) {
        var promise = getTornStats("spy/faction/"+factionID, 8, true); //Force overwrite cache for Torn Stats data
    } else {
        var promise = getTornStats("spy/faction/"+factionID);
    }
    promises.push(promise);
    });
  
    // Wait for all promises to complete before calling loadTerritoryWar
    Promise.all(promises)
    .then(function(dataArray) {
        dataArray.forEach((data) => {
            //if torn stats data is false, throw error
            if (data?.status == false) throw data?.message;

            // check for member data and insert it into global variable
            if (data?.faction?.members && Object.keys(data.faction.members)) {
                for (const [id, member] of Object.entries(data.faction.members)) {
                    allMembers[id] = member;
                }
            } else {
                throw "Torn Stats faction member data not found.";
            }
        });
    })
    .then(function() {
    $('.f-war-list .faction-war').addClass('re_territorywar'); //Used for CSS styling for less jumpy pages
    const TT_CONTAINER = $('.re_territorywar');
    TT_CONTAINER.find('.tab-menu-cont > div.members-cont > div.title > .members').after(`<div class="re_spy_title left">Spy</div>`);

    const membersElements = TT_CONTAINER.find('.tab-menu-cont .members-list > li:not(.join)');
    return genericSpyFunction(membersElements, `.user.name`);
    })
    .then(function() {
    /* event listener from interceptFetch for when user status changes */
    document.addEventListener("re_territory_wars_fetch", re_territory_wars_fetch_eventListener);
    })
    .then(function() {
        clearError(TT_STATS, true);
    })
    .catch((err) => {
        showError(TT_STATS, err, true);
    });
  }

  function re_territory_wars_fetch_eventListener() {
    const membersElements = $('.re_territorywar .tab-menu-cont .members-list > li:not(.join,.timer-wrap)');
    return genericSpyFunction(membersElements, `.user.name`);
  }

