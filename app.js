let ALL = [];
let POOL = [];
let IDX = 0;
let MODE = 'landing'; // 'practice' | 'exam' | 'review'
let ANSWERS = {}; // { id: { sel:'T'|'F', correct: true|false|null } }
let TICK = null;
let TIMELEFT = 0;
let NO_BACK = false;

const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function shuffle(a){
  const arr = a.slice();
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function fmt(s){
  const m = String(Math.floor(s/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return `${m}:${sec}`;
}

async function loadQuestions(){
  const r = await fetch('questions.json');
  const data = await r.json();
  ALL = data.map((x,i)=> ({
    id: x.id ?? (i+1),
    statement: x.statement || x.original_text || '',
    answer: (x.answer||'').toString().trim().toUpperCase(), // 'T'|'F' or ''
    explanation: x.explanation || x.reference_answer || '',
    category: x.category || '',
    difficulty: x.difficulty || 'medium'
  }));
  $('#poolSize').placeholder = String(ALL.length);
}

function setView(name){
  MODE = name;
  $('#landing').classList.toggle('hidden', name!=='landing');
  $('#quiz').classList.toggle('hidden', name!=='practice' && name!=='exam');
  $('#review').classList.toggle('hidden', name!=='review');
}

function buildPool(){
  const ps = parseInt($('#poolSize').value || ALL.length);
  const size = clamp(ps, 1, ALL.length);
  POOL = shuffle(ALL).slice(0, size);
  IDX = 0;
  ANSWERS = {};
}

function updateProgress(){
  $('#progress').textContent = `ข้อ ${IDX+1}/${POOL.length}`;
  $('#progressFill').style.width = `${Math.round(((IDX+1)/POOL.length)*100)}%`;
}

function renderQuestion(){
  const q = POOL[IDX];
  $('#modeLabel').textContent = MODE==='practice' ? 'Practice' : 'Exam';
  $('#meta').textContent = `${q.category?('หมวด: ' + q.category + ' • '):''}${q.difficulty?('ความยาก: ' + q.difficulty):''}`;
  $('#statement').textContent = q.statement;

  const rec = ANSWERS[q.id] || {};
  // Button state
  $('#btnT').classList.toggle('primary', rec.sel==='T');
  $('#btnT').classList.toggle('wide', true);
  $('#btnF').classList.toggle('primary', rec.sel==='F');
  $('#btnF').classList.toggle('wide', true);

  // Feedback
  const fb = $('#feedback');
  if (MODE==='practice' && rec.sel){
    fb.classList.remove('hidden');
    let inner = `<div><strong>เฉลย:</strong> ${q.explanation || '(ไม่มีคำอธิบายในไฟล์)'}</div>`;
    if(q.answer==='T' || q.answer==='F'){
      const ok = (rec.sel === q.answer);
      rec.correct = ok;
      inner += `<div class="mt"><span class="badge ${ok?'ok':'ng'}">${ok?'ถูก':'ผิด'}</span></div>`;
    }else{
      inner += `<div class="mt"><span class="badge">โหมด Self-mark (ไฟล์ไม่มีคำตอบ T/F)</span></div>`;
    }
    fb.innerHTML = inner;
  } else {
    fb.classList.add('hidden');
    fb.innerHTML = '';
  }

  $('#btnPrev').disabled = (MODE==='exam' && NO_BACK) || IDX===0;
  $('#btnNext').textContent = (IDX===POOL.length-1) ? 'สุดท้าย' : 'ถัดไป';
  updateProgress();
}

function answer(val){
  const q = POOL[IDX];
  ANSWERS[q.id] = ANSWERS[q.id] || {};
  ANSWERS[q.id].sel = val;
  renderQuestion();
}

function prev(){ if(MODE==='exam' && NO_BACK) return; if(IDX>0){ IDX--; renderQuestion(); } }
function next(){ if(IDX<POOL.length-1){ IDX++; renderQuestion(); } }

function review(){
  setView('review');
  // score
  let correct=0, wrong=0, unscored=0;
  const list = $('#reviewList');
  list.innerHTML='';
  POOL.forEach((q,i)=>{
    const rec = ANSWERS[q.id]||{};
    let verdict = 'ยังไม่ตรวจ';
    let badge = 'badge';
    if(q.answer==='T' || q.answer==='F'){
      if(rec.sel){
        const ok = rec.sel===q.answer;
        rec.correct = ok;
        verdict = ok?'ถูก':'ผิด';
        badge += ok?' ok':' ng';
      }else{
        verdict = 'ยังไม่ตอบ';
      }
    }else{
      verdict = rec.sel ? `ตอบ: ${rec.sel} (self-mark)` : 'ยังไม่ตอบ';
    }
    if(rec.correct===true) correct++;
    else if(rec.correct===false) wrong++;
    else unscored++;

    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="muted small">ข้อ ${i+1} ${q.category?('• '+q.category):''} ${q.difficulty?('• '+q.difficulty):''}</div>
      <div style="margin-top:4px">${q.statement}</div>
      <div class="muted small" style="margin-top:6px">เฉลย: ${q.explanation || '-'}</div>
      <div style="margin-top:6px"><span class="${badge}">${verdict}</span></div>
    `;
    list.appendChild(div);
  });
  const total = POOL.length;
  const percent = total ? Math.round((correct/total)*100) : 0;
  $('#summary').textContent = `คะแนนอัตโนมัติ: ${correct}/${total} (${percent}%) • ไม่ตรวจ: ${unscored}`;
}

function startPractice(){
  NO_BACK = false;
  buildPool();
  setView('practice');
  $('#timerBox').classList.add('hidden');
  renderQuestion();
}
function startExam(){
  NO_BACK = $('#noBack').checked;
  buildPool();
  setView('exam');
  TIMELEFT = Math.max(5, parseInt($('#examMinutes').value||'60'))*60;
  $('#timerBox').classList.remove('hidden');
  $('#timer').textContent = fmt(TIMELEFT);
  renderQuestion();
}

function startTimer(){
  if(TICK) return;
  TICK = setInterval(()=>{
    TIMELEFT--;
    $('#timer').textContent = fmt(TIMELEFT);
    if(TIMELEFT<=0){
      clearInterval(TICK); TICK=null;
      review();
    }
  }, 1000);
}
function submitExam(){
  if(TICK){ clearInterval(TICK); TICK=null; }
  review();
}

function shuffleNew(){
  buildPool();
  if(MODE==='practice'){ setView('practice'); } else { setView('exam'); }
  renderQuestion();
}

function restart(){
  setView('landing');
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await loadQuestions();
  setView('landing');

  $('#btnPractice').addEventListener('click', startPractice);
  $('#btnExam').addEventListener('click', startExam);
  $('#btnTimer').addEventListener('click', startTimer);
  $('#btnSubmit').addEventListener('click', submitExam);
  $('#btnT').addEventListener('click', ()=>answer('T'));
  $('#btnF').addEventListener('click', ()=>answer('F'));
  $('#btnPrev').addEventListener('click', prev);
  $('#btnNext').addEventListener('click', next);
  $('#btnReview').addEventListener('click', review);
  $('#btnShuffle').addEventListener('click', shuffleNew);
  $('#btnRestart').addEventListener('click', restart);

  // Keyboard shortcuts: T/F, arrow nav
  document.addEventListener('keydown', (e)=>{
    const tag = (e.target && e.target.tagName) || '';
    if(tag==='INPUT' || tag==='TEXTAREA') return;
    if(MODE==='practice' || MODE==='exam'){
      if(e.key==='t' || e.key==='T') answer('T');
      if(e.key==='f' || e.key==='F') answer('F');
      if(e.key==='ArrowRight') next();
      if(e.key==='ArrowLeft') prev();
    }
  });
});
