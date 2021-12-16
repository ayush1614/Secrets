require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require('md5');
// const encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB",
    { useNewUrlParser: true }).then(() => {
        console.log("Connection successful with database");
    }).catch((e) => {
        console.log("No connection");
    });
//for security we are now making the schema from mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const User = new mongoose.model('user', userSchema);

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
    response.render("secrets");
});

app.post("/register", function (request, response) {

    bcrypt.hash(request.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            email: request.body.username,
            password: hash 
        });
        newUser.save();
        response.redirect("/secrets");
    });
});

app.post("/login", function (request, response) {
    let enteredUsername = request.body.username;
    // findOne automatically decrypts the password and find the data for us 
    User.findOne({ email: enteredUsername }, function (err, foundUser) {
        if (err) {
            console.log(err);
        }
        else {
            bcrypt.compare(request.body.password, foundUser.password, function(err, result) {
                if(result===true)
                {
                    response.render("/secrets") ; 
                }
            });
        }
    });
});

app.listen(3000, function () {
    console.log("Server started successfully");
}); 