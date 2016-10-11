var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
// var knex = require('knex');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var checkUser = function(username, hashedPassword) {
  //select * from users where username = username;
  return db.knex('users').where({username: username, password: hashedPassword});
};

app.get('/',
function(req, res) {
  //  console.log(req);
  checkUser(app.username, app.hashedPassword).then(function(rows) {
    if (rows.length) {
      res.render('index');
    } else {
      res.render('login');
    }
  });
});

app.get('/create',
function(req, res) {
  if (checkUser('test', 'test')) {
    res.render('index');
  } else {
    res.render('login');
  }
});

app.get('/links',
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/


app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.get('/login',
function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  console.log(username);
  // if (username === '' && password === '') {
  //   req.session.regenerate(function() {
  //     req.session.user = username;
  //     res.redirect('/restricted');
  //   });
  // } else {
  return db.knex('users').where({username: username}).then(function(rows) {
    if (rows.length) {
      var salt = rows[0].salt;
      var hash = bcrypt.hashSync(password, salt);
      return checkUser(username, hash).then(function(rows) {
        if (rows.length) {
          console.log('rows.length at login: ', rows.length);
          res.redirect('/index');
        } else {
          console.log('redirect to login');
          res.redirect('/login');
        }
      });
    }
  });

  // }
});

app.post('/signup', function(req, res) {
  //store info in database.
  console.log(req.body);
  var username = req.body.username;
  var password = req.body.password;

  return db.knex('users').where({username: username}).then(function(rows) {
    console.log('rows: ', rows);
    if (rows.length) {
      res.redirect('/login');
    } else {
      var salt = bcrypt.genSaltSync(4);
      var hash = bcrypt.hashSync(password, salt);
      var newUser = new User({username: username, password: hash, salt: salt});
      newUser.save();
      app.username = username;
      app.hashedPassword = hash;
      res.redirect('/');
    }
  });

});

app.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
});




/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
