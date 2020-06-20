/**
 * Module dependencies.
    var io = require('socket.io').listen(http);
*/

var http = require('http');
var express = require('express');
var routes = require('./routes');
var path = require('path');
var io = require('socket.io').listen(http);
SessionSockets = require('session.socket.io'),
    sessionSockets = new SessionSockets(io);

var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(methodOverride());
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'uwotm8' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(multer()); - use to upload files
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Routing
 */
require('./routes/index.js')(app);


/**
 * Configure Sockets
 */
io.set('log level', 2);

//io.set('close timeout', 10);

io.set('authorization', function (handshakeData, callback) {
    if (handshakeData.headers.cookie) {
        // Read cookies from handshake headers
        var cookies = cookie.parse(handshakeData.headers.cookie);
        // We're now able to retrieve session ID
        var sessionID;
        if (cookies['connect.sid'])
            sessionID = connect.utils.parseSignedCookie(cookies['connect.sid'], sessionSecret);
        // No session? Refuse connection
        if (!sessionID) {
            callback('No session', false);
        } else {
            // On récupère la session utilisateur, et on en extrait son username
            sessionStore.get(sessionID, function (err, session) {
                if (!err && session && session.user) {
                    // OK, on accepte la connexion
                    callback(null, true);
                } else {
                    // Session incomplète, ou non trouvée
                    callback(err || 'User not authenticated', false);
                }
            });
        }
    }
});


//Game controller
var mainCtrl  = require('./controllers/main.js'),
    gameCtrl  = require('./controllers/game.js');

sessionSockets.on('connection', function(err, socket, session){
    mainCtrl.connect(socket, session);

    // Main
    socket.on('disconnect',        function()    { mainCtrl.disconnect(socket, session); });
    socket.on('chat:sendMessage',  function(data){ mainCtrl.chatSendMessage(socket, session, data); });
    socket.on('lobby:getGameList', function()    { mainCtrl.lobbyGetGameList(socket); });
    socket.on('library:get',       function()    { mainCtrl.libraryGet(socket, session); });
    socket.on('library:saveDeck',  function(data){ mainCtrl.librarySaveDeck(socket, session, data); });

    //Game
    socket.on('game:create',  function(data){ gameCtrl.createGame(socket, session, data); });
    socket.on('game:join',    function(data){ gameCtrl.joinGame(io, socket, session, data); });
    socket.on('game:info',    function(data){ gameCtrl.getGameInfo(socket, session, data); });
    socket.on('game:quit',    function()    { gameCtrl.quitGame(socket, session); });
    socket.on('game:phase0',  function(data){ gameCtrl.phase0Game(io, socket, session, data); });
    socket.on('game:phase1',  function(data){ gameCtrl.phase1Game(io, socket, session, data); });
    socket.on('game:phase2',  function(data){ gameCtrl.phase2Game(io, socket, session, data); });
});


//launch server
var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});