'use strict';
// dependencies
const mumble = require("mumble");
const fs = require("fs");
const chokidar = require("chokidar");
const { msg2json } = require("./myJsonBuilder");
const path = require("./path");
const { stringify } = require("querystring");

// constants
const MUMBLE_HOST = "mumble.cvh-server.de";
const USERNAME = "BigMumbleJS";
const MAX_MSG_LENGTH = 1024;
const COMMAND_SYMBOL = ';';

// variables
var user;
var channel;
var message;

// watcher
const bbb_watcher = chokidar.watch(path.bbbJSON);
// to generate a key the following command must be executed in the terminal ' openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem '

// const MUMBLE_OPTIONS = { 
//     key: fs.readFileSync('./key.pem'),
//     cert: fs.readFileSync('./cert.pem')
// }

// connection to the mumble-server
console.log("Verbindung zu Mumble wird aufgebaut ...");
mumble.connect(MUMBLE_HOST, /*MUMBLE_OPTIONS*/ '', (err, connection) => {
    // when the connection fails an error will be thrown
    if (err) {
        console.log("Verbindung zu Mumble fehlgeschlagen");
        throw new Error(err);
    };

    connection.authenticate(USERNAME);
    console.log("Verbindung zu Mumble erfolgreich hergestellt");

    var sessions = {};
    connection.on('userState', state => {
        sessions[state.session] = state;
    });

    var channels = {};
    connection.on('channelState', state => {
        channels[state.channel_id] = state;
    });

    bbb_watcher.on('change', () => {
        fs.readFile(path.bbbJSON, 'utf-8', (err, data) => {
            if (err)
                console.log(err);
            const obj = JSON.parse(data);
            connection.channelById(user.channel_id).sendMessage(obj.username + ": " + obj.message);
        });
    });

    connection.on('textMessage', data => {
        //console.log(data);
        user = sessions[data.actor];
        //console.log(user);
        channel = channels[data.channel_id];
        message = data.message;
        // private messages are interpreted as commands and won't be considered a conversation
        if (channel == undefined) {

            if (message[0] == COMMAND_SYMBOL) {
                message = message.slice(1, message.length);
                if (message.slice(0, 4) == "join") {
                    connection.channelById(user.channel_id).join();
                    console.log("joined channel: " + connection.channelById(user.channel_id).name);
                }
                else if(message.slice(0,3) == "end"){
                    bbb_watcher.close();
                    fs.writeFileSync(path.mumbleJSON, msg2json("master_of_puppets", "end"),"utf-8");
                    fs.writeFileSync(path.bbbJSON, msg2json("master_of_puppets", "end"),"utf-8");
                    connection.disconnect();
                }
            }
        }
        // public messages are considered a conversation and will be transmitted to bigbluebutton, they won't be registered as commands
        else {
            if (message.length > MAX_MSG_LENGTH) {
                connection.channelById(user.channel_id).sendMessage(`Es tut mir leid, Ihre Nachricht überschreitet das Maximum von ${MAX_MSG_LENGTH} Zeichen`);
            }
            else {
                if (message[0] == COMMAND_SYMBOL) { }
                else {
                    //console.log(connection.channelById(user.channel_id));
                    console.log("channel-name: " + connection.channelById(user.channel_id || 0).name + " - " + user.name + ": " + message);
                    fs.writeFileSync(path.mumbleJSON, msg2json(user.name, message));
                };
            }
        }
    });
});