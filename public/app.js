const socket = io();
const el = id => document.getElementById(id); let room, order, selected, moves=0, clock;
const toast = text => { el('toast').textContent=text; el('toast').classList.add('show'); setTimeout(()=>el('toast').classList.remove('show'),3400); };
function shuffled(){ let a=[...Array(16).keys()]; do { a.sort(()=>Math.random()-.5); } while(a.every((v,i)=>v===i)); return a; }
function draw(){ const b=el('board'); b.innerHTML=''; order.forEach((piece, i)=>{ const sheetX=(room.image%4)*4+(piece%4), sheetY=Math.floor(room.image/4)*4+Math.floor(piece/4); const tile=document.createElement('button'); tile.className='tile'+(selected===i?' selected':''); tile.style.backgroundImage="url('/assets/animal-puzzle-pack.png')"; tile.style.backgroundSize='1600% 1600%'; tile.style.backgroundPosition=`${sheetX/15*100}% ${sheetY/15*100}%`; tile.onclick=()=>tap(i); b.append(tile); }); }
function tap(index){ if(selected===undefined){ selected=index; draw(); return; } if(selected===index){selected=undefined;draw();return;} [order[selected],order[index]]=[order[index],order[selected]]; selected=undefined;moves++;el('moves').textContent=`${moves} حركة`;draw(); if(order.every((v,i)=>v===i)){ clearInterval(clock); socket.emit('finish',{moves,seconds:Math.floor((Date.now()-room.startedAt)/1000)}); }}
function format(seconds){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
function start(data){ room=data; el('lobby').hidden=true;el('game').hidden=false;el('roomCode').textContent=`غرفة ${room.code}`; updatePlayers(room); if(!room.started){el('waiting').hidden=false;el('puzzleArea').hidden=true;el('shareCode').textContent=room.code;return;} el('waiting').hidden=true;el('puzzleArea').hidden=false; order=shuffled();moves=0;selected=undefined;el('reference').style.backgroundPosition=`${room.image%4/3*100}% ${Math.floor(room.image/4)/3*100}%`;draw();clearInterval(clock);clock=setInterval(()=>el('timer').textContent=format(Math.max(0,Math.floor((Date.now()-room.startedAt)/1000))),250); }
function updatePlayers(data){el('players').textContent=`👥 ${data.players.map(p=>p.name).join('، ')}`}
function validName(){const name=el('name').value.trim();if(!name){toast('اكتب اسمك أولاً');return null}return name}
el('create').onclick=()=>{const name=validName();if(name)socket.emit('create-room',{name})};
el('join').onclick=()=>{const name=validName(),code=el('code').value.trim();if(!code){toast('اكتب رمز الغرفة');return}if(name)socket.emit('join-room',{name,code})};
el('leave').onclick=()=>location.reload();
socket.on('room-ready',start);socket.on('game-start',start);socket.on('room-update',updatePlayers);socket.on('room-error',toast);socket.on('winner',r=>toast(`🏆 الفائز: ${r.winner} — ${format(r.seconds)} / ${r.moves} حركة`));
