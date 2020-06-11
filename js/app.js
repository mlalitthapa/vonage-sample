// replace these values with those generated in your TokBox Account
var apiKey = "";
var sessionId = "";
var token = "";

// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        alert(error.message);
    }
}

// Video/audio options for stream
const streamOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%',
    audioBitrate: 20000,
    maxResolution: {
        width: 960,
        height: 720
    },
    resolution: "640x480",
    preferredFrameRate: 10
}

var urlParams = new URLSearchParams(window.location.search)
let room = urlParams.get('room') || 'learnie';
let Name = urlParams.get('Name') || 'Name';
let Role = urlParams.get('Role') || 'Student';
const Room = room;
console.log('Publishing new stream with following info:')
console.log({Room, Name, Role})

// Start vonage connection after signalR connection is successfull
const SERVER_BASE_URL = 'https://learnie.herokuapp.com';
fetch(SERVER_BASE_URL + '/room/' + room + `?name=${Name}&role=${Role}`).then(function(res) {
    return res.json()
}).then(function(res) {
    apiKey = res.apiKey;
    sessionId = res.sessionId;
    token = res.token;
    initializeSession();
}).catch(handleError);

function initializeSession() {
    var session = OT.initSession(apiKey, sessionId);
    // Subscribe to a newly created stream
    session.on('streamCreated', function ({ stream }) {
        const { name, role } = JSON.parse(stream.connection.data)
        console.log('New stream created by:')
        console.log({name, role})

        if(Role == 'Student' && role == 'Teacher'){
            session.subscribe(stream, 'subscriber', Object.assign(streamOptions, {name}), handleError);
        } else if (Role == 'Teacher') {
            session.subscribe(stream, 'subscriber', Object.assign(streamOptions, {
                name,
                width: '320px',
                height: '200px',
            }), handleError);
        }
    });

    // Create a publisher
    var publisher = OT.initPublisher('publisher', Object.assign(streamOptions, {name: Name,}), handleError);

    // Connect to the session
    session.connect(token, function(error) {
        // If the connection is successful, publish to the session
        if (error) {
            handleError(error);
        } else {
            session.publish(publisher, handleError);
        }
    });
}
