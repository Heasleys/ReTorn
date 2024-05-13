(function() {
    //make sure we are not logged out
    if ($('div.content-wrapper.logged-out').length == 0) {
        //Insert container
        const containerObject = {
            "feature": `${CONNECT}`,
            "insertLocation": "append",
            "elementClasses": "",
            "bar": false
        }
        insertContainer($("div.content-wrapper"), containerObject);
        const RE_CONTAINER = $(`.re_container[data-feature="${CONNECT}"]`);

        RE_CONTAINER.find('.re_head .re_title').prepend(`<span class="re_logo"><span class="re_yellow">Re</span>Torn: </span>`)
        RE_CONTAINER.find('.re_settings_icon').remove();
        RE_CONTAINER.find('.re_content').html(`
        <div class="re_row">
            <p id="re_signin_message">You are not signed into ReTorn. Please enter your api key then click connect.</p>
        </div>
        <div class="re_row">
            <div class="re_button_wrap">
            <input id="re_apikey" type="text" maxlength="16" required autocomplete="off">
            <button class="re_torn_button" id="re_sync">Connect</button>
            <button class="re_torn_button" id="re_options">Options</button>
            <button class="re_torn_button" id="re_logout" hidden>Logout</button>
            </div>
        </div>
        <div class="re_row" hidden>
            <p id="re_message" hidden></p>
        </div>
        `);

        $("button#re_sync").click(() => {
            const key = $("#re_apikey").val();
            $("#re_message").html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder" id="re_loader" style="margin-left: 0; left: 0;">`);
            $("#re_message").attr('hidden', false);
            $("#re_message").parent().attr('hidden', false);
            if (key && key.length == 16) {
                sendMessage({name: "set_api", apikey: key})
                .then((r) => {
                if (r.status) {
                    $("#re_message").attr('hidden', true);
                    $("#re_message").parent().attr('hidden', true);
                    isSynced(r);
                } else {
                    errorMessage({status: false, message: r.message});
                }
                })
                .catch((error) => errorMessage(error));
            } else {
                errorMessage({status: false, message: "Please enter a valid apikey."});
            }
        });

        $("button#re_logout").click(function() {
            sendMessage({name: "logout"})
            .then((r) => {
                if (r.status) {
                    signedOut();
                    errorMessage({message: r.message});
                } else {
                    errorMessage(response);
                }
            }).catch((error) => errorMessage(error));
        });



        sendMessage({name: "get_local", value: "re_apikey"})
        .then((r) => {
            isSynced(r);
        })
        .catch((e) => console.error(e))

        //initialize hide icons selection
        hideIcons();




        function isSynced(r) {
        if (r.status) {
            sendMessage({name: "get_local", value: "re_user"})
            .then((rr) => {
                $("#re_signin_message").text(`Welcome ${rr?.data?.name}! You are signed in.`);
            })
            .catch((e) => console.error(e))

            $("#re_sync").text("Connected!");
            $("#re_sync").attr("disabled", true);
            $("#re_sync").attr("hidden", false);
            $("#re_logout").attr("hidden", false);
            $("#re_apikey").hide();
        } else {
            signedOut();
        }
        }

        function signedOut() {
            $("#re_sync").text("Connect");
            $("#re_sync").attr("disabled", false);
            $("#re_logout").attr("hidden", true);
            $('#re_apikey').val('');
            $("#re_apikey").show();
            $("#re_signin_message").text(`You are not signed into ReTorn. Please enter your api key then click connect.`);
        }

        function errorMessage(error) {
            console.log("[ReTorn]",error);
            $("#re_message").text(error.message);
            $("#re_message").attr('hidden', false);
            $("#re_message").parent().attr('hidden', false);
        }

        function hideIcons() {
            if ($('#iconTray').length) {
                //initialize slashed icons
                if (settings?.hide_sidebar_icons) {
                    const icons = settings?.hide_sidebar_icons.split(',');
                    icons.forEach(i => {
                        $(`#your-icons #iconTray > #${i}`).addClass('re_disabled').css('opacity', "0.6").append(`
                        <i class="fa-solid fa-slash" style="
                        padding-left: 0px;
                        padding-top: 2px;
                        color: red;
                        font-size: 14px;
                        "></i>
                        `);
                    });
                }

                

                $('#iconTray > li[id*="icon"]').click(function() {
                    const id = $(this).attr('id');
                    if ($(this).hasClass('re_disabled')) {
                        $(this).removeClass('re_disabled');
                        $(this).css('opacity', "");
                        $(this).children('i').remove();

                        $(`#${id}-sidebar`).parent('li').removeClass("re_hide");
                    } else {
                        $(this).addClass('re_disabled');
                        $(this).css('opacity', "0.6");
                        $(this).append(`<i class="fa-solid fa-slash" style="
                        padding-left: 0px;
                        padding-top: 2px;
                        color: red;
                        font-size: 14px;
                        "></i>`);
                    }
                        
                    var iconString = "";
                    $('#your-icons #iconTray .re_disabled').each(function() {
                        let iconID = $(this).attr('id');
                        if (iconString != "") {
                            iconString += `,${iconID}`;
                        } else {
                            iconString = `${iconID}`;
                        }
                    });
                    
                    const obj = {
                        "hide_sidebar_icons": iconString
                    }

                    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
                    .then((r) => {
                    settings["hide_sidebar_icons"] = iconString;
                    hideLocalIcons(id);
                    })
                    .catch((e) => console.error(e))       
                });
            }
        }

        function hideLocalIcons(id) {
            if ($(`#re_hide_${id}`).length > 0) {
                $(`#re_hide_${id} > li`).unwrap();
            } else {
                $(`#sidebar ul[class*="status-icons_"] li[class*="${id}_"]`).wrap(`<span class="re_hide" id="re_hide_${id}">`);
            }
          }
    }
})();