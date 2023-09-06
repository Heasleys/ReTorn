//Object Template
/*
const headerObject = {
    "feature": `${}`,
    "insertLocation": "append",
    "elementClasses": "",
    "bar": false
}
*/
function insertHeader() {
    console.log("[ReTorn]: insertHeader no longer in use. Convert to insertContainer")
}

function insertContainer(element, object) {
    const feature = object?.feature;
    const insertLocation = object?.insertLocation;
    const elementClasses = object?.elementClasses;
    const barOnly = object?.bar;

    //if header already exists, ignore
    if ($(`div.re_container[data-feature="${feature}"]`).length) return;       

    const title = feature.replaceAll('_', ' ');

    var headerElement = `
    <div class="re_container ${elementClasses}" data-feature="${feature}">
        <div class="re_head">
            <span class="re_title noselect">
                <span id="re_title">${title}</span>
            </span>
    `;
    if (!barOnly) {
        headerElement += `
        <div class="re_icon_wrap">
            <span class="re_icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
            </span>
        </div>
        `;
    }
    headerElement += `</div>`; //End of re_head

    if (!barOnly) {
        headerElement += `<div class="re_content" style="display: none;"></div>`
    }
    headerElement += `</div>`; //End of re_container

    //Insert the header into the page
    switch (insertLocation) {
    case 'append':
        element.append(headerElement);
    break;
    case 'prepend':
        element.prepend(headerElement);
    break;
    case 'after':
        element.after(headerElement);
    break;
    case 'before':
        element.before(headerElement);
    break;
    }

  
    const RE_CONTAINER = $(`div.re_container[data-feature="${feature}"]`);
  
    const remove_me_button = `<li id="re_remove_feature"><span class="re_menu_item"><i class="fa-solid fa-trash-can"></i><span class="re_menu_item_text">Remove feature</span></span></li>`
    const settings_view = `<div class="re_menu_block noselect"><div class="re_menu"><ul id="re_features_settings_view">${remove_me_button}</ul></div></div>`
    const settings_element = `<span class="re_settings_icon"><i class="fas fa-gear" id="re_feature_settings" title="Feature Settings"></i>${settings_view}</span>`;

    //Insert settings dropdown
    RE_CONTAINER.find('.re_head .re_title').after(settings_element);
  
    $(document).on('click', function(e) { //hide feature menu if it's open when clicking anywhere else
        RE_CONTAINER.find('#re_feature_settings').removeClass('re_active');
    })
    RE_CONTAINER.find('#re_feature_settings, .re_menu_block').click(function(e) { //open feature menu when clicking on cog icon or cog icon gradient
        e.stopPropagation();
        RE_CONTAINER.find('#re_feature_settings').toggleClass('re_active');
    });
    
    //Default remove me click event
    RE_CONTAINER.find('#re_remove_feature').on('click', function(e){    
        if (feature && locationURL) {
            const obj = {
                "pages": {
                    [locationURL]: {
                        [feature]: {
                            "enabled": false
                        }
                    }
                }
            }
            sendMessage({"name": "merge_sync", "key": "features", "object": obj})
            .then((r) => {
            if (r?.status) {
                features["pages"][locationURL][feature]["enabled"] = false;
                RE_CONTAINER.remove();
                if (typeof featureCleanup === 'function') {
                    featureCleanup(feature);
                }
            }
            })
        }
    });
  
    if (!barOnly) {
        // set header expanded
        if (settings?.headers?.[locationURL]?.[feature]?.expanded) {
            RE_CONTAINER.find(".re_head").addClass("expanded");
            RE_CONTAINER.find("div.re_content").show();
        }
        // re_container head click event
        RE_CONTAINER.find(".re_head").click(function() {
            if ($(this).parent('.re_container').find('.re_content').length) {
                $(this).toggleClass("expanded");
                $(this).next("div.re_content").slideToggle("fast");
                $(this).find("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
                let expanded = $(this).hasClass("expanded");
                const obj = {"headers": {[locationURL]: {[feature]: {"expanded": expanded}}}}
                sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
                .catch((e) => console.error(e)) 
            }
        });

        //set correct arrow direction
        if (RE_CONTAINER.find('div.re_content').is(":visible")) {
            RE_CONTAINER.find('span.re_icon').addClass('arrow_down');
          } else {
            RE_CONTAINER.find('span.re_icon').addClass('arrow_right');
          }
    }  

    console.log(`[ReTorn] Inserted container for ${feature}`)
}

function settingsCheckbox(liID, checkboxID, text) {
    const element = `
    <li id="${liID}">
        <span class="re_menu_item">
            <input type="checkbox" id="${checkboxID}">
            <span class="re_menu_item_text">${text}</span>
        </span>
    </li>`;
    return element;
}
function disableFilterCheckbox(FEATURE) {
    const RE_CONTAINER = $(`.re_container[data-feature="${FEATURE}"]`);
    //insert additional buttons to the header
    RE_CONTAINER.find('.re_head .re_title').after(`
    <span class="re_checkbox" id="re_disable_filters">
        <label class="re_title noselect">Disable filters</label>
        <input type="checkbox" title="Disable filters">
    </span>
    `);

    //click events for disable filter label and checkbox
    RE_CONTAINER.find('#re_disable_filters').click(function(e) {
        e.stopPropagation();
        const checkbox = $(this).find('input[type=checkbox]');
        checkbox.prop("checked", checkbox.prop("checked"));
    });
    RE_CONTAINER.find('#re_disable_filters > label').click(function() {
        const checkbox = $(this).parent('#re_disable_filters').find('input[type="checkbox"]');
        checkbox.prop("checked", !checkbox.prop("checked"));
        checkbox.trigger("change");
    });
}



function showError(FEATURE, err, onlyBar = false) {
    if (!FEATURE) {
        console.error("[ReTorn] Feature now given with show error function.", err);
        return;
    }

    // Remove any previous errors
    clearError(FEATURE, onlyBar);

    const RE_CONTAINER = $(`.re_container[data-feature="${FEATURE}"]`);
    console.log(`[ReTorn][${FEATURE}] Error: `, err);

    if (onlyBar) {
        if (RE_CONTAINER.find('.re_content').length == 0) {
            RE_CONTAINER.append(`<div class="re_content"></div>`)
        }
    }

    RE_CONTAINER.find('#re_loader').remove();
    const RE_CONTENT = RE_CONTAINER.find('.re_content');
    RE_CONTENT.append(`<div class="re_row re_error">${err}</div>`);
    RE_CONTENT.show();
    RE_CONTAINER.find('.re_head').addClass("expanded");
}

function clearError(FEATURE, onlyBar = false) {
    if (!FEATURE) {
        console.error("[ReTorn] Feature not given with clear error function.", err);
        return;
    }
    const RE_CONTAINER = $(`.re_container[data-feature="${FEATURE}"]`);

    RE_CONTAINER.find('#re_loader').remove();
    RE_CONTAINER.find('.re_error').remove();

    if (onlyBar) {
        RE_CONTAINER.find('.re_content').remove();
        RE_CONTAINER.find('.re_head').removeClass("expanded");
    }
    RE_CONTAINER.find('.re_error').remove();
}





/* 
###################
Operation functions
###################
*/
const abbreviateNumber = (number) => { //https://stackoverflow.com/questions/10599933/convert-long-number-into-abbreviated-string-in-javascript-with-a-special-shortn
    if (number === 0) return number
  
    const tier = SI_PREFIXES.filter((n) => number >= n.value).pop()
    const numberFixed = (number / tier.value).toFixed(1)
  
    return `${numberFixed}${tier.symbol}`
}
  
function shortnameStats(stat) {
    stat = stat.toLowerCase();
    switch (stat) {
      case "defense":
        return "DEF";  
      break;
      case "strength":
        return "STR";  
      break;
      case "dexterity":
        return "DEX";  
      break;
      case "speed":
        return "SPD";  
      break;
      case "total":
        return "TOTAL"
      break;
      default:
        return stat;
      break;
    }
}