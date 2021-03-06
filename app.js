// --------------------------------- server ---------------------------------
var express = require('express');
var session = require('express-session')
var app = express();
var bodyParser = require('body-parser');
var controller = require('./controllers/controller.js');
var quiz = require('./controllers/quiz.js');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
// setup for user creation
var User = require('./models/users.js');

// ----- mongodb via mongoose
// ---------------------------------------
var mongoose = require('mongoose');
mongoose.connect('mongodb://admin:password@ds059908.mongolab.com:59908/lingo');


// ----- set view engine to jade in /views
// ---------------------------------------
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// ----- static files in /public
// ---------------------------------------
app.use(express.static(__dirname + '/public'));

// ----- parse form body as json
// ---------------------------------------
app.use(bodyParser.urlencoded({extended: false}));

// ----- auth setup
// ---------------------------------------
app.use(session({
	secret: 'keyboard cat',
	resave: true,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new FacebookStrategy({
    clientID: '332743610214109',
    clientSecret: 'cbcdc673a23db1baff5c117ebafb6404',
    callbackURL: "/auth/facebook/authed"
  },
  function(accessToken, refreshToken, profile, done) {

  	User.findOneOrCreate({fbId: profile.id}, {
  		name: profile.displayName,
  		fbId: profile.id,
  		stats: {
  			totalQuizzesTaken: 0,
  			quizzesPassed: 0,
  			quizzesFailed: 0,
  			percentPassed: 0,
  			totalWordsTranslated: 0,
  			translatedCorrectly: 0,
  			translatedIncorrectly: 0,
  			percentTranslated: 0,
  			bestTenWords: [],
  			worstTenWords: []
  		},
      currentQuiz: {
        amountIncorrect: 0,
        questionNumber: 1,
        answer: ''
      }
  	},
  	function(err, user){
  		if (err) { return done(err); }
  		done(null, user);
  	})
  }
));
// end auth setup

// ----- routes
// ---------------------------------------
app.get('/', controller.index);
app.get('/login', controller.login);
app.get('/start-quiz', controller.startQuiz);
app.post('/new-quiz', controller.newQuiz);
app.get('/quiz', controller.quiz);
app.get('/translate', controller.translator);
app.post('/translate', controller.translate);
app.get('/progress', controller.progress);


// quiz api
//get a question
app.get('/quiz/getQuestion/:toLang/:fromLang', quiz.getQuestion);
// check if answer is correct
app.post('/quiz/isCorrect/:user/:answer', quiz.answer);

// user api
// update users stats
// app.post('/user/:user/');

// authentication
	// Redirect the user to Facebook for authentication.  When complete,
	// Facebook will redirect the user back to the application at
	//     /auth/facebook/authed
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/authed', passport.authenticate('facebook', { 
	successRedirect: '/',
	failureRedirect: '/login' 
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
// authentication

//test
// ----- create server
// 		--	on port 3000
// 		-- 	unless process has port defined
// ---------------------------------------
var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
	console.log('Server on... localhost:' + server.address().port);
});