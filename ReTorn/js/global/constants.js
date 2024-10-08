const RE_ITEM_CATEGORIES = ["Alcohol","Artifact", "Book", "Booster", "Candy", "Car", "Clothing", "Collectible", "Defensive", "Drug", "Energy Drink", "Enhancer", "Flower", "Jewelry", "Materials", "Medical", "Melee", "Other", "Plushie", "Primary", "Secondary", "Special", "Supply Pack", "Temporary", "Tools", "Unused", "Virus"];

const RE_WEAPON_CATEGORIES = ["Primary", "Secondary", "Melee", "Temporary"];

const RE_WEAPON_TYPES = ["Clubbing", "Heavy Artillery", "Machine Gun", "Mechanical", "Piercing", "Pistol", "Rifle", "Shotgun", "Slashing", "SMG"];

const RE_WEAPON_BONUSES = ["Achilles","Assassinate","Backstab","Berserk","Bleed","Blindfire","Blindside","Bloodlust","Burning","Comeback","Conserve","Cripple","Crusher","Cupid","Deadeye","Deadly","Demoralized","Disarm","Double Tap","Double-edged","Emasculate","Empower","Eviscerate","Execute","Expose","Finale","Focus","Freeze","Frenzy","Fury","Grace","Hazardous","Home Run","Irradiate","Laceration","Motivation","Paralyzed","Parry","Penetrate","Plunder","Poisoned","Powerful","Proficience","Puncture","Quicken","Rage","Revitalize","Roshambo","Severe Burning","Shock","Sleep","Slow","Smurf","Specialist","Spray","Storage","Stricken","Stun","Suppress","Sure Shot","Throttle","Toxin","Warlord","Weaken","Wind-up","Wither"]

const RE_ADVANCED_ARMOR = ["Riot","Assault","Dune","Delta","Marauder","Sentinel","Vanguard","EOD"];


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


const CACHE_NAMES_TO_ID = {
  "Armor Cache": "1118",
  "Melee Cache": "1119",
  "Small Arms Cache": "1120",
  "Medium Arms Cache": "1121",
  "Heavy Arms Cache": "1122"
}

const OUTDATED_TIMESTAMP = 25920000000; // 9 months


const PERSONALSTATS = [
    {key: "attackswon", name: "Attacks Won"},
    {key: "attackslost", name: "Attacks Lost"},
    {key: "attacksdraw", name: "Attacks Stalemated"},
    {key: "bestkillstreak", name: "Best Kill Streak"},
    {key: "moneymugged", name: "Money Mugged"},
    {key: "attacksstealthed", name: "Stealth Attacks"},
    {key: "attackhits", name: "Hits"},
    {key: "attackmisses", name: "Misses"},
    {key: "attackcriticalhits", name: "Critical Hits"},
    {key: "respectforfaction", name: "Total Respect Gained"},
    {key: "defendswon", name: "Defends Won"},
    {key: "defendslost", name: "Defends Lost"},
    {key: "defendsstalemated", name: "Defends Stalemated"},
    {key: "roundsfired", name: "Rounds Fired"},
    {key: "yourunaway", name: "Times Ran Away"},
    {key: "theyrunaway", name: "Foes Ran Away"},
    {key: "highestbeaten", name: "Highest Level Beaten"},
    {key: "largestmug", name: "Largest Mug"},
    {key: "attacksassisted", name: "Attacks Assisted"},
    {key: "unarmoredwon", name: "Unarmored Won"},
    {key: "arrestsmade", name: "Arrests Made"},
    {key: "attackdamage", name: "Damage Done"},
    {key: "onehitkills", name: "One Hit Kills"},
    {key: "bestdamage", name: "Best Damage Made"},
    {key: "specialammoused", name: "Special Ammo Used"},
    {key: "hollowammoused", name: "Hollow Ammo used"},
    {key: "piercingammoused", name: "Piercing Ammo Used"},
    {key: "tracerammoused", name: "Tracer Ammo Used"},
    {key: "incendiaryammoused", name: "Incendiary Ammo Used"},
    {key: "attackswonabroad", name: "Attacks Won Abroad"},
    {key: "defendslostabroad", name: "Defends Lost Abroad"},
    {key: "retals", name: "Retaliations"},
    {key: "elo", name: "Elo Rating"},
    {key: "territoryjoins", name: "Territory Joins"},
    {key: "rankedwarhits", name: "Ranked War Hits"},
    {key: "raidhits", name: "Raid Hits"},
    {key: "territoryclears", name: "Territory clears"},
    {key: "bazaarcustomers", name: "Bazaar Customers"},
    {key: "bazaarsales", name: "Bazaar Sales"},
    {key: "bazaarprofit", name: "Bazaar Profit"},
    {key: "itemsbought", name: "Items Bought"},
    {key: "pointsbought", name: "Points Bought"},
    {key: "itemsboughtabroad", name: "Items Bought Abroad"},
    {key: "weaponsbought", name: "Weapons Bought"},
    {key: "itemssent", name: "Items Sent"},
    {key: "auctionswon", name: "Auctions Won"},
    {key: "auctionsells", name: "Items Auctioned"},
    {key: "pointssold", name: "Points Sold"},
    {key: "stockpayouts", name: "Stock Payouts"},
    {key: "cityitemsbought", name: "Shop Purchases"},
    {key: "peoplebusted", name: "People Busted"},
    {key: "failedbusts", name: "Failed Busts"},
    {key: "peoplebought", name: "People Bailed"},
    {key: "peopleboughtspent", name: "Bail Fees"},
    {key: "jailed", name: "Times Jailed"},
    {key: "revives", name: "Revives"},
    {key: "revivesreceived", name: "Revives Received"},
    {key: "medicalitemsused", name: "Medical Items Used"},
    {key: "hospital", name: "Times in Hospital"},
    {key: "bloodwithdrawn", name: "Blood Withdrawn"},
    {key: "reviveskill", name: "Revive Skill"},
    {key: "chahits", name: "Machinery"},
    {key: "axehits", name: "Clubbed Weapons"},
    {key: "grehits", name: "Temporary Weapons"},
    {key: "pishits", name: "Pistols"},
    {key: "rifhits", name: "Rifles"},
    {key: "smghits", name: "Sub Machine Gun"},
    {key: "piehits", name: "Piercing Weapons"},
    {key: "slahits", name: "Slashing Weapons"},
    {key: "machits", name: "Machine Guns"},
    {key: "shohits", name: "Shotguns"},
    {key: "heahits", name: "Heavy Artillery"},
    {key: "h2hhits", name: "Hand to Hand"},
    {key: "personalsplaced", name: "Personals Placed"},
    {key: "classifiedadsplaced", name: "Classified Ads Placed"},
    {key: "mailssent", name: "Mails Sent"},
    {key: "friendmailssent", name: "Mails Sent to Friends"},
    {key: "factionmailssent", name: "Mails Sent to Faction"},
    {key: "companymailssent", name: "Mails Sent to Colleagues"},
    {key: "spousemailssent", name: "Mails Sent to Spouse"},
    {key: "selling_illegal_products", name: "Selling Illegal Goods (Crimes 1.0)"},
    {key: "theft", name: "Theft"},
    {key: "auto_theft", name: "Auto Theft (Crimes 1.0)"},
    {key: "drug_deals", name: "Drug Deals (Crimes 1.0)"},
    {key: "computer_crimes", name: "Computer Crimes (Crimes 1.0)"},
    {key: "murder", name: "Murder (Crimes 1.0)"},
    {key: "fraud_crimes", name: "Fraud (Crimes 1.0)"},
    {key: "other", name: "Other (Crimes 1.0)"},
    {key: "total_crimes", name: "Criminal Offences"},
    {key: "organisedcrimes", name: "Organised Crimes"},
    {key: "vandalism", name: "Vandalism"},
    {key: "counterfeiting", name: "Counterfeiting"},
    {key: "fraud", name: "Fraud"},
    {key: "illicitservices", name: "Illicit Services"},
    {key: "cybercrime", name: "Cybercrime"},
    {key: "extortion", name: "Extortion"},
    {key: "illegalproduction", name: "Illegal Production"},
    {key: "bountiesplaced", name: "Bounties Placed"},
    {key: "bountiesreceived", name: "Bounties Received"},
    {key: "bountiescollected", name: "Bounties Collected"},
    {key: "totalbountyreward", name: "Money Rewarded"},
    {key: "totalbountyspent", name: "Spent on Bounties"},
    {key: "receivedbountyvalue", name: "Bounty Value Received"},
    {key: "virusescoded", name: "Viruses Coded"},
    {key: "cityfinds", name: "Items Found"},
    {key: "statenhancersused", name: "Stat Enhancers Used"},
    {key: "dumpfinds", name: "Items Found in Dump"},
    {key: "dumpsearches", name: "Dump Searches"},
    {key: "itemsdumped", name: "Items Trashed"},
    {key: "consumablesused", name: "Consumables Used"},
    {key: "candyused", name: "Candy Used"},
    {key: "alcoholused", name: "Alcohol Used"},
    {key: "energydrinkused", name: "Energy Drinks Used"},
    {key: "boostersused", name: "Boosters Used"},
    {key: "traveltimes", name: "Times Travelled"},
    {key: "argtravel", name: "Argentina"},
    {key: "mextravel", name: "Mexico"},
    {key: "dubtravel", name: "Dubai"},
    {key: "hawtravel", name: "Hawaii"},
    {key: "japtravel", name: "Japan"},
    {key: "lontravel", name: "United Kingdom"},
    {key: "soutravel", name: "South Africa"},
    {key: "switravel", name: "Switzerland"},
    {key: "chitravel", name: "China"},
    {key: "cantravel", name: "Canada"},
    {key: "caytravel", name: "Cayman Islands"},
    {key: "traveltime", name: "Time Spent Travelling"},
    {key: "drugsused", name: "Drugs Used"},
    {key: "overdosed", name: "Times Overdosed"},
    {key: "cantaken", name: "Cannabis Taken"},
    {key: "exttaken", name: "Ecstasy Taken"},
    {key: "lsdtaken", name: "LSD Taken"},
    {key: "shrtaken", name: "Shrooms Taken"},
    {key: "xantaken", name: "Xanax Taken"},
    {key: "victaken", name: "Vicodin Taken"},
    {key: "kettaken", name: "Ketamine Taken"},
    {key: "opitaken", name: "Opium Taken"},
    {key: "spetaken", name: "Speed Taken"},
    {key: "pcptaken", name: "PCP Taken"},
    {key: "rehabs", name: "Rehabilitations"},
    {key: "rehabcost", name: "Rehabilitation fees"},
    {key: "missionscompleted", name: "Missions Completed"},
    {key: "missioncreditsearned", name: "Mission Credits Earned"},
    {key: "contractscompleted", name: "Contracts Completed"},
    {key: "dukecontractscompleted", name: "Duke Contracts Completed"},
    {key: "useractivity", name: "User Activity"},
    {key: "trainsreceived", name: "Times Trained by Director"},
    {key: "meritsbought", name: "Merits Bought"},
    {key: "logins", name: "Logins"},
    {key: "daysbeendonator", name: "Days Been a Donator"},
    {key: "networth", name: "Networth"},
    {key: "refills", name: "Refills"},
    {key: "awards", name: "Awards"},
    {key: "nerverefills", name: "Nerve Refills"},
    {key: "tokenrefills", name: "Token Refills"},
    {key: "booksread", name: "Books Read"},
    {key: "territorytime", name: "Territory Time"},
    {key: "timesloggedin", name: "Times Logged In"},
    {key: "activestreak", name: "Active Streak"},
    {key: "bestactivestreak", name: "Best Active Streak"},
    {key: "jobpointsused", name: "Job Points Used"},
    {key: "itemslooted", name: "Items Looted"},
    {key: "rankedwarringwins", name: "Ranked warring wins"},
    {key: "racingpointsearned", name: "Racing Points Earned"},
    {key: "raceswon", name: "Races Won"},
    {key: "racesentered", name: "Races Entered"},
    {key: "racingskill", name: "Racing Skill"},
    {key: "networthitemmarket", name: "Networth Item Market"},
    {key: "networthenlistedcars", name: "Networth Enlisted Cars"}
]

const OBS_OPTIONS = {attributes: false, childList: true, characterData: false, subtree:true};
