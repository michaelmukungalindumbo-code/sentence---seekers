// ════════════════════════════════
// STORAGE (localStorage — works on CodePen & browsers)
// ════════════════════════════════
async function sGet(k,sh=false){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}}
async function sSet(k,v,sh=false){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
async function sDel(k,sh=false){try{localStorage.removeItem(k);}catch{}}
async function sList(p,sh=false){
  try{
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.startsWith(p))keys.push(k);
    }
    return keys;
  }catch{return[];}
}

// ════════════════════════════════
// CONSTANTS
// ════════════════════════════════
const COLORS=['#38BDF8','#F472B6','#34D399','#FBBF24','#A78BFA','#FB923C','#F87171','#67E8F9'];
const DIRS=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
const DIAG_DIRS=[[1,1],[1,-1],[-1,1],[-1,-1]];
const ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIFF={easy:{sz:8,n:4,mul:1},medium:{sz:9,n:5,mul:1.5},hard:{sz:10,n:6,mul:2}};
const BONUS_EVERY=3, BONUS_SEC=90;
const SCRAMBLE_EVERY=5;
const BOSS_EVERY=10;

// Determine level "type" by precedence — boss > scramble > bonus > normal
function getLevelType(level){
  if(level%BOSS_EVERY===0) return 'boss';
  if(level%SCRAMBLE_EVERY===0) return 'scramble';
  if(level%BONUS_EVERY===0) return 'bonus';
  return 'normal';
}
const LEVEL_META={
  normal:   {icon:'',    label:'',                 color:'#38BDF8'},
  bonus:    {icon:'🔥',  label:'BONUS ROUND',       color:'#FBBF24'},
  scramble: {icon:'🌀',  label:'SCRAMBLE LEVEL',    color:'#A78BFA'},
  boss:     {icon:'👑',  label:'BOSS LEVEL',        color:'#FBBF24'}
};

// ════════════════════════════════
// PUZZLES
// ════════════════════════════════
const PUZZLES=[
  {t:"Space Exploration",s:[
    {tpl:"The brave _PILOT_ guided the ship into _ORBIT_.",b:["PILOT","ORBIT"]},
    {tpl:"A glowing _COMET_ streaked past the _NEBULA_.",b:["COMET","NEBULA"]},
    {tpl:"Scientists launched a _PROBE_ toward the _LUNAR_ surface.",b:["PROBE","LUNAR"]}
  ],w:["PILOT","ORBIT","COMET","NEBULA","PROBE","LUNAR"]},
  {t:"Ancient Civilizations",s:[
    {tpl:"The great _PHARAOH_ ruled from a golden _THRONE_.",b:["PHARAOH","THRONE"]},
    {tpl:"Workers carved the _SPHINX_ beside the tall _OBELISK_.",b:["SPHINX","OBELISK"]},
    {tpl:"A clay _TABLET_ recorded the ancient _RITUAL_.",b:["TABLET","RITUAL"]}
  ],w:["PHARAOH","THRONE","SPHINX","OBELISK","TABLET","RITUAL"]},
  {t:"Deep Ocean",s:[
    {tpl:"The _DIVER_ spotted a giant _SQUID_ in the dark.",b:["DIVER","SQUID"]},
    {tpl:"A sunken _WRECK_ rested on a _CORAL_ reef.",b:["WRECK","CORAL"]},
    {tpl:"The _SONAR_ detected a _TRENCH_ miles below.",b:["SONAR","TRENCH"]}
  ],w:["DIVER","SQUID","WRECK","CORAL","SONAR","TRENCH"]},
  {t:"Detective Mystery",s:[
    {tpl:"The sharp _SLEUTH_ found a hidden _CLUE_ in the room.",b:["SLEUTH","CLUE"]},
    {tpl:"She took a _SAMPLE_ and checked every _ALIBI_.",b:["SAMPLE","ALIBI"]},
    {tpl:"The _MOTIVE_ pointed straight to the _CULPRIT_.",b:["MOTIVE","CULPRIT"]}
  ],w:["SLEUTH","CLUE","SAMPLE","ALIBI","MOTIVE","CULPRIT"]},
  {t:"Culinary Arts",s:[
    {tpl:"The head _CHEF_ whisked the silky _BATTER_ all morning.",b:["CHEF","BATTER"]},
    {tpl:"A pinch of _SPICE_ gave the rich _BROTH_ its depth.",b:["SPICE","BROTH"]},
    {tpl:"The golden _GLAZE_ dripped over the warm _PASTRY_.",b:["GLAZE","PASTRY"]}
  ],w:["CHEF","BATTER","SPICE","BROTH","GLAZE","PASTRY"]},
  {t:"Wildlife Safari",s:[
    {tpl:"A lone _CHEETAH_ chased prey across the _SAVANNA_.",b:["CHEETAH","SAVANNA"]},
    {tpl:"The young _RHINO_ cooled off at the muddy _LAGOON_.",b:["RHINO","LAGOON"]},
    {tpl:"Rangers tracked a rare _FALCON_ near the _CANYON_.",b:["FALCON","CANYON"]}
  ],w:["CHEETAH","SAVANNA","RHINO","LAGOON","FALCON","CANYON"]},
  {t:"Mountain Adventure",s:[
    {tpl:"The _CLIMBER_ fixed a _PITON_ into the icy wall.",b:["CLIMBER","PITON"]},
    {tpl:"A sudden _BLIZZARD_ buried the hidden _GLACIER_.",b:["BLIZZARD","GLACIER"]},
    {tpl:"They set up _CAMP_ just below the rocky _SUMMIT_.",b:["CAMP","SUMMIT"]}
  ],w:["CLIMBER","PITON","BLIZZARD","GLACIER","CAMP","SUMMIT"]},
  {t:"Modern Technology",s:[
    {tpl:"The new _SENSOR_ fed data to the central _SERVER_.",b:["SENSOR","SERVER"]},
    {tpl:"An AI _NEURAL_ network decoded the _SIGNAL_ instantly.",b:["NEURAL","SIGNAL"]},
    {tpl:"Engineers tested the _DRONE_ near the radio _TOWER_.",b:["DRONE","TOWER"]}
  ],w:["SENSOR","SERVER","NEURAL","SIGNAL","DRONE","TOWER"]},
  {t:"Musical Journey",s:[
    {tpl:"The _VIOLIN_ solo echoed through the grand _CONCERT_ hall.",b:["VIOLIN","CONCERT"]},
    {tpl:"She played a haunting _CHORD_ on her old _GUITAR_.",b:["CHORD","GUITAR"]},
    {tpl:"The steady _TEMPO_ was set by a booming _DRUM_.",b:["TEMPO","DRUM"]}
  ],w:["VIOLIN","CONCERT","CHORD","GUITAR","TEMPO","DRUM"]},
  {t:"Fairy Tale Kingdom",s:[
    {tpl:"The brave _KNIGHT_ crossed the enchanted _FOREST_.",b:["KNIGHT","FOREST"]},
    {tpl:"A wise _WIZARD_ cast a spell on the crumbling _CASTLE_.",b:["WIZARD","CASTLE"]},
    {tpl:"The hidden _POTION_ broke the ancient _CURSE_.",b:["POTION","CURSE"]}
  ],w:["KNIGHT","FOREST","WIZARD","CASTLE","POTION","CURSE"]},
  {t:"Science Lab",s:[
    {tpl:"The _CHEMIST_ poured a glowing _REAGENT_ into the flask.",b:["CHEMIST","REAGENT"]},
    {tpl:"Under the _LENS_, a tiny _MICROBE_ came into view.",b:["LENS","MICROBE"]},
    {tpl:"The _LASER_ beam split the _PRISM_ into rainbow light.",b:["LASER","PRISM"]}
  ],w:["CHEMIST","REAGENT","LENS","MICROBE","LASER","PRISM"]},
  {t:"Urban Legends",s:[
    {tpl:"Locals whispered about a _PHANTOM_ near the old _BRIDGE_.",b:["PHANTOM","BRIDGE"]},
    {tpl:"The _CIPHER_ carved in stone held a dark _OMEN_.",b:["CIPHER","OMEN"]},
    {tpl:"A grainy _PHOTO_ showed a strange _SHADOW_ in the alley.",b:["PHOTO","SHADOW"]}
  ],w:["PHANTOM","BRIDGE","CIPHER","OMEN","PHOTO","SHADOW"]},

  // ── NATURE & SCIENCE ──
  {t:"Volcanoes & Geology",s:[
    {tpl:"Hot _MAGMA_ surged through the _CRATER_ with great force.",b:["MAGMA","CRATER"]},
    {tpl:"The _TREMOR_ shook the ground as _LAVA_ began to flow.",b:["TREMOR","LAVA"]},
    {tpl:"Geologists studied the _BASALT_ rock near the _FISSURE_.",b:["BASALT","FISSURE"]}
  ],w:["MAGMA","CRATER","TREMOR","LAVA","BASALT","FISSURE"]},

  {t:"Rainforest",s:[
    {tpl:"A bright _TOUCAN_ perched high in the forest _CANOPY_.",b:["TOUCAN","CANOPY"]},
    {tpl:"The _JAGUAR_ stalked silently through the dense _JUNGLE_.",b:["JAGUAR","JUNGLE"]},
    {tpl:"Heavy _RAINFALL_ fed the winding _RIVER_ below.",b:["RAINFALL","RIVER"]}
  ],w:["TOUCAN","CANOPY","JAGUAR","JUNGLE","RAINFALL","RIVER"]},

  {t:"Human Body",s:[
    {tpl:"The _NEURON_ carried signals straight to the _BRAIN_.",b:["NEURON","BRAIN"]},
    {tpl:"Strong _MUSCLE_ tissue surrounds every _TENDON_ in the leg.",b:["MUSCLE","TENDON"]},
    {tpl:"The _PLASMA_ in our _BLOOD_ carries vital nutrients.",b:["PLASMA","BLOOD"]}
  ],w:["NEURON","BRAIN","MUSCLE","TENDON","PLASMA","BLOOD"]},

  {t:"Weather & Climate",s:[
    {tpl:"A powerful _TYPHOON_ brought heavy _RAINFALL_ to the coast.",b:["TYPHOON","RAINFALL"]},
    {tpl:"The _CLIMATE_ shift caused a record-breaking _DROUGHT_.",b:["CLIMATE","DROUGHT"]},
    {tpl:"Dark _CUMULUS_ clouds signalled an incoming _BLIZZARD_.",b:["CUMULUS","BLIZZARD"]}
  ],w:["TYPHOON","RAINFALL","CLIMATE","DROUGHT","CUMULUS","BLIZZARD"]},

  // ── HISTORY & CULTURE ──
  {t:"Medieval Knights",s:[
    {tpl:"The _KNIGHT_ raised his _SHIELD_ before the charging army.",b:["KNIGHT","SHIELD"]},
    {tpl:"Inside the stone _CASTLE_, the _SQUIRE_ polished every blade.",b:["CASTLE","SQUIRE"]},
    {tpl:"A royal _HERALD_ announced the start of the grand _JOUST_.",b:["HERALD","JOUST"]}
  ],w:["KNIGHT","SHIELD","CASTLE","SQUIRE","HERALD","JOUST"]},

  {t:"Pirates",s:[
    {tpl:"The cunning _PIRATE_ buried the _TREASURE_ on a hidden isle.",b:["PIRATE","TREASURE"]},
    {tpl:"They sailed the _GALLEON_ under a black _JOLLY_ flag.",b:["GALLEON","JOLLY"]},
    {tpl:"The ship's _COMPASS_ guided them past the deadly _REEF_.",b:["COMPASS","REEF"]}
  ],w:["PIRATE","TREASURE","GALLEON","JOLLY","COMPASS","REEF"]},

  {t:"Exploration & Discovery",s:[
    {tpl:"The bold _EXPLORER_ drew a new _COMPASS_ route across the map.",b:["EXPLORER","COMPASS"]},
    {tpl:"They crossed the _TUNDRA_ to reach the remote _GLACIER_.",b:["TUNDRA","GLACIER"]},
    {tpl:"A worn _JOURNAL_ recorded every _SUMMIT_ they conquered.",b:["JOURNAL","SUMMIT"]}
  ],w:["EXPLORER","COMPASS","TUNDRA","GLACIER","JOURNAL","SUMMIT"]},

  {t:"Greek Mythology",s:[
    {tpl:"Mighty _ZEUS_ hurled a _THUNDER_ bolt across the dark sky.",b:["ZEUS","THUNDER"]},
    {tpl:"The cunning _HERMES_ carried messages for every _ORACLE_.",b:["HERMES","ORACLE"]},
    {tpl:"Brave _THESEUS_ slew the fierce _MINOTAUR_ in the labyrinth.",b:["THESEUS","MINOTAUR"]}
  ],w:["ZEUS","THUNDER","HERMES","ORACLE","THESEUS","MINOTAUR"]},

  // ── FUN & POP ──
  {t:"Movies & Cinema",s:[
    {tpl:"The talented _DIRECTOR_ called action on the final _SCENE_.",b:["DIRECTOR","SCENE"]},
    {tpl:"A dramatic _TRAILER_ teased the thrilling _CLIMAX_ ahead.",b:["TRAILER","CLIMAX"]},
    {tpl:"The lead _ACTRESS_ won an _OSCAR_ for her stunning role.",b:["ACTRESS","OSCAR"]}
  ],w:["DIRECTOR","SCENE","TRAILER","CLIMAX","ACTRESS","OSCAR"]},

  {t:"Sports",s:[
    {tpl:"The fearless _STRIKER_ scored a goal in extra _STOPPAGE_ time.",b:["STRIKER","STOPPAGE"]},
    {tpl:"A swift _SPRINTER_ broke the world _RECORD_ on the track.",b:["SPRINTER","RECORD"]},
    {tpl:"The team's _CAPTAIN_ led them to a stunning _TROPHY_ win.",b:["CAPTAIN","TROPHY"]}
  ],w:["STRIKER","STOPPAGE","SPRINTER","RECORD","CAPTAIN","TROPHY"]},

  {t:"Video Games",s:[
    {tpl:"The skilled _PLAYER_ reached the final _DUNGEON_ at midnight.",b:["PLAYER","DUNGEON"]},
    {tpl:"Collecting every _POWER_ up unlocked the hidden _PORTAL_.",b:["POWER","PORTAL"]},
    {tpl:"The final _BATTLE_ against the _DRAGON_ lasted three hours.",b:["BATTLE","DRAGON"]}
  ],w:["PLAYER","DUNGEON","POWER","PORTAL","BATTLE","DRAGON"]},

  {t:"Superheroes",s:[
    {tpl:"The caped _HERO_ stopped the _VILLAIN_ on the rooftop.",b:["HERO","VILLAIN"]},
    {tpl:"Her incredible _POWER_ let her leap over every _SKYSCRAPER_.",b:["POWER","SKYSCRAPER"]},
    {tpl:"The _SHIELD_ deflected the blast saving the whole _CITY_.",b:["SHIELD","CITY"]}
  ],w:["HERO","VILLAIN","POWER","SKYSCRAPER","SHIELD","CITY"]},

  // ── EDUCATION ──
  {t:"Mathematics",s:[
    {tpl:"The student solved the _ALGEBRA_ problem using a simple _FORMULA_.",b:["ALGEBRA","FORMULA"]},
    {tpl:"A perfect _CIRCLE_ has an infinite number of lines of _SYMMETRY_.",b:["CIRCLE","SYMMETRY"]},
    {tpl:"The teacher plotted each _VECTOR_ on the graph with great _PRECISION_.",b:["VECTOR","PRECISION"]}
  ],w:["ALGEBRA","FORMULA","CIRCLE","SYMMETRY","VECTOR","PRECISION"]},

  {t:"World Geography",s:[
    {tpl:"The mighty _AMAZON_ river flows through a vast _RAINFOREST_.",b:["AMAZON","RAINFOREST"]},
    {tpl:"Mount _EVEREST_ stands as the tallest _SUMMIT_ on Earth.",b:["EVEREST","SUMMIT"]},
    {tpl:"The _SAHARA_ desert stretches across the African _CONTINENT_.",b:["SAHARA","CONTINENT"]}
  ],w:["AMAZON","RAINFOREST","EVEREST","SUMMIT","SAHARA","CONTINENT"]},

  {t:"Economics",s:[
    {tpl:"Rising _INFLATION_ reduced the buying _POWER_ of consumers.",b:["INFLATION","POWER"]},
    {tpl:"The _MARKET_ crash led to a sharp drop in _EXPORTS_.",b:["MARKET","EXPORTS"]},
    {tpl:"Central banks adjust the _INTEREST_ rate to control _GROWTH_.",b:["INTEREST","GROWTH"]}
  ],w:["INFLATION","POWER","MARKET","EXPORTS","INTEREST","GROWTH"]},

  {t:"Elements & Chemistry",s:[
    {tpl:"_OXYGEN_ and _HYDROGEN_ combine to form pure water.",b:["OXYGEN","HYDROGEN"]},
    {tpl:"The _PROTON_ sits at the core of every _NUCLEUS_ in an atom.",b:["PROTON","NUCLEUS"]},
    {tpl:"A _CATALYST_ speeds up the _REACTION_ without being consumed.",b:["CATALYST","REACTION"]}
  ],w:["OXYGEN","HYDROGEN","PROTON","NUCLEUS","CATALYST","REACTION"]}
];

// ════════════════════════════════
// STATE
// ════════════════════════════════
const G={
  mode:'solo', name:'', level:1, diff:'easy', score:0, streak:0, hints:3,
  themeIdx:0, levelType:'normal', bonLeft:BONUS_SEC, bonSecTotal:BONUS_SEC, bonIv:null,
  grid:[], words:[], sentences:[], found:new Set(),
  dragging:false, startCell:null, curCell:null, dragLine:null,
  roomCode:null, isHost:false, oppName:'', oppScore:0, oppFound:0, pollIv:null,
  customPuzzle:null, extraWords:[]
};

// ════════════════════════════════
// SCREEN NAV
// ════════════════════════════════
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById('s-'+id);
  if(el){el.classList.add('active');el.scrollTop=0;window.scrollTo(0,0);}
}

// ════════════════════════════════
// LEADERBOARD
// ════════════════════════════════
async function loadLB(){
  const keys=await sList('lb:',true);
  const rows=[];
  for(const k of keys){const v=await sGet(k,true);if(v)rows.push(v);}
  rows.sort((a,b)=>b.score-a.score);
  const el=document.getElementById('lb-list');
  if(!rows.length){el.innerHTML='<div class="lb-empty">No scores yet — be the first!</div>';return;}
  el.innerHTML=rows.slice(0,5).map((r,i)=>`
    <div class="lb-row">
      <div class="lb-rank">${['🥇','🥈','🥉','4.','5.'][i]}</div>
      <div class="lb-name">${r.name}</div>
      <div class="lb-score">${r.score.toLocaleString()}</div>
    </div>`).join('');
}
async function saveLB(name,score){
  const k='lb:'+name.toLowerCase().replace(/\s+/g,'-');
  const ex=await sGet(k,true);
  if(!ex||score>ex.score) await sSet(k,{name,score},true);
}

// ════════════════════════════════
// NAME GATE
// ════════════════════════════════
let _pendingAction=null;
function requireName(fn){
  if(G.name){fn();return;}
  _pendingAction=fn;
  show('name');
  const inp=document.getElementById('name-inp');
  inp.value='';
  setTimeout(()=>inp.focus(),300);
  const btn=document.getElementById('name-go');
  btn.onclick=()=>{
    const n=inp.value.trim();
    if(!n){inp.style.borderColor='var(--red)';return;}
    G.name=n;
    if(_pendingAction){_pendingAction();_pendingAction=null;}
  };
  inp.onkeydown=e=>{if(e.key==='Enter')btn.click();};
}

// ════════════════════════════════
// SOLO
// ════════════════════════════════
function goSolo(){
  requireName(()=>{
    G.mode='solo';G.level=1;G.score=0;G.themeIdx=0;
    document.getElementById('diff-bar').style.display='flex';
    document.getElementById('vs-bar').classList.remove('on');
    show('game');
    build();
  });
}

// ════════════════════════════════
// VS MODE
// ════════════════════════════════
function goVS(){requireName(()=>{G.mode='vs';show('vs');renderVSChoose();});}

function renderVSChoose(){
  document.getElementById('vs-body').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:10px;width:100%;">
      <button class="btn btn-sky" onclick="createRoom()">Create Room</button>
      <div style="text-align:center;color:var(--muted);font-size:12px;">— or join one —</div>
      <div class="join-row">
        <input class="code-input" id="vs-join-inp" placeholder="XXXXX" maxlength="5" autocomplete="off" spellcheck="false" style="user-select:auto;-webkit-user-select:auto;">
        <button class="btn btn-ghost" style="width:auto;padding:12px 16px;" onclick="joinRoom()">Join</button>
      </div>
      <div class="status-msg" id="vs-status"></div>
    </div>`;
  document.getElementById('vs-join-inp').addEventListener('input',e=>e.target.value=e.target.value.toUpperCase());
}

function mkCode(){return Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random()*23)]).join('');}

async function createRoom(){
  const code=mkCode(); G.roomCode=code; G.isHost=true;
  const room={host:G.name,guest:null,status:'waiting',puzzleIdx:G.themeIdx,diff:G.diff,
    hostScore:0,guestScore:0,hostFound:[],guestFound:[],ts:Date.now()};
  await sSet('vs:'+code,room,true);
  document.getElementById('vs-body').innerHTML=`
    <div class="room-box"><div class="room-code">${code}</div><div class="room-code-sub">Share with your opponent</div></div>
    <div class="players-box">
      <div class="players-box-title">Players</div>
      <div class="p-row"><div class="p-dot"></div><div class="p-name">${G.name}<span class="p-you">(you)</span></div></div>
      <div class="p-row"><div class="p-dot wait"></div><div class="p-name" style="color:var(--muted)">Waiting<span class="dots"><span>.</span><span>.</span><span>.</span></span></div></div>
    </div>
    <button class="btn btn-ghost" onclick="cancelRoom('${code}')">Cancel</button>`;
  clearInterval(G.pollIv);
  G.pollIv=setInterval(()=>pollForGuest(code),2500);
}

async function cancelRoom(code){
  clearInterval(G.pollIv);
  await sDel('vs:'+code,true);
  renderVSChoose();
}

async function pollForGuest(code){
  const r=await sGet('vs:'+code,true);
  if(r&&r.guest){
    clearInterval(G.pollIv);
    G.oppName=r.guest;
    r.status='playing';
    await sSet('vs:'+code,r,true);
    startVS(code,r);
  }
}

async function joinRoom(){
  const code=(document.getElementById('vs-join-inp').value||'').toUpperCase().trim();
  const st=document.getElementById('vs-status');
  if(code.length!==5){st.textContent='Enter a 5-letter code.';return;}
  st.textContent='Joining…';
  const r=await sGet('vs:'+code,true);
  if(!r){st.textContent='Room not found.';return;}
  if(r.guest){st.textContent='Room is full!';return;}
  r.guest=G.name;r.status='playing';
  await sSet('vs:'+code,r,true);
  G.roomCode=code;G.isHost=false;G.oppName=r.host;
  startVS(code,r);
}

function startVS(code,room){
  G.themeIdx=room.puzzleIdx;G.diff=room.diff;G.score=0;G.oppScore=0;G.oppFound=0;
  document.getElementById('diff-bar').style.display='none';
  const vb=document.getElementById('vs-bar');vb.classList.add('on');
  document.getElementById('vs-my-name').textContent=G.name;
  document.getElementById('vs-opp-name').textContent=G.oppName;
  document.getElementById('vs-my-score').textContent='0';
  document.getElementById('vs-opp-score').textContent='0';
  show('game');build();
  clearInterval(G.pollIv);
  G.pollIv=setInterval(()=>pollOpp(code),2500);
}

async function pollOpp(code){
  const r=await sGet('vs:'+code,true);if(!r)return;
  const oppScore=G.isHost?r.guestScore:r.hostScore;
  const oppFoundArr=G.isHost?r.guestFound:r.hostFound;
  G.oppScore=oppScore||0;G.oppFound=(oppFoundArr||[]).length;
  document.getElementById('vs-opp-score').textContent=G.oppScore;
  document.getElementById('vs-opp-found').textContent=G.oppFound+' word'+(G.oppFound!==1?'s':'');
  renderOppLines(oppFoundArr||[]);
}

async function pushVS(){
  if(!G.roomCode)return;
  const r=await sGet('vs:'+G.roomCode,true);if(!r)return;
  const arr=Array.from(G.found);
  if(G.isHost){r.hostScore=G.score;r.hostFound=arr;}
  else{r.guestScore=G.score;r.guestFound=arr;}
  if(G.found.size===G.words.length)r.status='done';
  await sSet('vs:'+G.roomCode,r,true);
}

function renderOppLines(foundArr){
  document.querySelectorAll('.l-opp').forEach(l=>l.remove());
  const svg=document.getElementById('svg-layer');
  foundArr.forEach(word=>{
    const wo=G.words.find(w=>w.word===word);
    if(!wo||G.found.has(word))return;
    const se=document.querySelector(`[data-r="${wo.start[0]}"][data-c="${wo.start[1]}"]`);
    const ee=document.querySelector(`[data-r="${wo.end[0]}"][data-c="${wo.end[1]}"]`);
    if(!se||!ee)return;
    const s=cc(se),e=cc(ee);
    const l=mkLine('l-opp','#A78BFA',s,e);svg.appendChild(l);
  });
}

// ════════════════════════════════
// CHALLENGE JOIN
// ════════════════════════════════
function goJoinChallenge(){
  requireName(()=>{
    show('join');
    document.getElementById('join-inp').value='';
    document.getElementById('join-status').textContent='';
  });
}
async function joinChallenge(){
  const code=(document.getElementById('join-inp').value||''
