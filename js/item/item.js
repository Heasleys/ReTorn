// @version      1.0.0
// @description  Add quick items
// @author       Heasleys4hemp [1468764]
if ($('div.captcha').length == 0 && $('#body').attr('data-traveling') != "true") { //Check for captcha and traveling
  var n = 1;
  insertHeader($("div.equipped-items-wrap"), 'before', 'after');

  $('#re_title').text("Quick Items");
  $('.re_content').html(`
    <p>Click on an item's image to add it to this quick items list.</p>
    <div class="re_row" id="re_quick_items"></div>
    <div class="re_row action-wrap use-act use-action" id="re_quick_items_response" style="display: none;"></div>
    `);
    loadItems();

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {

        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          if (mutation.target && mutation.target.nodeName && mutation.target.nodeName === "UL") {
            if (mutation.target.parentElement && mutation.target.parentElement.id && mutation.target.parentElement.id == "category-wrap") {
              if (mutation.previousSibling == null) {
                for (const element of mutation.addedNodes) {
                  let itemID = element.dataset.item;
                  let itemCategory = element.dataset.category;

                  if (itemCategory == 'Medical' || itemCategory == 'Drug' || itemCategory == 'Energy Drink' || itemCategory == 'Alcohol' || itemCategory == 'Candy' || itemCategory == 'Booster' || itemCategory == 'Supply Pack' || itemID == 283) { //Donator Packs = 283
                    if ($(element).find('.re_add_qitem').length > 0) {
                      return;
                    }
                    let nameWrap = $(element).find('span.name-wrap');
                    let actionWrap = $(element).find('ul.actions-wrap');
                    actionWrap.parent('.actions').addClass("re_qitemWrap");
                    nameWrap.addClass("re_qitemWrap");


                    let itemName = nameWrap.find('.name').text();
                    let itemQty = nameWrap.find('.qty.t-hide').text().replace('x', '');
                    if (itemQty === "") {itemQty = 1;}

                    //Update Item Qty in quick item list if item is in list
                    if ($('#re_quick_items').find('div[data-itemid='+itemID+']').length > 0) {
                      let itemElement = $('#re_quick_items').find('div[data-itemid='+itemID+']');
                      if (parseInt(itemElement.attr('data-qty')) != itemQty) {
                        itemElement.attr('data-qty', itemQty);
                        itemElement.find('.re_qty').text('x'+itemQty);
                        chrome.runtime.sendMessage({name: "set_value", value_name: "re_qitems", value: {items: {[itemID]: {itemID: itemID, itemName: itemName, itemQty: itemQty, itemCategory: itemCategory}}}}, (response) => {
                        //loadItems();
                        });

                      }


                    }
                      var qitemButton = $('<li/>');
                      qitemButton.addClass('re_add_qitem');
                      qitemButton.data('itemName', itemName);
                      qitemButton.data('itemQty', parseInt(itemQty));
                      qitemButton.data('itemID', itemID);
                      qitemButton.data('itemCategory', itemCategory);
                      qitemButton.append(`<span class="icon-h" title="Add to Quick Items">
                                              <button aria-label="Add ${itemName} to Quick Items" class="option-equip wai-btn re_green"></button>
                                              <span class="opt-name">
                                                  Add
                                                  <span class="t-hide">to Quick Items</span>
                                              </span>
                                          </span>`);

                      actionWrap.find('li').first().after(qitemButton);
                  }

                }//for

                $(".re_add_qitem").off('click').click(function (event) {
                  event.stopPropagation();
                  event.preventDefault();

                  var itemName = $(this).data("itemName");
                  var itemQty = $(this).data("itemQty");
                  var itemID = $(this).data("itemID");
                  var itemCategory = $(this).data("itemCategory");

                  if ($('#re_quick_items').find('div[data-itemID='+itemID+']').length == 0) {
                    chrome.runtime.sendMessage({name: "set_value", value_name: "re_qitems", value: {items: {[itemID]: {itemID: itemID, order: n, itemName: itemName, itemQty: itemQty, itemCategory: itemCategory}}}}, (response) => {
                      loadItems();
                    });
                  }

                });
              }
            }
          }
        }
      })
    });

  var target = document.querySelector('div.items-wrap');
  if (target) {
    observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
  } else {
    console.log("Could not find items wrap.");
    chrome.runtime.sendMessage({name: "set_logger", type: "error", subtype: "page", message: "Could not find items wrap on item.php.", log: {timestamp: Date.now()}});
  }



} //if captcha


function loadItems() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_qitems"}, (response) => {
    if (response.status && response.status == true) {
      if (response.value && response.value.re_qitems && response.value.re_qitems.items) {
          let x = 0;
          $('#re_quick_items').empty();
          var items = response.value.re_qitems.items;
          $.each(items, (index, item) => {
            x++;
            $('#re_quick_items').prepend(`
              <div class="re_button" data-itemID="`+item.itemID+`" data-qty="`+item.itemQty+`" style="order: `+item.order+`"><button class="re_quse"><img src="/images/items/`+item.itemID+`/medium.png" alt="`+item.itemName+`"><span class="re_name">`+item.itemName+`</span><span class="re_qty">x`+item.itemQty+`</span><span class="close"></span></button></div>
            `);
          });
          n = x;
          n++;

          $(".close").off('click').click(function (event) {
            event.stopPropagation();
            event.preventDefault();

            let itemID = $(this).parent().parent().data('itemid');

            chrome.runtime.sendMessage({name: "del_value", value: "re_qitems", key: itemID}, (response) => {
              if (response && response.status && response.status == true) {
                loadItems();
              }
            });

          });

          $(".re_quse").off('click').click(function (event) {
            event.preventDefault();

            let itemID = $(this).parent().data('itemid');
            $("#re_quick_items_response").append(`<p class="link-act" data-item="`+itemID+`"></p>`);
            //$("#re_quick_items_response").find('.link-act').attr('data-item', itemID);

            $("#re_quick_items_response").find('.link-act').click();
            $("#re_quick_items_response").show();

          });
      }
    }
  });

}


$('#re_quick_items_response').on('click', '.close-act', function() {
  $('#re_quick_items_response').hide();
});
