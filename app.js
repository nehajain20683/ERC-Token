var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var validator = require('express-validator');
var verifyRequest = require('./routes/auth');
var indexRouter = require('./routes/index');
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(verifyRequest());
app.use(logger('dev'));
app.use(validator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//For Swagger
const expressSwagger = require('express-swagger-generator')(app);
expressSwagger({
  swaggerDefinition: {
     info: {
      title: process.env.SWAGGER_TITLE,
      description: process.env.SWAGGER_DESCRIPTION,
      version: process.env.SWAGGER_VERSION,
    },
    host: process.env.SWAGGER_API_HOST,
    consumes: [
      "application/json"
    ],
    produces: [
      "application/json"
    ],
    schemes: ['http', 'https'],
    securityDefinitions: {
      "Basic Auth": {
        "type": "basic",
        "name": "authorization",
        "in": "header"
      }
    }
  },
  basedir: __dirname, //app absolute path
  files: [
    './routes/*.js'
 ]
 });


 //MongoDB connection
 mongoose.connect('mongodb://localhost:27017/messagingApp',
 { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", function (callback) {
 console.log("Mongo Connection Succeeded.");
});

module.exports = app;
