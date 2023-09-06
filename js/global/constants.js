const RE_ITEM_CATEGORIES = ["Alcohol","Artifact", "Book", "Booster", "Candy", "Car", "Clothing", "Collectible", "Defensive", "Drug", "Electronic", "Energy Drink", "Enhancer", "Flower", "Jewelry", "Medical", "Melee", "Other", "Plushie", "Primary", "Secondary", "Special", "Supply Pack", "Temporary", "Unused", "Virus"];

const RE_WEAPON_BONUSES = ["Achilles","Assassinate","Backstab","Berserk","Bleed","Blindfire","Blindside","Bloodlust","Burning","Comeback","Conserve","Cripple","Crusher","Cupid","Deadeye","Deadly","Demoralized","Disarm","Double Tap","Double-edged","Emasculate","Empower","Eviscerate","Execute","Expose","Finale","Focus","Freeze","Frenzy","Fury","Grace","Hazardous","Home Run","Irradiate","Laceration","Motivation","Paralyzed","Parry","Penetrate","Plunder","Poisoned","Powerful","Proficience","Puncture","Quicken","Rage","Revitalize","Roshambo","Severe Burning","Sleep","Slow","Smurf","Specialist","Spray","Storage","Stricken","Stun","Suppress","Sure Shot","Throttle","Toxin","Warlord","Weaken","Wind-up","Wither"]

const RE_ADVANCED_ARMOR = ["Riot","Assault","Dune","Delta","Marauder","EOD"];


const onlineIcon = `<svg xmlns="http://www.w3.org/2000/svg" filter="" fill="url(&quot;#svg_status_online&quot;)" stroke="#fff" stroke-width="0" width="13" height="13" viewBox="-1.5 -1.2 14 14"><path d="M0,6a6,6,0,1,1,6,6A6,6,0,0,1,0,6Z"></path></svg>`;
const idleIcon = `<svg xmlns="http://www.w3.org/2000/svg" filter="" fill="url(&quot;#svg_status_idle&quot;)" stroke="#fff" stroke-width="0" width="13" height="13" viewBox="-1.5 -1.2 14 14"><g xmlns="http://www.w3.org/2000/svg"><path d="M0,6a6,6,0,1,1,6,6A6,6,0,0,1,0,6Z"></path><path d="M5,3V7H9V6H6V3Z" fill="#f2f2f2"></path></g></svg>`;
const offlineIcon = `<svg xmlns="http://www.w3.org/2000/svg" filter="" fill="url(&quot;#svg_status_offline&quot;)" stroke="#fff" stroke-width="0" width="13" height="13" viewBox="-1.5 -1.2 14 14"><g xmlns="http://www.w3.org/2000/svg"><path d="M0,6a6,6,0,1,1,6,6A6,6,0,0,1,0,6Z"></path><path d="M3,5H9V7H3Z" fill="#f2f2f2"></path></g></svg>`;    


const RW_FILTER = "ranked_war_filter";
const TT_STATS = "territory_war_spies";
const FACTION_FILTER = "faction_profile_filter";
const MEMBERLIST_SPIES = "faction_profile_spies";
const RAID_FILTER = "raid_war_filter";
const A_FILTER = "auction_filter";
const CITY_FINDS = "city_finds";
const CT_HELPER = "christmas_town_helper";
const TS_GRAPH = "torn_stats_graph";
const QUICK_ITEMS = "quick_items";
const QUICK_JAIL = "quick_jail";
const PROFILE_STATS = "profile_stats";
const CONNECT = "connect";
const QUICK_CRIMES = "quick_crimes";

const SI_PREFIXES = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'K' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 't' },
    { value: 1e15, symbol: 'q' },
    { value: 1e18, symbol: 'Q' },
    { value: 1e21, symbol: 's' },
    { value: 1e24, symbol: 'S' }
  ]