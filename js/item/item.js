// @version      1.0.0
// @description  Add quick items
// @author       Heasleys4hemp [1468764]
if ($('div.captcha').length == 0 && $('#body').attr('data-traveling') != "true") { //Check for captcha and traveling
  var n = 1;
  insertHeader($("div.equipped-items-wrap"), 'before', 'after');

  $('#re_title').text("Quick Items");
  $('.re_content').html(`
    <p>Click the <span class="option-equip wai-btn qitem-btn"></span> button on an item to add it to this quick items list.</p>
    <div class="re_row" id="re_quick_items"></div>
    <div class="re_row" id="re_quick_items_response" style="display: none;"></div>
    `);
    loadItems();

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {

        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          if (mutation.target && mutation.target.nodeName && mutation.target.nodeName === "UL") {
            if (mutation.target.parentElement && mutation.target.parentElement.id && mutation.target.parentElement.id == "category-wrap") {
              if (mutation.previousSibling == null) {

                if (mutation.addedNodes[0].firstChild && mutation.addedNodes[0].firstChild.className && mutation.addedNodes[0].firstChild.className.includes("ajax-placeholder") ) {
                  return;
                }
                //update item qtys
                if (mutation.target.dataset && mutation.target.dataset.info) {
                  updateQtyCategory(mutation.target, mutation.target.dataset.info);
                }

                for (const element of mutation.addedNodes) {
                  let itemID = element.dataset.item;
                  let itemCategory = element.dataset.category;

                  if (itemCategory == 'Medical' || itemCategory == 'Drug' || itemCategory == 'Energy Drink' || itemCategory == 'Alcohol' || itemCategory == 'Candy' || itemCategory == 'Booster' || itemCategory == 'Supply Pack' || itemID == 283 || itemCategory == 'Special') { //Donator Packs = 283
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

                      var qitemButton = $('<li/>');
                      qitemButton.addClass('re_add_qitem');
                      qitemButton.data('itemName', itemName);
                      qitemButton.data('itemQty', parseInt(itemQty));
                      qitemButton.data('itemID', itemID);
                      qitemButton.data('itemCategory', itemCategory);
                      qitemButton.append(`<span class="icon-h" title="Add to Quick Items">
                                              <button aria-label="Add ${itemName} to Quick Items" class="option-equip wai-btn qitem-btn"></button>
                                              <span class="opt-name">
                                                  Add
                                                  <span class="t-hide">to Quick Items</span>
                                              </span>
                                          </span>`);
                      if (itemCategory == "Special" && itemID != 283) { // Keep buttons consistent so add button for donator pack doesn't look odd
                        actionWrap.find('li').first().after(`<li class="left"></li>`);
                      } else {
                        actionWrap.find('li').first().after(qitemButton);
                      }
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

function updateQtyCategory(target, category) {
  if ($('#re_quick_items').find('div[data-category="'+category+'"]').length > 0) {
    $('#re_quick_items').find('div[data-category="'+category+'"]').each(function() {
      let itemQty;
      let itemID = $(this).attr('data-itemid');
      let lastQty = $(this).attr("data-qty");

      if ($(target).children(`li[data-item='${itemID}']`).length == 0) {
        itemQty = 0;
      } else {
        itemQty = $(target).children(`li[data-item='${itemID}']`).attr("data-qty");
      }

      if (lastQty != itemQty) {
        chrome.runtime.sendMessage({name: "set_value", value_name: "re_qitems", value: {items: {[itemID]: {itemQty: itemQty}}}})
        $(this).attr("data-qty", itemQty);
        $(this).find('.re_qty').text(`x${itemQty}`);
      }
    });
  }
}


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
              <div class="re_button" data-itemID="`+item.itemID+`" data-qty="`+item.itemQty+`" data-category="`+item.itemCategory+`" style="order: `+item.order+`"><button class="re_quse"><img src="/images/items/`+item.itemID+`/medium.png" alt="`+item.itemName+`"><span class="re_name">`+item.itemName+`</span><span class="re_qty">x`+item.itemQty+`</span><span class="close"></span></button></div>
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
            let parent = $(this).parent();
            let itemID = parent.data('itemid');

            sendItemUseRequest(itemID);

            $("#re_quick_items_response").show();



          });
      } else {
        chrome.runtime.sendMessage({name: "set_logger", type: "error", subtype: "page", message: "Could not find re_qitems for quick items page.", log: {timestamp: Date.now()}});
      }
    }
  });

}


$('#re_quick_items_response').on('click', '.close-act', function() {
  $('#re_quick_items_response').hide();
});

function sendItemUseRequest(itemID) {
  var options = {
      url: "item.php",
      type: "post",
      data: { step: "useItem", itemID: itemID, item: itemID },
      beforeSend: function(xhr) {
        $("#re_quick_items_response").html('<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10">');
      },
      success: function(str) {
        $("#re_quick_items_response").empty();
        try {
            var msg = JSON.parse(str);

            if (msg.success) {
                let item = $('#re_quick_items').find(`[data-itemid="${itemID}"]`);
                let itemQty = parseInt(item.data("qty"));
                itemQty--;
                if (itemQty < 0) {
                  itemQty = 0;
                }

                chrome.runtime.sendMessage({name: "set_value", value_name: "re_qitems", value: {items: {[itemID]: {itemQty: itemQty}}}})
                item.attr("data-qty", itemQty);
                item.find('.re_qty').text(`x${itemQty}`);
            }

            let linksHTML = `<p><a class="close-act t-blue h">Close</a>`;
            if (msg.links) {
              for (const [key, link] of Object.entries(msg.links)) {
                linksHTML+= `<a class="t-blue h m-left10 ${link.class}" href="${link.url}" ${link.attr}>${link.title}</a>`
              }
            }
            linksHTML+= `</p>`;

            $("#re_quick_items_response").append(`<div>
            <p>${msg.text}</p>
            ${linksHTML}
            </div>`);



            // If response includes a countdown
            if ($("#re_quick_items_response").find('.counter-wrap').length > 0) {
              let seconds = $("#re_quick_items_response").find('.counter-wrap').data('time');
              var date = new Date().getTime() + (seconds*1000);
              //using jquery.countdown plugin
              $("#re_quick_items_response").find('.counter-wrap')
              .countdown(date, function(event) {
                var totalHours = event.offset.totalDays * 24 + event.offset.hours;
                $(this).text(
                  event.strftime(`${totalHours}:%M:%S`)
                );
              })
            }
        } catch (e) {
            console.error(e);
        }
      }
  };

  $.ajax(options);
}
