const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static("public"));
const rooms = new Map();
const maxPlayers = 10;
function code() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:5},()=>chars[crypto.randomInt(chars.length)]).join("");
}
function snapshot(room) {
  return [...room.players.values()].map(p=>({id:p.id,name:p.name,team:p.team,x:p.x,z:p.z,yaw:p.yaw,hp:p.hp}));
}
function broadcast(roomCode) {
  const room=rooms.get(roomCode);
  if(room) io.to(roomCode).emit("room-state",{code:roomCode,players:snapshot(room),score:room.score});
}
io.on("connection",socket=>{
  function leave() {
    const roomCode=socket.data.room, room=rooms.get(roomCode);
    if(!room)return;
    const p=room.players.get(socket.id);
    room.players.delete(socket.id); socket.leave(roomCode); socket.data.room=null;
    if(p)io.to(roomCode).emit("notice",p.name+" saiu.");
    if(!room.players.size)rooms.delete(roomCode);else broadcast(roomCode);
  }
  function join(roomCode,name,cb) {
    const room=rooms.get(roomCode);
    if(!room)return cb({ok:false,error:"Sala não encontrada."});
    if(room.players.size>=maxPlayers)return cb({ok:false,error:"Sala cheia (10 jogadores)."});
    leave();
    const ct=[...room.players.values()].filter(p=>p.team==="ct").length;
    const t=[...room.players.values()].filter(p=>p.team==="t").length;
    const team=ct<=t?"ct":"t";
    const p={id:socket.id,name:String(name||"Jogador").trim().slice(0,16)||"Jogador",team,x:team==="ct"?-7:7,z:team==="ct"?8:-8,yaw:0,hp:100};
    room.players.set(socket.id,p);socket.data.room=roomCode;socket.join(roomCode);
    cb({ok:true,id:socket.id,code:roomCode,team});broadcast(roomCode);
    socket.to(roomCode).emit("notice",p.name+" entrou na partida.");
  }
  socket.on("create-room",({name},cb)=>{let c;do{c=code()}while(rooms.has(c));rooms.set(c,{players:new Map(),score:{ct:0,t:0}});join(c,name,cb||(()=>{}));});
  socket.on("join-room",({name,code:c},cb)=>join(String(c||"").trim().toUpperCase(),name,cb||(()=>{})));
  socket.on("move",d=>{const room=rooms.get(socket.data.room),p=room&&room.players.get(socket.id);if(!p)return;p.x=Math.max(-21,Math.min(21,Number(d.x)||0));p.z=Math.max(-21,Math.min(21,Number(d.z)||0));p.yaw=Number(d.yaw)||0;socket.to(socket.data.room).emit("player-moved",{id:p.id,x:p.x,z:p.z,yaw:p.yaw});});
  socket.on("fire",({targetId})=>{const room=rooms.get(socket.data.room),a=room&&room.players.get(socket.id),b=room&&room.players.get(targetId);if(!a||!b||a.team===b.team)return;b.hp=Math.max(0,b.hp-34);io.to(socket.data.room).emit("hit-update",{id:b.id,hp:b.hp});if(!b.hp){room.score[a.team]++;io.to(socket.data.room).emit("elimination",{killer:a.name,victim:b.name,score:room.score});b.hp=100;b.x=b.team==="ct"?-7:7;b.z=b.team==="ct"?8:-8;}broadcast(socket.data.room);});
  socket.on("chat",m=>{const room=rooms.get(socket.data.room),p=room&&room.players.get(socket.id);if(p)io.to(socket.data.room).emit("chat",{name:p.name,message:String(m||"").slice(0,140)});});
  socket.on("disconnect",leave);
});
const port=process.env.PORT||3000;
server.listen(port,()=>console.log("CS DOS XITOLHOS a correr na porta "+port));