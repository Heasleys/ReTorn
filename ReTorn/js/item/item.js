var items;
var tornRFC;

if (re_items) items = re_items;

const qitem_categories = ['Medical', 'Drug', 'Energy Drink', 'Alcohol', 'Candy', 'Booster', 'Supply Pack', 'Special']
const quick_equip_categores = ["Primary", "Secondary", "Melee", "Defensive", "Temporary"];
const exceptionItemList = ["403", "283"]; //tissues, donator packs

const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      if (mutation.target && mutation.target.nodeName && mutation.target.nodeName === "UL") {
        if (mutation.target.parentElement && mutation.target.parentElement.id && mutation.target.parentElement.id == "category-wrap") {
          //if (mutation.previousSibling != null) return;

          if (mutation.addedNodes[0].firstChild && mutation.addedNodes[0].firstChild.className && mutation.addedNodes[0].firstChild.className.includes("ajax-placeholder")) return;
            
          if (mutation.addedNodes[0].firstChild && mutation.addedNodes[0].firstChild.className && mutation.addedNodes[0].firstChild.className.includes("ajax-item-loader")) return;

          if (mutation.addedNodes[0].firstChild && mutation.addedNodes[0].firstChild.className && mutation.addedNodes[0].firstChild.className.includes("ajax-preloader")) return;

          if (mutation.addedNodes[0] && mutation.addedNodes[0].className && mutation.addedNodes[0].className.includes("ajax-item-loader")) return;


          for (const element of mutation.addedNodes) {
            if (!element) return;
            if (element.className && element.className.includes("item-group")) return; //Ignore grouped weapons from the ALL list


            let itemID = element.dataset.item;
            let armoryID = element.dataset.armoryid;


            if (features?.pages?.item?.quick_items?.enabled) {
              let itemCategory = element.dataset.category;

              if (qitem_categories.includes(itemCategory) || quick_equip_categores.includes(itemCategory)) {
                //update item qtys
                if (mutation.target.dataset && mutation.target.dataset.info && features?.pages?.item?.quick_items?.enabled) {
                  //update qty from the mutation with multiple items listed
                  updateQtyCategory(mutation.target, mutation.target.dataset.info);
                }
                if ($(element).find('.re_add_qitem').length > 0) return; //if quickitem button already exists, ignore
                let nameWrap = $(element).find('span.name-wrap');
                let actionWrap = $(element).find('ul.actions-wrap');
                let bonusesEl = $(element).find('.cont-wrap > .bonuses');
                actionWrap.parent('.actions').addClass("re_qitemWrap");

                bonusesEl.addClass("re_qitemWrap");
                nameWrap.addClass("re_qitemWrap");

                var data_string;

                let itemName = nameWrap.find('.name').text();
                let itemQty = nameWrap.find('.qty.t-hide').text().replace('x', '');
                if (itemQty === "") {itemQty = 1;}

                //Temporary weapons should not save the armoryid. Set to 0.
                if (itemCategory == "Temporary") armoryID = 0;

                if (quick_equip_categores.includes(itemCategory)) {
                  const regex = /\d+/; // matches one or more digits
                  const bonus_name_regex = /(?<=<b>)([a-zA-Z]*?)(?=<\/b>)/; //Match word between <b> and </b>
                  
                  if (itemCategory == "Temporary") {
                    data_string = `data-itemname="${itemName}" data-itemqty="${itemQty}" data-itemid="${itemID}" data-itemcategory="${itemCategory}" data-itemarmoryid="${armoryID}"`;
                  }

                  if (itemCategory == "Defensive") {
                    let armor = $(element).find(".bonus-attachment-item-defence-bonus").next("span").text();
                    let title_1 = $(element).find("i[data-bonusid]").first().attr("title");
                    let bonus_1 = "", num_1 = "";
                    if (title_1) {
                      bonus_1 = title_1.match(bonus_name_regex) ? title_1.match(bonus_name_regex)[0] : "";
                      num_1 = title_1.match(regex) ? parseInt(title_1.match(regex)[0]) : 0; // extract the first number from title1 (or set to 0)
                    }
                    let el_color_class = $(element).find(".thumbnail .item-plate").attr("class");
                    let color = el_color_class.replace("item-plate ", "").replace("glow-", "");
  
                    data_string = `data-itemcolor="${color}" data-itemnum_1="${num_1}" data-itembonus_1="${bonus_1}" data-itemarmor="${armor}" data-itemname="${itemName}" data-itemqty="${itemQty}" data-itemid="${itemID}" data-itemcategory="${itemCategory}" data-itemarmoryid="${armoryID}"`;
                  }

                  if (itemCategory == "Primary" || itemCategory == "Secondary" || itemCategory == "Melee") {
                    let damage = $(element).find(".bonus-attachment-item-damage-bonus").next("span").text();
                    let accuracy = $(element).find(".bonus-attachment-item-accuracy-bonus").next("span").text();
                    
                    let title_1 = $(element).find("i[data-bonusid]").first().attr("title");
                    let title_2 = $(element).find("i[data-bonusid]").last().attr("title");
        
                    let bonus_1 = "", bonus_2 = "", num_1 = "", num_2 = "";
  
                    if (title_1) {
                      bonus_1 = title_1.match(bonus_name_regex) ? title_1.match(bonus_name_regex)[0] : "";
                      num_1 = title_1.match(regex) ? parseInt(title_1.match(regex)[0]) : 0; // extract the first number from title1 (or set to 0)
                      if (bonus_1 == "Disarm") num_1 = num_1 + "T";
                    }
                    if (title_2) {
                      bonus_2 = title_2.match(bonus_name_regex) ? title_2.match(bonus_name_regex)[0] : "";
                      num_2 = title_2.match(regex) ? parseInt(title_2.match(regex)[0]) : 0; // extract the first number from title2 (or set to 0)
                      if (bonus_2 == "Disarm") num_2 = num_2 + "T";
                    }
                    
                    let el_color_class = $(element).find(".thumbnail .item-plate").attr("class");
                    let color = el_color_class.replace("item-plate ", "").replace("glow-", "");
                    
                    data_string = `data-itemcolor="${color}" data-itemnum_2="${num_2}" data-itemnum_1="${num_1}" data-itembonus_2="${bonus_2}" data-itembonus_1="${bonus_1}" data-itemaccuracy="${accuracy}" data-itemdamage="${damage}" data-itemname="${itemName}" data-itemqty="${itemQty}" data-itemid="${itemID}" data-itemcategory="${itemCategory}" data-itemarmoryid="${armoryID}"`;
                  }

                } else {
                  data_string = `data-itemname="${itemName}" data-itemqty="${itemQty}" data-itemid="${itemID}" data-itemcategory="${itemCategory}" data-itemarmoryid="${armoryID}"`;
                }


                  let qitemButton = `
                  <li class="re_add_qitem" ${data_string}>
                    <span class="icon-h" title="Add ${itemName} to Quick Items">
                      <button aria-label="Add ${itemName} to Quick Items" class="option-equip wai-btn qitem-btn"></button>
                      <span class="opt-name">
                          Add
                          <span class="t-hide">to Quick Items</span>
                      </span>
                    </span>
                  </li>
                  `;
                  if ((itemCategory == "Special" || itemCategory == "Other") && !exceptionItemList.includes(itemID)) { // Keep buttons consistent so add-button for donator pack doesn't look odd
                    actionWrap.find('li').first().after(`<li class="left re_add_qitem"></li>`);
                  } else {
                    actionWrap.find('li').first().after(qitemButton);
                  }
              }
            }

            if (features?.pages?.item?.item_values?.enabled) {
              if ($(element).find('.re_value').length > 0) return;
              if (jQuery.isEmptyObject(items)) return;

              let nameWrap = $(element).find('span.name-wrap');
              let itemQty = nameWrap.find('.qty.t-hide').text().replace('x', '');
              if (itemQty === "") {itemQty = 1;}

              if (typeof items[itemID] != "undefined") {
                let value = parseInt(itemQty * items[itemID].market_value);
                
                let title = `${itemQty.toLocaleString('en-US')} x $${items[itemID].market_value.toLocaleString('en-US')}`;

                nameWrap.append(`<span class="re_value" title="${title}">$${value.toLocaleString('en-US')}</span>`)
              }
            }

            if (features?.pages?.item?.no_confirm_equip?.enabled) {
              let itemCategory = element.dataset.category;

              if (quick_equip_categores.includes(itemCategory) || itemCategory == "Clothing") {
                $(element).find("ul.actions-wrap > li[data-action='equip']").attr('data-confirm', "1");
              }
            }

            if (features?.pages?.item && features?.pages?.item?.quick_items?.enabled == false && features?.pages?.item?.item_values?.enabled == false && features?.pages?.item?.no_confirm_equip?.enabled == false) observer.disconnect();
          }//for
        }
      }
    }
  })
});

if (jQuery.isEmptyObject(items)) {
  sendMessage({name: "get_local", value: "re_items"})
  .then((r) => {
      if (r.status) {
          items = r?.data?.items;
      }
      initObserver();
  })
  .catch((e) => console.error(e));
} else {
  initObserver();
}

(function() {
  if ($('div.captcha').length != 0 && $('#body').attr('data-traveling') == "true") {//Check for captcha and traveling  
    return;
  }
  init_quick_items();
})();


function init_quick_items() {
  if (features?.pages?.item?.quick_items?.enabled) {
    document.addEventListener("RFCtoReTorn", function(e) {
      tornRFC = e.detail;
    }, false);
    var rfcEv = new CustomEvent("getTornRFC");
    document.dispatchEvent(rfcEv);

    //Insert container
    if ($(`.re_container[data-feature="${QUICK_ITEMS}"]`).length != 0) return;
    const containerObject = {
        "feature": `${QUICK_ITEMS}`,
        "insertLocation": "before",
        "elementClasses": "after",
        "bar": false,
        "info": `Click the Add to Quick Items <span class='option-equip wai-btn qitem-btn re_info'></span> button on an item to add it to this quick items list.`
    }
    insertContainer($("div.equipped-items-wrap"), containerObject);
    const RE_CONTAINER = $(`.re_container[data-feature="${QUICK_ITEMS}"]`);


    //insert button to toggle removing items
    const element = `
    <li class="re_modify_quick_items">
        <span class="re_menu_item">
            <i class="fa-regular fa-pen-to-square"></i>
            <span class="re_menu_item_text">Edit quick items</span>
        </span>
    </li>
    `;
    RE_CONTAINER.find('#re_features_settings_view').prepend(element);
    RE_CONTAINER.find('.re_modify_quick_items').off('click').click(function() {
      let qi_container = $('#re_quick_items, #re_quick_equip');
      qi_container.find('.re_quse .close').toggleClass("re_hide");
      qi_container.find('.re_quse .re_handle').toggleClass("re_hide");
      qi_container.toggleClass('re_disabled');

      if (qi_container.hasClass('re_modify_active')) {
        qi_container.sortable('destroy');
      } else {
        qi_container.sortable({
          items: '> .re_button',
          cancel: '',
          placeholder: 're_button re_sortable_placeholder',
          tolerance: "pointer"
        });
        qi_container.off("sortdeactivate").on("sortdeactivate", function(event,ui) {
          var obj_qi = {
            quick_items: {
            }
          }


          $('#re_quick_items').each(function() {
            $(this).find('.re_button[data-itemid]').each(function(i) {
              const itemID = $(this).attr('data-itemid');
              $(this).css('order', i+1);
              obj_qi["quick_items"][itemID] = {
                order: i+1
              }
            });
          })

          sendMessage({"name": "merge_sync", "key": "settings", "object": obj_qi})
          .then((r) => {
            //loadItems();
          })
          .catch((e) => console.error(e))



          var obj_qe = {
            quick_equip: {
            }
          }

          $('#re_quick_equip').each(function() {
            $(this).find('.re_button[data-armoryid]').each(function(i) {
              const armoryID = $(this).attr('data-armoryid');
              $(this).css('order', i+1);
              obj_qe["quick_equip"][armoryID] = {
                order: i+1
              }
            });
          })

          sendMessage({"name": "merge_sync", "key": "settings", "object": obj_qe})
          .then((r) => {
            //loadItems();
          })
          .catch((e) => console.error(e))

        })
      }

      qi_container.toggleClass('re_modify_active');
      $("#re_quick_equip .re_button").toggleClass("equipped");
    });


    //Add divs for quick items content
    RE_CONTAINER.find('.re_content').html(`
      <div class="re_quick_items">
          <div class="re_row re_quick_container" id="re_quick_items"></div>
          <div class="re_row action-wrap use-act use-action" id="re_quick_items_response" style="display: none;"></div>
      </div>
      <div class="re_quick_equip" style="display: none;">
          <hr class="delimiter-999 m-top10 m-bottom10 re_hr">
          <div class="re_row re_quick_container items-cont actions" id="re_quick_equip"></div>
          <div class="re_row items-cont" id="re_quick_equip_response"></div>
      </div>
      `);

      $('#re_quick_items_response').on('click', '.close-act', function() {
        $('#re_quick_items_response').hide();
      });
      $('#re_quick_equip_response').on('click', '.close-act', function() {
        $('#re_quick_equip_response').hide();
      });

      loadItems();

      $(document).on('click', '.re_add_qitem', function(event){ //click event for add quick item buttons next to items
        event.stopPropagation();
        event.preventDefault();
        
        let thisButton = $(event.currentTarget);

        var itemName = thisButton.data("itemname");
        var itemQty = thisButton.data("itemqty");
        var itemID = thisButton.data("itemid");
        var itemCategory = thisButton.data("itemcategory");
        var item_order;
        var armoryID, color;

        let is_usable_item = qitem_categories.includes(itemCategory);
        let is_equippable = quick_equip_categores.includes(itemCategory);
        var obj;

        if (is_usable_item) {
          if ($('#re_quick_items').find('[data-itemID='+itemID+']').length != 0) return;

          item_order = $('#re_quick_items > .re_button').length + 1;

          obj = {
            quick_items: {
              [itemID]: {
                itemID: itemID, 
                order: item_order, 
                itemName: itemName, 
                itemQty: itemQty, 
                itemCategory: itemCategory
              }
            }
          }
        }
        if (is_equippable) {
          item_order = $('#re_quick_equip > .re_button').length + 1;
          var equipment_info;

          if (itemCategory == "Temporary") {
            armoryID = itemName;

            equipment_info = {
              itemID: itemID, 
              order: item_order, 
              itemName: itemName, 
              itemQty: itemQty, 
              itemCategory: itemCategory,
              armoryID: armoryID
            }
          } else {
            armoryID = thisButton.data("itemarmoryid");
            color = thisButton.data("itemcolor");
          }

          if (itemCategory == "Defensive") {
            let armor = thisButton.data("itemarmor");
            let bonus_1 = thisButton.data("itembonus_1");
            let num_1 = thisButton.data("itemnum_1");

            equipment_info = {
              itemID: itemID, 
              order: item_order, 
              itemName: itemName, 
              itemQty: itemQty, 
              itemCategory: itemCategory,
              armoryID: armoryID,
              armor: armor,
              color: color
            }
            
            if (bonus_1) equipment_info.bonus_1 = {name: bonus_1, value: num_1 }
          }

          if (itemCategory == "Primary" || itemCategory == "Secondary" || itemCategory == "Melee") {
            let damage = thisButton.data("itemdamage");
            let accuracy = thisButton.data("itemaccuracy");

            let bonus_1 = thisButton.data("itembonus_1");
            let bonus_2 = thisButton.data("itembonus_2");
            
            let num_1 = thisButton.data("itemnum_1");
            let num_2 = thisButton.data("itemnum_2");
            
            equipment_info = {
              itemID: itemID, 
              order: item_order, 
              itemName: itemName, 
              itemQty: itemQty, 
              itemCategory: itemCategory,
              armoryID: armoryID,
              damage: damage,
              accuracy: accuracy,
              color: color
            }
            
            if (bonus_1) equipment_info.bonus_1 = {name: bonus_1, value: num_1 }
            if (bonus_2) equipment_info.bonus_2 = {name: bonus_2, value: num_2 }
          }

          if ($('#re_quick_equip').find('[data-armoryID='+armoryID+']').length != 0) return;

          obj = {
            quick_equip: {
              [armoryID]: equipment_info
            }
          }
        }

        sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
        .then((r) => {
          loadItems();
        })
        .catch((e) => console.error(e))
        
      });
  }
}

function initObserver() {
  var target = document.querySelector('div.items-wrap');
  if (target && !target.classList.contains("re_obsinit")) {
    target.classList.add("re_obsinit");
    observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
  } else {
    console.log("[ReTorn][Items Features] Could not find items wrap.");
  }
}

function updateQtyCategory(target, category) { //update qty based on observed change on Torn item page
  if (!qitem_categories.includes(category)) return;
  if ($('#re_quick_items').find('[data-category="'+category+'"]').length > 0 && $(target).children(`li[data-item]`).length != 0) {
    var obj = {quick_items: {}}
    $('#re_quick_items').find('[data-category="'+category+'"]').each(function() {
      let itemQty;
      let itemID = $(this).data('itemid');
      let lastQty = $(this).data("qty");

      if ($(target).children(`li[data-item='${itemID}']`).length == 0) { //check if Torn item node exists
        itemQty = 0;
      } else {
        itemQty = $(target).children(`li[data-item='${itemID}']`).attr("data-qty"); //set qty from Torn item node qty
      }

      if (lastQty != itemQty) {
          obj["quick_items"][itemID] = {
            itemQty: itemQty
          }
          //update visuals and data
          $(this).attr("data-qty", itemQty);
          $(this).data("qty", itemQty);
          $(this).find('.re_qty').text(`x${itemQty}`);
      }
    });

    //after all quick items in category are checked, check if obj has any new qty, if so, send
    if (!jQuery.isEmptyObject(obj["quick_items"])) {
      sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
      .catch((e) => console.error(e))
    }
  }
}

function loadItems() {
  sendMessage({name: "get_sync", value: "settings"})
  .then((r) => {
    if (!r?.status) throw r;
    let quick_items_empty = jQuery.isEmptyObject(r?.data?.quick_items);
    let quick_equip_empty = jQuery.isEmptyObject(r?.data?.quick_equip);
    if (quick_items_empty && quick_equip_empty) { //if both quick_items and quick_equip are empty, add default message
      $('#re_quick_items').html(`Click the Add to Quick Items <span class='option-equip wai-btn qitem-btn re_info'></span> button on an item to add it to this quick items list.`);
      return;
    }

    //If someone tries to add an item while sort is enabled, we need to reset sort
    let qi_container = $('#re_quick_items, #re_quick_equip');
    if (qi_container.hasClass('re_modify_active')) {
      qi_container.removeClass('re_modify_active re_disabled');
      qi_container.sortable('destroy');
    }
    qi_container.empty();

    if (!quick_items_empty) {
      sort_reverse_and_prepend_items(r.data.quick_items);
    }

    if (!quick_equip_empty) {
      sort_reverse_and_prepend_items(r.data.quick_equip);
      $('.re_quick_equip').show();
    }

    $(".close").off('click').click(function (event) {
      event.stopPropagation();
      event.preventDefault();
      let qi_button = $(this).parent().parent();
      let item_category = qi_button.data('category');
      let id, settings;

      if (qitem_categories.includes(item_category)) {
        id = qi_button.data('itemid');
        settings = "quick_items";
      }
      if (quick_equip_categores.includes(item_category)) {
        id = qi_button.data('armoryid');
        settings = "quick_equip";
      }

      let data = {"name": "delete_settings_key", "item": settings, "key": id}      
      sendMessage(data)
      .then((r) => {
        qi_button.remove();
        if (!$("#re_quick_equip").children().length) $('.re_quick_equip').hide();
      })
      .catch((e) => console.error(e))

    });

    $(".re_quse").off('click').click(function (event) {
      event.preventDefault();
      let parent = $(this).parent();
      let qi_container = parent.parent();
      //Do not send use request if we are modifying the buttons. Prevent accidental clicks
      if (qi_container.hasClass('re_disabled')) return;

      let itemID = parent.data('itemid');
      let item_category = parent.data('category');
      let armoryID = parent.data('armoryID')
      sendItemUseRequest(itemID, item_category, armoryID);

      if (qitem_categories.includes(item_category)) {
        $("#re_quick_items_response").show();
      }
      if (quick_equip_categores.includes(item_category)) {
        $("#re_quick_equip_response").show();
      }
    });  

    
  })
  .catch((e) => console.error("[ReTorn][Quick Items][Error]", e))
}

function sort_reverse_and_prepend_items(items) {
  var sorted = [];

  Object
  .keys(items).sort(function(a, b){
      return items[a].order - items[b].order;
  })
  .forEach(function(key) {
      sorted.push({[key]: items[key]});
  });

  sorted.reverse();
  sorted.forEach((e) => {
    const index = Object.keys(e)[0];
    const item = Object.values(e)[0];
    let parent;
    if (qitem_categories.includes(item.itemCategory)) {
      parent = $("#re_quick_items");
      parent.prepend(`
        <div class="re_button" data-itemID="`+item.itemID+`" data-qty="`+item.itemQty+`" data-category="`+item.itemCategory+`" style="order: `+item.order+`"><button class="re_quse"><img src="/images/items/`+item.itemID+`/large@4x.png" alt="`+item.itemName+`"><span class="re_name">`+item.itemName+`</span><span class="re_qty">x`+item.itemQty+`</span><span class="re_handle re_hide"></span><span class="close re_hide"></span></button></div>
      `);
    }
    if (quick_equip_categores.includes(item.itemCategory)) {
      parent = $("#re_quick_equip");
      let id = item.itemCategory == "Temporary" ? 1 : item.armoryID;
      let confirm = ` data-confirm="1"`;
      let stats_string = "";
      let color_string = "";
      if (item.color) color_string = ` background: var(--items-glow-${item.color}-linear-gradient);`;
      if (item.itemCategory == "Defensive") {
        let bonuses_string = "";
        if (item.bonus_1) {
          bonuses_string = bonus_text(item.bonus_1);
        }
        stats_string = `<span class="re_bonuses"><span class="re_stats"><span><i class="bonus-attachment-item-defence-bonus"></i>${item.armor}</span></span>${bonuses_string}</span>`;
      }
      if (item.itemCategory != "Defensive" && item.itemCategory != "Temporary") {
        let bonuses_string = "";
        if (item.bonus_1) {
          bonuses_string = bonus_text(item.bonus_1);
        }
        if (item.bonus_2) {
          bonuses_string += bonus_text(item.bonus_2);
        }
        

        stats_string = `<span class="re_bonuses"><span class="re_stats"><span><i class="bonus-attachment-item-damage-bonus"></i>${item.damage}</span><span><i class="bonus-attachment-item-accuracy-bonus"></i>${item.accuracy}</span></span>${bonuses_string}</span>`;
      }

      


      parent.prepend(`
        <div class="re_button equipped"${confirm} data-id="${id}" data-action="equip" data-armoryID="${item.armoryID}" data-item="${item.itemID}" data-itemID="${item.itemID}" data-qty="${item.itemQty}" data-category="${item.itemCategory}" style="order: ${item.order};${color_string}"><button class="re_quse"><span class="re_name">${item.itemName}</span><img src="/images/items/${item.itemID}/large@4x.png" alt="${item.itemName}"><i></i>${stats_string}<span class="re_handle re_hide"></span><span class="close re_hide"></span></button></div>
      `);
    }
  });
}

function bonus_text(bonus) {
  let v = "";
  if (!bonus.value) return `<span>${bonus.name}</span>`;
  if (bonus.name == "Disarm") {
    v = bonus.value;
  } else {
    v = bonus.value + "%";
  }
  return `<span>${v} ${bonus.name}</span>`;
}

function sendItemUseRequest(itemID, item_category, armoryID) {
  const ajax_loader = `<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10">`;
  var data, response, parent;
  if (quick_equip_categores.includes(item_category)) {
    return; //quick equip is being done via modified HTML class manipulation instead of an item request
    data = {step: "actionForm", item_id: itemID, item: itemID, id: 1, type: 5, action: "equip"};
    if (armoryID) data = {step: "actionForm", confirm: 1, action: "equip", id: armoryID}
    response = $("#re_quick_equip_response");
    parent = $("#re_quick_equip");
  }
  if (qitem_categories.includes(item_category)) {
    data = { step: "useItem", itemID: itemID, item: itemID }
    response = $("#re_quick_items_response");
    parent = $("#re_quick_items");
  }

  var options = {
      url: "item.php?rfcv="+tornRFC,
      type: "post",
      data: data,
      beforeSend: function(xhr) {
        response.html(ajax_loader);
      },
      success: function(str) {
        response.empty();
        if (str.includes("equipped-act")) {
          if (str.includes("equipped-act unequipped-act")) {
            let res = $(str);
            let li = res.wrap('<li>').parent();
            li.prepend(`<div class="actions"></div>`);
            response.html(li);
          } else {
            response.html(str);
          }
        } else {
          try {
              var msg = JSON.parse(str);
              let itemsHTML;
              if (msg.success) {
                  let item = parent.find(`[data-itemid="${itemID}"]`);
                  let itemQty = parseInt(item.data("qty"));
                  itemQty--;
                  if (itemQty < 0) {
                    itemQty = 0;
                  }

                  const obj = {
                    quick_items: {
                      [itemID]: {
                        itemID: itemID,  
                        itemQty: itemQty
                      }
                    }
                  }

                  sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
                  item.attr("data-qty", itemQty);//set attribute data
                  item.data("qty", itemQty);//set object data
                  item.find('.re_qty').text(`x${itemQty}`);

                  if (msg.items && msg.items.itemAppear) {
                    itemsHTML = `<div><div class="re-pack-open-result">`;
                    for (const [key, item] of Object.entries(msg.items.itemAppear)) {

                      if (item.type) {
                        if (item.type == "Armor" || item.type == "Weapon") {
                        itemsHTML += `
                        <div class="re-pack-open-content expanded"><div class="re-pack-open-result">

                                    <div class="cache-item single-unique">`;
                                    if (item.bonuses) {
                                      itemsHTML += `<div class="item-bonuses m-top3"><div class="bonuses-holder">`;
                                      for (const [key, bonus] of Object.entries(item.bonuses)) {
                                        itemsHTML += `<i class="bonus-attachment-${bonus.icon}" title="${bonus.hoverover}"></i>`;
                                      }
                                      itemsHTML += `</div></div>`;
                                    }

                                    //Item Image Start
                                      itemsHTML += `<div><img class="torn-item" data-size="large" src="/images/items/${item.ID}/large.png"`;

                                      if (item.glow) {
                                        itemsHTML += `${item.glow}`;
                                      }

                                      itemsHTML += `></div>`;
                                    //Item Image End

                                    if (item.stats) {
                                      itemsHTML += `<div class="item-bonuses m-bottom3">`;
                                      for (const [key, stat] of Object.entries(item.stats)) {
                                        itemsHTML += `<div class="stats-holder"><i class="bonus-attachment-${stat.icon}"></i><span>${stat.value}</span></div>`;
                                      }
                                      itemsHTML += `</div>`;
                                    }

                                    itemsHTML += `</div>`;

                        itemsHTML += `</div></div>`;
                      }
                      }

                      if (item.type && item.ID) {
                        itemsHTML += `<div class="item-image-container">
                              <div`;
                              if (item.name) {
                                itemsHTML += ` title="${item.name}"`;
                              }
                              itemsHTML += `>
                                  <img width="100" height="50" src="/images/items/${item.ID}/large.png" class="cache-item">
                              </div>
                              `;
                        if (parseInt(item.qty) > 1) {
                          itemsHTML += `<div class="item-amount">${item.qty}</div></div>`;
                        } else {
                          itemsHTML += `</div>`;
                        }
                      }

                    } //for loop
                    itemsHTML += `</div></div>`;
                  }

              }

              let linksHTML = `<p><a class="close-act t-blue h">Close</a>`;
              if (msg.links) {
                for (const [key, link] of Object.entries(msg.links)) {
                  linksHTML+= `<a class="t-blue h m-left10 ${link.class}" href="${link.url}" ${link.attr}>${link.title}</a>`
                }
              }
              linksHTML += `</p>`;

              let responseHTML = `<div>`;
              if (itemsHTML) {
                responseHTML += itemsHTML;
              }
              responseHTML += `<p>${msg.text}</p>${linksHTML}</div>`;

              response.append(responseHTML);
              convertImageToCanvas(response.find('img.torn-item'), true);



              // If response includes a countdown
              if (response.find('.counter-wrap').length > 0) {
                response.find('.counter-wrap').each(function() {
                  let seconds = $(this).data('time');
                  var date = new Date().getTime() + (seconds*1000);
                  //using jquery.countdown plugin
                  $(this)
                  .countdown(date, function(event) {
                    var totalHours = event.offset.totalDays * 24 + event.offset.hours;
                    $(this).text(
                      event.strftime(`${totalHours}:%M:%S`)
                    );
                  })
                })
              }
          } catch (e) {
            console.error(e);
          }
        }

      }
  };

  $.ajax(options);
}


function isCanvasSupported() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
}

function convertImageToCanvas(item, imgRemove, offsetX, offsetY) {
    if (isCanvasSupported()) {
        var shadowBlur = 9;
        offsetX = (offsetX !== undefined) ? offsetX : 0;
        offsetY = (offsetY !== undefined) ? offsetY : 0;
        var imageOffsetWidth = offsetX * 2;
        var imageOffsetHeight = offsetY * 2;
        item.each(function() {
            var $elem = $(this);
            var color = $elem.attr('data-color');
            var opacity = $elem.attr('data-opacity');
            var overlay = $elem.attr('data-overlay');
            imgRemove = imgRemove || false;
            var src = $elem.attr('src');
            var size = $elem.attr('data-size');
            var cl = $elem.attr('data-cl') || '';
            var itemOptions = {
                blank: {
                    width: 100,
                    height: 50
                },
                crimes_medium: {
                    width: 60,
                    height: 30
                },
                crimes_blank: {
                    width: 60,
                    height: 30
                },
                large: {
                    width: 100,
                    height: 50
                },
                large_bg_gray: {
                    width: 100,
                    height: 50
                },
                large_dark: {
                    width: 100,
                    height: 50
                },
                medium: {
                    width: 60,
                    height: 30
                },
                small: {
                    width: 38,
                    height: 19
                }
            };
            if (!src || !color) {
                return null;
            }
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            var img = new Image();
            img.src = src;
            if (itemOptions[size]) {
                var imageRegExp = new RegExp('(\\/images\\/items\\/\\d+\\/)?' + 'large' + '(\\.png){1}(\\?v=\\d+)?','g');
                var currentSrc = img.getAttribute('src');
                img.src = currentSrc.replace(imageRegExp, function(str, $1, $2) {
                    return $1 + size + $2;
                });
            }
            canvas.className = "item-glow " + cl;
            $(img).on('load', function(){
                canvas.width = img.width + imageOffsetWidth;
                canvas.height = img.height + imageOffsetHeight;
                ctx.shadowBlur = shadowBlur;
                ctx.shadowColor = hex2rgb(color, opacity).css;
                ctx.drawImage(img, offsetX, offsetY);
                var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                var pix = imgData.data;
                var red = hex2rgb(overlay).r;
                var green = hex2rgb(overlay).g;
                var blue = hex2rgb(overlay).b;
                for (var i = 0, n = pix.length; i < n; i += 4) {
                    pix[i] = (pix[i] < 128) ? 2 * red * pix[i] / 255 : 255 - 2 * (255 - red) * (255 - pix[i]) / 255;
                    pix[i + 1] = (pix[i + 1] < 128) ? 2 * green * pix[i + 1] / 255 : 255 - 2 * (255 - green) * (255 - pix[i + 1]) / 255;
                    pix[i + 2] = (pix[i + 2] < 128) ? 2 * blue * pix[i + 2] / 255 : 255 - 2 * (255 - blue) * (255 - pix[i + 2]) / 255;
                }
                ctx.putImageData(imgData, 0, 0);
            });
            $elem.before($(canvas));
            if (imgRemove) {
                $elem.remove();
            }
        });
        return true;
    } else {
        return false;
    }
}

function hex2rgb(hex, opacity) {
    hex = (hex + '').trim();
    opacity = opacity || 1;
    var rgb = null;
    var match = hex.match(/^#?(([0-9a-zA-Z]{3}){1,3})$/);
    if (!match) {
        return null;
    }
    rgb = {};
    hex = match[1];
    if (hex.length == 6) {
        rgb.r = parseInt(hex.substring(0, 2), 16);
        rgb.g = parseInt(hex.substring(2, 4), 16);
        rgb.b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length == 3) {
        rgb.r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
        rgb.g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
        rgb.b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
    }
    rgb.css = 'rgb' + (opacity ? 'a' : '') + '(';
    rgb.css += rgb.r + ',' + rgb.g + ',' + rgb.b;
    rgb.css += (opacity ? ',' + opacity : '') + ')';
    return rgb;
}

function featureCleanup() {
  $('.re_qitemWrap').removeClass('re_qitemWrap');
  $('.re_add_qitem').remove();
  observer.disconnect();
}