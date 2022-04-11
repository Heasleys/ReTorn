var settings; // global variable for other files to use
var loc = window.location.href.split('.com/').pop().split('.php').shift().trim().toLowerCase();


chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
  if (response.status == true) {
    if (response.value.re_settings) {
      settings = response.value.re_settings;
      let root = document.documentElement;
      if (settings.header_color != undefined) {
        let color = settings.header_color;
        let color_two;
        if (wc_hex_is_light(color)) {
          color_two = pSBC(-0.15, color);
        } else {
          color_two = pSBC(0.013, color);
        }

        root.style.setProperty('--re-header-color', color);
        root.style.setProperty('--re-header-color-two', color_two);
      }

      if (settings.leftalign != undefined && settings.leftalign == true) {
        root.style.setProperty('--re-leftalign', "20px");
      }

      if (settings.torn3d != undefined && settings.torn3d == true) {
        $( document ).ready(function() {
          var ss = document.createElement("script");
          ss.src = chrome.runtime.getURL("/js/everywhere/torn3d.js");
          (document.head || document.documentElement).appendChild(ss);
        });
      }

    }
  }
});

function insertHeader(element, where, classes) {
  if ($('div.re_container').length == 0) {
    var header = `
    <div class="re_container `+classes+`">
      <div class="re_head">
        <span class="re_title noselect"><span class="re_logo"><span class="re_yellow">Re</span>Torn: </span><span id="re_title"></span></span>
          <div class="re_icon_wrap">
            <span class="re_icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
            </span>
          </div>
      </div>
      <div class="re_content" style="display: none;">

      </div>
    </div>`;
    switch (where) {
      case 'append':
        element.append(header);
      break;
      case 'prepend':
        element.prepend(header);
      break;
      case 'after':
        element.after(header);
      break;
      case 'before':
        element.before(header);
      break;
    }

    if (loc != 'gym') {
      if (settings && settings.headers && settings.headers[loc] && settings.headers[loc].expanded == true) {
        $(".re_head").addClass("expanded");
        $("div.re_content").show();
      }
    }


    $(".re_head").click(function() {
        $(this).toggleClass("expanded");
        $(this).next("div.re_content").slideToggle("fast");
        $(this).find("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
        let expanded = $(this).hasClass("expanded");
        if (loc != "gym") { //disable saving for header on gym because tornstats graph
          chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {headers: {[loc]: {expanded: expanded}}}});
        }
    });

    if ($('div.re_content').is(":visible")) {
      $('span.re_icon').addClass('arrow_down');
    } else {
      $('span.re_icon').addClass('arrow_right');
    }
  }
}


/* Inject FetchIntercept via js/everywhere/interceptFetch.js into Torn page */
var ss = document.createElement("script");
ss.src = chrome.runtime.getURL("/js/everywhere/interceptFetch.js");
(document.head || document.documentElement).appendChild(ss);

/* Create customEvent to communicate with content script/extension */
ss.onload = function(){
  var url=chrome.runtime.getURL("/js/everywhere/interceptFetch.js");
  var evt=document.createEvent("CustomEvent");
  evt.initCustomEvent("re_fetchInject", true, true, url);
  document.dispatchEvent(evt);
};



function getScreenType() {
  let element = document.querySelector('body');
  let styles = window.getComputedStyle(element,':before')
  let content = styles['content'];
  return content.replaceAll(`"`,``);
}



//Function to return colors darker/lighter/blended - https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
//Version 4.0
const pSBC=(p,c0,c1,l)=>{
	let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
	if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
	if(!this.pSBCr)this.pSBCr=(d)=>{
		let n=d.length,x={};
		if(n>9){
			[r,g,b,a]=d=d.split(","),n=d.length;
			if(n<3||n>4)return null;
			x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
		}else{
			if(n==8||n==6||n<4)return null;
			if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
			d=i(d.slice(1),16);
			if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
			else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
		}return x};
	h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
	if(!f||!t)return null;
	if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
	else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
	a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
	if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
	else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}

function wc_hex_is_light(color) {
    const hex = color.replace('#', '');
    const c_r = parseInt(hex.substr(0, 2), 16);
    const c_g = parseInt(hex.substr(2, 2), 16);
    const c_b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
    return brightness > 155; //originally 155
}

function timeDifference(current, previous) {

  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;

  if (elapsed < msPerMinute) {
       return Math.round(elapsed/1000) + ' seconds ago';
  }

  else if (elapsed < msPerHour) {
       return Math.round(elapsed/msPerMinute) + ' minutes ago';
  }

  else if (elapsed < msPerDay ) {
       return Math.round(elapsed/msPerHour ) + ' hours ago';
  }

  else if (elapsed < msPerMonth) {
      return '' + Math.round(elapsed/msPerDay) + ' days ago';
  }

  else if (elapsed < msPerYear) {
      return '' + Math.round(elapsed/msPerMonth) + ' months ago';
  }

  else {
      return '' + Math.round(elapsed/msPerYear ) + ' years ago';
  }
}
