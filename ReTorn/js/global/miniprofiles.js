/* Mini Profiles */
(function() {
    document.addEventListener('re_miniprofiles', function (r) {
        if (features?.general?.last_action_mini_profile?.enabled) {
            miniProfiles(r?.detail?.response);
        }
    });
    
    function miniProfiles(response) {
        if (response?.user) {
        let message = "";
    
            if (response?.user?.role === "NPC") {
            //Loot Time??
            }
    
            if (response?.user?.lastAction?.seconds && !isNaN(response.user.lastAction.seconds)) {
            message = "Last Action: ";
            const seconds = response.user.lastAction.seconds;
    
            const lastaction = secondsToHmsShort(seconds);
            message += lastaction;
            const desc = $('#profile-mini-root').find('.description');
            const subdesc = desc.find('.sub-desc');
    
            let subdescText = subdesc.text();
            if (subdescText != "") {
                desc.parent('.profile-container').css("min-height", "40px");
                desc.css("height", "40px");
                desc.append(`<span class="sub-desc">`+message+`</span>`);
            } else {
                subdesc.text(message);
            }
    
            if (response?.user?.userID.toString() == "1468764") {
                $('#profile-mini-root').find('.icons').prepend(`<span class="right" style="font-size: 17px;" title="King of ReTorn">👑</span>`);
                $('#profile-mini-root .box-info .box-value .digit .two-row>span:first-child').text('Epic');
            }
            }
        }
    }
})();