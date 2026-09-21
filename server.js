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
  return { code: room.code, image: room.image, startedAt: room.startedAt, started: Boolean(room.startedAt), players: [...room.players.values()].map(p => ({ name: p.name, connected: p.connected })) };
}
function makeCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

io.on('connection', socket => {
  socket.on('create-room', ({ name, token }) => {
    let code; do { code = makeCode(); } while (rooms.has(code));
    const room = { code, image: images[Math.floor(Math.random() * images.length)], startedAt: null, hostToken: token, players: new Map() };
    room.players.set(token, { name: String(name || 'لاعب').slice(0, 20), finished: false, connected: true, socketId: socket.id });
    rooms.set(code, room); socket.join(code); socket.emit('room-ready', { ...publicRoom(room), isHost: true });
  });
  socket.on('join-room', ({ code, name, token }) => {
    const room = rooms.get(String(code || '').toUpperCase());
    if (!room) return socket.emit('room-error', 'الغرفة غير موجودة.');
    if (room.players.size >= 4) return socket.emit('room-error', 'الغرفة مكتملة (4 لاعبين).');
    if (room.startedAt) return socket.emit('room-error', 'بدأت المباراة بالفعل. أنشئ غرفة جديدة.');
    room.players.set(token, { name: String(name || 'لاعب').slice(0, 20), finished: false, connected: true, socketId: socket.id });
    socket.join(room.code);
    socket.emit('room-ready', { ...publicRoom(room), isHost: false });
    io.to(room.code).emit('room-update', publicRoom(room));
  });
  socket.on('rejoin-room', ({ code, token }) => {
    const room = rooms.get(String(code || '')), player = room?.players.get(token);
    if (!room || !player) return socket.emit('room-lost');
    player.connected = true; player.socketId = socket.id; socket.join(room.code);
    socket.emit('room-ready', { ...publicRoom(room), isHost: room.hostToken === token });
    io.to(room.code).emit('room-update', publicRoom(room));
  });
  socket.on('start-room', () => {
    const code = [...socket.rooms].find(x => rooms.has(x)), room = rooms.get(code);
    const host = room?.players.get(room?.hostToken);
    if (!room || host?.socketId !== socket.id || room.startedAt) return;
    if ([...room.players.values()].filter(p => p.connected).length < 2) return socket.emit('room-error', 'يجب دخول لاعب آخر قبل بدء المباراة.');
    room.startedAt = Date.now();
    io.to(room.code).emit('game-start', publicRoom(room));
  });
  socket.on('finish', ({ moves, seconds }) => {
    const code = [...socket.rooms].find(x => rooms.has(x)), room = rooms.get(code);
    const player = room && [...room.players.values()].find(p => p.socketId === socket.id);
    if (!room?.startedAt || !player || player.finished) return;
    if (room.winner) return;
    player.finished = true;
    const result = { winner: player.name, moves: Number(moves), seconds: Number(seconds), at: Date.now() };
    room.winner = result;
    io.to(code).emit('winner', result);
  });
  socket.on('disconnect', () => {
    for (const [code, room] of rooms) for (const [token, player] of room.players) if (player.socketId === socket.id) {
      player.connected = false; io.to(code).emit('room-update', publicRoom(room));
      setTimeout(() => {
        if (player.connected || player.socketId !== socket.id) return;
        room.players.delete(token);
        if (!room.players.size || room.hostToken === token) rooms.delete(code);
        else io.to(code).emit('room-update', publicRoom(room));
      }, 60000);
    }
  });
});
