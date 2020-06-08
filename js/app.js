// replace these values with those generated in your TokBox Account
var apiKey = "45828062";
var sessionId = "1_MX40NTgyODA2Mn5-MTU5MTAyNDk3MDAwMX5DdmwxMjJpRlZQU1JDVWZpZStoSmJyS3d-UH4";
var token = "T1==cGFydG5lcl9pZD00NTgyODA2MiZzaWc9ZWFmZDBjNWEyNjNhZmVkODE2ZDg3NTBmMThiODE2OGNlYjU5MTc2NzpzZXNzaW9uX2lkPTFfTVg0ME5UZ3lPREEyTW41LU1UVTVNVEF5TkRrM01EQXdNWDVEZG13eE1qSnBSbFpRVTFKRFZXWnBaU3RvU21KeVMzZC1VSDQmY3JlYXRlX3RpbWU9MTU5MTAyNDk4NyZub25jZT0wLjI3NDg1MTgxODgxNjIwMjYmcm9sZT1wdWJsaXNoZXImZXhwaXJlX3RpbWU9MTU5MTExMTM4Nw==";

// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        alert(error.message);
    }
}


var urlParams = new URLSearchParams(window.location.search)
var room = urlParams.get('room')
if (!room) {
    room = 'learnie'
}

const Name =urlParams.get('Name');
const Role =urlParams.get('Role');
const Room =room;

// Create new signalR connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl(`https://learnie.azurewebsites.net/learnie?Name=${Name}&Role=${Role}&Room=${Room}`)
    .withAutomaticReconnect([1000, 2000, 5000, 5000, 10000, 10000, 10000, 20000, 30000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

// Initialize connection
connection.start().then(() => {
    // Start vonage connection after signalR connection is successfull
    const SERVER_BASE_URL = 'https://learnie.herokuapp.com';
    fetch(SERVER_BASE_URL + '/room/' + room).then(function(res) {
        return res.json()
    }).then(function(res) {
        apiKey = res.apiKey;
        sessionId = res.sessionId;
        token = res.token;
        initializeSession();
    }).catch(handleError);
}).catch(err => console.error(err));

function initializeSession() {
    var session = OT.initSession(apiKey, sessionId);
    // Subscribe to a newly created stream
    session.on('streamCreated', function (event) {

        const connectionId = event.stream.connection.id
        console.log("streamCreated " + connectionId);

        connection.invoke("GetClientByStreamId", connectionId).then(({role, name}) => {    
            console.log({connectionId, role, name});

            if(Role == 'Student' && role == 'Teacher'){
                session.subscribe(event.stream, 'subscriber', {
                    insertMode: 'append',
                    width: '100%',
                    height: '100%'
                }, handleError);
            } else if (Role == 'Teacher') {
                session.subscribe(event.stream, 'subscriber', {
                    insertMode: 'append',
                    width: '320px',
                    height: '200px'
                }, handleError);
            }
        });
    });

    // Create a publisher
    var publisher = OT.initPublisher('publisher', {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        name: Name
    }, handleError);

    // Connect to the session
    session.connect(token, function(error) {
        // If the connection is successful, publish to the session
        if (error) {
            handleError(error);
        } else {
            session.publish(publisher, handleError);

            const ConnectionId = session.connection.id;       

            console.log("My StreamId id : " + ConnectionId);
            // Connect signalR channel
            connection.invoke("SetStreamId", ConnectionId);
        }
    });
}
