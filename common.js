import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
export const app=initializeApp(firebaseConfig);export const auth=getAuth(app);export const db=getFirestore(app);
export const $=id=>document.getElementById(id);
export function show(el,yes){$(el).classList.toggle('hidden',!yes)}
export function leaderboard(players){return [...players].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).map((p,i)=>`<div class="leader"><span>${i+1}. ${safe(p.name)}</span><b>${p.score} pts</b></div>`).join('')||'<p class="muted">No players yet</p>'}
export function safe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export function visual(q){const image=q.image?`<img class="photo" src="${q.image}" alt="Animal comparison" onerror="this.style.display='none'">`:'';return `${image}<div class="emoji">${q.emoji}</div>`}
