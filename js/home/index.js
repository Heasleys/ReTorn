// @version      1.0.0
// @description  Small tweaks to homepage - total personal perks on tab
// @author       Heasleys4hemp [1468764]

let totPP = $('div#personal-perks').find('ul > li.last').text().replace(/\D/g,'');
$('h5.box-title:contains("Personal Perks")').text( 'Personal Perks: ' + totPP).prop('title', 'Total Personal Perks: ' + totPP);


var bsBox = $('h5.box-title:contains("Battle Stats")').parent('div.title').parent('div.sortable-box');
var statsContainer = bsBox.children('div.bottom-round');

bsBox.find('div.battle.bottom-round').removeClass('bottom-round');
var stats = [];
var bonuses = [];
var titles = [];

bsBox.find('ul > li').each( function(i) {
  let stat = parseInt($(this).find('span.desc').text().replace(/\D/g,''));
  let perc = parseInt($(this).find('span.mod-value').text().replace("−", "-").replace("%", ""));
  let bonus = (stat * (perc / 100));
  let calced = stat + bonus;
  stats[i] = Math.floor(calced);
  bonuses[i] = Math.floor(bonus);
  if (bonus > 0) {
    titles[i] = "<div class='green'>"+bonuses[i].toLocaleString()+"</div>";
  }
  if (bonus < 0) {
    titles[i] = "<div class='red'>"+bonuses[i].toLocaleString()+"</div>";
  }
  if (bonus == 0) {
    titles[i] = "<div>"+bonuses[i].toLocaleString()+"</div>";
  }
});
stats[4] = Math.floor(stats[0] + stats[1] + stats[2] + stats[3]);
bonuses[4] = Math.floor(bonuses[0] + bonuses[1] + bonuses[2] + bonuses[3]);
if (bonuses[4] > 0) {
  titles[4] = "<div class='green'>"+bonuses[4].toLocaleString()+"</div>";
}
if (bonuses[4] < 0) {
  titles[4] = "<div class='red'>"+bonuses[4].toLocaleString()+"</div>";
}
if (bonuses[4] == 0) {
  titles[4] = "<div>"+bonuses[4].toLocaleString()+"</div>";
}
statsContainer.append(`
  <div class="re_head expanded flat-top">
    <span class="re_title">ReTorn: <span id="re_title">Effective Stats</span></span>
  </div>
  <div class="re_stats_list">

    <ul>
    <li tabindex="0" aria-label="Strength: `+stats[0].toLocaleString()+`">
      <span class="re_divider">
        <span>Strength</span>
      </span>
      <span class="stats" title="`+titles[0]+`">`+stats[0].toLocaleString()+`</span>
    </li>

    <li tabindex="0" role="row" aria-label="Defense: `+stats[1].toLocaleString()+`">
      <span class="re_divider">
        <span>Defense</span>
      </span>
      <span class="stats" title="`+titles[1]+`">`+stats[1].toLocaleString()+`</span>
    </li>

    <li tabindex="0" role="row" aria-label="Speed: `+stats[2].toLocaleString()+`">
      <span class="re_divider">
        <span>Speed</span>
      </span>
      <span class="stats" title="`+titles[2]+`">`+stats[2].toLocaleString()+`</span>
    </li>

    <li tabindex="0" role="row" aria-label="Dexterity: `+stats[3].toLocaleString()+`">
      <span class="re_divider">
      <span>Dexterity</span>
      </span>
      <span class="stats" title="`+titles[3]+`">`+stats[3].toLocaleString()+`</span>
    </li>

    <li class="last" tabindex="0" role="row" aria-label="Total: 4,205,666,307">
      <span class="re_divider">
      <span>Total</span>
      </span>
      <span class="stats" title="`+titles[4]+`">`+stats[4].toLocaleString()+`</span>
    </li>

    </ul>

  </div>
  `);
