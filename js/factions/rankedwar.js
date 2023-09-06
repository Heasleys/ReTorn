//function for adding the Ranked War filter header
function rankedWar() {
    console.log("RANKED")
    //stop and ignore if territory wars
    if ($('.faction-war-info').find('a[href*="#terrName"]').length > 0) {
      return;
    }
    //stop and ignore on raids
    if ($('.desc-wrap.raid-members-list').length > 0) {
      return;
    }
    //check to see if territory header is in the way, if so delete it
    if ($(`.re_container[data-feature="${TT_STATS}"]`).length) {
      $(`.re_container[data-feature="${TT_STATS}"]`).remove();
    }



    //insert container if doesn't exist
    if (!$(`.re_container[data-feature="${RW_FILTER}"]`).length) {
      insert_ranked_war_container();
    }

    preload_ranked_war(); // Immedietely add elements to the page, so less jumpy page loading
    loadRankedWar();
  }

  function insert_ranked_war_container() {
            //Insert container
            const containerObject = {
              "feature": `${RW_FILTER}`,
              "insertLocation": "before",
              "elementClasses": "",
              "bar": false
          }
          insertContainer($("ul.f-war-list"), containerObject);
          const RE_CONTAINER = $(`.re_container[data-feature="${RW_FILTER}"]`);
    
        //insert additional buttons to the header
        RE_CONTAINER.find('.re_head .re_title').after(`<span class="re_checkbox" id="re_disable_filters">
          <label class="re_title noselect">Disable filters</label>
          <input type="checkbox" title="Disable filters">
        </span>`);
    
        //insert button into header menu to refresh Torn Stats War data manually
        RE_CONTAINER.find('#re_features_settings_view').prepend('<li id="re_war_refresh"><span class="re_menu_item"><i class="fa-solid fa-arrows-rotate"></i><span class="re_menu_item_text">Refresh war data</span></span></li>')
        //click event to refresh tornstats data
        RE_CONTAINER.find('#re_war_refresh').click(function() {
          //cleanup ranked war page first
          featureCleanup(RW_FILTER);
          preload_ranked_war();
          
          getWarID()
          .then((warID) => getTornStats("wars/"+warID, 8, true))//8 hours cached, force update
          .then(() => {
            loadRankedWar();//reload ranked war
          })
          .catch((e) => console.error(e))
        });
  }
  
  function preload_ranked_war() {
    //Add loading dots
    $(`.re_container[data-feature="${RW_FILTER}"]`).find('.re_content').html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" id="re_loader">
    <p id="re_message" style="display: none;"></p>`);
  
    //player count elements
    $(`.faction-names .name.enemy`).append(`<div class="re_enemy_count re_mem_count">
    <p class="re_showing">&nbsp;</p>
    <p class="re_playercounts">&nbsp;</p>
    </div>`);
    $(`.faction-names .name.your`).append(`<div class="re_your_count re_mem_count">
    <p class="re_showing">&nbsp;</p>
    <p class="re_playercounts">&nbsp;</p>
    </div>`);
  
  
    // Ideally it should preload the columns, but that will be a bigger overhaul, maybe later
  }
  
  function loadRankedWar() {
    const RE_CONTAINER = $(`.re_container[data-feature="${RW_FILTER}"]`);
  
    getWarID()
    //pull ranked war data from Torn Stats
    .then((warID) => getTornStats("wars/"+warID))
    //add data to members lists
    .then((data) => {
      if (data.status) {
        if (data.faction_a && data.faction_a.members) {
          for (const [id, member] of Object.entries(data.faction_a.members)) {
            allMembers[id] = member;
          }
        }
        if (data.faction_b && data.faction_b.members) {
          for (const [id, member] of Object.entries(data.faction_b.members)) {
            allMembers[id] = member;
          }
        }
      }
    })
    .then(() => {
      $('.f-war-list .faction-war').addClass('re_rankedwar'); //Used for CSS styling for less jumpy pages
      const RW_CONTAINER = $('.re_rankedwar');
      RW_CONTAINER.find('.tab-menu-cont > div.members-cont > div > .member').after(`<div class="re_spy_title left">Spy<div class="re_sort_icon"></div></div>`);
  
      //Sorting for spy column
      RW_CONTAINER.find('.re_spy_title').click(function() {
        const spyCols = RW_CONTAINER.find('.re_spy_title');
        
        //send out a React State Change request to sort by player name first
        const className = 'faction-war re_rankedwar';
  
        const opponentActive = $('.faction-names .enemy').is('[class*=active_]');
        //opponentActive is needed in case of small screen, we don't want to force switch the faction view
        const newStateObj = {
          "opponentActive": opponentActive,
          "sorting": {
            "field": "playername",
            "direction": "desc"
          }
        }
        const e = new CustomEvent("reUpdateState", {detail: {className: className, newState: newStateObj}});
        document.dispatchEvent(e);
        //React State Change Request
  
        
        const clickedSpyCol = $(this); //then spyCol that was clicked
        const clickedIcon = clickedSpyCol.find('.re_sort_icon');
        let dir = true;  //always sort by largest > smallest first
        if (clickedIcon.hasClass('re_desc')) dir = false;
  
        spyCols.each(function() {//now change icon for both spyCols to the correct direction
          const spyCol = $(this); 
          const icon = spyCol.find('.re_sort_icon');
  
          const memberCont = spyCol.closest('.members-cont');
          const memberList = memberCont.find('ul.members-list');
          
          memberCont.find('div[class*="sortIcon_"]').removeClass(function (index, css) {
            return (css.match (/(^|\s)desc_\S+/g) || []).join(' ');
          }).removeClass(function (index, css) {
            return (css.match (/(^|\s)asc_\S+/g) || []).join(' ');
          });
  
          //actually sort the players based on direction
          if (dir) {
            icon.removeClass('re_asc').addClass('re_desc');
            memberList.find('li').sort(sort_li_desc).appendTo(memberList);
          } else {
            icon.removeClass('re_desc').addClass('re_asc');
            memberList.find('li').sort(sort_li_asc).appendTo(memberList);
          }
        })
      });
      //if another column is clicked, then remove the classes from the spy column
      RW_CONTAINER.find('div.members-cont > div > div[class*="tab_"]').click(function() {
        $(this).closest('.faction-war').find('.re_spy_title .re_sort_icon').removeClass('re_asc').removeClass('re_desc');
      })
  
      const membersElements = RW_CONTAINER.find('ul.members-list > li');
      return genericSpyFunction(membersElements, `div.member div[class*="userWrap"] a`);
    })
    //insert information into header (buttons/text) and input functions
    .then((psList) => {
      let psStr = `<select class="mb1" id="re_ps_select"><option selected value="">Hide user if...</option>`;
      psStr += `<option value="offline">Offline</option><option value="idle">Idle</option><option value="online">Online</option><option value="not okay">Not Okay</option>`;
      
      //psList will be empty if no Torn Stats data is available
      if (psList.length != 0) psStr += `<option value="strength">Strength</option><option value="defense">Defense</option><option value="speed">Speed</option><option value="dexterity">Dexterity</option><option value="total">Total Stats</option>`;
      
      for (var i = 0; i < psList.length; i++) {
         psStr += `<option value="${psList[i]}">${psList[i]}</option>`;
      }
      psStr += `</select>`;
  
      let enemyFac = $('.faction-names .name.enemy [class*="text"]').text();
      let friendlyFac = $('.faction-names .name.your [class*="text"]').text();
  
  
      RE_CONTAINER.find('#re_loader').remove();
      RE_CONTAINER.find('.re_content').prepend(`
        <div class="re_row">
        <div>
          ${psStr}
          <div class="switch_wrap switch_row" id="re_ps_wrap" style="display: none;">
            <select>
              <option value="" selected>is...</option>
              <option value="<">Less than</option>
              <option value=">">Greater than</option>
              <option value="=">Equal to</option>
            </select>
            <input type="text" placeholder="value">
            <button class="re_torn_button" type="button">Add</button>
          </div>
        </div>
        <div class="switch_wrap" id="re_rw_rules">
          <p class="re_ptitle">Filter Rules</p>
            <div class="re_scrollbox">
              <ul class="re_list" id="re_filter_rules">
              <li><div class="re_list_item item">No filter rules being applied.</div></li>
              </ul>
            </div>
          </div>
        </div>
        `);
  
  
        //add player counts to already inserted player count elements
        //enemy
        $('.re_enemy_count > .re_showing').html(`Showing <span class="re_enemy">0</span> of <span class="re_enemy_max">0</span> ${enemyFac} members`);
        $('.re_enemy_count > .re_playercounts').html(`${onlineIcon}<span class="onlineCount">0</span> ${idleIcon}<span class="idleCount">0</span> ${offlineIcon}<span class="offlineCount">0</span>`);
        //friendly      
        $('.re_your_count > .re_showing').html(`Showing <span class="re_your">0</span> of <span class="re_your_max">0</span> ${friendlyFac} members`);
        $('.re_your_count > .re_playercounts').html(`${onlineIcon}<span class="onlineCount">0</span> ${idleIcon}<span class="idleCount">0</span> ${offlineIcon}<span class="offlineCount">0</span>`);
  
  
    
  
        countPlayerStatus();
  
  
  
        $('#re_ps_select').change(function() {        
          if ($(this).val()) {
            $('#re_ps_wrap').show();
          } else {
            $('#re_ps_wrap').hide();
          }
  
          if ($(this).val() == "offline" || $(this).val() == "idle" || $(this).val() == "online" || $(this).val() == "not okay") {
            $('#re_ps_wrap select').prop("selectedIndex", 3);
            $('#re_ps_wrap select').prop('disabled', true).hide();
            $('#re_ps_wrap input').prop('disabled', true).hide().val(1);
          } else {
            $('#re_ps_wrap select').prop("selectedIndex", 0);
            $('#re_ps_wrap select').prop('disabled', false).show();
            $('#re_ps_wrap input').prop('disabled', false).show();
            $('#re_ps_wrap input').val("");
          }
        });
  
        //click events for disable filter label and checkbox
        RE_CONTAINER.find('#re_disable_filters').click(function(e) {
          e.stopPropagation();
          const checkbox = $(this).find('input[type=checkbox]');
          checkbox.prop("checked", checkbox.prop("checked"));
          rankedWarFilters();
        });
        RE_CONTAINER.find('.re_checkbox > label').click(function() {
          let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
          checkbox.prop("checked", !checkbox.prop("checked"));
          checkbox.trigger("change");
        });
  
        /* event listener from interceptFetch for when user status changes */
        document.addEventListener("re_ranked_wars_fetch", re_ranked_wars_fetch_eventListener);
  
        $(document).on('click', '#re_filter_rules .re_list_item.x .remove-link .delete-subscribed-icon', function() {
          const parent = $(this).closest('li');
          const index = parent.attr('data-index');
          if (index != undefined && parent.length > 0) {
            sendMessage({name: "del_settings_index", key: index, setting: "ranked_war_filters"})
            .then((r) => {
              parent.remove();
              delete settings.ranked_war_filters[index];
              settings.ranked_war_filters = fixIndexAfterDelete(index, settings.ranked_war_filters);
              rankedWarFilters();
            })
            .catch((e) => console.error(e))
          }
        });
  
        //set letters to numbers
        $('#re_ps_wrap input').on('change, keyup', function() {
          var currentInput = $(this).val().toLowerCase();
          if (!/\.$/.test(currentInput)) {
            var numVal = Number(currentInput.replace(/[^0-9.]+/g, ''));
            if (/\d+k$/.test(currentInput)) numVal *= 1000;
            if (/\d+m$/.test(currentInput)) numVal *= 1000000;
            if (/\d+b$/.test(currentInput)) numVal *= 1000000000;
            if (/\d+t$/.test(currentInput)) numVal *= 1000000000000;
  
            if (numVal) {
              $(this).val(numVal.toLocaleString("en-US"));
            }
          }
        });
  
        $('#re_ps_wrap button').click(function() {
          const option = $( "#re_ps_select" ).find(":selected").val();
          const inequalities = $('#re_ps_wrap select').val();
          const num = $('#re_ps_wrap input').val().replace(/[^0-9]+/g, '');  
  
  
          if (option && inequalities && num) {
            resetFilterInputs();
  
  
            const index = Object.keys(settings?.ranked_war_filters).length;
  
            const obj = {
              "ranked_war_filters": {
                [index]: {
                  "option": option,
                  "eq": inequalities, 
                  "value": num
                }
              }
            }
  
            settings["ranked_war_filters"][index] = {"option": option, "eq": inequalities, "value": num};
            
            sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
            .then((r) => {
              rankedWarFilters();
            })
            .catch((e) => console.error(e))
  
          } else {
            if (!option) {
              $('#re_ps_select').addClass("error");
              setTimeout(function() {
                $('#re_ps_select').removeClass("error");
              }, 2000);
            }
            if (!inequalities) {
              $('#re_ps_wrap select').addClass("error");
              setTimeout(function() {
                $('#re_ps_wrap select').removeClass("error");
              }, 2000);
            }
            if (!num) {
              $('#re_ps_wrap input[type="text"]').addClass("error");
              setTimeout(function() {
                $('#re_ps_wrap input[type="text"]').removeClass("error");
              }, 2000);
            }
          }
        })
    })
    //pull filters and apply filters
    .then(() => {
      rankedWarFilters();
    })
    .catch((err) => {
      console.log("[ReTorn][Ranked War Filter] Error: ", err);
      RE_CONTAINER.find('#re_loader').remove();
      RE_CONTAINER.find('#re_message').html(`<span class="re_error">${err}</span>`);
      RE_CONTAINER.find('#re_message').show();
    });
  }
  
  function getWarID() {
    return new Promise((resolve, reject) => {
      if ($('.f-war-list [class*="rankBox"]').length == 1) {
        if ($('.f-war-list [class*="rankBox"]').data("warid")) {
          let warID = $('.f-war-list [class*="rankBox"]').data("warid");
          return resolve(warID);
        }
      }
      return reject();
    });
  }
  
  function rankedWarFilters() {
    const filters = settings?.ranked_war_filters;
    $('#re_filter_rules').empty();
  
    filterUsers(filters);
  
    //add the filters to rule list
    for (const [index, data] of Object.entries(filters)) {
      if (data.option == "offline" || data.option == "idle" || data.option == "online" || data.option == "not okay") {
        $('#re_filter_rules').prepend(`<li data-index="${index}" data-option="${data.option}"><div class="re_list_item x"><a class="remove-link"> <i class="delete-subscribed-icon"></i> </a></div><div class="re_list_item item">Hide user if ${data.option}</div></li>`);
      } else {
        $('#re_filter_rules').prepend(`<li data-index="${index}" data-option="${data.option}"><div class="re_list_item x"><a class="remove-link"> <i class="delete-subscribed-icon"></i> </a></div><div class="re_list_item item">Hide user if ${data.option} ${data.eq} ${parseInt(data.value).toLocaleString("en-US")}</div></li>`);
      }
    }
  
    if (Object.keys(filters).length == 0) {
      $('#re_filter_rules').prepend(`<li><div class="re_list_item item">No filter rules being applied.</div></li>`);
    }
  }
  
  function filterUsers(filters) {
    const RE_CONTAINER = $(`.re_container[data-feature="${RW_FILTER}"]`);
  
    //actually filter the players
    if (!RE_CONTAINER.find('#re_disable_filters input[type="checkbox"]').is(":checked")) { //if filter rules checkbox is not checked, proceed
      $('ul.members-list > li').each(function() { //for each member
        $(this).show().addClass("re_show");
  
        for (const [index, data] of Object.entries(filters)) { //for each filter
          if ($(this).data(data.option)  != undefined) {
            if (data.eq == "<") {
              if ($(this).data(data.option) < data.value) {
                $(this).hide().removeClass("re_show");
              }
            }
            if (data.eq == ">") {
              if ($(this).data(data.option) > data.value) {
                $(this).hide().removeClass("re_show");
              }
            }
            if (data.eq == "=") {
              if ($(this).data(data.option) == data.value) {
                $(this).hide().removeClass("re_show");
              }
            }
          }
  
          //user activity (offline, idle, online)
          if (data.option == "offline" || data.option == "idle" || data.option == "online") {
            const domID = $(this).find('[class*="userStatusWrap_"]').attr('id');
            if (domID.includes(data.option)) $(this).hide().removeClass("re_show");
          }
  
          // hide user if Status is not okay
          if (data.option == "not okay") {
            if ($(this).find('.status.not-ok').length > 0) $(this).hide().removeClass("re_show");
          }
        }
      
      });
    } else {
      $('.faction-war ul.members-list > li').show().addClass("re_show");
    }
  
    //set the number of shown members for each faction
    let yourCount = $('.faction-war ul.members-list > li.your.re_show').length;
    let enemyCount = $('.faction-war ul.members-list > li.enemy.re_show').length;
    $('.re_enemy_count .re_enemy').text(enemyCount);
    $('.re_enemy_count .re_enemy_max').text($('.faction-war ul.members-list > li.enemy').length);
    $('.re_your_count .re_your').text(yourCount);
    $('.re_your_count .re_your_max').text($('.faction-war ul.members-list > li.your').length);
  }
  
  function resetFilterInputs() {
    $('#re_ps_select').prop("selectedIndex", 0);
    $('#re_ps_wrap select').prop("selectedIndex", 0);
    $('#re_ps_wrap select').prop('disabled', false).show();
    $('#re_ps_wrap input').prop('disabled', false).show();
    $('#re_ps_wrap input').val("");
    $('#re_ps_wrap').hide();
  }
  
  function showReadyOCs(checked) {
    $('ul.crimes-list > li.item-wrap').each(function() {
      if ($(this).find('ul.item li.status:contains("Ready")').length > 0) {
        if ($(this).find('.stat.stat-red').length == 0) {
          if (checked) {
            $(this).addClass('active');
          } else {
            $(this).removeClass('active');
          }
        } else {
          $(this).find('ul.item li.status').html(`<span class="bold t-red">${$(this).find('.stat.stat-red').length} Not Ready</span>`)
        }
      }
    });
  }
  
  function countPlayerStatus() {
    //count offline, online, idle
    const statuses = ["offline", "idle", "online"]
    statuses.forEach(function(e) {
      let enemyCount = $('.faction-war .enemy-faction ul.members-list .member.icons [id*="'+e+'"]').length;
      $('.re_enemy_count .'+e+'Count').text(enemyCount);
  
      let yourCount = $('.faction-war .your-faction ul.members-list .member.icons [id*="'+e+'"]').length;
      $('.re_your_count .'+e+'Count').text(yourCount);
    });
  }
  
  function re_ranked_wars_fetch_eventListener() {
    const filters = settings?.ranked_war_filters;
    if (features?.pages?.factions?.ranked_war_filter?.enabled) {
      countPlayerStatus();
      filterUsers(filters);
    }
  }