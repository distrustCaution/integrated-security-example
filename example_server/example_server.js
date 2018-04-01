// example_server.js
// Sets up an example rest api for you

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
var Sequelize = require('sequelize');
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
var models = require('./example_models');
const logic = require('./example_logic');
const cookieParser = require('cookie-parser');
const path = require('path');

exports.models = models;
exports.database = models.sequelize; //for reading sqli
exports.app = null;
exports.server = null;
exports.start = async function(port){
    if(!port) port = 8000;
    // create the db

    await models.sync();

    // Create the server
    const app = express();
    exports.app = app;//kind of dirty

    // set the view engine to pug
    app.set("view engine", "pug");
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }))
    // set the views folder
    app.set("views", path.join(__dirname, "views"));
    app.use(cookieParser());
    // Set some local variables 
    app.locals.siteName = "The Notepad for Sharing";

    app.use('/public', express.static(path.join(__dirname, 'public')));
    app.use('/angular', express.static(path.join(__dirname, '../../node_modules/angular')));
    app.use('/angular-cookies', express.static(path.join(__dirname, '../../node_modules/angular-cookies')));

    exports.server = app.listen(port);

    // REST API (Routes and controller content in the same place since this is test code)

    //custom middleware

    var readJwtGenerator = function(location,err){
        return function(req, res, next){
            if(location(req)){
                var data = models.scripts.readJwt(location(req));
                if(data){
                    res.locals.user = data.data;
                } else {
                    res.locals.user = null;
                }
            }
            next()
        }
    }

    var authenticateHeader = readJwtGenerator(
        function(req){
            return req.get("Token");
        }
    );

    var authenticateCookie = readJwtGenerator(
        function(req){
            return req.cookies["Token"];
        }
    );

    // create an account
    app.post('/api/account', async function(req,res){ //mvp
        var success = await logic.users.create(req.body);
        if(success){
            res.status(201).send({"message":"account created"});
        } else {
            res.status(400).send({"message":"account creation failed"});
        }
    });

    // get account information
    app.get('/api/account/:name', authenticateHeader,  async function(req, res){
        if(!res.locals.user) return res.sendStatus(400);        
        var account = await logic.users.read(req.params.name)
        .then(function(account){
            return account;
        });
        res.send({
            username: account.username,
            id : account.id,
            firstname: account.firstname,
            lastname: account.lastname,
            adminRights: account.adminRights
        });
    });

    // create login token
    app.post('/api/login', async function(req,res){
        if(!req.body) return res.sendStatus(400);
        var jwt = await models.scripts.loginUser(req.body.username, req.body.password);
        if(!jwt) return res.sendStatus(400);
        
        res.status(200).cookie("Token",jwt).send({"Token":jwt});
    });

    // create a new note
    app.post('/api/note', authenticateHeader, async function(req,res){ //mvp
        if(!req.body && !res.locals.user) return res.send(400);
        var success = await logic.notes.create(res.locals.user, req.body)
        .then((res) => {return res}, (err) => {return err});
        res.status(200).send(success);
    });

    // read all notes
    app.get('/api/note/', authenticateHeader, async function(req, res) { //mvp
        if(!res.locals.user) return res.sendStatus(400);
        var success = await logic.notes.list(res.locals.user)
        .then((res) => {return res}, (err) => {return err});
        res.status(200).send(success); 
    });

    // read a note
    app.get('/api/note/:id/', authenticateHeader, async function(req, res){ //mvp, does built in authz correctly
        if(!res.locals.user) return res.sendStatus(400);
        var success = await logic.notes.read(res.locals.user, req.params.id)
        .then((res) => {return res}, (err) => {return err});
        if(success){
            res.status(200).send(success);            
        } else {
            res.sendStatus(404);
        }
    });

    //update a note
    app.put('/api/note/:id', authenticateHeader , async function(req, res) { //mvp, has authz bug
        if(req.body && res.locals.user){
            var success = await logic.notes.update(req.body, req.params.id)
            .then((res) => {return res}, (err) => {return err});
            res.status(200).send(success);
        } else {
            res.status(400);
        } 
    });

    // share a note
    app.put('/api/note/:id/share', authenticateHeader, async function(req,res){ //mvp, has authz bug
        if(req.body && res.locals.user){
            var success = await logic.notes.share(req.body, req.params.id)
            .then((res) => {return res}, (err) => {return err});
            if(success){
                res.status(200).send(success);            
            } else {
                res.sendStatus(400);
            }
        } else {
            res.status(400);
        }
    });

    // WEB SITE 

    // ping
    app.get('/ping', (req, res) => {
        res.locals.note = {"title":"<b>fooo</b>","data":"bar"};
        res.render('note');       
    });

    // login
    app.get('/login', (req, res) => {
        res.render("login");    
    });

    app.post('/login', async (req, res) => {
        if(!req.body) return res.sendStatus(400);
        var jwt = await models.scripts.loginUser(req.body.username, req.body.password);
        if(!jwt) {
            res.redirect('/login');
        } 
        else {
            res.cookie("Token",jwt).redirect('/home' );            
        }
    });

    // home (list)
    app.get('/home', authenticateCookie, async (req, res) => {
        if(!res.locals.user) res.redirect('/login');
        // get all notes
        await logic.notes.list(res.locals.user)
        .then(function(success){
            res.locals.notes = success;
            res.render('allNotes');        
        })
        .catch(function(failure){
            res.redirect('/login');
        });
    });

    // one note
    app.get('/note/:id', authenticateCookie, async (req, res) => {
        if(!res.locals.user) return res.redirect('/login');
        await logic.notes.read(res.locals.user, req.params.id)
        .then(function(success){
            res.locals.note = success;
            res.render('note');        
        })
        .catch(function(failure){
            res.redirect('/home');
        });
    });    

}

