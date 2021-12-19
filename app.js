require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const { serializeUser } = require('passport');
const req = require('express/lib/request');
const res = require('express/lib/response');
const { request } = require('express');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());         //used for authentication
app.use(passport.session());          // used for sessions 

mongoose.connect("mongodb://localhost:27017/userDB",
    { useNewUrlParser: true }).then(() => {
        console.log("Connection successful with database");
    }).catch((e) => {
        console.log("No connection");
    });

//for security we are now making the schema from mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('user', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

// renders the home page 
app.get("/", function (req, res) {
    res.render("home");
});

// renders the login page on request 
app.get("/login", function (req, res) {
    res.render("login");
});

//renders the register page on request 
app.get("/register", function (req, res) {
    res.render("register");
});

// renders the secrets page 
app.get("/secrets", function (request, response) {

    if (request.isAuthenticated())
        response.render("secrets");

    else
        response.redirect('/login');
});

// defining the logout page
app.get("/logout", (request, response) => {
    request.logout();
    response.redirect('/');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    });

app.post("/register", function (request, response) {

    User.register({ username: request.body.username }, request.body.password, function (err, user) {

        if (err) {
            console.log(err);
            response.redirect("/register");
        }
        else {
            passport.authenticate("local")(request, response, function () {
                response.redirect("/secrets");
            }); 
        }

    });
});

app.post("/login", function (request, response) {
    const user = new User({
        username: request.body.username,
        password: request.body.password
    })
    request.logIn(user, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local");
            response.redirect("/secrets");
        }
    })
});

app.listen(3000, function () {
    console.log("Server started successfully");
}); 