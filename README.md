# CS DOS XITOLHOS — protótipo online

Jogo FPS experimental no navegador, com salas privadas e sincronização multiplayer via Socket.IO.

## Funcionalidades iniciais
- Criar sala privada e entrar com código.
- Até 10 jogadores por sala, equipas CT/T equilibradas.
- Arena 3D simples com Three.js.
- Movimento sincronizado, chat, placar e disparos experimentais.

## Executar localmente
Requer Node.js 20+.
```bash
npm install
npm start
```
Abre http://localhost:3000.

## Publicar
Usa um serviço de alojamento que execute Node.js e suporte WebSockets. Define o comando de arranque como `npm start`. Partilha o URL HTTPS do serviço.

## Limitações
É uma primeira demonstração, não uma versão competitiva pronta para produção. Faltam validação anti-cheat, física e colisões completas, sistema de rondas/bomba, contas, ranking persistente e testes de carga. O cliente carrega Three.js por CDN e precisa de Internet.