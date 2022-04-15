const { Manager } = require('erela.js');
const TIDAL = require('../dist');

const manager = new Manager({
    nodes: [{
        host: 'localhost',
        port: 8080,
        password: 'youshallnotpass'
    }],
    send(id, packet) {
        return true;
    },
    plugins: [
        new TIDAL({
            convertUnresolved: true
        })
    ]
});

manager.init('725067926457155706');

manager.on('nodeConnect', () => manager.search('http://www.tidal.com/track/19784638', null).then(console.log))