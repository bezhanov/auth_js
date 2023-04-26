const express = require('express');
const { Liquid } = require('liquidjs');
const userRoutes = require('./user');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const port = 3000;

const fs = require('fs');
const users = [];

fs.readFile('./users.json', (err, data) => {
  if (err) {
    throw err;
  }
  Object.assign(users, JSON.parse(data));
  console.log(users);
});

app.set('trust proxy', 1); // trust first proxy
app.use(cookieParser());
app.use(
  session({
    secret: '321123',
    resave: false,
    saveUninitialized: true,
  })
);

const engine = new Liquid();
app.engine('liquid', engine.express()); // register liquid engine
app.set('views', './views'); // specify the views directory
app.set('view engine', 'liquid'); // set liquid to default

app.use(bodyParser.urlencoded());

function auth(req, res, next) {
  if (req.username) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.use((req, res, next) => {
  if (req.session.username) {
    req.username = {
      id: req.session.username,
    };
  }
  next();
});

app.get('/login', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
  let foundUser, usersId;
  for (let i = 0; i < users.length; i++) {
    let u = users[i];
    if (u.username == req.body.username && u.password == req.body.password) {
      foundUser = u.username;
      usersId = i;
    }
  }

  if (foundUser !== undefined) {
    req.session.username = req.body.username;
    req.session.role = users[usersId].role;
    console.log('Login succeeded: ', req.session.username);
    res.redirect('/');
    return;
  } else {
    console.log('Login failed: ', req.body.username);
    res.redirect('/login');
  }
});

app.get('/', auth, (req, res) => {
  res.render('home', {
    userId: req.username.id,
    name: req.session.username,
    role: req.session.role,
  });
});

app.get('/logout', (req, res) => {
  req.session.user = '';
  res.redirect('/login');
});

app.get('/admin', (req, res) => {
  res.render('admin', {
    role: req.session.role,
    users: users,
  });
});

app.use('/user', auth, userRoutes);

app.listen(port, () => console.log(`Example app listening on port ${port}`));
