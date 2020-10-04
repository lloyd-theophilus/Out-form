//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;


const app = express();

app.use(express.static("public"));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: 'dont be a goat.',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//conneting to the db
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

//creating a user schema and level 2 securiity
const userSchema = new mongoose.Schema({
  email: "string",
  password: "string"
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//encrypting specific field
//const secret = ("Thisisourlittlesecret.");
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]});

//user schema model
const User = new mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));



app.get("/", function(req, res){
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    } else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

app.post("/register", function(req, res){
  User.register({username:req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect('/');
});

//making a post request from registration and creating new user
//app.post("/register", function(req, res){
//bcrypt.hash(req.body.password, saltRounds, function(err, hash){
 // const newUser = new User({
    //email: req.body.username,
    //password: hash
    //password: md5(req.body.password)
  //});
  //saving new user
  //newUser.save(function(err){
    //if(err){
     // console.log(err);
   // } else{
      //res.render("secrets");
    //}
 // });
//});
//});

//making a post request for new user details at login and adding password encryption
//app.post("/login", function(req, res){
  //const username = req.body.username;
  //const password = req.body.password;
  //const username = req.body.username;
 // const password = bcrypt.hash(req.body.password);
 // const password = md5(req.body.password);

 // User.findOne({email: username}, function(err, foundUser){
   // if(err){
     // console.log(err);
   // } else{
      //if(foundUser){
       // bcrypt.compare(password, foundUser.password, function(err, result){
         // if(result=== true){
            //res.render("secrets");
          //}
         // });
        //if(foundUser.password===password){
         // res.render("secrets");
        //}
      //}
 //});
//});


app.listen(3000, function(){
  console.log('Server started on port 3000');
});
