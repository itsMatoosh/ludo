var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();
var expressWs = require('express-ws')(app)

var gameRouter = require('./routes/game/game');
var statsRouter = require('./routes/stats/stats');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// set up routes
app.get('/', async (req, res) => {
  var stats = await statsRouter.getGameStats()
  var games = await gameRouter.getOnGoingGames()
  var players = 0
  for(game of games) {
    players += game.players
  }
  res.render('index', {
    ongoingGames: games.length,
    playersOnline: players,
    completedGames: stats.gamesCompleted
  })
})
app.use('/games', gameRouter.router)
app.use('/stats', statsRouter.router)

// set up database for storing game info
const Database = require('sqlite-async')
Database.open(':memory:').then(async (db) => {
  await gameRouter.init(db)
  await statsRouter.init(db)
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
