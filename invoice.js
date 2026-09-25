
// CONFIG
const GS_URL  = "https://script.google.com/macros/s/AKfycby8dRHqbZJ6wcXW8aTTkJxO5yzwHFbMgB0tDTQrLs0sIaQN_6KcsnQr9xJ5p3kJzSiY/exec";
const GS_LINK = "";
const _tk = ["SU2026","PC!","nv0!","ce"];
const FORM_TOKEN = _tk.join('');

function sanitise(str) {
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;').trim();
}
function escapeHtml(str) {
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

const DEFAULT_PROGS = [];
let RATES = {
  ft:  { lead: 400, support: 200 },
  pt:  { lead: { wd: 100, we: 150 }, support: { wd: 50, we: 75 }, ta: { wd: 25, we: 50 } }
};
let customProgs = ["SCTP AIE", "SCTP AI UXPS", "SCTP CE", "SCTP DSAI"];

const _p = ["10","86","42"];
let ADMIN_PIN = _p.join('');
let pinUnlocked = false;
let _pinAttempts = 0;
let _pinLockedUntil = 0;

function openAdmin() {
  if(!pinUnlocked) {
    const now = Date.now();
    if(now < _pinLockedUntil) { alert(`Too many incorrect attempts. Try again in ${Math.ceil((_pinLockedUntil-now)/1000)} seconds.`); return; }
    const entered = prompt("Enter 6-digit PIN to access Settings:");
    if(entered === null) return;
    if(entered !== ADMIN_PIN) {
      _pinAttempts++;
      if(_pinAttempts >= 5) { _pinLockedUntil = Date.now()+60000; _pinAttempts=0; alert("Too many incorrect attempts. Locked for 60 seconds."); }
      else alert(`Incorrect PIN. ${5-_pinAttempts} attempt(s) remaining.`);
      return;
    }
    _pinAttempts = 0; pinUnlocked = true;
  }
  loadRatesIntoModal(); renderAdminCustomList();
  document.getElementById('adminModal').classList.add('show');
}
function closeAdmin() { document.getElementById('adminModal').classList.remove('show'); pinUnlocked=false; }
document.getElementById('adminModal').addEventListener('click',function(e){if(e.target===this)closeAdmin();});

function loadRatesIntoModal() {
  document.getElementById('r-ftl').value=RATES.ft.lead||'';
  document.getElementById('r-fts').value=RATES.ft.support||'';
  document.getElementById('r-ptlwd').value=RATES.pt.lead.wd||'';
  document.getElementById('r-ptlwe').value=RATES.pt.lead.we||'';
  document.getElementById('r-ptswd').value=RATES.pt.support.wd||'';
  document.getElementById('r-ptswe').value=RATES.pt.support.we||'';
  document.getElementById('r-ptawd').value=RATES.pt.ta.wd||'';
  document.getElementById('r-ptawe').value=RATES.pt.ta.we||'';
}
function saveRates() {
  const posNum = id => Math.max(0,parseFloat(document.getElementById(id).value)||0);
  RATES.ft.lead=posNum('r-ftl'); RATES.ft.support=posNum('r-fts');
  RATES.pt.lead.wd=posNum('r-ptlwd'); RATES.pt.lead.we=posNum('r-ptlwe');
  RATES.pt.support.wd=posNum('r-ptswd'); RATES.pt.support.we=posNum('r-ptswe');
  RATES.pt.ta.wd=posNum('r-ptawd'); RATES.pt.ta.we=posNum('r-ptawe');
  localStorage.setItem('pc_custom_progs',JSON.stringify(customProgs));
  dispRates(); calcAll();
  document.querySelectorAll('.pb').forEach(b=>{const id=parseInt(b.id.split('-')[1]);refreshProgDropdown(id);});
  const msg=document.getElementById('ratesSavedMsg'); msg.style.display='block'; setTimeout(()=>msg.style.display='none',2500);
}

function addCustomProg() {
  const inp=document.getElementById('admin-custom-input');
  const val=sanitise(inp.value.trim()).slice(0,80);
  if(!val) return;
  if(val.length<2) return alert('Program name must be at least 2 characters.');
  if(customProgs.includes(val)){inp.value='';return alert('That program is already in the list.');}
  customProgs.push(val); inp.value=''; renderAdminCustomList();
  document.querySelectorAll('.pb').forEach(b=>{const id=parseInt(b.id.split('-')[1]);renderProgDropdown(id);});
}
function removeCustomProg(name) {
  if(!confirm(`Remove "${name}" from the program list?`)) return;
  customProgs=customProgs.filter(p=>p!==name); renderAdminCustomList();
  document.querySelectorAll('.pb').forEach(b=>{const id=parseInt(b.id.split('-')[1]);renderProgDropdown(id);});
}
function renderAdminCustomList() {
  const el=document.getElementById('admin-custom-list');
  el.innerHTML=customProgs.length===0
    ? '<span style="font-size:.78rem;color:var(--ink-soft)">No programs added yet.</span>'
    : customProgs.map(p=>`<span class="custom-tag">${escapeHtml(p)}<button onclick="removeCustomProg(${JSON.stringify(p)})">&#10005;</button></span>`).join('');
}
function allProgs(){return [...customProgs];}
function refreshProgDropdown(id){renderProgDropdown(id);}

function dispRates() {
  const fmt=v=>v>0?v.toFixed(2):'—';
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent='S$ '+fmt(val);};
  set('rdisp-ftl',RATES.ft.lead); set('rdisp-fts',RATES.ft.support);
  set('rdisp-ptlwd',RATES.pt.lead.wd); set('rdisp-ptlwe',RATES.pt.lead.we);
  set('rdisp-ptswd',RATES.pt.support.wd); set('rdisp-ptswe',RATES.pt.support.we);
  set('rdisp-ptawd',RATES.pt.ta.wd); set('rdisp-ptawe',RATES.pt.ta.we);
}

let curStep=1;
function go(n){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('step'+n).classList.add('active');
  document.querySelectorAll('.snav').forEach((b,i)=>{
    b.classList.remove('active','done');
    if(i+1===n) b.classList.add('active');
    else if(i+1<n) b.classList.add('done');
  });
  curStep=n;
  document.getElementById('progFill').style.width=((n-1)/4*100)+'%';
  if(n===5) buildReview();
  if(n===4){setTimeout(initSig,50);lockBank();}
  if(n===1){lockProfile();}
  window.scrollTo({top:0,behavior:'smooth'});
}

function next(from){
  if(from===1){
    if(!document.getElementById('d-name').value.trim()) return alert('Please enter your name.');
    const emailVal=document.getElementById('d-email').value.trim();
    if(!emailVal){document.getElementById('d-email').focus();return alert('Email address is required.');}
    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(emailVal)){document.getElementById('d-email').focus();return alert('Please enter a valid email address.');}
    if(!document.getElementById('d-date').value) return alert('Please select an invoice date.');
    lockProfile();
  }
  if(from===2){
    if(document.querySelectorAll('.pb').length===0) return alert('Please add at least one program.');
    let valid=true, errorMsg='';
    document.querySelectorAll('.pb').forEach(b=>{
      if(!valid) return;
      const id=parseInt(b.id.split('-')[1]);
      const pname=document.getElementById('pbtitle-'+id)?.textContent||'Program '+id;
      const sel=document.querySelector(`#pb-${id} select`)?.value;
      const ftOn=document.getElementById('ft-on-'+id)?.checked;
      const ptOn=document.getElementById('pt-on-'+id)?.checked;
      const cohortVal=document.getElementById('cohort-'+id)?.value||'';
      if(!cohortVal){valid=false;errorMsg=`Please enter a Cohort number for "${pname}".`;return;}
      if(!sel){valid=false;errorMsg=`"${pname}": Please select a program name.`;return;}
      if(!ftOn&&!ptOn){valid=false;errorMsg=`"${pname}": Please select Full-Time and/or Part-Time.`;return;}
      if(ftOn){
        const role=document.querySelector(`input[name="ftr-${id}"]:checked`)?.value;
        const ftDates=document.querySelectorAll(`[id^="ft-date-val-${id}-"]`);
        if(!role){valid=false;errorMsg=`"${pname}" FT: Please select a role.`;return;}
        if(ftDates.length===0){valid=false;errorMsg=`"${pname}" FT: Please add at least one session date.`;return;}
      }
      if(ptOn){
        const wdRole=document.querySelector(`input[name="ptr-wd-${id}"]:checked`)?.value;
        const weRole=document.querySelector(`input[name="ptr-we-${id}"]:checked`)?.value;
        const wdDates=document.querySelectorAll(`[id^="pt-date-val-${id}-wd-"]`);
        const weDates=document.querySelectorAll(`[id^="pt-date-val-${id}-we-"]`);
        const hasWD=wdDates.length>0&&wdRole;
        const hasWE=weDates.length>0&&weRole;
        if(!hasWD&&!hasWE){valid=false;errorMsg=`"${pname}" PT: Please add at least one date and select a role.`;return;}
        if(wdDates.length>0&&!wdRole){valid=false;errorMsg=`"${pname}" PT Weekday: Please select a role.`;return;}
        if(weDates.length>0&&!weRole){valid=false;errorMsg=`"${pname}" PT Weekend: Please select a role.`;return;}
      }
      const total=parseFloat(document.getElementById('pb-total-'+id)?.textContent.replace('S$ ','').replace(/,/g,''))||0;
      if(total===0){valid=false;errorMsg=`"${pname}": Total is S$0.00 — please check your entries.`;return;}
    });
    if(!valid) return alert(errorMsg);
  }
  if(from===4){
    const _paynow=document.getElementById('b-paynow').value.trim();
    const _hasPaynow=_paynow.length>0;
    if(!_hasPaynow){
      if(!document.getElementById('b-bank').value) return alert('Please select a bank, or enter a PayNow / UEN number.');
      if(!document.getElementById('b-name').value.trim()) return alert('Please enter account holder name.');
      if(!document.getElementById('b-acc').value.trim()) return alert('Please enter account number.');
    }
    saveAndLockBank();
  }
  go(from+1);
}

function lsEncode(obj){return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));}
function lsDecode(str){try{return JSON.parse(decodeURIComponent(escape(atob(str))));}catch(e){return null;}}

function autoSaveProfile(){
  localStorage.setItem('pc_profile',lsEncode({name:document.getElementById('d-name').value,email:'',phone:document.getElementById('d-phone').value}));
}
function toggleBankRequired(){
  const hasPaynow=document.getElementById('b-paynow').value.trim().length>0;
  const hint=document.getElementById('paynow-hint');
  if(hint){hint.textContent=hasPaynow?'✓ bank fields now optional':'(optional if bank details filled)';hint.style.color=hasPaynow?'var(--green)':'var(--ink-soft)';}
  ['b-name-req','b-acc-req'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.opacity=hasPaynow?'0.3':'1';});
}
function autoSaveBank(){
  localStorage.setItem('pc_bank',lsEncode({bank:document.getElementById('b-bank').value,bname:document.getElementById('b-name').value,acc:document.getElementById('b-acc').value,paynow:document.getElementById('b-paynow').value}));
}
function saveAndLockBank(){autoSaveBank();lockBank();}
function lockProfile(){
  const name=document.getElementById('d-name').value.trim();
  if(!name) return;
  document.getElementById('lock-name').textContent=name||'—';
  document.getElementById('lock-email').textContent=document.getElementById('d-email').value||'—';
  document.getElementById('lock-phone').textContent=document.getElementById('d-phone').value||'—';
  document.getElementById('profile-locked').style.display='block';
  document.getElementById('profile-edit').style.display='none';
}
function unlockProfile(){
  document.getElementById('profile-locked').style.display='none';
  document.getElementById('profile-edit').style.display='block';
  setTimeout(()=>document.getElementById('d-name').focus(),100);
}
function lockBank(){
  const acc=document.getElementById('b-acc').value.trim();
  const paynow=document.getElementById('b-paynow').value.trim();
  if(!acc&&!paynow) return;
  document.getElementById('lock-bank').textContent=document.getElementById('b-bank').value||'—';
  document.getElementById('lock-bname').textContent=document.getElementById('b-name').value||'—';
  document.getElementById('lock-bacc').textContent=document.getElementById('b-acc').value||'—';
  document.getElementById('lock-paynow').textContent=document.getElementById('b-paynow').value||'—';
  document.getElementById('bank-locked').style.display='block';
  document.getElementById('bank-edit').style.display='none';
}
function unlockBank(){
  document.getElementById('bank-locked').style.display='none';
  document.getElementById('bank-edit').style.display='block';
  setTimeout(()=>document.getElementById('b-acc').focus(),100);
}
function loadSaved(){
  try{
    const pinRaw=localStorage.getItem('pc_pin');
    if(pinRaw){const pinData=lsDecode(pinRaw);if(pinData&&pinData.pin&&/^\d{6}$/.test(pinData.pin))ADMIN_PIN=pinData.pin;}
    const pRaw=localStorage.getItem('pc_profile');
    const p=pRaw?lsDecode(pRaw):null;
    if(p&&p.name){document.getElementById('d-name').value=p.name||'';document.getElementById('d-email').value=p.email||'';document.getElementById('d-phone').value=p.phone||'';lockProfile();}
    const bRaw=localStorage.getItem('pc_bank');
    const b=bRaw?lsDecode(bRaw):null;
    if(b&&(b.acc||b.paynow||b.bank)){document.getElementById('b-bank').value=b.bank||'';document.getElementById('b-name').value=b.bname||'';document.getElementById('b-acc').value=b.acc||'';document.getElementById('b-paynow').value=b.paynow||'';lockBank();}
    const cp=JSON.parse(localStorage.getItem('pc_custom_progs'));
    if(cp&&Array.isArray(cp)){cp.forEach(p=>{const safe=sanitise(String(p||'')).slice(0,80);if(safe&&safe.length>=2&&!customProgs.includes(safe))customProgs.push(safe);});}
  }catch(e){}
}
function clearProfile(){
  if(!confirm('Clear saved profile data?')) return;
  localStorage.removeItem('pc_profile');
  document.getElementById('d-name').value='';document.getElementById('d-email').value='';document.getElementById('d-phone').value='';
  unlockProfile();
}

let pc=0;
function addProg(){
  pc++;
  const id=pc;
  const container=document.getElementById('pb-container');
  const div=document.createElement('div');
  div.className='pb open active';
  div.id='pb-'+id;
  div.innerHTML=`
    <div class="pb-hdr" onclick="togPb(${id})">
      <div style="display:flex;align-items:center;gap:8px"><span class="pb-title" id="pbtitle-${id}">Program ${id}</span></div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="rm-btn" onclick="rmPb(event,${id})">&#10005; Remove</button>
        <span class="pb-arrow">&#9660;</span>
      </div>
    </div>
    <div class="pb-body">
      <div class="fg c1" style="margin-bottom:14px">
        <div class="f"><label>Program Name *</label><div id="prog-sel-wrap-${id}"></div></div>
      </div>
      <div class="f" style="margin-bottom:14px">
        <label>Cohort <span style="font-weight:400;color:var(--ink-soft)">(e.g. 1, 2, 3F, 04)</span></label>
        <input type="text" id="cohort-${id}" placeholder="Type cohort number e.g. 04, 3F"
          oninput="this.value=this.value.replace(/[^0-9Ff]/g,'').toUpperCase();onCohortChange(${id})"
          style="max-width:200px">
        <div id="cohort-ft-note-${id}" style="display:none;margin-top:5px;font-size:.72rem;font-weight:600;color:var(--ft)">&#9873; FT cohort &mdash; Full-Time Weekday Only</div>
        <div id="cohort-empty-note-${id}" style="margin-top:5px;font-size:.72rem;font-weight:600;color:var(--ink-soft)">&uarr; Enter cohort number to show Full-Time or Part-Time options</div>
      </div>
      <div class="role-section" id="ftsec-${id}" style="display:none">
        <div class="rs-head rs-ft-head">
          <label style="display:flex;align-items:center;gap:7px;cursor:pointer;margin:0">
            <input type="checkbox" id="ft-on-${id}" onchange="togFT(${id})">
            <span>Full-Time &nbsp;&middot;&nbsp; Weekday Only</span>
          </label>
        </div>
        <div id="ft-fields-${id}" style="display:none">
          <div class="fg c2" style="margin-bottom:12px">
            <div class="f"><label>Role</label>
              <div class="chips">
                <label><input type="radio" name="ftr-${id}" value="lead" onchange="calcPbAndUpdate(${id})"><span class="chip cl"><span class="dot"></span>Lead</span></label>
                <label><input type="radio" name="ftr-${id}" value="support" onchange="calcPbAndUpdate(${id})"><span class="chip cs"><span class="dot"></span>Support</span></label>
              </div>
            </div>
            <div class="f"><label>Rate / Session</label><input type="text" id="ft-ratedis-${id}" readonly placeholder="Select role first"></div>
          </div>
          <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-soft);margin-bottom:8px">Session Dates</div>
          <div id="ft-dates-${id}"></div>
          <button class="add-pb-btn" style="margin-bottom:12px" onclick="addFTDate(${id})">&#65291; Add Date</button>
          <div class="calc-strip" id="ftstrip-${id}">
            <div class="cs-item"><div class="cs-lbl">Sessions</div><div class="cs-val" id="ft-cs-sess-${id}">0</div></div>
            <div class="cs-eq">&times;</div>
            <div class="cs-item"><div class="cs-lbl">Rate</div><div class="cs-val" id="ft-cs-rate-${id}">S$0</div></div>
            <div class="cs-eq">=</div>
            <div class="cs-sub-wrap"><div class="cs-lbl">FT Subtotal</div><div class="cs-val" id="ft-cs-sub-${id}">S$0</div></div>
          </div>
        </div>
      </div>
      <div class="role-section" id="ptsec-${id}" style="display:none">
        <div class="rs-head rs-pt-head">
          <label style="display:flex;align-items:center;gap:7px;cursor:pointer;margin:0">
            <input type="checkbox" id="pt-on-${id}" onchange="togPT(${id})">
            <span>Part-Time &nbsp;&middot;&nbsp; Weekday &amp; / or Weekend</span>
          </label>
          <span class="rs-badge rs-pt-badge">PT</span>
        </div>
        <div id="pt-fields-${id}" style="display:none">
          <div style="background:#fafbfd;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px">
            <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ft);margin-bottom:8px">Weekday</div>
            <div class="f" style="margin-bottom:10px"><label>Role</label>
              <div class="chips">
                <label><input type="radio" name="ptr-wd-${id}" value="lead" onchange="calcPbAndUpdate(${id})"><span class="chip cl"><span class="dot"></span>Lead</span></label>
                <label><input type="radio" name="ptr-wd-${id}" value="support" onchange="calcPbAndUpdate(${id})"><span class="chip cs"><span class="dot"></span>Support</span></label>
                <label><input type="radio" name="ptr-wd-${id}" value="ta" onchange="calcPbAndUpdate(${id})"><span class="chip ct"><span class="dot"></span>TA</span></label>
              </div>
            </div>
            <div id="pt-wd-dates-${id}"></div>
            <button class="add-pb-btn" onclick="addPTDate(${id},'wd')">&#65291; Add Weekday Date</button>
          </div>
          <div id="pt-we-wrap-${id}" style="background:#fafbfd;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px">
            <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--pt);margin-bottom:8px">Weekend</div>
            <div class="f" style="margin-bottom:10px"><label>Role</label>
              <div class="chips">
                <label><input type="radio" name="ptr-we-${id}" value="lead" onchange="calcPbAndUpdate(${id})"><span class="chip cl"><span class="dot"></span>Lead</span></label>
                <label><input type="radio" name="ptr-we-${id}" value="support" onchange="calcPbAndUpdate(${id})"><span class="chip cs"><span class="dot"></span>Support</span></label>
                <label><input type="radio" name="ptr-we-${id}" value="ta" onchange="calcPbAndUpdate(${id})"><span class="chip ct"><span class="dot"></span>TA</span></label>
              </div>
            </div>
            <div id="pt-we-dates-${id}"></div>
            <button class="add-pb-btn" onclick="addPTDate(${id},'we')">&#65291; Add Weekend Date</button>
          </div>
          <div class="calc-strip" id="ptstrip-${id}">
            <div class="cs-item"><div class="cs-lbl">WD Hours</div><div class="cs-val" id="pt-cs-wds-${id}">0</div></div>
            <div class="cs-eq">+</div>
            <div class="cs-item"><div class="cs-lbl">WE Hours</div><div class="cs-val" id="pt-cs-wes-${id}">0</div></div>
            <div class="cs-eq">=</div>
            <div class="cs-sub-wrap"><div class="cs-lbl">PT Subtotal</div><div class="cs-val" id="pt-cs-sub-${id}">S$0</div></div>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:10px">
        <div style="background:var(--accent);color:#fff;border-radius:8px;padding:8px 16px;font-size:.82rem;font-weight:700">
          Program Total: <span id="pb-total-${id}">S$ 0.00</span>
        </div>
      </div>
    </div>`;
  container.appendChild(div);
  renderProgDropdown(id);
  calcAll();
}

function renderProgDropdown(id) {
  const wrap=document.getElementById('prog-sel-wrap-'+id);
  if(!wrap) return;
  if(customProgs.length===0){
    wrap.innerHTML=`<div style="padding:10px 13px;border:1.5px dashed var(--border);border-radius:7px;font-size:.83rem;color:var(--ink-soft);background:#fafbfc">No programs yet &mdash; go to <strong style="color:var(--accent)">&#9881; Settings</strong> to add your programs first.</div>`;
  } else {
    const cur=document.getElementById('prog-sel-'+id)?.value||'';
    const opts=customProgs.map(p=>`<option value="${escapeHtml(p)}"${p===cur?' selected':''}>${escapeHtml(p)}</option>`).join('');
    wrap.innerHTML=`<select id="prog-sel-${id}" onchange="onProgSelect(${id},this.value)"><option value="">— Select program —</option>${opts}</select>`;
  }
}

const PT_ONLY_PROGRAMS=["SCTP AI UXPS","SCTP CE"];
function onProgSelect(id,val){
  if(val) document.getElementById('pbtitle-'+id).textContent=val;
  const ftSec=document.getElementById('ftsec-'+id);
  if(!ftSec) return;
  if(PT_ONLY_PROGRAMS.includes(val)){
    ftSec.style.display='none';
    const ftOn=document.getElementById('ft-on-'+id);
    if(ftOn){ftOn.checked=false;togFT(id);}
    let notice=document.getElementById('pt-notice-'+id);
    if(!notice){notice=document.createElement('div');notice.id='pt-notice-'+id;notice.style.cssText='font-size:.75rem;font-weight:600;color:var(--pt);background:var(--pt-light);border:1px solid var(--pt-border);border-radius:7px;padding:7px 12px;margin-bottom:10px';notice.textContent='⚠️ This program is Part-Time only';ftSec.parentNode.insertBefore(notice,ftSec);}
    notice.style.display='block';
  } else {
    ftSec.style.display='block';
    const notice=document.getElementById('pt-notice-'+id);
    if(notice) notice.style.display='none';
  }
  calcPbAndUpdate(id);
}

function togPb(id){document.getElementById('pb-'+id)?.classList.toggle('open');}
function rmPb(e,id){e.stopPropagation();document.getElementById('pb-'+id)?.remove();calcAll();}
function togFT(id){document.getElementById('ft-fields-'+id).style.display=document.getElementById('ft-on-'+id).checked?'block':'none';calcPbAndUpdate(id);}
function togPT(id){document.getElementById('pt-fields-'+id).style.display=document.getElementById('pt-on-'+id).checked?'block':'none';calcPbAndUpdate(id);}

function calcPb(id){
  let ftSub=0,ptSub=0,ftTotalSess=0,ptTotalWD=0,ptTotalWE=0;
  if(document.getElementById('ft-on-'+id)?.checked){
    const role=document.querySelector(`input[name="ftr-${id}"]:checked`)?.value;
    const rate=role==='lead'?RATES.ft.lead:role==='support'?RATES.ft.support:0;
    document.querySelectorAll(`[id^="ft-date-sess-${id}-"]`).forEach(sel=>{ftTotalSess+=parseFloat(sel.value)||0;});
    ftSub=ftTotalSess*rate;
    if(document.getElementById('ft-ratedis-'+id)) document.getElementById('ft-ratedis-'+id).value=rate>0?'S$'+rate+'/session':'Set in ⚙ Settings';
    if(document.getElementById('ft-cs-sess-'+id)) document.getElementById('ft-cs-sess-'+id).textContent=ftTotalSess;
    if(document.getElementById('ft-cs-rate-'+id)) document.getElementById('ft-cs-rate-'+id).textContent='S$'+rate;
    if(document.getElementById('ft-cs-sub-'+id)) document.getElementById('ft-cs-sub-'+id).textContent='S$'+(ftSub||0);
  }
  if(document.getElementById('pt-on-'+id)?.checked){
    const wdRole=document.querySelector(`input[name="ptr-wd-${id}"]:checked`)?.value;
    const weRole=document.querySelector(`input[name="ptr-we-${id}"]:checked`)?.value;
    document.querySelectorAll(`[id^="pt-date-hrs-${id}-wd-"]`).forEach(inp=>{ptTotalWD+=parseFloat(inp.value)||0;});
    document.querySelectorAll(`[id^="pt-date-hrs-${id}-we-"]`).forEach(inp=>{ptTotalWE+=parseFloat(inp.value)||0;});
    if(wdRole&&wdRole!=='none') ptSub+=ptTotalWD*(RATES.pt[wdRole]?.wd||0);
    if(weRole&&weRole!=='none') ptSub+=ptTotalWE*(RATES.pt[weRole]?.we||0);
    if(document.getElementById('pt-cs-wds-'+id)) document.getElementById('pt-cs-wds-'+id).textContent=ptTotalWD+'hrs';
    if(document.getElementById('pt-cs-wes-'+id)) document.getElementById('pt-cs-wes-'+id).textContent=ptTotalWE+'hrs';
    if(document.getElementById('pt-cs-sub-'+id)) document.getElementById('pt-cs-sub-'+id).textContent='S$'+(ptSub||0);
  }
  const total=ftSub+ptSub;
  const fmtT=v=>{const s=v.toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});return s.endsWith('.00')?s.slice(0,-3):s;};
  if(document.getElementById('pb-total-'+id)) document.getElementById('pb-total-'+id).textContent='S$ '+fmtT(total);
  return total;
}
function calcPbAndUpdate(id){calcPb(id);calcAll();}

let ftDateCount={};
function addFTDate(id){
  if(!ftDateCount[id]) ftDateCount[id]=0;
  ftDateCount[id]++;
  const dc=ftDateCount[id];
  const container=document.getElementById('ft-dates-'+id);
  const div=document.createElement('div');
  div.id=`ft-date-${id}-${dc}`;
  div.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-bottom:8px';
  div.innerHTML=`
    <div class="f"><label>Date</label><input type="date" id="ft-date-val-${id}-${dc}" onchange="validateDayType(this,'wd');calcPbAndUpdate(${id})"></div>
    <div class="f"><label>Sessions</label>
      <select id="ft-date-sess-${id}-${dc}" onchange="calcPbAndUpdate(${id})">
        <option value="1">1 session (3hrs)</option>
        <option value="2">2 sessions (6hrs)</option>
      </select>
    </div>
    <button class="rm-btn" style="padding:9px 10px;margin-bottom:1px" onclick="document.getElementById('ft-date-${id}-${dc}').remove();calcPbAndUpdate(${id})">&#10005;</button>`;
  container.appendChild(div);
  calcPbAndUpdate(id);
}

let ptDateCount={};
function addPTDate(id,type){
  const key=`${id}-${type}`;
  if(!ptDateCount[key]) ptDateCount[key]=0;
  ptDateCount[key]++;
  const dc=ptDateCount[key];
  const container=document.getElementById(`pt-${type}-dates-${id}`);
  const div=document.createElement('div');
  div.id=`pt-date-${id}-${type}-${dc}`;
  div.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-bottom:8px';
  div.innerHTML=`
    <div class="f"><label>Date</label><input type="date" id="pt-date-val-${id}-${type}-${dc}" onchange="validateDayType(this,'${type}');calcPbAndUpdate(${id})"></div>
    <div class="f"><label>Hours <span style="font-weight:400;color:var(--ink-soft)">(default 3)</span></label>
      <input type="number" id="pt-date-hrs-${id}-${type}-${dc}" value="3" min="0.5" step="0.5" oninput="calcPbAndUpdate(${id})">
    </div>
    <button class="rm-btn" style="padding:9px 10px;margin-bottom:1px" onclick="document.getElementById('pt-date-${id}-${type}-${dc}').remove();calcPbAndUpdate(${id})">&#10005;</button>`;
  container.appendChild(div);
  calcPbAndUpdate(id);
}

let mentCount=0;
function addMentoringEntry(){
  mentCount++;
  const mc=mentCount;
  const container=document.getElementById('mentoring-entries');
  const div=document.createElement('div');
  div.id=`ment-${mc}`;
  div.style.cssText='background:#f7f8fc;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px';
  div.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:.78rem;font-weight:600;color:var(--ink-mid)">Session ${mc}</div>
      <button class="rm-btn" onclick="document.getElementById('ment-${mc}').remove();calcSvcs()">&#10005; Remove</button>
    </div>
    <div class="fg c2" style="margin-bottom:8px">
      <div class="f"><label>Date</label><input type="date" id="ment-date-${mc}" onchange="calcSvcs()"></div>
      <div class="f"><label>Hours</label><input type="number" id="ment-hrs-${mc}" min="0.5" step="0.5" placeholder="e.g. 1" oninput="calcSvcs()"></div>
    </div>
    <div class="f"><label>Student Name(s)</label><input type="text" id="ment-students-${mc}" placeholder="e.g. Wei Min, Sock Hoon, Merlin"></div>`;
  container.appendChild(div);
  calcSvcs();
}

function togSvc(name){
  const el=document.getElementById('svc-'+name);
  const btn=el.querySelector('.svc-tog');
  el.classList.toggle('on');
  const on=el.classList.contains('on');
  btn.textContent=on?'✓ Added':'+ Add';
  btn.classList.toggle('on',on);
  calcSvcs();
}
function togTraining(){
  const t=document.querySelector('input[name="tr-type"]:checked')?.value;
  document.getElementById('tr-hourly').style.display=t==='hourly'?'grid':'none';
  document.getElementById('tr-flat').style.display=t==='flat'?'grid':'none';
  calcSvcs();
}
let adhocCount=0;
function addAdhocItem(){
  adhocCount++;
  const ac=adhocCount;
  const container=document.getElementById('adhoc-items');
  const div=document.createElement('div');
  div.id='adhi-'+ac;
  div.style.cssText='display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:end;margin-bottom:8px';
  div.innerHTML=`
    <div class="f"><label>Description</label><input type="text" placeholder="e.g. Event setup, cover class, material prep&hellip;"></div>
    <div class="f"><label>Amount (S$)</label><div class="pfx"><span>$</span><input type="number" id="adh-amt-${ac}" min="0" step="0.50" placeholder="0.00" oninput="calcSvcs()"></div></div>
    <button class="rm-btn" style="margin-bottom:1px;padding:9px 10px" onclick="document.getElementById('adhi-${ac}').remove();calcSvcs()">&#10005;</button>`;
  container.appendChild(div);
}

function calcSvcs(){
  const mHrs=parseFloat(document.getElementById('m-hrs')?.value)||0;
  const mRate=parseFloat(document.getElementById('m-rate')?.value)||0;
  const mSub=document.getElementById('svc-mentoring').classList.contains('on')?mHrs*mRate:0;
  const mSubEl=document.getElementById('m-sub');
  if(mSubEl) mSubEl.value=mSub>0?'S$ '+mSub.toFixed(2):'S$ 0.00';
  const t=document.querySelector('input[name="tr-type"]:checked')?.value;
  let trSub=0;
  if(document.getElementById('svc-training').classList.contains('on')){
    if(t==='hourly'){trSub=(parseFloat(document.getElementById('tr-hrs')?.value)||0)*(parseFloat(document.getElementById('tr-rate')?.value)||0);const trSubEl=document.getElementById('tr-sub');if(trSubEl)trSubEl.value='S$ '+trSub.toFixed(2);}
    else if(t==='flat'){trSub=parseFloat(document.getElementById('tr-flat-amt')?.value)||0;}
  }
  let adhSub=0;
  if(document.getElementById('svc-adhoc').classList.contains('on')) document.querySelectorAll('[id^="adh-amt-"]').forEach(i=>adhSub+=parseFloat(i.value)||0);
  const plSub=document.getElementById('svc-proglead').classList.contains('on')?parseFloat(document.getElementById('pl-rate')?.value)||0:0;
  let progTotal=0;
  document.querySelectorAll('[id^="pb-total-"]').forEach(el=>{progTotal+=parseFloat(el.textContent.replace('S$ ','').replace(/,/g,''))||0;});
  const grand=progTotal+mSub+plSub+adhSub+trSub;
  const grandFmt=grand.toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(document.getElementById('grand-total')) document.getElementById('grand-total').textContent='S$ '+grandFmt;
}

function calcAll(){
  document.querySelectorAll('.pb').forEach(b=>{const id=parseInt(b.id.split('-')[1]);calcPb(id);});
  calcSvcs();
}

function buildReview(){
  if(GS_LINK!=="YOUR_GOOGLE_SHEET_LINK_HERE") document.getElementById('gsLink').href=GS_LINK;
  const name=document.getElementById('d-name').value;
  const date=document.getElementById('d-date').value;
  const invno=document.getElementById('d-invno').value;
  const fmt=d=>d?new Date(d).toLocaleDateString('en-SG',{day:'numeric',month:'long',year:'numeric'}):'—';
  let pbRows='';
  document.querySelectorAll('.pb').forEach(b=>{
    const id=parseInt(b.id.split('-')[1]);
    const pname=document.getElementById('pbtitle-'+id)?.textContent||'—';
    const ftOn=document.getElementById('ft-on-'+id)?.checked;
    const ptOn=document.getElementById('pt-on-'+id)?.checked;
    const tags=[];
    if(ftOn){const r=(document.querySelector(`input[name="ftr-${id}"]:checked`)?.value||'');tags.push(`<span style="background:var(--ft-light);color:var(--ft);font-size:.68rem;font-weight:700;padding:2px 7px;border-radius:99px">FT ${r.charAt(0).toUpperCase()+r.slice(1)}</span>`);}
    if(ptOn){const rs=[...document.querySelectorAll(`input[name="ptr-${id}"]:checked`)].map(r=>r.value==='ta'?'TA':r.value.charAt(0).toUpperCase()+r.value.slice(1)).join(', ');tags.push(`<span style="background:var(--pt-light);color:var(--pt);font-size:.68rem;font-weight:700;padding:2px 7px;border-radius:99px">PT ${rs}</span>`);}
    const total=document.getElementById('pb-total-'+id)?.textContent||'S$ 0.00';
    pbRows+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);gap:10px;flex-wrap:wrap"><div><div style="font-weight:600;font-size:.88rem">${escapeHtml(pname)}</div><div style="display:flex;gap:5px;margin-top:4px">${tags.join('')}</div></div><div style="font-weight:700;color:var(--accent)">${total}</div></div>`;
  });
  document.getElementById('review-html').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;margin-bottom:16px">
      <div><div style="font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-soft);margin-bottom:2px">Instructor</div><div style="font-weight:700">${escapeHtml(name)}</div></div>
      <div><div style="font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-soft);margin-bottom:2px">Invoice No.</div><div style="font-weight:700">${escapeHtml(invno)}</div></div>
      <div><div style="font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-soft);margin-bottom:2px">Invoice Date</div><div style="font-weight:700">${fmt(date)}</div></div>
      <div><div style="font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-soft);margin-bottom:2px">Bank</div><div style="font-weight:700">${escapeHtml(document.getElementById('b-bank').value||'—')}</div></div>
    </div>
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-soft);margin-bottom:8px">Programs</div>
    ${pbRows||'<div style="color:var(--ink-soft);font-size:.85rem">No programs added.</div>'}`;
  calcAll();
  let progTotal=0;
  document.querySelectorAll('[id^="pb-total-"]').forEach(el=>{progTotal+=parseFloat(el.textContent.replace('S$ ','').replace(/,/g,''))||0;});
  const mHrs=parseFloat(document.getElementById('m-hrs')?.value)||0;
  const mRate=parseFloat(document.getElementById('m-rate')?.value)||0;
  const mSub=document.getElementById('svc-mentoring').classList.contains('on')?mHrs*mRate:0;
  const plSub=document.getElementById('svc-proglead').classList.contains('on')?parseFloat(document.getElementById('pl-rate')?.value)||0:0;
  let adhSub=0;
  if(document.getElementById('svc-adhoc').classList.contains('on')) document.querySelectorAll('[id^="adh-amt-"]').forEach(i=>adhSub+=parseFloat(i.value)||0);
  const tType=document.querySelector('input[name="tr-type"]:checked')?.value;
  let trSub=0;
  if(document.getElementById('svc-training').classList.contains('on')){
    if(tType==='hourly') trSub=(parseFloat(document.getElementById('tr-hrs')?.value)||0)*(parseFloat(document.getElementById('tr-rate')?.value)||0);
    else if(tType==='flat') trSub=parseFloat(document.getElementById('tr-flat-amt')?.value)||0;
  }
  const grand=progTotal+mSub+plSub+adhSub+trSub;
  const fmtR=v=>v.toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});
  let rows=`<div class="trow"><span class="tn">Programs Subtotal</span><span class="tv">S$ ${fmtR(progTotal)}</span></div>`;
  if(document.getElementById('svc-mentoring').classList.contains('on')&&mSub>0) rows+=`<div class="trow"><span class="tn">Mentoring</span><span class="tv">S$ ${fmtR(mSub)}</span></div>`;
  if(document.getElementById('svc-proglead').classList.contains('on')&&plSub>0) rows+=`<div class="trow"><span class="tn">Program Lead</span><span class="tv">S$ ${fmtR(plSub)}</span></div>`;
  if(document.getElementById('svc-adhoc').classList.contains('on')&&adhSub>0) rows+=`<div class="trow"><span class="tn">Ad-hoc Services</span><span class="tv">S$ ${fmtR(adhSub)}</span></div>`;
  if(document.getElementById('svc-training').classList.contains('on')&&trSub>0) rows+=`<div class="trow"><span class="tn">Training / Workshop</span><span class="tv">S$ ${fmtR(trSub)}</span></div>`;
  document.getElementById('totals-rows').innerHTML=rows;
  document.getElementById('grand-total').textContent='S$ '+fmtR(grand);
}

const sigEl=document.getElementById('sig');
const sctx=sigEl.getContext('2d');
let drawing=false;
function gp(e){const r=sigEl.getBoundingClientRect();const s=e.touches?e.touches[0]:e;return{x:(s.clientX-r.left)*(sigEl.width/r.width),y:(s.clientY-r.top)*(sigEl.height/r.height)};}
let hasSigned=false;
sigEl.addEventListener('mousedown',e=>{if(!hasSigned){sctx.clearRect(0,0,sigEl.width,sigEl.height);hasSigned=true;}drawing=true;const p=gp(e);sctx.beginPath();sctx.moveTo(p.x,p.y);});
sigEl.addEventListener('mousemove',e=>{if(!drawing)return;const p=gp(e);sctx.lineTo(p.x,p.y);sctx.strokeStyle='#1a1a2e';sctx.lineWidth=2;sctx.lineCap='round';sctx.stroke();});
sigEl.addEventListener('mouseup',()=>drawing=false);
sigEl.addEventListener('mouseleave',()=>drawing=false);
sigEl.addEventListener('touchstart',e=>{e.preventDefault();if(!hasSigned){sctx.clearRect(0,0,sigEl.width,sigEl.height);hasSigned=true;}drawing=true;const p=gp(e);sctx.beginPath();sctx.moveTo(p.x,p.y);},{passive:false});
sigEl.addEventListener('touchmove',e=>{e.preventDefault();if(!drawing)return;const p=gp(e);sctx.lineTo(p.x,p.y);sctx.strokeStyle='#1a1a2e';sctx.lineWidth=2;sctx.lineCap='round';sctx.stroke();},{passive:false});
sigEl.addEventListener('touchend',()=>drawing=false);
function clrSig(){sctx.clearRect(0,0,sigEl.width,sigEl.height);hasSigned=false;initSig();}
function initSig(){
  const w=sigEl.parentElement?.offsetWidth||sigEl.offsetWidth||600;
  sigEl.width=w;sigEl.height=120;
  sctx.clearRect(0,0,sigEl.width,sigEl.height);
  sctx.font='13px Inter, sans-serif';sctx.fillStyle='#b0b8d0';sctx.textAlign='center';
  sctx.fillText('✍  Click/tap and drag here to sign',sigEl.width/2,sigEl.height/2);
  sctx.textAlign='left';
}
window.addEventListener('resize',initSig);
setTimeout(initSig,100);setTimeout(initSig,500);setTimeout(initSig,1000);

function submitOrReprint(){
  if(document.getElementById('successScreen').classList.contains('edit-mode')){
    calcAll();
    const invno=document.getElementById('d-invno').value;
    const grandTotal=document.getElementById('grand-total').textContent;
    const payload={
      invoiceNo:sanitise(invno)||'',name:sanitise(document.getElementById('d-name').value),
      email:sanitise(document.getElementById('d-email').value),phone:sanitise(document.getElementById('d-phone').value),
      date:sanitise(document.getElementById('d-date').value),grandTotal,
      bank:sanitise(document.getElementById('b-bank').value),accNo:sanitise(document.getElementById('b-acc').value),
      paynow:sanitise(document.getElementById('b-paynow').value),remarks:sanitise(document.getElementById('b-notes').value),
    };
    buildPDF(payload);
    document.getElementById('mainForm').style.display='none';
    document.getElementById('successScreen').classList.add('show');
    document.getElementById('edit-note').style.display='block';
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  submitForm();
}

async function submitForm(){
  const grandTotal=document.getElementById('grand-total').textContent;
  const grandAmt=parseFloat(grandTotal.replace('S$ ','').replace(/,/g,''))||0;
  if(grandAmt===0) return alert('Total Payable is S$0.00 — please go back and check your entries.');
  const invno=document.getElementById('d-invno').value;
  calcAll();
  document.getElementById('gsStatus').textContent='Submitting…';

  const programTotals={};
  document.querySelectorAll('.pb').forEach(b=>{
    const id=parseInt(b.id.split('-')[1]);
    const pname=document.getElementById('pbtitle-'+id)?.textContent||'—';
    const totalStr=document.getElementById('pb-total-'+id)?.textContent||'S$ 0.00';
    const totalAmt=parseFloat(totalStr.replace('S$ ','').replace(/,/g,''))||0;
    if(programTotals[pname]) programTotals[pname]+=totalAmt; else programTotals[pname]=totalAmt;
  });

  const programs=Object.entries(programTotals).map(([name,total])=>{
    const fmtT=v=>{const s=v.toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});return s.endsWith('.00')?s.slice(0,-3):s;};
    return name+' (S$'+fmtT(total)+')';
  });

  const mentoringOn=document.getElementById('svc-mentoring').classList.contains('on');
  const progLeadOn=document.getElementById('svc-proglead').classList.contains('on');
  const adhocOn=document.getElementById('svc-adhoc').classList.contains('on');
  const trainingOn=document.getElementById('svc-training').classList.contains('on');

  const fmtAmt=(val)=>{const formatted=val.toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});return formatted.endsWith('.00')?formatted.slice(0,-3):formatted;};

  const mRate=mentoringOn?parseFloat(document.getElementById('m-rate')?.value)||0:0;
  const mHrs2=mentoringOn?parseFloat(document.getElementById('m-hrs')?.value)||0:0;
  let mentoringFmt='';
  if(mentoringOn&&mHrs2>0){
    mentoringFmt=mHrs2+'hrs = S$'+fmtAmt(mHrs2*mRate);
    const entries=[];
    document.querySelectorAll('[id^="ment-date-"]').forEach(dateInp=>{
      const mc=dateInp.id.replace('ment-date-','');
      const date=dateInp.value?sanitise(new Date(dateInp.value).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'})):'';
      const hrs=parseFloat(document.getElementById('ment-hrs-'+mc)?.value)||0;
      const students=sanitise(document.getElementById('ment-students-'+mc)?.value||'');
      if(date||students) entries.push(date+(students?' ('+students+')':'')+(hrs?' '+hrs+'hrs':''));
    });
    if(entries.length>0) mentoringFmt+=' | '+entries.join(' | ');
  }

  const plAmt=progLeadOn?parseFloat(document.getElementById('pl-rate')?.value)||0:0;
  const plDesc=sanitise(document.getElementById('pl-desc')?.value||'');
  const progLeadFmt=progLeadOn&&plAmt>0?'S$'+fmtAmt(plAmt)+(plDesc?' — '+plDesc:''):'';

  let adhocFmt='';
  if(adhocOn){
    const items=[];
    document.querySelectorAll('#adhoc-items [id^="adhi-"]').forEach(item=>{
      const desc=sanitise(item.querySelector('input[type="text"]')?.value||'');
      const amt=item.querySelector('input[type="number"]')?.value||'0';
      if(desc||amt!=='0') items.push(desc+' (S$'+fmtAmt(parseFloat(amt))+')');
    });
    adhocFmt=items.join(' | ');
  }

  let trainingFmt='';
  if(trainingOn){
    const tType=document.querySelector('input[name="tr-type"]:checked')?.value;
    if(tType==='hourly'){const hrs=parseFloat(document.getElementById('tr-hrs')?.value)||0;const rate=parseFloat(document.getElementById('tr-rate')?.value)||0;trainingFmt=hrs+'hrs @ S$'+fmtAmt(rate)+'/hr = S$'+fmtAmt(hrs*rate);}
    else if(tType==='flat'){const amt=parseFloat(document.getElementById('tr-flat-amt')?.value)||0;const desc=sanitise(document.getElementById('tr-flat-desc')?.value||'');trainingFmt='S$'+fmtAmt(amt)+(desc?' — '+desc:'');}
  }

  const ftPerProg={};
  const ptPerProg={};
  document.querySelectorAll('.pb').forEach(b=>{
    const id=parseInt(b.id.split('-')[1]);
    const pname=document.getElementById('pbtitle-'+id)?.textContent||'—';
    const cohort=document.getElementById('cohort-'+id)?.value||'';
    const cohortStr=cohort?' Cohort '+cohort:'';
    if(document.getElementById('ft-on-'+id)?.checked){
      const role=document.querySelector(`input[name="ftr-${id}"]:checked`)?.value;
      const rLabel=role==='lead'?'Lead':'Support';
      let totalSess=0;const dateLines=[];
      document.querySelectorAll(`[id^="ft-date-val-${id}-"]`).forEach(dateInp=>{
        if(!dateInp.value) return;
        const dc=dateInp.id.replace(`ft-date-val-${id}-`,'');
        const date=new Date(dateInp.value).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'});
        const sess=parseFloat(document.getElementById(`ft-date-sess-${id}-${dc}`)?.value)||0;
        totalSess+=sess;dateLines.push('- '+date+' ('+(sess*3)+'hrs)');
      });
      const rate=role==='lead'?RATES.ft.lead:RATES.ft.support;
      const amt=totalSess*rate;
      if(dateLines.length>0){
        const entry=pname+cohortStr+' Weekday '+rLabel+': '+totalSess+' session'+(totalSess>1?'s':'')+' = S$'+fmtAmt(amt)+'\n'+dateLines.join('\n');
        if(ftPerProg[pname]) ftPerProg[pname]+='\n'+entry; else ftPerProg[pname]=entry;
      }
    }
    if(document.getElementById('pt-on-'+id)?.checked){
      const wdRole=document.querySelector(`input[name="ptr-wd-${id}"]:checked`)?.value;
      const weRole=document.querySelector(`input[name="ptr-we-${id}"]:checked`)?.value;
      let wdHrs=0;const wdLines=[];
      document.querySelectorAll(`[id^="pt-date-val-${id}-wd-"]`).forEach(dateInp=>{
        const dc=dateInp.id.replace(`pt-date-val-${id}-wd-`,'');
        const date=dateInp.value?new Date(dateInp.value).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'}):'—';
        const hrs=parseFloat(document.getElementById(`pt-date-hrs-${id}-wd-${dc}`)?.value)||0;
        wdHrs+=hrs;wdLines.push('- '+date+' ('+hrs+'hrs)');
      });
      let weHrs=0;const weLines=[];
      document.querySelectorAll(`[id^="pt-date-val-${id}-we-"]`).forEach(dateInp=>{
        const dc=dateInp.id.replace(`pt-date-val-${id}-we-`,'');
        const date=dateInp.value?new Date(dateInp.value).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'}):'—';
        const hrs=parseFloat(document.getElementById(`pt-date-hrs-${id}-we-${dc}`)?.value)||0;
        weHrs+=hrs;weLines.push('- '+date+' ('+hrs+'hrs)');
      });
      const wdRLabel=wdRole==='ta'?'TA':wdRole?wdRole.charAt(0).toUpperCase()+wdRole.slice(1):'';
      const weRLabel=weRole==='ta'?'TA':weRole?weRole.charAt(0).toUpperCase()+weRole.slice(1):'';
      let ptEntry='';
      if(wdHrs>0&&wdRole&&wdRole!=='none') ptEntry+=pname+cohortStr+' Weekday '+wdRLabel+': '+wdHrs+'hrs = S$'+fmtAmt(wdHrs*(RATES.pt[wdRole]?.wd||0))+'\n'+wdLines.join('\n');
      if(weHrs>0&&weRole&&weRole!=='none'){if(ptEntry)ptEntry+='\n';ptEntry+=pname+cohortStr+' Weekend '+weRLabel+': '+weHrs+'hrs = S$'+fmtAmt(weHrs*(RATES.pt[weRole]?.we||0))+'\n'+weLines.join('\n');}
      if(ptEntry){if(ptPerProg[pname])ptPerProg[pname]+='\n'+ptEntry;else ptPerProg[pname]=ptEntry;}
    }
  });

  const ftCombined=Object.values(ftPerProg).join('\n');
  const ptCombined=Object.values(ptPerProg).join('\n');
  const svcParts=[];
  if(mentoringFmt) svcParts.push('Mentoring: '+mentoringFmt);
  if(progLeadFmt) svcParts.push('Program Lead: '+progLeadFmt);
  if(adhocFmt) svcParts.push('Ad-hoc: '+adhocFmt);
  if(trainingFmt) svcParts.push('Training: '+trainingFmt);
  const svcCombined=svcParts.length>0?svcParts.join(' | '):'';

  const payload={
    invoiceNo:sanitise(invno)||'',
    name:sanitise(document.getElementById('d-name').value),
    email:sanitise(document.getElementById('d-email').value),
    phone:sanitise(document.getElementById('d-phone').value.replace(/^\+/,'')),
    date:sanitise(document.getElementById('d-date').value),
    programs:sanitise(programs.join(' | ')),
    ftRoles:sanitise(ftCombined),
    ptRoles:sanitise(ptCombined),
    services:sanitise(svcCombined),
    grandTotal,
    bank:sanitise(document.getElementById('b-bank').value),
    accNo:sanitise(document.getElementById('b-acc').value),
    paynow:sanitise(document.getElementById('b-paynow').value),
    remarks:sanitise(document.getElementById('b-notes').value),
    token:FORM_TOKEN,
honeypot:document.getElementById('honeypot').value,
  };

  if(GS_URL!=="YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"){
    try{
      const formData=new FormData();
      formData.append('data',JSON.stringify(payload));
      fetch(GS_URL,{method:'POST',mode:'no-cors',body:formData})
        .then(()=>{document.getElementById('gsStatus').textContent='✓ Saved to sheet';})
        .catch(()=>{document.getElementById('gsStatus').textContent='⚠ Check sheet manually';});
    }catch(e){document.getElementById('gsStatus').textContent='⚠ Check sheet manually';}
  }

  document.getElementById('mainForm').style.display='none';
  document.getElementById('successScreen').classList.add('show');
  document.getElementById('sucRef').textContent=invno||'No Invoice #';
  document.getElementById('sucMsg').textContent=`${payload.name}'s invoice totalling ${payload.grandTotal} has been recorded.`;
  buildPDF(payload);
}

function buildPDF(payload){
  const fmt=v=>v||'—';
  const today=new Date().toLocaleDateString('en-SG',{day:'2-digit',month:'2-digit',year:'numeric'});
  document.getElementById('pdf-invno').textContent=fmt(payload.invoiceNo);
  document.getElementById('pdf-date').textContent=payload.date?new Date(payload.date).toLocaleDateString('en-SG',{day:'numeric',month:'long',year:'numeric'}):'—';
  document.getElementById('pdf-subdate').textContent=today;
  document.getElementById('pdf-name').textContent=fmt(payload.name);
  document.getElementById('pdf-email').textContent=fmt(payload.email);
  document.getElementById('pdf-phone').textContent=fmt(payload.phone);
  document.getElementById('pdf-bank').textContent=fmt(payload.bank);
  document.getElementById('pdf-accno').textContent=payload.accNo?'Acc No: '+payload.accNo:'—';
  document.getElementById('pdf-paynow').textContent=payload.paynow?'PayNow: '+payload.paynow:'';
  document.getElementById('pdf-remarks').textContent=fmt(payload.remarks);
  document.getElementById('pdf-signame').textContent=fmt(payload.name);
  document.getElementById('pdf-total').textContent=payload.grandTotal;
  const sigEl=document.getElementById('sig');
  if(sigEl){const sigImg=document.getElementById('pdf-sig');sigImg.src=sigEl.toDataURL();sigImg.style.display='block';}
  const tbody=document.getElementById('pdf-items');
  tbody.innerHTML='';
  const fmtDate=d=>d?new Date(d).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'}):'—';
  const fmtAmt2=v=>{const s=v.toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});return s.endsWith('.00')?s.slice(0,-3):s;};
  document.querySelectorAll('.pb').forEach(b=>{
    const id=parseInt(b.id.split('-')[1]);
    const pname=document.getElementById('pbtitle-'+id)?.textContent||'—';
    const cohort=document.getElementById('cohort-'+id)?.value||'';
    const cohortStr=cohort?' Cohort '+cohort:'';
    const subRows=[];
    if(document.getElementById('ft-on-'+id)?.checked){
      const role=document.querySelector(`input[name="ftr-${id}"]:checked`)?.value||'';
      const rLabel=role==='lead'?'Lead':'Support';
      const rate=role==='lead'?RATES.ft.lead:RATES.ft.support;
      let totalSess=0;const dateLines=[];
      document.querySelectorAll(`[id^="ft-date-val-${id}-"]`).forEach(dateInp=>{
        if(!dateInp.value) return;
        const dc=dateInp.id.replace(`ft-date-val-${id}-`,'');
        const sess=parseFloat(document.getElementById(`ft-date-sess-${id}-${dc}`)?.value)||0;
        totalSess+=sess;dateLines.push('- '+fmtDate(dateInp.value)+' ('+sess+' session'+(sess>1?'s':'')+', '+(sess*3)+'hrs)');
      });
      if(dateLines.length>0) subRows.push({label:'FT Weekday '+rLabel,lines:dateLines,amt:totalSess*rate});
    }
    if(document.getElementById('pt-on-'+id)?.checked){
      const wdRole=document.querySelector(`input[name="ptr-wd-${id}"]:checked`)?.value;
      const weRole=document.querySelector(`input[name="ptr-we-${id}"]:checked`)?.value;
      let wdHrs=0;const wdLines=[];
      document.querySelectorAll(`[id^="pt-date-val-${id}-wd-"]`).forEach(dateInp=>{
        if(!dateInp.value) return;
        const dc=dateInp.id.replace(`pt-date-val-${id}-wd-`,'');
        const hrs=parseFloat(document.getElementById(`pt-date-hrs-${id}-wd-${dc}`)?.value)||0;
        wdHrs+=hrs;wdLines.push('- '+fmtDate(dateInp.value)+' ('+hrs+'hrs)');
      });
      if(wdLines.length>0&&wdRole){const rLabel=wdRole==='ta'?'TA':wdRole.charAt(0).toUpperCase()+wdRole.slice(1);subRows.push({label:'PT Weekday '+rLabel,lines:wdLines,amt:wdHrs*(RATES.pt[wdRole]?.wd||0)});}
      let weHrs=0;const weLines=[];
      document.querySelectorAll(`[id^="pt-date-val-${id}-we-"]`).forEach(dateInp=>{
        if(!dateInp.value) return;
        const dc=dateInp.id.replace(`pt-date-val-${id}-we-`,'');
        const hrs=parseFloat(document.getElementById(`pt-date-hrs-${id}-we-${dc}`)?.value)||0;
        weHrs+=hrs;weLines.push('- '+fmtDate(dateInp.value)+' ('+hrs+'hrs)');
      });
      if(weLines.length>0&&weRole){const rLabel=weRole==='ta'?'TA':weRole.charAt(0).toUpperCase()+weRole.slice(1);subRows.push({label:'PT Weekend '+rLabel,lines:weLines,amt:weHrs*(RATES.pt[weRole]?.we||0)});}
    }
    subRows.forEach((r,i)=>{
      const isLast=i===subRows.length-1;
      const descHtml=`<span style="font-weight:700">${escapeHtml(pname)}${escapeHtml(cohortStr)} — ${escapeHtml(r.label)}</span><br><span style="font-size:.83rem;color:var(--ink-mid);line-height:1.7">${r.lines.map(l=>escapeHtml(l)).join('<br>')}</span>`;
      tbody.innerHTML+=`<tr style="${isLast?'border-bottom:1px solid var(--border)':'border-bottom:1px solid #eee'}"><td style="padding:10px 12px">${descHtml}</td><td style="padding:10px 12px;text-align:right;font-weight:700;vertical-align:top">S$ ${fmtAmt2(r.amt)}</td></tr>`;
    });
  });
  const mRate2=parseFloat(document.getElementById('m-rate')?.value)||0;
  const mHrs3=parseFloat(document.getElementById('m-hrs')?.value)||0;
  if(document.getElementById('svc-mentoring').classList.contains('on')&&mHrs3>0&&mRate2>0){
    const mTotal=mHrs3*mRate2;const mLines=[];
    document.querySelectorAll('[id^="ment-date-"]').forEach(dateInp=>{
      const mc=dateInp.id.replace('ment-date-','');
      const hrs=parseFloat(document.getElementById('ment-hrs-'+mc)?.value)||0;
      const students=escapeHtml(document.getElementById('ment-students-'+mc)?.value||'');
      if(dateInp.value||students) mLines.push('- '+escapeHtml(fmtDate(dateInp.value))+(students?' ('+students+')':'')+(hrs?' '+hrs+'hrs':''));
    });
    tbody.innerHTML+=`<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px 12px"><span style="font-weight:700">Mentoring</span><br><span style="font-size:.83rem;color:var(--ink-mid);line-height:1.7">${mLines.length>0?mLines.join('<br>'):mHrs3+'hrs @ S$'+mRate2+'/hr'}</span></td><td style="padding:10px 12px;text-align:right;font-weight:700;vertical-align:top">S$ ${fmtAmt2(mTotal)}</td></tr>`;
  }
  const plRate=parseFloat(document.getElementById('pl-rate')?.value)||0;
  const plDesc=document.getElementById('pl-desc')?.value||'';
  if(document.getElementById('svc-proglead').classList.contains('on')&&plRate>0){
    tbody.innerHTML+=`<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px 12px"><span style="font-weight:700">Program Lead</span>${plDesc?'<br><span style="font-size:.83rem;color:var(--ink-mid)">'+escapeHtml(plDesc)+'</span>':''}</td><td style="padding:10px 12px;text-align:right;font-weight:700;vertical-align:top">S$ ${fmtAmt2(plRate)}</td></tr>`;
  }
  if(document.getElementById('svc-adhoc').classList.contains('on')){
    document.querySelectorAll('#adhoc-items [id^="adhi-"]').forEach(item=>{
      const desc=escapeHtml(item.querySelector('input[type="text"]')?.value||'Ad-hoc');
      const amt=parseFloat(item.querySelector('input[type="number"]')?.value)||0;
      if(amt>0) tbody.innerHTML+=`<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px 12px"><span style="font-weight:700">Ad-hoc Services</span><br><span style="font-size:.83rem;color:var(--ink-mid)">${desc}</span></td><td style="padding:10px 12px;text-align:right;font-weight:700;vertical-align:top">S$ ${fmtAmt2(amt)}</td></tr>`;
    });
  }
  const tType=document.querySelector('input[name="tr-type"]:checked')?.value;
  if(document.getElementById('svc-training').classList.contains('on')){
    let trAmt=0,trDesc='';
    if(tType==='hourly'){const h=parseFloat(document.getElementById('tr-hrs')?.value)||0;const r=parseFloat(document.getElementById('tr-rate')?.value)||0;trAmt=h*r;trDesc=h+'hrs @ S$'+r+'/hr';}
    else if(tType==='flat'){trAmt=parseFloat(document.getElementById('tr-flat-amt')?.value)||0;trDesc=escapeHtml(document.getElementById('tr-flat-desc')?.value||'Flat fee');}
    if(trAmt>0) tbody.innerHTML+=`<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px 12px"><span style="font-weight:700">Training / Workshop</span><br><span style="font-size:.83rem;color:var(--ink-mid)">${trDesc}</span></td><td style="padding:10px 12px;text-align:right;font-weight:700;vertical-align:top">S$ ${fmtAmt2(trAmt)}</td></tr>`;
  }
}

function printInvoice(){window.print();}

function editInvoice(){
  document.getElementById('successScreen').classList.remove('show');
  document.getElementById('mainForm').style.display='';
  document.getElementById('edit-note').style.display='block';
  go(2);
  window.scrollTo({top:0,behavior:'smooth'});
  document.getElementById('successScreen').classList.add('edit-mode');
}

function onCohortChange(id){
  const val=document.getElementById('cohort-'+id)?.value||'';
  const isFT=val.length>0&&val.toUpperCase().endsWith('F');
  const isPT=val.length>0&&!val.toUpperCase().endsWith('F');
  const isEmpty=val.length===0;
  const ftNote=document.getElementById('cohort-ft-note-'+id);
  const emptyNote=document.getElementById('cohort-empty-note-'+id);
  const ptSec=document.getElementById('ptsec-'+id);
  const ftSec=document.getElementById('ftsec-'+id);
  const weWrap=document.getElementById('pt-we-wrap-'+id);
  if(ftNote) ftNote.style.display=isFT?'block':'none';
  if(emptyNote) emptyNote.style.display=isEmpty?'block':'none';
  if(ftSec) ftSec.style.display=isFT?'':'none';
  if(ptSec) ptSec.style.display=isPT?'':'none';
  if(weWrap) weWrap.style.display=isFT?'none':'';
  if(isPT||isEmpty){
    const ftOn=document.getElementById('ft-on-'+id);
    if(ftOn&&ftOn.checked){ftOn.checked=false;togFT(id);}
    document.querySelectorAll(`[id^="ft-date-val-${id}-"]`).forEach(el=>{el.closest(`[id^="ft-date-${id}-"]`)?.remove();});
    document.querySelectorAll(`input[name="ftr-${id}"]`).forEach(r=>r.checked=false);
  }
  if(isFT||isEmpty){
    const ptOn=document.getElementById('pt-on-'+id);
    if(ptOn&&ptOn.checked){ptOn.checked=false;togPT(id);}
    document.querySelectorAll(`[id^="pt-date-val-${id}-wd-"]`).forEach(el=>{el.closest(`[id^="pt-date-${id}-wd-"]`)?.remove();});
    document.querySelectorAll(`[id^="pt-date-val-${id}-we-"]`).forEach(el=>{el.closest(`[id^="pt-date-${id}-we-"]`)?.remove();});
    document.querySelectorAll(`input[name="ptr-wd-${id}"]`).forEach(r=>r.checked=false);
    document.querySelectorAll(`input[name="ptr-we-${id}"]`).forEach(r=>r.checked=false);
  }
  calcPbAndUpdate(id);
}

function validateDayType(input,type){
  if(!input.value){input.style.borderColor='';input.title='';return;}
  const [y,m,d]=input.value.split('-').map(Number);
  const dow=new Date(y,m-1,d).getDay();
  const isWeekend=dow===0||dow===6;
  const expectWeekend=type==='we';
  if(isWeekend!==expectWeekend){
    const dayName=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow];
    const expect=expectWeekend?'a weekend (Sat/Sun)':'a weekday (Mon–Fri)';
    input.style.borderColor='#e53e3e';input.style.boxShadow='0 0 0 3px rgba(229,62,62,.18)';input.title=`⚠ ${dayName} is not ${expect}`;
    let warn=input.parentElement.querySelector('.day-warn');
    if(!warn){warn=document.createElement('div');warn.className='day-warn';warn.style.cssText='font-size:.68rem;font-weight:600;color:#e53e3e;margin-top:3px';input.parentElement.appendChild(warn);}
    warn.textContent=`⚠ ${dayName} — expected ${expect}`;
  } else {
    input.style.borderColor='';input.style.boxShadow='';input.title='';
    const warn=input.parentElement.querySelector('.day-warn');
    if(warn) warn.remove();
  }
}

loadSaved();
document.getElementById('d-date').value=new Date().toISOString().split('T')[0];
if(GS_LINK!=="YOUR_GOOGLE_SHEET_LINK_HERE") document.getElementById('gsLink').href=GS_LINK;
addProg();
