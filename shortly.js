var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');
var _ = require('underscore');

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

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 864000}
}));

var checkUser = function(username, hashedPassword) {
  return db.knex('users').where({username: username, password: hashedPassword});
};

app.get('/',
function(req, res) {
  checkUser(req.session.username, req.session.password).then(function(rows) {
    if (rows.length) {
      res.render('index');
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/create',
function(req, res) {
  checkUser(req.session.username, req.session.password).then(function(rows) {
    if (rows.length) {
      res.render('index');
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/links',
function(req, res) {
  checkUser(req.session.username, req.session.password).then(function(rows) {
    if (rows.length) {
      Links.reset().fetch().then(function(links) {
        var filteredModels = _.filter(links.models, function (model) {
          return model.attributes.userId === req.session.userId;
        });
        res.status(200).send(filteredModels);
      });
    } else {
      res.redirect('/login');
    }
  });
});

app.post('/links',
function(req, res) {
  checkUser(req.session.username, req.session.password).then(function(rows) {
    if (rows.length) {
      var uri = req.body.url;
      if (!util.isValidUrl(uri)) {
        console.log('Not a valid url: ', uri);
        return res.sendStatus(404);
      }

      new Link({ url: uri, userId: req.session.userId}).fetch().then(function(found) {
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
              baseUrl: req.headers.origin,
              userId: req.session.userId 
            })
            .then(function(newLink) {
              res.status(200).send(newLink);
            });
          });
        }
      });
    } else {
      res.redirect('/login');
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
  return db.knex('users').where({username: username}).then(function(rows) {
    if (rows.length) {
      var salt = rows[0].salt;
      var id = rows[0].id;
      var hash = bcrypt.hashSync(password, salt);
      return checkUser(username, hash).then(function(rows) {
        if (rows.length) {
          req.session.username = username;
          req.session.password = hash;
          req.session.userId = id;
          res.redirect('/');
        } else {
          res.redirect('/login');
        }
      });
    } else {
      res.redirect('/login');
    }
  });
});

app.post('/signup', function(req, res) {
  //store info in database.
  var username = req.body.username;
  var password = req.body.password;

  return db.knex('users').where({username: username}).then(function(rows) {
    if (rows.length) {
      res.redirect('/login');
    } else {
      var salt = bcrypt.genSaltSync(4);
      var hash = bcrypt.hashSync(password, salt);
      var newUser = new User({username: username, password: hash, salt: salt});
      req.session.username = username;
      req.session.password = hash;
      req.session.userId = newUser.cid;
      newUser.save();
      res.redirect('/');
    }
  });

});

app.get('/logout', function(req, res) {
  console.log('logging out');
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
