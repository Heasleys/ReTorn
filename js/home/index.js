// @version      1.0.0
// @description  Small tweaks to homepage - total personal perks on tab
// @author       Heasleys4hemp [1468764]

let totPP = $('div#personal-perks').find('ul > li.last').text().replace(/\D/g,'');
$('h5.box-title:contains("Personal Perks")').text( 'Personal Perks: ' + totPP).prop('title', 'Total Personal Perks: ' + totPP);
