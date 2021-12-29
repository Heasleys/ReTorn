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
    <div class="re_row action-wrap use-act use-action" id="re_quick_items_response" style="display: none;"></div>
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

                  if (itemCategory == 'Medical' || itemCategory == 'Drug' || itemCategory == 'Energy Drink' || itemCategory == 'Alcohol' || itemCategory == 'Candy' || itemCategory == 'Booster' || itemCategory == 'Supply Pack' || itemCategory == 'Special' || itemCategory == 'Other') { //Donator Packs = 283
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
                      if (itemCategory == "Special" || itemCategory == "Other" && itemID != 403 && itemID != 283) { // Keep buttons consistent so add button for donator pack doesn't look odd
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
            let itemsHTML;
            if (msg.success) {
                let item = $('#re_quick_items').find(`[data-itemid="${itemID}"]`);
                let itemQty = parseInt(item.data("qty"));
                itemQty--;
                if (itemQty < 0) {
                  itemQty = 0;
                }

                item.data("qty", itemQty);
                item.find('.re_qty').text(`x${itemQty}`);

                chrome.runtime.sendMessage({name: "set_value", value_name: "re_qitems", value: {items: {[itemID]: {itemQty: itemQty}}}})
                item.attr("data-qty", itemQty);
                item.find('.re_qty').text(`x${itemQty}`);

                if (msg.items && msg.items.itemAppear) {
                  itemsHTML = `<div><div class="re-pack-open-result">`;
                  for (const [key, item] of Object.entries(msg.items.itemAppear)) {

                    if (item.type && item.type == "Weapon") {
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

            $("#re_quick_items_response").append(responseHTML);
            convertImageToCanvas($('#re_quick_items_response img.torn-item'), true);



            // If response includes a countdown
            if ($("#re_quick_items_response").find('.counter-wrap').length > 0) {
              $("#re_quick_items_response").find('.counter-wrap').each(function() {
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
