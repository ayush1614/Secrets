require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require('md5');
const encrypt = require('mongoose-encryption');

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

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
    let username = request.body.username;
    let password = request.body.password;

    let errors = {};
    User.findOne({ email: username }, function (err, foundUser) {
        if(foundUser.email === username)
        {
            console.log('Email alredy exists') ; 
        }
        else
        {
            const newUser = new User({
                email : username , 
                password : md5(password)
            }) ;
            newUser.save();
            console.log("data added successfully") ; 
        }
    });
    // newUser.save();         // automatically encrypts the password
    response.redirect("/register");
});

app.post("/login", function (request, response) {
    let enteredUsername = request.body.username;
    let enteredPassword = request.body.password;

    // findOne automatically decrypts the password and find the data for us 
    User.findOne({ email: enteredUsername }, function (err, foundUser) {
        if (err) {
            console.log(err);
        }
        else {
            if (foundUser.password === enteredPassword) {
                response.redirect("secrets");
            }
            else
                console.log("wrong password");
        }
    });
});

app.listen(3000, function () {
    console.log("Server started successfully");
}); 