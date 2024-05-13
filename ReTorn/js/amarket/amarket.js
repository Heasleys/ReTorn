var re_items;

//watch for changes to auction tabs
const auctionTabObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target && mutation.target.className && mutation.target.className.includes('items-list')) {
        if (mutation.addedNodes && mutation.addedNodes.length != 0) {
            if (!mutation.addedNodes[0].className) {
                if (mutation.target && mutation.target.className && mutation.target.className.includes('items-list')) {
                    const tab = $('.tabContainer > div.tab-menu-cont:visible').attr('id');
                    filter(`#${tab}`);
                }
            }
        }
      }
    })
});

  //watch for changes to pagination
const paginationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target && mutation.target.className && mutation.target.className.includes('pagination-wrap')) {
        if (mutation.addedNodes && mutation.addedNodes.length != 0) {
            duplicatePager();
            paginationObserver.disconnect();
        }
      }
    })
});



//check if captcha or if user is logged out first, then start function
if ($('div.captcha').length == 0 && $('div.content-wrapper.logged-out').length == 0) { 
    if (features?.pages?.amarket?.auction_filter?.enabled) {
        insertAMarketFilter();    
        initSearchElements();
        initShowFilter();
    }
    if (features?.pages?.amarket?.duplicate_pagination?.enabled) {
        enableDuplicatePagination();
    }
}

function insertAMarketFilter() {
    //check if container already exists
    if ($(`.re_container[data-feature="${A_FILTER}"]`).length != 0) return;

    const target = document.getElementById('auction-house-tabs');
    //mutationObserver on auction house tabs
    if (target) {
        auctionTabObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
    }

    //watch for changes to url hash, switch filter view
    window.addEventListener('hashchange', () => {
        const hash = location.hash;
        
        if (hash.includes('itemtab=weapons')) {
            $('#re_ah_weapons').show();
            $('#re_ah_armor').hide();
            $('#re_ah_items').hide();  
        }
        if (hash.includes('itemtab=armor')) {
            $('#re_ah_weapons').hide();
            $('#re_ah_armor').show();
            $('#re_ah_items').hide();     
        }
        if (hash.includes('itemtab=items')) {
            $('#re_ah_weapons').hide();
            $('#re_ah_armor').hide();
            $('#re_ah_items').show();  
        }
    }, false);

    const containerObject = {
        "feature": `${A_FILTER}`,
        "insertLocation": "before",
        "elementClasses": "",
        "bar": false
    }
    insertContainer($("div#auction-house-tabs"), containerObject);
    const RE_CONTAINER = $(`.re_container[data-feature="${TT_STATS}"]`);
    RE_CONTAINER.after(`<hr class="delimiter-999 m-top10">`);
    
    //insert filter html
    $('.re_content').html(`
    <!-- Weapons -->
    <div id="re_ah_weapons" class="re_filter" style="display: none;">
    <input type="text" class="re_name" placeholder="Weapon name" list="re_ah_weapons_list" id="re_ah_weapons_list_textbox">
    <datalist id="re_ah_weapons_list"></datalist>
    <select class="re_category" id="re_ah_weapons_category" required></select>
    <select class="re_category" id="re_ah_weapons_type" required></select>
    <input class="re_stats" type="number" placeholder="Dmg" id="re_ah_weapons_damage" min="0" title="Weapon damage">
    <input class="re_stats" type="number" placeholder="Acc" id="re_ah_weapons_accuracy" min="0" title="Weapon accuracy">

    <select class="re_color" id="re_ah_weapons_color" required><option value="" selected>Weapon color</option><option value="none">None</option><option value="yellow">Yellow</option><option value="orange">Orange</option><option value="red">Red</option><option value="orangered">Orange & Red</option></select>
    <select id="re_ah_weapons_bonuses_1" class="re_bonus" required></select>
    <input class="re_stats" type="number" id="re_ah_weapons_bonuses_1_perc" min="0" placeholder="Perc" title="Bonus percent" disabled>
    <select id="re_ah_weapons_bonuses_2" class="re_bonus" required></select>
    <input class="re_stats" type="number" id="re_ah_weapons_bonuses_2_perc" min="0" placeholder="Perc" title="Bonus percent" disabled>
    </div>

    <!-- Armor -->
    <div id="re_ah_armor" class="re_filter" style="display: none;">
    <input type="text" class="re_name" list="re_ah_armor_types" id="re_ah_armor_types_textbox" placeholder="Armor name">
    <datalist id="re_ah_armor_types">
    <option data-name="Riot" value="Riot">Impregnable</option>
    <option data-name="Assault" value="Assault">Impenetrable</option>
    <option data-name="Dune" value="Dune">Insurmountable</option>
    <option data-name="Delta" value="Delta">Invulnerable</option>
    <option data-name="Marauder" value="Marauder">Imperviable</option>
    <option data-name="Sentinel" value="Sentinel">Immutable</option>
    <option data-name="Vanguard" value="Vanguard">Irrepressible</option>
    <option data-name="EOD" value="EOD">Impassable</option>
    <option data-name="Welding Helmet" value="Welding Helmet"></option>
    <option data-name="Hazmat Suit" value="Hazmat Suit">Radiation</option>
    </datalist>
    <input class="re_stats" type="number" id="re_ah_armor_defense" min="0" placeholder="Def" title="Armor defense">
    <select class="re_color" id="re_ah_armor_color" required><option value="" selected>Armor color</option><option value="none">None</option><option value="yellow">Yellow</option><option value="orange">Orange</option><option value="red">Red</option><option value="orangered">Orange & Red</option></select>
    <input class="re_stats" type="number" id="re_ah_armor_bonus_perc" min="0" placeholder="Perc" title="Bonus percent">
    </div>

    <!-- Items -->
    <div id="re_ah_items" class="re_filter" style="display: none;">
    <input type="text" id="re_ah_items_textbox" class="re_name" placeholder="Item name">
    <select class="re_category" id="re_ah_item_category" required></select>
    </div>
    <div class="re_row re_message">
    <p>Showing <b><span id="shown">10</span></b> out of <b><span id="total">10</span></b>
    </div>
    `);

    //fill datalist for Weapon Bonuses
    var weaponBonusesList =`<option value="" selected>Weapon bonus</option>`;
    $.each(RE_WEAPON_BONUSES, function(n,e) {
        weaponBonusesList += '<option data-name="'+e+'">'+e+'</option>';
    });
    $('#re_ah_weapons_bonuses_1').html(weaponBonusesList);
    $('#re_ah_weapons_bonuses_2').html(weaponBonusesList);

    //fill select for Weapon Categories
    var weaponCategoriesList = `<option value="" selected>Weapon category</option>`
    $.each(RE_WEAPON_CATEGORIES, function(n,e) {
        weaponCategoriesList += '<option data-name="'+e+'">'+e+'</option>';
    });
    $('#re_ah_weapons_category').html(weaponCategoriesList);

    //fill select for Weapon Types
    var weaponTypesList = `<option value="" selected>Weapon type</option>`
    $.each(RE_WEAPON_TYPES, function(n,e) {
        weaponTypesList += '<option data-name="'+e+'">'+e+'</option>';
    });
    $('#re_ah_weapons_type').html(weaponTypesList);

    //fill select for Item Categories
    var itemCategoriesList = `<option value="" selected>Item category</option>`
    $.each(RE_ITEM_CATEGORIES, function(n,e) {
        itemCategoriesList += '<option data-name="'+e+'">'+e+'</option>';
    });
    $('#re_ah_item_category').html(itemCategoriesList);

    //pull item data from retorn, fill lists for weapons, items
    sendMessage({name: "get_local", value: "re_items"})
    .then((r) => {
        if (r.status) {
            re_items = r?.data?.items;
            var weaponsList = '<option></option>';
            $.each(re_items, function(n,e) {
                if (e?.weapon_type) {
                    weaponsList += '<option data-name="'+e?.name+'">'+e?.name+'</option>';
                }
            });
            $('#re_ah_weapons_list').html(weaponsList);
        }
    })
    .catch((e) => showError(A_FILTER, e));

    if (settings?.auction_filter) {
        let af = settings.auction_filter;
        if (af?.weapons) {
            let w = af.weapons;
            //textboxese
            w?.name && $('#re_ah_weapons_list_textbox').val(w?.name);
            w?.category && $('#re_ah_weapons_category').find(`option[data-name="${w?.category}"]`).prop('selected', true);
            w?.weapon_type && $('#re_ah_weapons_type').find(`option[data-name="${w?.weapon_type}"]`).prop('selected', true);
            w?.damage && $('#re_ah_weapons_damage').val(w?.damage);
            w?.accuracy && $('#re_ah_weapons_accuracy').val(w?.accuracy);
            (w?.bonus_1 && w?.bonus_1?.percentage) && $('#re_ah_weapons_bonuses_1_perc').val(w?.bonus_1?.percentage);
            (w?.bonus_2 && w?.bonus_2?.percentage) && $('#re_ah_weapons_bonuses_2_perc').val(w?.bonus_2?.percentage);

            //selects
            w?.color && $('#re_ah_weapons_color').find(`option[value="${w?.color}"]`).prop('selected', true);
            (w?.bonus_1 && w?.bonus_1?.name) && $('#re_ah_weapons_bonuses_1').find(`option[data-name="${w?.bonus_1?.name}"]`).prop('selected', true);
            (w?.bonus_2 && w?.bonus_2?.name) && $('#re_ah_weapons_bonuses_2').find(`option[data-name="${w?.bonus_2?.name}"]`).prop('selected', true);
        }
        if (af?.armor) {
            let ar = af.armor;
            ar?.color && $('#re_ah_armor_color').find(`option[value="${ar?.color}"]`).prop('selected', true);
            ar?.defense && $('#re_ah_armor_defense').val(ar?.defense);
            ar?.name && $('#re_ah_armor_types_textbox').val(ar?.name);
            ar?.percentage && $('#re_ah_armor_bonus_perc').val(ar?.percentage);
        }
        if (af?.items) {
            let it = af.items;
            it?.category && $('#re_ah_item_category').find(`option[data-name="${it?.category}"]`).prop('selected', true);
            it?.name && $('#re_ah_items_textbox').val(it?.name);
        }
        
    }
}

function enableDuplicatePagination() {
    const target = document.getElementById('auction-house-tabs');
    if (target) {
        paginationObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
        $('.auction-market-main-cont').addClass('re_torn_ah'); //used for changing class for pagination arrows        
    }
}


function duplicatePager() {
    //duplicate pagination
    $('.pagination-wrap').each(function(i, obj) {
        $(this).clone().css("border-top","0").css("border-bottom", "2px solid var(--default-panel-divider-outer-side-color)").prependTo($(this).parent());
    });
}

//check which auction tab is shown, then show the correct filter div block
function initShowFilter() {
    let itemtype = $('#auction-house-tabs .tabContainer > div.tab-menu-cont:visible').attr('data-itemtype');
    switch (itemtype) {
        case "weapons":
            $('#re_ah_weapons').show();   
        break;
        case "armor":
            $('#re_ah_armor').show();   
        break;
        case "items":
            $('#re_ah_items').show();  
        break;
        default://default weapons
            $('#re_ah_weapons').show();
        break;
    }
}

//add event listeners to search elements
function initSearchElements() {
    //Weapon Filters
    $('#re_ah_weapons_bonuses_1, #re_ah_weapons_bonuses_2, #re_ah_weapons_color, #re_ah_weapons_category, #re_ah_weapons_type').on('change', function() {
        filter('#types-tab-1');
    });
    $('#re_ah_weapons_list_textbox, #re_ah_weapons_damage, #re_ah_weapons_accuracy, #re_ah_weapons_bonuses_1_perc, #re_ah_weapons_bonuses_2_perc').on('input', function() {
        filter('#types-tab-1');
    });

    //Armor Filters
    $('#re_ah_armor_color').on('change', function() {
        filter('#types-tab-2');
    });
    $('#re_ah_armor_types_textbox, #re_ah_armor_defense, #re_ah_armor_bonus_perc').on('input', function() {
        filter('#types-tab-2');
    });

    //Item Filters
    $('#re_ah_items_textbox').on('input', function() {
        filter('#types-tab-3');
    });
    $('#re_ah_item_category').on('change', function() {
        filter('#types-tab-3');
    })

    //select input text on focus
    $('.re_filter input[type="text"]').on('focus', function() {
        $(this).select();
    });
}

//filter by name (weapon/armor/items)
function nameFilter(element, searchTerm) {
    var s1 = $(element).text().toLowerCase();//item name
    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        if(s1.indexOf(searchTerm) !== -1) {
            $(element).closest("li").removeClass('re_name_hide');
        } else {
            $(element).closest("li").addClass('re_name_hide');
        }
    } else {
        $(element).closest("li").removeClass('re_name_hide');
    }

}

//filter by bonus and bonus perc (weapon only)
function bonusFilter(element, b1, b2, perc1, perc2) {
    if ($('#re_ah_weapons_bonuses_1_perc').prop('disabled')) {
        perc1 = "";
    }
    if ($('#re_ah_weapons_bonuses_2_perc').prop('disabled')) {
        perc2 = "";
    }

    //if bonus filters are not set, stop hiding based on bonus
    if (!b1 && !b2) {
        $(element).closest("li").removeClass("re_bonus_hide");
    }
    //if bonus perc filters are not set, stop hiding based on bonus perc
    if (!perc1 && !perc2) {
        $(element).closest("li").removeClass("re_bonus_perc_hide");
    }
    //just exit function if nothing is set, because no point in checking everything
    if (!b1 && !b2 && !perc1 && !perc2) {
        return;
    }

    const regex = /\d+/; // matches one or more digits

    //bonus elements
    const bonuses = $(element).find('.bonus-attachment-icons');
    //more than one bonus exists on the weapon

    if (bonuses.length == 2) {
        
        const s1 = $(bonuses[0]).attr('title').toLowerCase();//bonus desc 1
        const s2 = $(bonuses[1]).attr('title').toLowerCase();//bonus desc 2

        
        const num1 = s1.match(regex) ? parseInt(s1.match(regex)[0]) : 0; // extract the first number from title1 (or set to 0)
        const num2 = s2.match(regex) ? parseInt(s2.match(regex)[0]) : 0; // extract the first number from title2 (or set to 0)

        //if both bonus select inputs are set
        if (b1 && b2) {//then check if bonuses exist within each bonus elements, if not hide            
            if ((s1.indexOf(b1) !== -1 || s1.indexOf(b2) !== -1) && (s2.indexOf(b1) !== -1 || s2.indexOf(b2) !== -1)) {
                $(element).closest("li").removeClass('re_bonus_hide');
             
                //now we check if bonus percs are set
                if (perc1 && perc2) { // both are set

                    //this is checking if both percentages exist in the bonuses, without knowing the order of the elements
                    var matchFound = bonuses.filter(function(index, bonus1) {
                        return bonuses.not(bonus1).toArray().some(function(bonus2) {
                          if (s1 && s2) {
                            var hasPerc1AndB1 = (num1 == 0 || num1 >= perc1) && s1.includes(b1);
                            var hasPerc2AndB2 = (num2 == 0 || num2 >= perc2) && s2.includes(b2);
                            var hasPerc2AndB2InDifferentElements = (num1 == 0 || num1 >= perc2) && s1.includes(b2) && (num2 == 0 || num2 >= perc1) && s2.includes(b1);
                            return (hasPerc1AndB1 && hasPerc2AndB2) || hasPerc2AndB2InDifferentElements;
                          }
                          return false;
                        });
                      });
                                        
                    if (matchFound.length > 0) {
                        $(element).closest("li").removeClass("re_bonus_perc_hide");
                    } else {
                        $(element).closest("li").addClass("re_bonus_perc_hide");
                    }

                } else {//both are not set, so lets check individually
                    if (perc1) {//only perc1
                        var hasPerc1AndB1InS1 = (num1 == 0 || num1 >= perc1) && s1.includes(b1);
                        var hasPerc1AndB1InS2 = (num2 == 0 || num2 >= perc1) && s2.includes(b1);
                        if ((hasPerc1AndB1InS1 || hasPerc1AndB1InS2)) {
                            $(element).closest("li").removeClass("re_bonus_perc_hide");
                        } else {
                            $(element).closest("li").addClass("re_bonus_perc_hide");
                        }
                    }
                    if (perc2) {
                        var hasPerc2AndB1InS1 = (num1 == 0 || num1 >= perc2) && s1.includes(b1);
                        var hasPerc2AndB1InS2 = (num2 == 0 || num2 >= perc2) && s2.includes(b1);
                        if ((hasPerc2AndB1InS1 || hasPerc2AndB1InS2)) {
                            $(element).closest("li").removeClass("re_bonus_perc_hide");
                        } else {
                            $(element).closest("li").addClass("re_bonus_perc_hide");
                        }
                    }
                }


            } else {
                $(element).closest("li").addClass('re_bonus_hide');
            }
        } else {
            
            if (b1) {//if the first bonus input is set, check both bonuses to see if it exists                
                if ((s1.indexOf(b1) !== -1 || s2.indexOf(b1) !== -1)) {
                    $(element).closest("li").removeClass('re_bonus_hide');
                } else {
                    $(element).closest("li").addClass('re_bonus_hide');
                }

                if (perc1) {
                    bonuses.each(function(i,element) {
                        const title = $(element).attr('title').toLowerCase();
                        if (title && title.includes(b1)) {
                            const p = title.match(regex) ? parseInt(title.match(regex)[0]) : 0;

                            if (p == 0 || p >= perc1) {
                                $(element).closest("li").removeClass('re_bonus_perc_hide');
                            } else {
                                $(element).closest("li").addClass('re_bonus_perc_hide');
                            }
                        }
                    })
                } else {//percentage input 1 is not set, so don't hide
                    $(element).closest("li").removeClass('re_bonus_perc_hide');
                }


            }

            if (b2) {//now check the other bonus input for either bonus
                if ((s1.indexOf(b2) !== -1 || s2.indexOf(b2) !== -1)) {
                    $(element).closest("li").removeClass('re_bonus_hide');
                } else {
                    $(element).closest("li").addClass('re_bonus_hide');
                }

                if (perc2) {
                    bonuses.each(function(i,element) {
                        const title = $(element).attr('title').toLowerCase();
                        if (title && title.includes(b2)) {
                            const p = title.match(regex) ? parseInt(title.match(regex)[0]) : 0;
                            if (p == 0 || p >= perc2) {
                                $(element).closest("li").removeClass('re_bonus_perc_hide');
                            } else {
                                $(element).closest("li").addClass('re_bonus_perc_hide');
                            }
                        }
                    })
                } else {//percentage input 1 is not set, so don't hide
                    $(element).closest("li").removeClass('re_bonus_perc_hide');
                }
            }
        }
    }

    if (bonuses.length == 1) {
        if (b1 && b2) { //if both bonus inputs are set, then single bonus weapons should be hidden
            $(element).closest("li").addClass('re_bonus_hide');
            return;
        }

        const s1 = $(bonuses[0]).attr('title').toLowerCase();//bonus desc 1

        if (b1) {//check the bonus based on first input
            if (s1.indexOf(b1) !== -1) {
                $(element).closest("li").removeClass('re_bonus_hide');
            } else {
                $(element).closest("li").addClass('re_bonus_hide');
            }

            if (perc1) {
                if (s1 && s1.includes(b1)) {
                    const p = s1.match(regex) ? parseInt(s1.match(regex)[0]) : 0;
                    if (p == 0 || p >= perc1) {
                        $(element).closest("li").removeClass('re_bonus_perc_hide');
                    } else {
                        $(element).closest("li").addClass('re_bonus_perc_hide');
                    }
                }
            } else {//percentage input 1 is not set, so don't hide
                $(element).closest("li").removeClass('re_bonus_perc_hide');
            }
        }
        if (b2) {//check the bonus based on 2nd input
            if (s1.indexOf(b2) !== -1) {
                $(element).closest("li").removeClass('re_bonus_hide');
            } else {
                $(element).closest("li").addClass('re_bonus_hide');
            }

            if (perc2) {
                if (s1 && s1.includes(b2)) {
                    const p = s1.match(regex) ? parseInt(s1.match(regex)[0]) : 0;
                    if (p == 0 || p >= perc2) {
                        $(element).closest("li").removeClass('re_bonus_perc_hide');
                    } else {
                        $(element).closest("li").addClass('re_bonus_perc_hide');
                    }
                }
            } else {//percentage input 1 is not set, so don't hide
                $(element).closest("li").removeClass('re_bonus_perc_hide');
            }
        }
    }

    if (bonuses.length == 0) {
        if (b1 || b2) {//if the weapons has no bonuses, but either of the bonus inputs are set, then hide
            $(element).closest("li").addClass('re_bonus_hide');
        } else {
            $(element).closest("li").removeClass('re_bonus_hide');
        }
    }
    

}

//filter by color (weapon/armor)
function colorFilter(element, color) {
    if (!element) return;
    
    if (color) {
        const elementClass = $(element).attr('class');
        const parent = $(element).closest("li");

        if (color == "none") {
            if (elementClass == "item-plate ") {
                parent.removeClass("re_color_hide");
                return;
            }
        }
        if (color == "orangered") {
            if ($(element).hasClass("glow-orange") || $(element).hasClass("glow-red")) {
                parent.removeClass("re_color_hide");
                return;
            }
        }
        if ($(element).hasClass(`glow-${color}`)) {
            parent.removeClass("re_color_hide");
            return;
        }
        $(element).closest("li").addClass("re_color_hide");
    } else {
        $(element).closest('li').removeClass('re_color_hide');
    }
}

//filter by stats (weapon/armor)
function statFilter(element, value) {
        const type = $(element).siblings('i').attr('class').replace('bonus-attachment-item-', '').replace('-bonus', '')
        var s1 = parseFloat($(element).text());//item stat

        if (value) {
            if (s1 < value) {
                $(element).closest("li").addClass(`re_${type}_hide`);
            } else {
                $(element).closest("li").removeClass(`re_${type}_hide`);
            }
        } else {
            $(element).closest("li").removeClass(`re_${type}_hide`);
        }
}

//filter by armor bonus perc (armor only)
function armorBonusPercFilter(element, perc) {
    if (!perc) {//perc is empty, which means we don't care about filtering by perc
        $(element).closest("li").removeClass(`re_bonus_perc_hide`);
        return;
    }
    const regex = /\d+/; // matches one or more digits

    const bonus = $(element).find('.bonus-attachment-icons');
    
    if (bonus.length) {
        const title = $(bonus).attr('title').toLowerCase();//bonus desc
        const num = title.match(regex) ? parseInt(title.match(regex)[0]) : 0; // extract the first number from title1 (or set to 0)
    
        if (num == 0 || num >= perc) {
            $(element).closest("li").removeClass('re_bonus_perc_hide');
        } else {
            $(element).closest("li").addClass('re_bonus_perc_hide');
        }
    } else { //no bonus (because non ranked war armor) so hide it since we care about bonus percentage
        $(element).closest("li").addClass('re_bonus_perc_hide');
    }

}

//filter by category (items and weapons)
function categoryFilter(element, category) {
    if (!category) {
        $(element).closest("li").removeClass(`re_category_hide`);
        return;
    }

    const regex = /\d+/; // matches one or more digits
    const itemID = $(element).find('.item.torn-item').attr('src').match(regex);

    if (re_items[itemID] && re_items[itemID]["type"] == category) {
        $(element).closest("li").removeClass(`re_category_hide`);
    } else {
        $(element).closest("li").addClass(`re_category_hide`);
    }
}


//filter by category (items and weapons)
function weaponTypeFilter(element, type) {
    if (!type) {
        $(element).closest("li").removeClass(`re_weapons_type_hide`);
        return;
    }

    const regex = /\d+/; // matches one or more digits
    const itemID = $(element).find('.item.torn-item').attr('src').match(regex);

    if (re_items[itemID] && re_items[itemID]["weapon_type"] == type) {
        $(element).closest("li").removeClass(`re_weapons_type_hide`);
    } else {
        $(element).closest("li").addClass(`re_weapons_type_hide`);
    }
}

//main filter function, checks for each filter
function filter(tab) {
    const elements = $(`${tab} ul.items-list > li:not(.bg-blue,.bg-green,.clear) .item-cont-wrap`); //ignore selling, highest bid, and empty list items

    
    /* Weapons */
    //name
    const nameWeapon = $('#re_ah_weapons_list_textbox').val() ? $('#re_ah_weapons_list_textbox').val() : "";
    //damage
    const damage = parseFloat($('#re_ah_weapons_damage').val()) ? parseFloat($('#re_ah_weapons_damage').val()) : "";
    //accuracy
    const accuracy = parseFloat($('#re_ah_weapons_accuracy').val()) ? parseFloat($('#re_ah_weapons_accuracy').val()) : "";
    //color
    const colorWeapon = $('#re_ah_weapons_color').find('option:selected').val() ? $('#re_ah_weapons_color').find('option:selected').val() : "";
    //bonus perc inputs
    const perc1_input = $('#re_ah_weapons_bonuses_1_perc');
    const perc2_input = $('#re_ah_weapons_bonuses_2_perc');
    //bonus percentages
    const perc1 = (!perc1_input.val()) ? "" : parseInt(perc1_input.val());
    const perc2 = (!perc2_input.val()) ? "" : parseInt(perc2_input.val());
    //bonuses
    const bonus_1_name = $('#re_ah_weapons_bonuses_1 option:selected').attr('data-name') ? $('#re_ah_weapons_bonuses_1 option:selected').attr('data-name') : "";
    const bonus_2_name = $('#re_ah_weapons_bonuses_2 option:selected').attr('data-name') ? $('#re_ah_weapons_bonuses_2 option:selected').attr('data-name') : "";
    const b1 = bonus_1_name ? `<b>${bonus_1_name.toLowerCase()}</b>` : '';
    const b2 = bonus_2_name ? `<b>${bonus_2_name.toLowerCase()}</b>` : '';
    //category
    const categoryWeapon = $('#re_ah_weapons_category').find('option:selected').val() ? $('#re_ah_weapons_category').find('option:selected').val() : "";
    //weapon type
    const typeWeapon = $('#re_ah_weapons_type').find('option:selected').val() ? $('#re_ah_weapons_type').find('option:selected').val() : "";

    /* Armor */
    const colorArmor = $('#re_ah_armor_color').find('option:selected').val() ? $('#re_ah_armor_color').find('option:selected').val() : "";
    const nameArmor = $('#re_ah_armor_types_textbox').val() ? $('#re_ah_armor_types_textbox').val() : "";
    const defense = $('#re_ah_armor_defense').val() ? parseFloat($('#re_ah_armor_defense').val()) : "";
    const percArmor = $('#re_ah_armor_bonus_perc').val() ? parseInt($('#re_ah_armor_bonus_perc').val()) : "";


    /* Items */
    const nameItem = $('#re_ah_items_textbox').val() ? $('#re_ah_items_textbox').val() : "";
    const category = $('#re_ah_item_category').find('option:selected').val() ? $('#re_ah_item_category').find('option:selected').val() : "";


    switch (tab) {
        case "#types-tab-1"://weapons

        if (!bonus_1_name) {
            perc1_input.prop('disabled', true);
        } else {
            perc1_input.prop('disabled', false);
        }
        if (!bonus_2_name) {
            perc2_input.prop('disabled', true);
        } else {
            perc2_input.prop('disabled', false);
        }

        elements.each(function(index, element) {
            colorFilter($(element).find('.img-wrap .item-plate'), colorWeapon);
            nameFilter($(element).find('.title > .item-name'), nameWeapon);
            categoryFilter($(element), categoryWeapon);
            weaponTypeFilter($(element), typeWeapon);
            bonusFilter($(element).find('.item-bonuses'), b1, b2, perc1, perc2);
            //damage
            statFilter($(element).find('.item-bonuses .infobonuses i[class="bonus-attachment-item-damage-bonus"]').siblings('span.label-value'), damage);
            //accuracy
            statFilter($(element).find('.item-bonuses .infobonuses i[class="bonus-attachment-item-accuracy-bonus"]').siblings('span.label-value'), accuracy);
        });
        break;

        case "#types-tab-2"://armor
        elements.each(function(index, element) {
            colorFilter($(element).find('.img-wrap .item-plate'), colorArmor);
            nameFilter($(element).find('.title > .item-name'), nameArmor);
            statFilter($(element).find('.item-bonuses .infobonuses i[class="bonus-attachment-item-defence-bonus"]').siblings('span.label-value'), defense);
            armorBonusPercFilter($(element).find('.item-bonuses'), percArmor);
        });
        break;

        case "#types-tab-3"://items
        elements.each(function(index, element) {
            nameFilter($(element).find('.title > .item-name'), nameItem);
            categoryFilter($(element), category);
        });
        break;
    
        default:
            return;
        break;
    }


    const new_settings = {
        "auction_filter": {
            "armor": {
                "color": colorArmor,
                "defense": defense,
                "name": nameArmor,
                "percentage": percArmor
            },
            "items": {
                "category": category,
                "name": nameItem
            },
            "weapons": {
                "accuracy": accuracy,
                "bonus_1": {
                    "name": bonus_1_name,
                    "percentage": perc1
                },
                "bonus_2": {
                    "name": bonus_2_name,
                    "percentage": perc2
                },
                "color": colorWeapon,
                "damage": damage,
                "category": categoryWeapon,
                "weapon_type": typeWeapon,
                "name": nameWeapon
            }
        }
    }

    updateTotal(tab);
    updateAuctionSettings(new_settings);
}


//updates the total seen/hidden items on auction filter
function updateTotal(parent) {
    $('#total').text($(`${parent} ul.items-list > li:not(.clear)`).length)
    $('#shown').text($(`${parent} ul.items-list > li:not(.clear):visible`).length)
}

//update the settings
function updateAuctionSettings(new_settings) {
    var old_settings = {};
    old_settings["auction_filter"] = settings?.auction_filter;

    const oldString = JSON.stringify(old_settings);
    const newString = JSON.stringify(new_settings);

    if (oldString != newString) {
        sendMessage({"name": "merge_sync", "key": "settings", "object": new_settings})
        .then((r) => {
            settings['auction_filter'] = new_settings["auction_filter"];
        })
        .catch((e) => showError(A_FILTER, e));
    }
}

