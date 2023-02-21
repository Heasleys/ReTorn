const weaponbonuses = ["Achilles","Assassinate","Backstab","Berserk","Bleed","Blindfire","Blindside","Bloodlust","Burning","Comeback","Conserve","Cripple","Crusher","Cupid","Deadeye","Deadly","Demoralized","Disarm","Double Tap","Double-edged","Emasculate","Empower","Eviscerate","Execute","Expose","Finale","Focus","Freeze","Frenzy","Fury","Grace","Hazardous","Home Run","Irradiate","Laceration","Motivation","Paralyzed","Parry","Penetrate","Plunder","Poisoned","Powerful","Proficience","Puncture","Quicken","Rage","Revitalize","Roshambo","Severe Burning","Sleep","Slow","Smurf","Specialist","Spray","Storage","Stricken","Stun","Suppress","Sure Shot","Throttle","Toxin","Warlord","Weaken","Wind-up","Wither"]
const armortypes = ["Riot","Assault","Dune","Delta","Marauder","EOD"];

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
if ($('div.captcha').length == 0 && $('div.content-wrapper.logged-out').length == 0) { //features?.pages?.auction?.auction_filter?.enabled

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

//mutationObserver on jail wrap
const target = document.getElementById('auction-house-tabs');
auctionTabObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});

const pageTarget = document.querySelector('div.pagination-wrap');
paginationObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});

$('.auction-market-main-cont').addClass('re_torn_ah');//used for changing class for pagination arrows

//insert auction head
insertHeader($("div#auction-house-tabs"), 'before', 'auction_filter');
$('.re_container').after(`<hr class="delimiter-999 m-top10">`);

//insert filter html
$('.re_content').html(`
<!-- Weapons -->
<div id="re_ah_weapons" class="re_filter" style="display: none;">
<input type="text" class="re_name" placeholder="Weapon name" list="re_ah_weapons_list" id="re_ah_weapons_list_textbox">
<datalist id="re_ah_weapons_list"></datalist>
<input class="re_stats" type="number" placeholder="Dmg" id="re_ah_weapons_damage" min="0">
<input class="re_stats" type="number" placeholder="Acc" id="re_ah_weapons_accuracy" min="0">

<select class="re_color" id="re_ah_weapons_color" required><option value="" selected>Weapon color</option><option value="none">None</option><option value="yellow">Yellow</option><option value="orange">Orange</option><option value="red">Red</option><option value="orangered">Orange & Red</option></select>
<select id="re_ah_weapons_bonuses_1" class="re_bonus" required></select>
<input class="re_stats" type="number" id="re_ah_weapons_bonuses_1_perc" min="0" placeholder="Perc" title="Bonus percent">
<select id="re_ah_weapons_bonuses_2" class="re_bonus" required></select>
<input class="re_stats" type="number" id="re_ah_weapons_bonuses_2_perc" min="0" placeholder="Perc" title="Bonus percent">
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
</div>
<div class="re_row re_message">
<p>Showing <b><span id="shown">10</span></b> out of <b><span id="total">10</span></b> people.
</div>
`);

//fill datalist for Weapons
var weaponlist =`<option value="" selected>Weapon bonus</option>`;
$.each(weaponbonuses, function(n,e) {
    weaponlist += '<option data-name="'+e+'">'+e+'</option>';
});
$('#re_ah_weapons_bonuses_1').html(weaponlist);
$('#re_ah_weapons_bonuses_2').html(weaponlist);

sendMessage({name: "get_local", value: "re_items"})
    .then((r) => {
        if (r.status) {
            const items = r?.data?.items;
            var itemsList = '<option></option>';
            $.each(items, function(n,e) {
                if (e?.weapon_type) {
                    itemsList += '<option data-name="'+e?.name+'">'+e?.name+'</option>';
                }
            });
            $('#re_ah_weapons_list').html(itemsList);
        }
    })
    .catch((e) => console.error(e))

initSearchElements();

initShowFilter();
}

function duplicatePager() {
    //duplicate pagination
    $('.pagination-wrap').each(function(i, obj) {
        $(this).clone().css("border-top","0").css("border-bottom", "2px solid var(--default-panel-divider-outer-side-color)").prependTo($(this).parent());
    });
}

function initShowFilter() {
    //check which tab is shown, then show the correct filter div
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

function initSearchElements() {
    //Weapon Filters
    $('#re_ah_weapons_bonuses_1, #re_ah_weapons_bonuses_2, #re_ah_weapons_color').on('change', function() {
        filter('#types-tab-1');
    });
    $('#re_ah_weapons_list_textbox, #re_ah_weapons_damage, #re_ah_weapons_accuracy, #re_ah_weapons_bonuses_1_perc, #re_ah_weapons_bonuses_2_perc').on('input', function() {
        filter('#types-tab-1');
    });

    //Armor Filters
    $('#re_ah_armor_color').on('change', function() {
        filter('#types-tab-2');
    });
    $('#re_ah_armor_types_textbox, #re_ah_armor_defense').on('input', function() {
        filter('#types-tab-2');
    });

    //Item Filters
    $('#re_ah_items_textbox').on('input', function() {
        filter('#types-tab-3');
    });

    //select on focus
    $('.re_filter input[type="text"]').on('focus', function() {
        $(this).select();
    });
}

function nameFilter(element, searchTerm) {
    var s1 = $(element).text().toLowerCase();//item name

    if (searchTerm) {
        if(s1.indexOf(searchTerm) !== -1) {
            $(element).closest("li").removeClass('re_name_hide');
        } else {
            $(element).closest("li").addClass('re_name_hide');
        }
    } else {
        $(element).closest("li").removeClass('re_name_hide');
    }

}

function bonusFilter(element, b1, b2, perc1, perc2) {

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
    bonuses = $(element).find('.bonus-attachment-icons');
        
    //more than one bonus
    if (bonuses.length == 2) {
        const s1 = $(bonuses[0]).attr('title').toLowerCase();//bonus desc 1
        const s2 = $(bonuses[1]).attr('title').toLowerCase();//bonus desc 2

        const num1 = parseInt(s1.match(regex)[0]); // extract the first number from title1
        const num2 = parseInt(s2.match(regex)[0]); // extract the first number from title2


        //if b1 & b2 are not empty
        if (b1 && b2) {//then check if bonuses exist within each bonus elements, if not hide            
            if ((s1.indexOf(b1) !== -1 || s1.indexOf(b2) !== -1) && (s2.indexOf(b1) !== -1 || s2.indexOf(b2) !== -1)) {
                $(element).closest("li").removeClass('re_bonus_hide');
             
                //now we check if bonus percs are set
                if (perc1 && perc2) { // both are set

                    //this is checking if both percentages exist in the bonuses, without knowing the order of the elements
                    var matchFound = bonuses.filter(function(index, bonus1) {
                        return bonuses.not(bonus1).toArray().some(function(bonus2) {
                          if (s1 && s2) {
                            var hasPerc1AndB1 = num1 >= perc1 && s1.includes(b1);
                            var hasPerc2AndB2 = num2 >= perc2 && s2.includes(b2);
                            var hasPerc2AndB2InDifferentElements = num1 >= perc2 && s1.includes(b2) && num2 >= perc1 && s2.includes(b1);
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
                        var hasPerc1AndB1InS1 = num1 >= perc1 && s1.includes(b1);
                        var hasPerc1AndB1InS2 = num2 >= perc1 && s2.includes(b1);
                        console.log(perc1, s1, b1, num1)
                        console.log(perc1, s2, b1, num2)
                        console.log(hasPerc1AndB1InS1,hasPerc1AndB1InS2)
                        if ((hasPerc1AndB1InS1 || hasPerc1AndB1InS2)) {
                            $(element).closest("li").removeClass("re_bonus_perc_hide");
                        } else {
                            $(element).closest("li").addClass("re_bonus_perc_hide");
                        }
                    }
                    if (perc2) {

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
            }
            if (b2) {//now check the other bonus input for either bonus
                if ((s1.indexOf(b2) !== -1 || s2.indexOf(b2) !== -1)) {
                    $(element).closest("li").removeClass('re_bonus_hide');
                } else {
                    $(element).closest("li").addClass('re_bonus_hide');
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
        }
        if (b2) {//check the bonus based on 2nd input
            if (s1.indexOf(b2) !== -1) {
                $(element).closest("li").removeClass('re_bonus_hide');
            } else {
                $(element).closest("li").addClass('re_bonus_hide');
            }
        }
    }

    if (bonuses.length == 0) {
        if (b1 || b2) {//if the weapons has no bonuses, but either of the bonus inputs are set, then hide
            $(element).closest("li").addClass('re_bonus_hide');
        }
    }
    

}

function colorFilter(element, color) {
    if (color) {
        if (color == "none") {
            if ($(element).attr('class') != "item torn-item large ") {
                $(element).closest("li").addClass("re_color_hide");
            }
            return;
        }
        if (color == "orangered") {
            if (($(element).attr('class') == "item torn-item large ") || ($(element).hasClass("yellow"))) {
                $(element).closest("li").addClass("re_color_hide");
            }
            return;
        }
        const colorsList = ["yellow", "orange", "red"];
        colorsList.forEach(function(c) {
            if ($(element).hasClass(c)) {
                if (color != c) {
                    $(element).closest("li").addClass("re_color_hide");
                } else {
                    $(element).closest("li").removeClass("re_color_hide");
                }
            }
        })
    } else {
        $(element).closest('li').removeClass('re_color_hide');
    }
}

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


function filter(tab) {
    const elements = $(`${tab} ul.items-list > li:not(.bg-blue,.clear) .item-cont-wrap`);

    switch (tab) {
        case "#types-tab-1"://weapons
        //color
        const colorWeapon = $('#re_ah_weapons_color').find('option:selected').val();

        //name
        const nameWeapon = $('#re_ah_weapons_list_textbox').val().toLowerCase();

        //bonuses
        const bonus_1 = $('#re_ah_weapons_bonuses_1 option:selected').attr('data-name');
        const bonus_2 = $('#re_ah_weapons_bonuses_2 option:selected').attr('data-name');
        const b1 = bonus_1 ? `<b>${bonus_1.toLowerCase()}</b>` : '';
        const b2 = bonus_2 ? `<b>${bonus_2.toLowerCase()}</b>` : '';
        //bonus percentages
        const perc1 = parseInt($('#re_ah_weapons_bonuses_1_perc').val());
        const perc2 = parseInt($('#re_ah_weapons_bonuses_2_perc').val());


        //weapon stats
        const damage = parseFloat($('#re_ah_weapons_damage').val());
        const accuracy = parseFloat($('#re_ah_weapons_accuracy').val());


        elements.each(function(index, element) {
            colorFilter($(element).find('.img-wrap .item.torn-item'), colorWeapon);
            nameFilter($(element).find('.title > .item-name'), nameWeapon);
            bonusFilter($(element).find('.item-bonuses'), b1, b2, perc1, perc2);
            //damage
            statFilter($(element).find('.item-bonuses .infobonuses i[class="bonus-attachment-item-damage-bonus"]').siblings('span.label-value'), damage);
            //accuracy
            statFilter($(element).find('.item-bonuses .infobonuses i[class="bonus-attachment-item-accuracy-bonus"]').siblings('span.label-value'), accuracy);
        });
        break;

        case "#types-tab-2"://armor
        const colorArmor = $('#re_ah_armor_color').find('option:selected').val();
        const nameArmor = $('#re_ah_armor_types_textbox').val().toLowerCase();
        const defense = parseFloat($('#re_ah_armor_defense').val());

        elements.each(function(index, element) {
            colorFilter($(element).find('.img-wrap .item.torn-item'), colorArmor);
            nameFilter($(element).find('.title > .item-name'), nameArmor);
            statFilter($(element).find('.item-bonuses .infobonuses i[class="bonus-attachment-item-defence-bonus"]').siblings('span.label-value'), defense);
        });
        break;

        case "#types-tab-3"://items
        const nameItem = $('#re_ah_items_textbox').val().toLowerCase();
        elements.each(function(index, element) {
            nameFilter($(element).find('.title > .item-name'), nameItem);
        });
        break;
    
        default:
            return;
        break;
    }

    updateTotal(tab);
}



function updateTotal(parent) {
    $('#total').text($(`${parent} ul.items-list > li:not(.clear)`).length)
    $('#shown').text($(`${parent} ul.items-list > li:not(.clear):visible`).length)
}