const express = require('express'),
  app = express(),
  User = require('./models/user'),
  path = require('path'),
  mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sample');

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.get('/', (req, res, next) => {
  User.find({}, (err, users) => {
    if (err) {
      return next(err);
    }
    res.render('index', { users });
  });
});

app.listen(3000, () => {
  console.log('Sample app listening on port 3000');
});
