(function() {
  var items;
  const qitem_categories = ['Medical', 'Drug', 'Energy Drink', 'Alcohol', 'Candy', 'Booster', 'Supply Pack', 'Special']
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
              let itemID = element.dataset.item;

              if (features?.pages?.item?.quick_items?.enabled) {
                let itemCategory = element.dataset.category;

                if (qitem_categories.includes(itemCategory)) {
                  //update item qtys
                  if (mutation.target.dataset && mutation.target.dataset.info && features?.pages?.item?.quick_items?.enabled) {
                    //update qty from the mutation with multiple items listed
                    updateQtyCategory(mutation.target, mutation.target.dataset.info);
                  }
                  if ($(element).find('.re_add_qitem').length > 0) return; //if quickitem button already exists, ignore
                  let nameWrap = $(element).find('span.name-wrap');
                  let actionWrap = $(element).find('ul.actions-wrap');
                  actionWrap.parent('.actions').addClass("re_qitemWrap");
                  nameWrap.addClass("re_qitemWrap");
  
                  let itemName = nameWrap.find('.name').text();
                  let itemQty = nameWrap.find('.qty.t-hide').text().replace('x', '');
                  if (itemQty === "") {itemQty = 1;}
  
                    let qitemButton = `
                    <li class="re_add_qitem" data-itemname="${itemName}" data-itemqty="${itemQty}" data-itemid="${itemID}" data-itemcategory="${itemCategory}">
                      <span class="icon-h" title="Add to Quick Items">
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

                let nameWrap = $(element).find('span.name-wrap');
                let itemQty = nameWrap.find('.qty.t-hide').text().replace('x', '');
                if (itemQty === "") {itemQty = 1;}

                if (typeof items[itemID] != "undefined") {
                  let value = parseInt(itemQty * items[itemID].market_value);
                  
                  let title = `${itemQty.toLocaleString('en-US')} x $${items[itemID].market_value.toLocaleString('en-US')}`;

                  nameWrap.append(`<span class="re_value" title="${title}">$${value.toLocaleString('en-US')}</span>`)
                }
              }
            }//for
          }
        }
      }
    })
  });

  var orderMain = 1;
  var tornRFC;
  if ($('div.captcha').length != 0 && $('#body').attr('data-traveling') == "true") {//Check for captcha and traveling  
    return;
  }
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

    RE_CONTAINER.find('.re_content').html(`
      <div class="re_row" id="re_quick_items"></div>
      <div class="re_row action-wrap use-act use-action" id="re_quick_items_response" style="display: none;"></div>
      `);

      $('#re_quick_items_response').on('click', '.close-act', function() {
        $('#re_quick_items_response').hide();
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

        if ($('#re_quick_items').find('div[data-itemID='+itemID+']').length == 0) {
          const obj = {
            quick_items: {
              [itemID]: {
                itemID: itemID, 
                order: orderMain, 
                itemName: itemName, 
                itemQty: itemQty, 
                itemCategory: itemCategory
              }
            }
          }
          sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
          .then((r) => {
            loadItems();
          })
          .catch((e) => console.error(e))
        }
      });
  }

  if (features?.pages?.item?.quick_items?.enabled || features?.pages?.item?.item_values?.enabled) {
    sendMessage({name: "get_local", value: "re_items"})
    .then((r) => {
        if (r.status) {
            items = r?.data?.items;
        }

        var target = document.querySelector('div.items-wrap');
        if (target) {
          observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
        } else {
          console.log("[ReTorn][Items Features] Could not find items wrap.");
        }
    })
    .catch((e) => console.error(e))

  }


  function updateQtyCategory(target, category) { //update qty based on observed change on Torn item page
    if ($('#re_quick_items').find('div[data-category="'+category+'"]').length > 0 && $(target).children(`li[data-item]`).length != 0) {
      var obj = {quick_items: {}}
      $('#re_quick_items').find('div[data-category="'+category+'"]').each(function() {
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
      if (!jQuery.isEmptyObject(r?.data?.quick_items)) {
          let x = 0;
          $('#re_quick_items').empty();
          var items = r.data.quick_items;
          $.each(items, (index, item) => {
            x++;
            $('#re_quick_items').prepend(`
              <div class="re_button" data-itemID="`+item.itemID+`" data-qty="`+item.itemQty+`" data-category="`+item.itemCategory+`" style="order: `+item.order+`"><button class="re_quse"><img src="/images/items/`+item.itemID+`/large@4x.png" alt="`+item.itemName+`"><span class="re_name">`+item.itemName+`</span><span class="re_qty">x`+item.itemQty+`</span><span class="close"></span></button></div>
            `);
          });
          orderMain = x;
          orderMain++;

          $(".close").off('click').click(function (event) {
            event.stopPropagation();
            event.preventDefault();

            let itemID = $(this).parent().parent().data('itemid');

            sendMessage({"name": "delete_settings_key", "item": "quick_items", "key": itemID})
            .then((r) => {
              loadItems();
            })
            .catch((e) => console.error(e))

          });

          $(".re_quse").off('click').click(function (event) {
            event.preventDefault();
            let parent = $(this).parent();
            let itemID = parent.data('itemid');

            sendItemUseRequest(itemID);

            $("#re_quick_items_response").show();

          });    
      } else {
        $('#re_quick_items').html(`Click the Add to Quick Items <span class='option-equip wai-btn qitem-btn re_info'></span> button on an item to add it to this quick items list.`);
      }
    })
    .catch((e) => console.error("[ReTorn][Quick Items][Error]", e))
  }

  function sendItemUseRequest(itemID) {
    var options = {
        url: "item.php?rfcv="+tornRFC,
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
})();



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