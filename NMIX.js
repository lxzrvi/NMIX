/* =========================================================
   DOM / STATE
   ========================================================= */
const $=id=>document.getElementById(id),$$=s=>document.querySelectorAll(s),body=document.body;
const [n1,op,n2]=["num1","equations","num2"].map($),main=$("mainDisplay"),screen=$("mainscreen"),label=$("displayLabel"),date=$("clockDate"),status=$("status"),calc=$("calcKeys"),timer=$("Timerbtn"),clock=$("clockbtn"),sw=$("stopwatchbtn"),fs=$("fullscreenClockBtn"),fsExit=$("exitClockFullscreen"),plus=$("timerPlus"),minus=$("timerMinus"),add=$("addbtn"),sub=$("minusbtn"),reset=$("erasebtn"),random=$("randombtn"),start=$("btnStart"),share=$("btnShare"),back=$("btnBack"),landing=$("landingGroup"),actions=$("welcomeActions"),brand=$("brandBox"),logoSlot=$("headerLogoSlot"),bioLand=$("landingBioMessage"),bioMain=$("mainBioMessage"),menu=$("menuButton"),panel=$("settingsPanel"),menuClose=$("settingsClose"),backdrop=$("settingsBackdrop"),dark=$("darkModeToggle"),meta=$("themeMeta"),screenToggle=$("screenToggle"),themes=$$(".theme-option"),fonts=$$(".font-option"),sections=$$(".tool-section"),bars=$$(".section-bar");
const MAX=18,HOLD=520,IDLE=4200,colors={green:"#319b79",blue:"#348bb8",purple:"#8a62c8",orange:"#d57d35",rose:"#c85878"},fontNames=["poppins","inter","outfit","nunito","quicksand"];
let started=false,moving=false,mode="idle",target="num1",timerSec=10,timerRun=false,timerInt=null,swMs=0,swRun=false,swInt=null,clockInt=null,count=0,idleInt=null,full=false,bioIndex=0,screenClosed=false;
screen.style.fontVariantNumeric="tabular-nums";$$(".copyrightYear").forEach(e=>e.textContent=new Date().getFullYear());

/* =========================================================
   STORAGE / APPEARANCE
   ========================================================= */
const get=k=>{try{return localStorage.getItem(k)}catch{return null}},save=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
function themeSet(v,s=true){if(!colors[v])v="green";body.dataset.theme=v;themes.forEach(x=>x.classList.toggle("active",x.dataset.theme===v));meta?.setAttribute("content",colors[v]);if(s)save("nmix-theme",v)}
function fontSet(v,s=true){if(!fontNames.includes(v))v="poppins";body.dataset.font=v;fonts.forEach(x=>x.classList.toggle("active",x.dataset.font===v));if(s)save("nmix-font",v)}
function darkSet(v,s=true){body.classList.toggle("dark-mode",v);dark.classList.toggle("active",v);dark.setAttribute("aria-checked",v);if(s)save("nmix-dark",v?"1":"0")}
themeSet(get("nmix-theme")||"green",false);fontSet(get("nmix-font")||"poppins",false);
const sd=get("nmix-dark");darkSet(sd!==null?sd==="1":!!matchMedia?.("(prefers-color-scheme:dark)").matches,false);
themes.forEach(x=>x.onclick=()=>{themeSet(x.dataset.theme);activity("Color theme changed.","success")});fonts.forEach(x=>x.onclick=()=>{fontSet(x.dataset.font);activity("Font changed.","success")});dark.onclick=()=>{let v=!body.classList.contains("dark-mode");darkSet(v);activity(`${v?"Dark":"Light"} mode enabled.`,"success")};

/* =========================================================
   SETTINGS / SCREEN TOGGLE
   ========================================================= */
function settings(v){body.classList.toggle("settings-open",v);menu.setAttribute("aria-expanded",v);panel.setAttribute("aria-hidden",!v)}
menu.onclick=()=>settings(!body.classList.contains("settings-open"));menuClose.onclick=backdrop.onclick=()=>settings(false);
function collapseScreen(v){screenClosed=v;body.classList.toggle("screen-collapsed",v);screenToggle.setAttribute("aria-expanded",String(!v));screenToggle.setAttribute("aria-label",v?"Show top screen":"Hide top screen");if(v)settings(false)}
const ensureScreenOpen=()=>{if(screenClosed)collapseScreen(false)};
screenToggle.onclick=()=>collapseScreen(!screenClosed);
document.addEventListener("keydown",e=>{if(e.key==="Escape"){settings(false);if(full)leaveFull()}});

/* =========================================================
   PROTECTION / ACTIVITY
   ========================================================= */
document.addEventListener("contextmenu",e=>{if(e.target.closest("button,.skill-chip,#calc"))e.preventDefault()});document.addEventListener("dragstart",e=>{if(e.target.closest("button"))e.preventDefault()});[n1,op,n2].forEach(x=>{x.onpointerdown=e=>e.preventDefault();x.onfocus=()=>x.blur()});
function wake(){if(full)return;body.classList.add("screen-active");clearTimeout(idleInt);idleInt=setTimeout(()=>body.classList.remove("screen-active"),IDLE)}
function activity(msg,type="info"){if(msg!=null){status.textContent=msg;status.className=`status-${type}`}wake()}
const tell=activity;
function display(v,l=null,a=true){screen.textContent=String(v);if(l!==null)label.textContent=l;if(a){screen.classList.remove("display-update");requestAnimationFrame(()=>screen.classList.add("display-update"))}}

/* =========================================================
   ACCORDIONS
   Any label automatically restores the top screen.
   ========================================================= */
function sectionSet(x,v){x.classList.toggle("open",v);x.querySelector(".section-bar")?.setAttribute("aria-expanded",v)}
bars.forEach(bar=>bar.onclick=()=>{ensureScreenOpen();const x=bar.closest(".tool-section"),open=!x.classList.contains("open");sections.forEach(s=>sectionSet(s,false));if(open)sectionSet(x,true);tell(open?`${bar.querySelector(".bar-copy strong")?.textContent||"Section"} opened.`:"Section closed.")});

/* =========================================================
   MODE HELPERS
   ========================================================= */
function modeBtn(x){[timer,clock,sw].forEach(b=>b.classList.toggle("mode-active",b===x))}
const hideTimer=()=>body.classList.remove("timer-mode");
function stopClock(){clearInterval(clockInt);clockInt=null}function pauseTimer(m=false){clearInterval(timerInt);timerInt=null;timerRun=false;if(m)tell("Timer paused. Hold Timer to continue.","warning")}function pauseSw(m=false){clearInterval(swInt);swInt=null;swRun=false;if(m)tell("Stopwatch paused. Tap again to continue.","warning")}function stopTools(){pauseTimer();pauseSw();stopClock()}

/* =========================================================
   CALCULATOR
   ========================================================= */
function openCalc(){ensureScreenOpen();body.classList.add("calc-open");hideTimer();mode="calculator";modeBtn(null);label.textContent="CALCULATOR"}
const input=()=>target==="num2"?n2:n1,ready=()=>!!(n1.value&&op.value&&n2.value);
function calcStatus(){if(ready())return tell("Ready — tap = or tap the large result screen.","success");if(n1.value&&op.value)return tell("Enter the second number.");if(n1.value)return tell("Choose an operator.");tell("Enter your first number.")}
function calculate(){openCalc();if(!n1.value||!n2.value){display("Incomplete","CALCULATOR");return tell("Enter both numbers first.","error")}const a=+n1.value,b=+n2.value;if(!Number.isFinite(a)||!Number.isFinite(b)){display("Error","CALCULATOR");return tell("Invalid number.","error")}let r;switch(op.value){case "+":r=a+b;break;case "-":case "−":r=a-b;break;case "×":r=a*b;break;case "÷":if(!b){display("Error","CALCULATOR");return tell("Division by zero is not allowed.","error")}r=a/b;break;case "%":if(!b){display("Error","CALCULATOR");return tell("Remainder by zero is not allowed.","error")}r=a%b;break;default:display("No sign","CALCULATOR");return tell("Choose an operator.","error")}if(!Number.isFinite(r)){display("Overflow","CALCULATOR");return tell("Result is too large.","error")}display(Number(r.toPrecision(12)),"RESULT");tell("Calculation complete.","success")}
function screenAction(){if(full)return;if(mode==="calculator")return ready()?calculate():tell("Fill both numbers and select an operator first.","warning");if(mode==="timer")return tell(timerRun?"Timer is running.":"Hold Timer to start or resume.",timerRun?"success":"info");if(mode==="stopwatch")return tell(swRun?"Stopwatch is running.":"Tap Stopwatch to start.",swRun?"success":"info");tell("Choose a tool below.")}
main.onclick=screenAction;main.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();screenAction()}};
calc.onclick=e=>{const b=e.target.closest(".btn");if(!b)return;stopTools();openCalc();const a=b.dataset.action,v=b.dataset.value;
if(b.classList.contains("number-btn")){const x=input();if(x.value.length>=MAX)return tell("Maximum number length reached.","warning");x.value+=v;display(x.value,target==="num1"?"FIRST NUMBER":"SECOND NUMBER");return calcStatus()}
if(a==="operator"){if(!n1.value)return tell("Enter the first number before selecting an operator.","warning");op.value=v;target="num2";display(v,"OPERATOR");return tell(`${b.textContent.trim()} selected. Enter the second number.`)}
if(a==="equal")return calculate();
if(a==="decimal"){const x=input();if(x.value.includes("."))return tell("This number already contains a decimal.","error");x.value+=x.value?".":"0.";display(x.value,"DECIMAL");return calcStatus()}
if(a==="toggle-sign"){const x=input();if(!x.value)return tell("Enter a number before using ±.","warning");x.value=String(-Number(x.value));display(x.value,"SIGN CHANGED");return calcStatus()}
if(a==="backspace"){const x=input();if(x.value){x.value=x.value.slice(0,-1);display(x.value||"0","EDITING")}else if(target==="num2"&&op.value){op.value="";target="num1"}return calcStatus()}
if(a==="clear"){n1.value=op.value=n2.value="";target="num1";display("Ready","CALCULATOR");tell("Calculator cleared.","warning")}};

/* =========================================================
   TIMER
   ========================================================= */
const timerFormat=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`,renderTimer=(a=false)=>display(timerFormat(timerSec),"TIMER",a);
function toggleTimer(){if(timerRun)return pauseTimer(true);if(timerSec<=0)return tell("Add five seconds before starting.","warning");timerRun=true;tell("Timer running. Hold Timer to pause.","success");timerInt=setInterval(()=>{timerSec=Math.max(0,timerSec-1);renderTimer();if(!timerSec){pauseTimer();tell("Time's up!","error")}},1000)}
plus.onclick=()=>{if(mode==="timer"){timerSec+=5;renderTimer(true);tell("Five seconds added.","success")}};minus.onclick=()=>{if(mode!=="timer")return;timerSec=Math.max(0,timerSec-5);renderTimer(true);if(!timerSec){pauseTimer();tell("Timer is at zero.","warning")}else tell("Five seconds removed.","success")};

/* =========================================================
   CLOCK / FULLSCREEN
   ========================================================= */
const time=()=>new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"}),dateText=()=>new Date().toLocaleDateString([],{weekday:"long",day:"numeric",month:"long",year:"numeric"});
function renderClock(a=false){display(time(),full?"NMIX • LOCAL TIME":"LIVE CLOCK",a);date.textContent=dateText()}
function startClock(m=true){ensureScreenOpen();pauseTimer();pauseSw();stopClock();hideTimer();body.classList.remove("calc-open");mode="clock";modeBtn(clock);renderClock(true);clockInt=setInterval(()=>renderClock(),1000);if(m)tell("Live clock is active.","success")}
clock.onclick=e=>{if(!e.target.closest("#fullscreenClockBtn"))startClock()};
async function browserFull(on){try{if(on&&!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else if(!on&&document.fullscreenElement)await document.exitFullscreen?.()}catch{}}
function enterFull(){full=true;settings(false);stopTools();body.classList.remove("calc-open","timer-mode","screen-active");body.classList.add("clock-fullscreen");mode="clock";modeBtn(clock);renderClock();clockInt=setInterval(()=>renderClock(),1000);browserFull(true)}
function leaveFull(browser=false){if(!full)return;full=false;body.classList.remove("clock-fullscreen");stopClock();mode="clock";modeBtn(clock);display(time(),"LIVE CLOCK",true);date.textContent="";clockInt=setInterval(()=>display(time(),"LIVE CLOCK",false),1000);tell("Returned to NMIX clock.");if(!browser)browserFull(false)}
fs.onclick=e=>{e.preventDefault();e.stopPropagation();enterFull()};fs.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();enterFull()}};fsExit.onclick=()=>leaveFull();document.addEventListener("fullscreenchange",()=>{if(full&&!document.fullscreenElement)leaveFull(true)});

/* =========================================================
   STOPWATCH / TAP-HOLD
   ========================================================= */
function swFormat(ms){const t=Math.floor(ms/1000);return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}.${String(Math.floor(ms%1000/10)).padStart(2,"0")}`}
function renderSw(){screen.textContent=swFormat(swMs);label.textContent="STOPWATCH"}function startSw(){if(swRun)return;swRun=true;const base=performance.now()-swMs;swInt=setInterval(()=>{swMs=performance.now()-base;renderSw()},30);tell("Stopwatch running.","success")}function resetSw(){pauseSw();swMs=0;renderSw();tell("Stopwatch reset.","warning")}
function tapHold(el,tap,hold){let id=null,held=false,p=null;const clear=()=>{clearTimeout(id);id=null;el.classList.remove("pressing");p=null};el.onpointerdown=e=>{if(e.pointerType==="mouse"&&e.button)return;p=e.pointerId;held=false;el.classList.add("pressing");try{el.setPointerCapture(p)}catch{}id=setTimeout(()=>{held=true;id=null;hold()},HOLD)};el.onpointerup=e=>{if(p!==null&&p!==e.pointerId)return;const t=id!==null&&!held;clear();if(t)tap();held=false};el.onpointercancel=()=>{clear();held=false}}
function timerMode(){ensureScreenOpen();stopClock();pauseSw();body.classList.remove("calc-open");body.classList.add("timer-mode");mode="timer";modeBtn(timer);renderTimer(true)}tapHold(timer,()=>{timerMode();tell("Use − / + for five seconds. Hold Timer to start.")},()=>{timerMode();toggleTimer()});
function swMode(){ensureScreenOpen();pauseTimer();stopClock();hideTimer();body.classList.remove("calc-open");mode="stopwatch";modeBtn(sw)}tapHold(sw,()=>{swMode();swRun?pauseSw(true):startSw()},()=>{swMode();resetSw()});

/* =========================================================
   COUNTERS
   ========================================================= */
function counterMode(){ensureScreenOpen();stopTools();hideTimer();body.classList.remove("calc-open");modeBtn(null);mode="counter";label.textContent="COUNTER"}const renderCount=()=>display(count,"COUNTER");
function rapid(btn,action,msg){let h=null,r=null,held=false,d=180,p=null;const run=()=>{action();renderCount();d=Math.max(45,d*.87);r=setTimeout(run,d)},clear=()=>{clearTimeout(h);clearTimeout(r);h=r=null;btn.classList.remove("pressing");p=null};btn.onpointerdown=e=>{if(e.pointerType==="mouse"&&e.button)return;counterMode();held=false;d=180;p=e.pointerId;btn.classList.add("pressing");try{btn.setPointerCapture(p)}catch{}h=setTimeout(()=>{held=true;action();renderCount();tell(msg,"success");run()},HOLD)};btn.onpointerup=e=>{if(p!==null&&p!==e.pointerId)return;if(!held){action();renderCount();tell(msg,"success")}clear();held=false};btn.onpointercancel=()=>{clear();held=false}}
rapid(add,()=>count++,"Counter increased.");rapid(sub,()=>count=Math.max(0,count-1),"Counter decreased.");rapid(random,()=>count=Math.floor(Math.random()*1000)+1,"Random number generated.");reset.onclick=()=>{counterMode();count=0;renderCount();tell("Counter reset to zero.","warning")};

/* =========================================================
   BIO
   ========================================================= */
const bios=["I'm currently doing a diploma in web development and building my skills step by step.","I'm learning HTML, CSS and JavaScript and understanding more about how real websites work.","I enjoy taking small ideas and turning them into projects that I can improve as I learn more.","I'm learning responsive design, interfaces and how to make websites feel smoother and easier to use.","I keep experimenting with new web development concepts so I can improve with every project I build.","NMIX is one of my projects for practising JavaScript logic, useful tools, interaction and interface design."];
function bioAnimate(el,msg){el.classList.remove("bio-enter");requestAnimationFrame(()=>{el.textContent=msg;el.classList.add("bio-enter")})}bioLand.classList.add("bio-enter");bioMain.classList.add("bio-enter");const bioInt=setInterval(()=>{bioIndex=(bioIndex+1)%bios.length;bioAnimate(bioLand,bios[bioIndex]);bioAnimate(bioMain,bios[bioIndex])},6800);

/* =========================================================
   LOGO / START / BACK
   ========================================================= */
const frames=f=>requestAnimationFrame(()=>requestAnimationFrame(f));
function moveLogo(dock){const a=brand.getBoundingClientRect();brand.classList.remove("logo-moving");brand.style.transform="none";if(dock){logoSlot.appendChild(brand);body.classList.add("logo-docked")}else{landing.insertBefore(brand,actions);body.classList.remove("logo-docked")}const b=brand.getBoundingClientRect();if(!b.width||!b.height)return;brand.style.transform=`translate3d(${a.left-b.left}px,${a.top-b.top}px,0) scale(${a.width/b.width},${a.height/b.height})`;frames(()=>{brand.classList.add("logo-moving");brand.style.transform="translate3d(0,0,0) scale(1)"})}
start.onclick=()=>{if(started||moving)return;moving=started=true;collapseScreen(false);body.classList.remove("app-reversing","landing-ready","landing-hidden","calc-open","timer-mode");mode="idle";target="num1";modeBtn(null);display("Ready","NMIX LIVE",false);moveLogo(true);frames(()=>body.classList.add("app-started"));setTimeout(()=>{body.classList.add("landing-hidden");moving=false;tell("Choose a tool below. NMIX is ready.","success")},1100)};
back.onclick=()=>{if(!started||moving)return;moving=true;settings(false);stopTools();collapseScreen(false);if(full){full=false;body.classList.remove("clock-fullscreen");browserFull(false)}clearTimeout(idleInt);body.classList.remove("screen-active","calc-open","timer-mode","landing-hidden");body.classList.add("app-reversing");sections.forEach(x=>sectionSet(x,false));moveLogo(false);frames(()=>body.classList.remove("app-started"));setTimeout(()=>body.classList.add("landing-ready"),650);setTimeout(()=>{body.classList.remove("app-reversing","landing-ready");brand.classList.remove("logo-moving");brand.style.transform="";mode="idle";started=false;moving=false},1250)};

/* =========================================================
   SHARE / CLEANUP / INITIAL
   ========================================================= */
share.onclick=async()=>{const d={title:"NMIX",text:"Check out NMIX — anything with numbers!",url:location.href};if(navigator.share){try{await navigator.share(d)}catch(e){if(e?.name!=="AbortError")console.error(e)}return}if(navigator.clipboard&&isSecureContext){try{await navigator.clipboard.writeText(location.href);alert("NMIX link copied to clipboard.");return}catch{}}alert("Sharing is not supported by this browser.")};
document.addEventListener("visibilitychange",()=>{if(!document.hidden){if(swRun)renderSw();if(mode==="clock")renderClock()}});
window.addEventListener("pagehide",()=>{clearInterval(timerInt);clearInterval(swInt);clearInterval(clockInt);clearInterval(bioInt);clearTimeout(idleInt)});
display("Ready","NMIX LIVE",false);status.textContent="Choose a tool below.";status.className="status-info";