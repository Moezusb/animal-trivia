import {auth,db,$,show,leaderboard,visual} from './common.js';
import {QUESTIONS} from './questions.js';
import {signInWithEmailAndPassword,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {doc,onSnapshot,collection,getDocs,writeBatch,Timestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
let game={phase:'lobby',index:-1},players=[],answers=[],initialized=false,busy=false;
const status=t=>$('status').textContent=t;
$('loginForm').onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$('email').value,$('password').value)}catch(err){status('Sign in: '+err.message)}};
onAuthStateChanged(auth,u=>{if(u&&!u.isAnonymous&&!initialized){initialized=true;show('login',false);show('controls',true);show('leaderboard',true);onSnapshot(doc(db,'game','main'),s=>{game=s.exists()?s.data():{phase:'lobby',index:-1};render()},e=>status('Game: '+e.message));onSnapshot(collection(db,'players'),s=>{players=s.docs.map(d=>({id:d.id,...d.data()}));render()},e=>status('Players: '+e.message));onSnapshot(collection(db,'answers'),s=>{answers=s.docs.map(d=>d.data());render()},e=>status('Answers: '+e.message));}});
function render(){const idx=game.index??-1,q=QUESTIONS[idx],left=game.deadline?Math.max(0,Math.ceil((game.deadline.toMillis()-Date.now())/1000)):0;
$('phase').textContent=(game.phase||'lobby').toUpperCase();$('question').textContent=q?`${idx+1}. ${q.title}`:'Waiting for players to join';$('visual').innerHTML=q?visual(q):'';
$('time').textContent=game.phase==='question'?`Time remaining: ${left} seconds${left===0?' — click Reveal answer':''}`:'';
$('stats').textContent=`${players.length} players · ${answers.filter(a=>a.question===idx).length} answers this round`;
$('players').textContent=players.map(p=>p.name).join(', ')||'None yet';$('rankings').innerHTML=leaderboard(players);
$('open').disabled=busy||players.length===0||game.phase==='question'||game.phase==='finished'||idx===6&&game.phase!=='lobby';
$('reveal').disabled=busy||game.phase!=='question';$('finish').disabled=busy||game.phase==='question';$('reset').disabled=busy;
}
async function update(data){const b=writeBatch(db);b.set(doc(db,'game','main'),data);await b.commit()}
async function act(fn){if(busy)return;busy=true;render();try{await fn()}catch(e){status('Action failed: '+e.message)}finally{busy=false;render()}}
$('open').onclick=()=>act(async()=>{if(!players.length){status('Ask someone to join before starting.');return}if(game.phase==='question'||game.phase==='finished')return;const idx=game.phase==='lobby'?0:game.index+1;if(idx>=QUESTIONS.length)return;await update({phase:'question',index:idx,deadline:Timestamp.fromMillis(Date.now()+30000)});status('Question started')});
$('reveal').onclick=()=>act(async()=>{if(game.phase!=='question')return;const idx=game.index,q=QUESTIONS[idx],b=writeBatch(db);for(const player of players){const a=answers.find(a=>a.uid===player.id&&a.question===idx);if(a?.choice===q.correct)b.update(doc(db,'players',player.id),{score:(player.score||0)+100})}b.set(doc(db,'game','main'),{phase:'reveal',index:idx,deadline:game.deadline});await b.commit();status(`Correct answer: ${q.options[q.correct]} — ${q.fact}`)});
$('finish').onclick=()=>act(async()=>{if(game.phase==='question'){status('Reveal the answer first.');return}await update({phase:'finished',index:game.index??6})});
$('reset').onclick=()=>act(async()=>{if(!confirm('Clear all players and scores, then return to lobby?'))return;const b=writeBatch(db);(await getDocs(collection(db,'answers'))).forEach(x=>b.delete(x.ref));(await getDocs(collection(db,'players'))).forEach(x=>b.delete(x.ref));b.set(doc(db,'game','main'),{phase:'lobby',index:-1});await b.commit();status('Reset done. Ask players to rejoin or refresh.')});
setInterval(()=>{if(game.phase==='question')render()},1000);
