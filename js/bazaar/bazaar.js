var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      if (mutation.target && mutation.target.className) {
        //startup added nodes (on first page load)
        if (mutation.target.className.includes('core-layout_')) {
          mutation.addedNodes.forEach(function(node) {
            //main container loaded
            if (node.className && node.className.includes('itemsContainner_')) {
              $('[class^="itemDescription_"] [class^="description_"]').each(function() {
                addBuyAllTitle($(this)[0]);
              });

              $(node).find('.ReactVirtualized__Grid__innerScrollContainer [class^="item_"] > [class^="itemDescription_"]').each(function() {
                addBuyMaxButton($(this)[0]);
              })
            }
          });
        }

        //item node as target, after clicking the shopping cart button
        if (mutation.target.className.includes('item')) {
          mutation.addedNodes.forEach(function(node) {
            //when clicking the buy button (shopping cart) in desktop mode, add max button
            if (node.className && node.className.includes('buyMenu')) {
              addBuyMaxButton(node);
            }
            //when clicking the buy button (shopping cart) in desktop mode, add buy all title to other in stock text
            if (node.className && node.className.includes('itemDescription_')) {
              addBuyAllTitle($(node).find('[class^="description_"]')[0]);
            }
          })
        }

        //main bazaar container, scrolling loading items
        if (mutation.target.className.includes('ReactVirtualized__Grid__innerScrollContainer')) {
          mutation.addedNodes.forEach(function(node) {
            if (node.className && node.className.includes('row_')) {
              $(node).find('[class^="rowItems_"] [class^="item_"]').each(function() {
                addBuyAllTitle($(this).find('[class^="description_"]')[0]);
                addBuyMaxButton($(this).find('[class^="itemDescription_"]')[0]);
              })
            }
          });
        }

        if (mutation.target.className.includes('itemDescription_')) {
          addBuyMaxButton(mutation.target);
        }

        //searching on tablet/mobile
        if (mutation.target.className.includes('rowItems_')) {
          addBuyMaxButton(mutation.target);
        }
        //another search on tablet/mobile
        if (mutation.target.className.includes('itemsContainner_')) {
          addBuyMaxButton(mutation.target);
        }

        //cancelling a buy
        if (mutation.target.className.includes('item_')) {
          addBuyMaxButton(mutation.target);
        }
      }
    }
  });
});

if (features?.general?.max_buy_torn?.enabled) {
  var target = document.querySelector('div.content-wrapper');
  observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
}


function addBuyAllTitle(element) {
  let amtElement;
  //determine if the amount in stock element is outer element or element after clicking shopping cart button
  if ($(element).find('[class^="amountValue"]').length > 0) {
    amtElement = $(element).find('[class^="amountValue"]');
  } else {
    if ($(element).find('[class^="amount_"]').length > 0) {
      amtElement = $(element).find('[class^="amount_"]');
    }
  }
  if (amtElement != undefined) {
    let amt = parseInt(amtElement.text().replace(/\D/g, ''));
    if (amt > 1) { //no need to add a title if only one item in stock (such as weapons/armor)
      let price = parseInt($(element).find('[class^="price"]').text().replace(/\D/g, ''));
      let buyAll = (price * amt);
      $(element).find('[class^="amount_"]').attr("title", `Buy all for $${buyAll.toLocaleString()}`);
    }
  }
}

function addBuyMaxButton(node) {
  let parent = $(node);
  if (parent.find('.re_max_buy').length == 0) {
    parent.find('[class^="amount_"]').each(function() {
      let qty = parseInt($(this).text().replace(/\D/g, ''));

      if (qty > 1) {//no need to add max button if only one item
        parent.find('[class^="buyForm"] [class^="field_"] button[class^="buy_"]').each(function() {
          $(this).before(`<button class="re_max_buy">Max</button>`);
        })
      }
    });

    $('.re_max_buy').off('click').click(function(e) {
      let parent = $(this).closest('[class^="item_"]');
      let max = getMax(parent);
      let input = parent.find('[class^="buyForm"] input[class^="numberInput"]');
      input.val(max);
      input.attr('value', max);
      input[0].dispatchEvent(new Event("input", { bubbles: true }));
    });

    //also add buyAll title if adding max button
    parent.find('[class^="info_"]').each(function() {
      addBuyAllTitle($(this)[0]);
    });
  } else {
    return;
  }
}


function getMax(parent) {
  let qty = parseInt(parent.find('[class^="amount_"]').text().replace(/\D/g, ''));
  let price = parseInt(parent.find('[class^="price_"]').text().replace(/\D/g, ''));
  let money = parseInt($('#user-money').attr('data-money'));

  let max = Math.floor(money/price) < qty ? Math.floor(money/price) : qty;
  return max;
}
