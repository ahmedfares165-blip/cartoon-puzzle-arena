const express = require('express');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = app.listen(process.env.PORT || 3000, () => console.log('Puzzle Arena started'));
const io = new Server(server, { cors: { origin: '*' } });
const rooms = new Map();
const images = Array.from({ length: 16 }, (_, i) => i);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_, res) => res.status(200).json({ ok: true }));

function publicRoom(room) {
  return { code: room.code, image: room.image, startedAt: room.startedAt, started: Boolean(room.startedAt), players: [...room.players.values()].map(p => ({ name: p.name })) };
}
function makeCode() { return Math.random().toString(36).slice(2, 7).toUpperCase(); }

io.on('connection', socket => {
  socket.on('create-room', ({ name }) => {
    let code; do { code = makeCode(); } while (rooms.has(code));
    const room = { code, image: images[Math.floor(Math.random() * images.length)], startedAt: null, players: new Map() };
    room.players.set(socket.id, { name: String(name || 'لاعب').slice(0, 20), finished: false });
    rooms.set(code, room); socket.join(code); socket.emit('room-ready', publicRoom(room));
  });
  socket.on('join-room', ({ code, name }) => {
    const room = rooms.get(String(code || '').toUpperCase());
    if (!room) return socket.emit('room-error', 'الغرفة غير موجودة.');
    room.players.set(socket.id, { name: String(name || 'لاعب').slice(0, 20), finished: false });
    socket.join(room.code);
    if (!room.startedAt && room.players.size >= 2) {
      room.startedAt = Date.now();
      io.to(room.code).emit('game-start', publicRoom(room));
    } else {
      socket.emit('room-ready', publicRoom(room));
    }
    io.to(room.code).emit('room-update', publicRoom(room));
  });
  socket.on('finish', ({ moves, seconds }) => {
    const code = [...socket.rooms].find(x => rooms.has(x)), room = rooms.get(code);
    if (!room?.startedAt || room.players.get(socket.id)?.finished) return;
    if (room.winner) return;
    const player = room.players.get(socket.id); player.finished = true;
    const result = { winner: player.name, moves: Number(moves), seconds: Number(seconds), at: Date.now() };
    room.winner = result;
    io.to(code).emit('winner', result);
  });
  socket.on('disconnect', () => {
    for (const [code, room] of rooms) if (room.players.delete(socket.id)) {
      if (!room.players.size) rooms.delete(code); else io.to(code).emit('room-update', publicRoom(room));
    }
  });
});
