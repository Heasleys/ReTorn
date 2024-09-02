//Object Template
/*
const headerObject = {
    "feature": `${}`, // The feature name (e.g. quick_items)
    "insertLocation": "append", //The location the header will be inserted (e.g. append, prepend)
    "elementClasses": "", // Additional classes (e.g. mb1)
    "bar": false // Boolean for if the bar will only be a bar or have the extra box below it
    "info": "" // Optional: If included it will add a info circle to the Header Title that can hovered over for additional information (see Quick Items for example)
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
    const infoText = object?.info;
    const subFeature = object?.subFeature;

    //if header already exists, ignore
    if (!subFeature) {
        if ($(`div.re_container[data-feature="${feature}"]`).length) return;       
    } else {
        if ($(`div.re_container[data-feature="${feature}"][data-subfeature="${subFeature}"]`).length) return;
    }

    var title = feature.replaceAll('_', ' ');

    if (subFeature) title += `: ${subFeature.replaceAll('_', ' ')}`;

    var headerElement = `
    <div class="re_container ${elementClasses}" data-feature="${feature}" data-subfeature="${subFeature}">
        <div class="re_head">
            <span class="re_title noselect">
                <span id="re_title">${title}</span>`;

    if (infoText) {
        headerElement += `
        <i class="ml1 fa-solid fa-circle-info" title="${infoText}"></i>
        `;
    }

    headerElement += `          
            </span>
    `;
    if (!barOnly) {
        headerElement += `
        <span class="re_icon_wrap">
            <span class="re_icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
            </span>
        </span>
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
    const settings_element = `<div class="re_settings_icon"><i class="fas fa-gear" id="re_feature_settings" title="Feature Settings"></i>${settings_view}</div>`;

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
                $(this).find(".re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
                let expanded = $(this).hasClass("expanded");
                const obj = {"headers": {[locationURL]: {[feature]: {"expanded": expanded}}}}
                sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
                .then((r) => {
                    if (r?.status) {
                        settings["headers"][locationURL][feature]["expanded"] = expanded;
                    }
                })
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

function get_player_id_from_page() {
    var player_id = 0;

    //get player_id by cookie
    player_id = parseInt(getCookieValue("uid"));
    if (player_id) return player_id;

    //get player_id by chat script in DOM
    player_id = $('script[type="text/javascript"][uid]').attr('uid') ? parseInt($('script[type="text/javascript"][uid]').attr('uid')) : 0;
    if (player_id) return player_id;

    //get player_id by sidebar
    player_id = parseInt($('#sidebarroot [class*="user-information"] [class*="menu-name_"]').next('a').attr('href').replace(/\D/g, ''));
    if (player_id) return player_id;

    return player_id;
}


function showError(FEATURE, err, onlyBar = false) {
    if (!FEATURE) {
        console.error("[ReTorn] Feature now given with show error function.", err);
        return;
    }

    // Remove any previous errors
    clearError(FEATURE, onlyBar);

    const RE_CONTAINER = $(`.re_container[data-feature="${FEATURE}"]`);
    console.error(`[ReTorn][${FEATURE}] Error: `, err);

    if (!RE_CONTAINER.length) return;

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
        console.error("[ReTorn] Feature not given with clear error function.");
        return;
    }
    const RE_CONTAINER = $(`.re_container[data-feature="${FEATURE}"]`);
    if (!RE_CONTAINER.length) {
        console.log(`[ReTorn] ${FEATURE} container could not be found.`);
        return;
    }

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
    const og_num = number;
    if (number === 0) return number;
    if (isNaN(parseInt(number))) return "NaN";
    number = Math.abs(parseInt(number));
      
    const tier = SI_PREFIXES.filter((n) => number >= n.value).pop()
    const numberFixed = (number / tier.value).toFixed(1)
  
    if (og_num < 0) return `-${numberFixed}${tier.symbol}`
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

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;
  
    var elapsed = current - previous;
  
    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';
    }
  
    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';
    }
  
    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';
    }
  
    else if (elapsed < msPerMonth) {
        return '' + Math.round(elapsed/msPerDay) + ' days ago';
    }
  
    else if (elapsed < msPerYear) {
        return '' + Math.round(elapsed/msPerMonth) + ' months ago';
    }
  
    else {
        return '' + Math.round(elapsed/msPerYear ) + ' years ago';
    }
}

function getStringFromDays(numberOfDays) {
    var years = Math.floor(numberOfDays / 365);
    var months = Math.floor(numberOfDays % 365 / 30);
    var days = Math.floor(numberOfDays % 365 % 30);

    var yearsDisplay = years > 0 ? years + (years == 1 ? " year " : " years ") : "";
    var monthsDisplay = months > 0 ? months + (months == 1 ? " month " : " months ") : "";
    var daysDisplay = days > 0 ? days + (days == 1 ? " day" : " days") : "";
    return yearsDisplay + monthsDisplay + daysDisplay; 
}

const getCookieValue = (name) => ( //https://stackoverflow.com/a/25490531/22230696
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
  )

function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });
    });
}