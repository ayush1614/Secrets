require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
console.log(process.env.API_KEY) ; 

//for security we are now making the schema from mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

//extending the facility of the userSchema 
let secret = "Thisisourlittlesecret.";              // for security adding the string      
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });    //encrypt package by adding encrypt plugin

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

    const newUser = new User({
        email: request.body.username,
        password: request.body.password
    });

    newUser.save();         // automatically encrypts the password
    response.redirect("/");
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
                console.log("wrong password")
        }
    });
});

app.listen(3000, function () {
    console.log("Server started successfully");
}); 