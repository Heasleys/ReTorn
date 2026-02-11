const isAndroidChromium = (navigator.userAgent.toLowerCase().includes('chrome') && navigator.userAgent.toLowerCase().includes('android'));

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
            <p id="re_signin_message">You are not signed into ReTorn. Please enter your api key then click connect. Click <a href="https://www.retorn.rocks/privacy/">here</a> to view the ReTorn privacy policy.</p>
        </div>
        <div class="re_row">
            <div class="re_button_wrap">
            <input id="re_apikey" type="text" maxlength="16" required autocomplete="off">
            <button class="re_torn_button" id="re_sync">Connect</button>
            <button class="re_torn_button" id="re_options">Options</button>
            <button class="re_torn_button" id="re_logout" hidden>Logout</button>
            </div>
        </div>
        <div class="re_row mb2" hidden>
            <p id="re_message" hidden></p>
        </div>
        <hr/>
        <div class="re_row mt2">
            <p id="re_ts_link_message">Many ReTorn features rely on the <a href="https://www.tornstats.com/api"  target="_blank">Torn Stats API</a>. To use these features, you must link your Torn Stats account by submitting the API key you use for Torn Stats below. You can view the Terms of Service for Torn Stats <a href="https://www.tornstats.com/tos">here</a>.</p>
        </div>
        <div class="re_row">
            <div class="re_button_wrap">
            <input id="re_torn_stats_apikey" type="text" maxlength="19" required autocomplete="off">
            <button class="re_torn_button" id="re_ts_link">Connect Torn Stats</button>
            <button class="re_torn_button" id="re_ts_unlink" hidden>Disconnect Torn Stats</button>
            </div>
        </div>
        <div class="re_row" style="display: none;">
            <p id="ts_message" style="display: none;"></p>
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

        //button to integrate tornstats     
        $("button#re_ts_link").click(async function() {
            const key = $("#re_torn_stats_apikey").val();
            if (key && key.length >= 16 && key.length <= 19) {
                if (confirm('By accepting, you agree to allow the api key you entered to be transmitted to tornstats.com.')) {
                    $("#ts_message").html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder" id="re_loader" style="margin-left: 0; left: 0;">`);
                    $("#ts_message").show();
                    $("#ts_message").parent().show();

                    var isGranted;
                    if (isAndroidChromium) {
                        isGranted = true; //skip checking if kiwi browser
                    } else {
                        isGranted = await sendMessage({"name": "request_tornstats_permissions"})
                        .then((r) => {
                            return r;
                        })
                        .catch((e) => console.error(e))
                    }

                    if (isGranted) {
                    sendMessage({name: "set_torn_stats_api", apikey: key})
                    .then((r) => {
                        if (r.status) {
                            $("#ts_message").hide();
                            $("#ts_message").parent().hide();
                            isTSSynced(r);
                        } else {
                            TornStatsMessage({status: false, message: r.message});
                        }
                    })
                    .catch((error) => TornStatsMessage(error));
                    }
                }
            } else {
                TornStatsMessage({status: false, message: "Torn Stats api key is invalid."});
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

        $("button#re_ts_unlink").click(function() {
            sendMessage({name: "remove_value", key: "re_torn_stats_apikey", location: "local"})
            .then(() => {
                signedOutTS();
            })
            .catch((e) => {
                console.error(e)
            })
        });



        sendMessage({name: "get_local", value: "re_apikey"})
        .then((r) => {
            isSynced(r);
        })
        .catch((e) => console.error(e))

        sendMessage({name: "get_local", value: "re_torn_stats_apikey"})
        .then((r) => {
            isTSSynced(r);
        })
        .catch((e) => {console.error(e)})

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

        function isTSSynced(r) {
            if (r.status) {
                $("#re_ts_link_message").text(``);
                $("#re_ts_link").text("Torn Stats Connected!");
                $("#re_ts_link").css("color", "#8ABEEF");
                $("#re_ts_link").attr("disabled", true);
                $("#re_ts_link").attr("hidden", false);
                $("#re_ts_unlink").attr("hidden", false);
                $("#re_torn_stats_apikey").hide();
            } else {
                signedOutTS();
            }
        }

        function signedOut() {
            $("#re_sync").text("Connect");
            $("#re_sync").attr("disabled", false);
            $("#re_logout").attr("hidden", true);
            $('#re_apikey').val('');
            $("#re_apikey").show();
            $("#re_signin_message").html(`You are not signed into ReTorn. Please enter your api key then click connect. Click <a href="https://www.retorn.rocks/privacy/">here</a> to view the ReTorn privacy policy.`);
        }

        function signedOutTS() {
            $("#re_ts_link").text("Connect Torn Stats");
            $("#re_ts_link").css("color", "");
            $("#re_ts_link").attr("disabled", false);
            $("#re_ts_unlink").attr("hidden", true);
            $('#re_torn_stats_apikey').val('');
            $("#re_torn_stats_apikey").show();
            $("#re_ts_link_message").html(`Many ReTorn features rely on the <a href="https://www.tornstats.com/api"  target="_blank">Torn Stats API</a>. To use these features, you must link your Torn Stats account by submitting the API key you use for Torn Stats below. You can view the Terms of Service for Torn Stats <a href="https://www.tornstats.com/tos">here</a>.`);
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
                $(`#sidebar ul[class*="status-icons_"] li[class*="${id}_"]`).removeClass('re_hide').attr('id', ``);
            } else {
                $(`#sidebar ul[class*="status-icons_"] li[class*="${id}_"]`).addClass('re_hide').attr('id', `re_hide_${id}`);
            }

            let sidebar_icons = $(`#sidebar ul[class*="status-icons_"]`);
            sidebar_icons.addClass('re_hide_icons');

            $('.re_hide_icons_six').removeClass('re_hide_icons_six');

            sidebar_icons.find('li:not(".re_hide")')
            .filter(function(index) {
                return (index + 1) % 6 == 0;    
            }).addClass('re_hide_icons_six')
        }
    }
})();

function TornStatsMessage(m) {
  const ts = $('#ts_message');
  ts.text(m.message);
  ts.show();
  ts.parent().show();
}