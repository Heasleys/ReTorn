const re_userlist_observer = new MutationObserver(function(mutations, observer) {
  if ($(".f-war-list.members-list").parent(".faction-info-wrap").length == 1 && $(`.re_container[data-feature="${FACTION_FILTER}"]`).length == 1) {
    checkMemberListFilters();
    update_filter_counts();
  }
});

function insertMemberListContainer() {
    //Insert container
    if ($(`.re_container[data-feature="${FACTION_FILTER}"]`).length == 0) {
        const containerObject = {
            "feature": `${FACTION_FILTER}`,
            "insertLocation": "before",
            "elementClasses": "",
            "bar": false
        }
        const insertElement = $(".f-war-list.members-list").parent(".faction-info-wrap");
        insertContainer(insertElement, containerObject);
        const RE_CONTAINER = $(`.re_container[data-feature="${FACTION_FILTER}"]`);
  
        disableFilterCheckbox(FACTION_FILTER);
        $(RE_CONTAINER.find('#re_disable_filters input[type=checkbox]')).change(function() {
          checkMemberListFilters();
        });

        //insert hide fallen member toggle in the settings view
        const fallen_li = "re_toggle_fallen";
        const fallen_checkbox = "re_fallen_toggle";
        RE_CONTAINER.find('#re_features_settings_view').prepend(settingsCheckbox(fallen_li, fallen_checkbox, "Hide fallen members"))
        //click event for checkbox
        $(`#${fallen_checkbox}`).on("change", function(e) {
            e.stopPropagation();
            const checked = $(this).prop("checked");
    
            if (checked != undefined) {
            const obj = {
                "faction_profile_filter": {
                "hide_fallen": checked
                }
            }
            
            checkMemberListFilters();
    
            sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
            .then((r) => {
                settings.faction_profile_filter.hide_fallen = checked;
            })
            .catch((e) => console.error(e))
            }
        });
        //click event for checkbox text to toggle checkbox
        $(`#${fallen_li} .re_menu_item_text`).click(function(e) {
            e.stopPropagation();
            const checkbox = $(`#${fallen_checkbox}`);
            checkbox.prop("checked", !checkbox.prop("checked"));
            checkbox.trigger("change");
        });

        insertFactionMembersFilter();
    }
}

function insertFactionMembersFilter() {
  if ($(`.re_container[data-feature="${FACTION_FILTER}"]`).length <= 0) return; //filter container must exist

  const RE_CONTAINER = $(`.re_container[data-feature="${FACTION_FILTER}"]`);
  const RE_CONTENT = RE_CONTAINER.find('.re_content');

  const c = getCounts();

  
  // filter buttons
  RE_CONTENT.append(`
  <div class="re_row" id="re_filterbuttons">
    <div>
      <input type="checkbox" id="re_online_filter" class="re_onlinestatus_checkbox">
      <label for="re_online_filter" class="noselect re_rounded_button">
        Online <span class="re_badge" id="re_onlineCount">${c.onlineCount}</span>
      </label>
    </div>
    <div>
    <input type="checkbox" id="re_idle_filter" class="re_onlinestatus_checkbox">
    <label for="re_idle_filter" class="noselect re_rounded_button">
      Idle <span class="re_badge" id="re_idleCount">${c.idleCount}</span>
    </label>
    </div>
    <div>
    <input type="checkbox" id="re_offline_filter" class="re_onlinestatus_checkbox">
    <label for="re_offline_filter" class="noselect re_rounded_button">
      Offline <span class="re_badge" id="re_offlineCount">${c.offlineCount}</span>
    </label>
    </div>

    <div>
    <input type="checkbox" id="re_okay_filter" class="re_status_checkbox">
    <label for="re_okay_filter" class="noselect re_rounded_button">
      Okay <span class="re_badge" id="re_okayCount">${c.okayCount}</span>
    </label>
    </div>

    <div>
    <input type="checkbox" id="re_hosp_filter" class="re_status_checkbox">
    <label for="re_hosp_filter" class="noselect re_rounded_button">
      Hospital <span class="re_badge red" id="re_hospCount">${c.hospCount}</span>
    </label>
    </div>

    <div>
    <input type="checkbox" id="re_travel_filter" class="re_status_checkbox">
    <label for="re_travel_filter" class="noselect re_rounded_button">
      Travel <span class="re_badge" id="re_travelCount">${c.travelCount}</span>
    </label>
    </div>

    <div>
    <input type="checkbox" id="re_jail_filter" class="re_status_checkbox">
    <label for="re_jail_filter" class="noselect re_rounded_button">
      Jail <span class="re_badge red" id="re_jailCount">${c.jailCount}</span>
    </label>
    </div>

    <div>
    <input type="checkbox" id="re_federal_filter" class="re_status_checkbox">
    <label for="re_federal_filter" class="noselect re_rounded_button">
      Federal <span class="re_badge red" id="re_fedCount">${c.fedCount}</span>
    </label>
    </div>


      <!--div>
      <input id='re_level' type='number' min='0' max='100' placeholder="Max level" title="Max level">
      </div-->
  </div>
  <div class="re_row re_message">
    <p>Showing <b><span id="shownFacProf">0</span></b> out of <b><span id="totalFacProf">0</span></b> members
  </div>
  `);

  if (settings?.faction_profile_filter) {
    Object.entries(settings?.faction_profile_filter).forEach(([key, enabled]) => {
      if (key == "hide_fallen") {
        $('#re_fallen_toggle').prop("checked", enabled);
      } else {
        $(`#re_filterbuttons input[type="checkbox"][id*="${key}"]`).prop("checked", enabled);
      }
    });
  }

  $('#shownFacProf').text($('.faction-info-wrap.another-faction .members-list .table-body li.table-row:visible').length)
  $('#totalFacProf').text($('.faction-info-wrap.another-faction .members-list .table-body li.table-row').length)


  $("#re_level").keyup(function () {
    // if val is greater than 100, set to 100. If val is less than 0, set to 0.
    if ($(this).val()) {
      if (parseInt($(this).val()) >= 100) $(this).val(100);
      if (parseInt($(this).val()) <= 0) $(this).val(0);
    }
  });

  $('#re_filterbuttons input[type=checkbox]').change(function() {
    checkMemberListFilters();

    const id = $(this).attr("id");
    const key = id.replace("re_","").replace("_filter", "");
    const checked = $(this).prop("checked");


    if (checked != undefined && key != undefined) {
      const obj = {
        "faction_profile_filter": {
          [key]: checked
        }
      }

      sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
      .then((r) => {
          settings.faction_profile_filter[key] = checked;
      })
      .catch((e) => console.error(e))
    }
  });


  try {
    const target = document.querySelector('.f-war-list.members-list');
    const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};
    re_userlist_observer.observe(target, obsOptions);
  }
  catch (e) {
    console.error("[ReTorn][FactionFilter] Observer error: ", e);
  }

  checkMemberListFilters();
}

function checkMemberListFilters() {
  const RE_CONTAINER = $(`.re_container[data-feature="${FACTION_FILTER}"]`);

  //select all elements to variable
  const allElements = $('.faction-info-wrap.another-faction .members-list .table-body li.table-row');

  // disable filters
  if (RE_CONTAINER.find('#re_disable_filters input[type=checkbox]').prop("checked")) {
    allElements.removeClass('re_onlinestatus_hide re_status_hide').show();
    $('#shownFacProf').text($('.faction-info-wrap.another-faction .members-list .table-body li.table-row:visible').length)
    $('#totalFacProf').text(allElements.length);
    return;
  }

  //check fallen members first
  const fallen_enabled = $('#re_fallen_toggle').prop("checked");
  if (fallen_enabled) {
    $('.faction-info-wrap.another-faction .members-list .table-body .status > span.fallen').closest('li.table-row').addClass('re_fallen_hide');
  } else {
    $('.faction-info-wrap.another-faction .members-list .table-body .status > span.fallen').closest('li.table-row').removeClass('re_fallen_hide');
  }


  //if no checkboxes are checked, then don't hide any
  if ($('#re_filterbuttons input[type=checkbox]:checked').length == 0) {
    allElements.removeClass('re_onlinestatus_hide re_status_hide');

    $('#shownFacProf').text($('.faction-info-wrap.another-faction .members-list .table-body li.table-row:visible').length)
    $('#totalFacProf').text(allElements.length)
    return;
  }


//select elements to variables based on statuses
const onlineDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .member [class*="userStatusWrap_"]  [fill*="online"]').closest('li.table-row');
const idleDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .member [class*="userStatusWrap_"]  [fill*="idle"]').closest('li.table-row');
const offlineDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .member [class*="userStatusWrap_"]  [fill*="offline"]').closest('li.table-row');

const okayDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.ok').closest('li.table-row');
//const travelDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.traveling, .faction-info-wrap.another-faction .members-list .table-body .status > span.abroad').closest('li.table-row');

const travelDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .table-row .member-icons ul').find('li[id*="icon71_"]').closest('li.table-row');


const jailDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.jail').closest('li.table-row');
const hospDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.hospital').closest('li.table-row');
const fedDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.federal').closest('li.table-row');

const fallenDOMS = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.fallen').closest('li.table-row');
const notokayDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.not-ok:not(.traveling,.abroad)').closest('li.table-row');

//reset: add hide class to all elements
allElements.addClass('re_onlinestatus_hide re_status_hide');

//if no online status checkboxes are checked, then remove hide class based on online status
if ($('#re_filterbuttons .re_onlinestatus_checkbox:checked').length == 0) {
  allElements.removeClass('re_onlinestatus_hide');
} else {
  if ($('#re_online_filter').is(':checked')) {
    onlineDOMs.removeClass('re_onlinestatus_hide');
  }

  if ($('#re_idle_filter').is(':checked')) {
    idleDOMs.removeClass('re_onlinestatus_hide');
  } 

  if ($('#re_offline_filter').is(':checked')) {
    offlineDOMs.removeClass('re_onlinestatus_hide');
  } 
}


//if no status checkboxes are checked, then don't hide based on other status
if ($('#re_filterbuttons .re_status_checkbox:checked').length == 0) {
  allElements.removeClass('re_status_hide');
} else {
  if ($('#re_okay_filter').is(':checked')) {
    okayDOMs.removeClass('re_status_hide');
  }
  if ($('#re_hosp_filter').is(':checked')) {
    hospDOMs.removeClass('re_status_hide');
  }
  if ($('#re_travel_filter').is(':checked')) {
    travelDOMs.removeClass('re_status_hide');
  }
  if ($('#re_jail_filter').is(':checked')) {
    jailDOMs.removeClass('re_status_hide');
  }
  if ($('#re_federal_filter').is(':checked')) {
    fedDOMs.removeClass('re_status_hide');
  }


  // if ($('#re_notokay_filter').is(':checked')) {
  //   notokayDOMs.removeClass('re_status_hide');
  // } 
}

$('#shownFacProf').text($('.faction-info-wrap.another-faction .members-list .table-body li.table-row:visible').length)
$('#totalFacProf').text(allElements.length)
}

function update_filter_counts() {
  const c = getCounts();
  for (const [key, value] of Object.entries(c)) {
    $(`#re_${key}`).text(value);
  }
}

function initMemberListSpies() {
  insertMemberListSpyElements();
  getMemberListStats();
}

function insertMemberListSpyElements() {
  const RE_CONTAINER = $(`.re_container[data-feature="${FACTION_FILTER}"]`);
  if (!RE_CONTAINER.length) return;

  //insert button into header menu to refresh Torn Stats spy data manually
  insertSettingsSpyRefresh(FACTION_FILTER, MEMBERLIST_SPIES); //This is technically the filter container, but whatever.
  //click event to refresh tornstats data
  RE_CONTAINER.find('.re_spy_refresh').click(function() {
      getMemberListStats(true); //Force refresh spy data
  });
}

//MemberListStats requires the filter to be active. This should not be called unless filter is enabled as well
function getMemberListStats(forced = false) {
  const factionID = getFactionIDFromFactionPage();

  if (!factionID) {
    console.log("[ReTorn][getMemberListStats] Faction ID could not be found.");
    return;
  }

  var promise;
  if (forced) {
    promise = getTornStats("spy/faction/"+factionID, 8, true); //Force overwrite cache for Torn Stats data
  } else {
    promise = getTornStats("spy/faction/"+factionID);
  }

  promise
  .then(function(data) {
    if (data?.status == false) {
      throw data?.message;
    }
    if (data?.faction?.members && Object.keys(data.faction.members)) {
      for (const [id, member] of Object.entries(data.faction.members)) {
        allMembers[id] = member;
      }
    } else {
      throw "Torn Stats faction member data not found.";
    }

    $('.f-war-list.members-list').parent('.faction-info-wrap').addClass('re_faction_stats');
    $('.faction-info-wrap.re_faction_stats .members-list .table-header .member').after(`<div class="re_spy_title left">Spy<div class="re_sort_icon"></div></div>`);
  
    const membersElements = $('.re_faction_stats ul.table-body li.table-row');

    return genericSpyFunction(membersElements, `[class*='honorWrap_'] [class*='linkWrap_']`)
  })
  .then(function() {
      //Sorting for spy column
      $('.re_faction_stats .re_spy_title').click(function() {
        const spyCols = $('.re_faction_stats .re_spy_title');
        
        const clickedSpyCol = $(this); //then spyCol that was clicked
        const clickedIcon = clickedSpyCol.find('.re_sort_icon');
        let dir = true;  //always sort by largest > smallest first
        if (clickedIcon.hasClass('re_desc')) dir = false;

        spyCols.each(function() {//now change icon for both spyCols to the correct direction
          const spyCol = $(this); 
          const icon = spyCol.find('.re_sort_icon');

          const memberCont = spyCol.closest('.members-list');
          const memberList = memberCont.find('ul.table-body');
          
          memberCont.find('div[class*="sortIcon_"]').removeClass(function (index, css) {
            return (css.match (/(^|\s)desc_\S+/g) || []).join(' ');
          }).removeClass(function (index, css) {
            return (css.match (/(^|\s)asc_\S+/g) || []).join(' ');
          });

          //actually sort the players based on direction
          if (dir) {
            icon.removeClass('re_asc').addClass('re_desc');
            memberList.find('li.table-row').sort(sort_li_desc).appendTo(memberList);
          } else {
            icon.removeClass('re_desc').addClass('re_asc');
            memberList.find('li.table-row').sort(sort_li_asc).appendTo(memberList);
          }
        })
      });
      //if another column is clicked, then remove the classes from the spy column
      $('.re_faction_stats .members-list ul.table-header > li.table-cell').click(function() {
        $(this).closest('.members-list').find('.re_spy_title .re_sort_icon').removeClass('re_asc').removeClass('re_desc');
      })
  })
  .then(function() {
    clearError(FACTION_FILTER, false);
  })
  .catch((err) => {
      showError(FACTION_FILTER, err, false);
  });


}

function getCounts() {
  const onlineDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .member [class*="userStatusWrap_"] [fill*="online"]');
  const idleDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .member [class*="userStatusWrap_"] [fill*="idle"]');
  const offlineDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .member [class*="userStatusWrap_"] [fill*="offline"]');

  const okayDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.ok');
  const travelDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .table-row .member-icons ul').find('li[id*="icon71_"]').closest('li.table-row');



  const notokayDOMs = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.not-ok:not(.traveling,.abroad)');
  const jailDOMS = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.jail');
  const hospDOMS = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.hospital');
  const fedDOMS = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.federal');
  const fallenDOMS = $('.faction-info-wrap.another-faction .members-list .table-body .status > span.fallen');

  //count online/idle/offline for member table
  let onlineCount = onlineDOMs.length;
  let idleCount = idleDOMs.length;
  let offlineCount = offlineDOMs.length;

  let okayCount = okayDOMs.length;
  let travelCount = travelDOMs.length;

  let notokayCount = notokayDOMs.length;
  let jailCount = jailDOMS.length;
  let hospCount = hospDOMS.length;
  let fedCount = fedDOMS.length;
  let fallenCount = fallenDOMS.length;//unused count, setting in dropdown
  
  
  const wallDOMS = $('.faction-info-wrap.another-faction .members-list .table-body .table-row .member-icons ul').find('li[id*="icon75_"], li[id*="icon76_"]');
  let wallCount = wallDOMS.length;

  const obj = {
      "onlineCount": onlineCount,
      "idleCount": idleCount,
      "offlineCount": offlineCount,
      "okayCount": okayCount,
      "hospCount": hospCount,
      "jailCount": jailCount,
      "travelCount": travelCount,
      "wallCount": wallCount,
      "notokayCount": notokayCount,
      "fedCount": fedCount,
      "fallenCount": fallenCount
  }

  return obj;
}

function add_toggle_description() {
  $('.faction-title[data-title="description"]').click(function() {
    $(this).toggleClass('re_hide_desc');
    $(this).siblings('div.faction-description').toggleClass('re_hide');

    const enabled = $(this).hasClass('re_hide_desc');

    const obj = {
      "factions": {
        "hide_description": {
          "enabled": enabled
        }
      }
    }
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      settings.factions.hide_description.enabled = enabled;
    })
    .catch((e) => console.error(e))

  });

  if (settings?.factions?.hide_description?.enabled) {
    let desc_title = $('.faction-title[data-title="description"]');
    desc_title.addClass('re_hide_desc');
    desc_title.siblings('div.faction-description').addClass('re_hide');
  }
}