/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import http               from 'http'; // nodejs.org/api/http.html
import WebSocket          from 'ws';   // ws: a Node.js WebSocket library
import { promises as fs } from 'fs';   // nodejs.org/api/fs.html


/* Web server  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const server = http.createServer();

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
    const html = file.toString('utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    res.end();
}

server.listen(process.env.PORT||3000);
console.info(`Server listening on port ${process.env.PORT||3000}`);


/* WebSocket server  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const wsServer = new WebSocket.Server({ server: server });

wsServer.on('connection', ws => {
    console.info('new connection from', ws._socket.remoteAddress);
    ws.on('close', () => {
        console.info(ws._socket.remoteAddress, 'left');
    });
});

wsServer.broadcast = function(data) {
    wsServer.clients.forEach(client => {
        if (client.readyState == WebSocket.OPEN) {
            client.send(data);
        }
    });
};

const trackers = [ // simulate tracker reports
    { id: 'a', lat: 52.20, lng: 0.12, ts: '00:00:00Z', speed: Math.random()/100, brng: Math.random()*360 },
    { id: 'b', lat: 52.20, lng: 0.12, ts: '00:00:00Z', speed: Math.random()/100, brng: Math.random()*360 },
    { id: 'c', lat: 52.20, lng: 0.12, ts: '00:00:00Z', speed: Math.random()/100, brng: Math.random()*360 },
];

function updateLocations() { // simulate movement of trackers
    for (const tracker of trackers) { // update tracker locations
        if (tracker.lat<50 || tracker.lat>56 || tracker.lng<-4 || tracker.lng>2) {
            // bounce off bounding box with new random speed/bearing
            tracker.speed = Math.random()/100;
            tracker.brng = (tracker.brng + 180 + Math.random()*90-45) % 360;
        }
        tracker.lat += tracker.speed * Math.cos(tracker.brng*Math.PI/180);
        tracker.lng += tracker.speed * Math.sin(tracker.brng*Math.PI/180);
        tracker.ts = new Date().toISOString().split('T')[1];
    }
}

function receiveTrackerReport() { // simulate receipt of tracker report; broadcast update
    const t = Math.floor(Math.random()*trackers.length); // select random tracker to broadcast
    wsServer.broadcast(JSON.stringify(trackers[t]));
}

setInterval(updateLocations, 100);      // update tracker locations every 100 ms
setInterval(receiveTrackerReport, 200); // 'receive report' from tracker every 200 ms

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
