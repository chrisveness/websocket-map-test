/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import http               from 'http';
import WebSocket          from 'ws';
import { promises as fs } from 'fs';


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const server = http.createServer(); // web server

server.on('request', async(req, res) => {
    switch (req.url) {
        case '/page':
            await servePage(res);
            break;
        default:
            res.writeHead(404);
            res.end();
            break;
    }
});

async function servePage(res) {
    const file = await fs.readFile('page.html');
    const html = file.toString('utf8').replace('{{timestamp}}', new Date().toISOString().split('T')[1]);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    res.end();
}

server.listen(3000);
console.info('Server listening on 3000');


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const wsServer = new WebSocket.Server({ server: server }); // websocket server

wsServer.on('connection', async (ws, req) => {
    console.log('new connection', ws._socket.remoteAddress);
    let open = true;

    ws.on('message', message => {
        console.log(`msg rec’d: ‘${message}’`)
    });

    ws.on('close', () => {
        console.log('connection closed');
        open = false;
    });

    while (open) { // send new location at random intervals
        const msg = {
            lat:   Math.random() * 6 + 50,
            lng:   Math.random() * 8 - 6,
            title: new Date().toISOString().split('T')[1],
        };
        console.log('send msg', msg.title);
        ws.send(JSON.stringify(msg));
        await sleep(Math.floor(Math.random()*4000));
    }
});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
