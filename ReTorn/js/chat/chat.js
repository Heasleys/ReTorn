(function() {
    var namesList = {} //namesList for remembering names in chats/group chats for TabComplete
    
    // Case-Insensitive JQuery contains found here https://stackoverflow.com/questions/8746882/jquery-contains-selector-uppercase-and-lower-case-issue
    jQuery.expr[':'].icontains = function(a, i, m) {
        return jQuery(a).text().toUpperCase()
            .indexOf(m[3].toUpperCase()) >= 0;
    };


    //Chatbox Observer
    const chatboxObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            console.log(mutation);
        //new messages
        if (mutation.target && mutation.target.className) {
            const targetClass = mutation.target.className;    
            if (targetClass.includes("chat-box-body__")) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    if (mutation.addedNodes[0] && mutation.addedNodes[0].nodeName && mutation.addedNodes[0].nodeName == "DIV") {
                        if (mutation.addedNodes[0].children && mutation.addedNodes[0].children.length > 0) {
                            let mutationChildren = mutation.addedNodes[0].children;
                            for (let i = 0, len = mutationChildren.length; i < len; i++) {
                                let mutationChild = mutationChildren[i];
                                if (mutationChild && mutationChild.className) {
                                    const mutationChildClass = mutationChild.className;
                                    if (mutationChildClass.includes("chat-box-message___")) {
                                        monitorChats($(mutationChild).closest(`div[class*="group-chat-box__chat-box-wrapper_"]`)[0]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        //opening chatboxes
        if (mutation.target && mutation.target.className && mutation.addedNodes.length > 0 && mutation.addedNodes[0].className) {
            if (mutation.target.className.includes('group-chat-box__') && mutation.addedNodes[0].className.includes('group-chat-box__chat-box-wrapper_')) {
                monitorChats(mutation.addedNodes[0]);
            }
        }
        });   
    });

    function initChatFeatures() {
        //Tab Name Autocomplete
        //If namesList hasn't been filled, add the chatbox names to the namesList
        if (Object.keys(namesList).length === 0) {
            if (features?.chat?.tab_autocomplete?.enabled) getNamesInAllChats();
        }
    }



    function monitorChats(target) {
        // if (features?.chat?.highlights?.enabled) {
        //     // Check for highlights
        //     const highlights = settings?.chat_highlights;
        //     if (highlights && !jQuery.isEmptyObject(highlights)) {
        //       for (const [key, value] of Object.entries(highlights)) {
        //         if (value.enabled) {
        //             //Check for Name Highlights
        //             if (value.value && value.value.includes("@")) {
        //             let name = value.value.replace("@", "").toLowerCase();
        //             if (value.enabled) {
        //                 $(`#chatRoot div[class*="overview"] div[class*="message_"] > a`).filter(function() {
        //                 return $.trim($(this).text()).replace(":", "").toLowerCase() == name;
        //                 }).css("color", value.color);
        //             } else {
        //                 $(`#chatRoot div[class*="overview"] div[class*="message_"] > a`).filter(function() {
        //                 return $.trim($(this).text()).replace(":", "").toLowerCase() == name;
        //                 }).css("color", "");
        //             }
        //             }
        //             //check chat messages 
        //             else {
        //                 let text = value.value.toLowerCase();
        //                 //value can be within a word (EX: 'heas' would trigger on 'heasley' or 'heasly')
        //                 if (text && text.includes("*")) {
        //                     text = text.replace('*', '');
        //                     $(`#chatRoot div[class*="overview"] div[class*="message_"] > span:icontains(${text})`).parent(`div[class*="message_"]`).css("background-color", value.color + "4D").css("font-weight", "bold");
        //                 } else {//must be exact match
        //                     const match = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        //                     const rgex = new RegExp(`\\b${match}\\b`);
        //                     $(`#chatRoot div[class*="overview"] div[class*="message_"] > span`).filter(function () {
        //                         return rgex.test($(this).text().toLowerCase()); 
        //                     }).parent(`div[class*="message_"]`).css("background-color", value.color + "4D").css("font-weight", "bold");
        //                 }
        //             }
        //         }
        //       };
        //     }
        // }
          
    
        // Check for names
        if (target != undefined) {
            if (features?.chat?.tab_autocomplete?.enabled) getNamesInChatbox($(target));
        }
    }




    
    //functions for TabComplete in chatboxes
    function addTabComplete(chatbox, title) {
        // tabComplete using plugin from: https://www.jqueryscript.net/form/Simple-jQuery-Tab-Completion-Plugin-Tab-Complete.html
      
      let textarea = chatbox.find(`textarea[class*="chat-box-footer__textarea_"]`);
      if (textarea.length != 0) {
      
        //remove previous event listeners and reset tabcomplete list (in case of new names added from chat)
        textarea.off("keydown");
        textarea.tabComplete("reset", []);
      
        //add tabComplete functionality
        textarea.tabComplete({
          getOptions:function() {
            return namesList[title]; //namesList for specific chatbox
          },
          getFormat: function(word, position) {
            return word.toString();
          },
        select: false,
        preventTabbing: true
        });
      
      }

      console.log(namesList);
    }
      
    function getNamesInAllChats() {
        $(`#chatRoot div[class*="group-chat-box_"] > div[class*="group-chat-box__chat-box-wrapper_"]`).each(function() {
            getNamesInChatbox($(this));
        });
    }
    
    function getNamesInChatbox(chatbox) {
        let title = chatbox.find(`[class*="chat-box-header__info__"] p[class*="chat-box-header__name__"]`).text().toLowerCase();
        if (!namesList[title]) {
            namesList[title] = [];
        }
    
        chatbox.find(`div[class*="chat-box-body_"] div[class*="chat-box-message_"] a[class*="chat-box-message__sender_"]`).each(function() {
            let name = $.trim($(this).text()).replace(":", "");
            if (!namesList[title].includes(name)) {
            namesList[title].push(name);
            }
        });
    
        addTabComplete(chatbox, title);
    }
    
    waitForElm('#chatRoot [class*="chat-app__chat-list-chat-box-wrapper_"]').then((elm) => {
        initChatFeatures();
        const chatRoot = document.getElementById("chatRoot");
        const observerParams = {attributes: false, childList: true, characterData: false, subtree:true};
        chatboxObserver.observe(chatRoot, observerParams);
    });
})();


