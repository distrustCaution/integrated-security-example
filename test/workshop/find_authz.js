/*
    TUTORIAL PART 1: 
    Any comment that starts with "TUTORIAL" contains instructions
    Your mission: Find reproduceable authorization bugs using the existing integration tests
*/

let chai = require('chai');
let server = require('../../src/example_server');
var expect = require('chai').expect;
const http = require('http');
var requestPromise = require('request-promise');
var helpers = require("./helper_methods")

/*
    TUTORIAL PART 2:
    We need an evil attacker. Let's call her Eve. 
    Eve is going to get in the way and steal things from Alice and Bob!
*/
var eve = {
    "username": "eve",
    "password": "evilPassword",
};

/* 
    TUTORIAL PART 3: (Optional)
    Since this is an API test, I recommend you use the proxy to help visualize it
*/
// helpers.request = requestPromise.defaults(
//     {'proxy':""} // put your path to your proxy here
// );


describe("API", function(){
    before(async function(){
        await helpers.startServer();
        /* 
           TUTORIAL PART 4:
           Let's make Eve's evil account and get a login token!
        */
        // create an account with eve's credentials. HINT: use the helper functions
        eve.token = ''; //get and assign a token to eve
    });
    
    /* 
        TUTORIAL PART 5:
        Let's find some tests that we can re-use as a security test!
    */

    /* TUTORIAL PART 6: "User creation tests" */
    // The user creation tests aren't particularly useful, but we can go through it
    describe("User", function(){
        var user = {
            username: "user1",
            password: "somepassword",
        };
        var token;
        // TUTORIAL: this one just makes the user. Great preparation step
        it("should be able to make a user", async function(){
            var result = await helpers.request({
                method: 'POST',
                uri:helpers.baseUri+"/api/account/",
                body: user,
                json: true
            })
            expect(result.message).to.not.be.null;
        });
        // TUTORIAL: this one is an authentication check, skip
        it("should be able to login the user", async function(){
            token = await helpers.request({
                method: 'POST',
                uri:helpers.baseUri+"/api/login",
                body: user,
                json: true
            })
            .then((res) => {
                expect(res.Token).to.be.a('string');
                expect(res.Token.length).to.be.greaterThan(0);
                return res.Token;
            })
            .catch((err) => {
                expect(err).to.be.null;
                return null;
            })
        });
        // TUTORIAL: this one is an authentication check, skip
        it("should be NOT able to read the user without a good login token", async function(){
            await helpers.request({
                method: 'GET',
                uri:helpers.baseUri+"/api/account/"+user.username,
                headers:{
                    'Token':'foobar'
                },
                json: true
            })
            .then(function(res){
                expect(res).to.be.null                
            })
            .catch(function(err){
                expect(err.statusCode).to.equal(400);
            });
        });
        // TUTORIAL: We could use this, let's modify it to use Eve, and through the proxy we can see the information returned
        it("should be able to read the user with login token", async function(){
            expect(token).to.be.a('string'); //Verify we have a token
            await helpers.request({
                method: 'GET',
                uri:helpers.baseUri+"/api/account/"+user.username,
                headers:{
                    // 'Token': token // TUTORIAL: remove this line
                    'Token': eve.token // we modify the test to use Eve instead
                },
                json: true
            })
            .then(function(res){
                expect(res.username).to.equal(user.username);
                expect(res.id).to.be.a('number');
                return res;              
            })
            .catch(function(err){
                expect(err.statusCode).to.be.null;
            });
        });
        /*
            TUTORIAL: 
            After running this part, you should see that there
            is no secret information (passwords/etc) returned in the get,
            but you can still iterate the user id to grab information.
            This is probably intended.
        */
    });

    
    /*
        TUTORIAL PART 6: "Note CRUD tests" 
        These are more useful, since we have more functions
    */
    describe("Notes", function(){
        var user1 = {
            "username": "user1!",
            "password": "user1hasasecurepassword"
        }
        var note = {
            title:"foo",
            data: "bar baz"
        }
        before(async function(){
            await helpers.createAccount(user1);
            user1.token = await helpers.getLoginToken(user1);
        });

        // TUTORIAL: This is simple note creation, this is a good "preparation step" to leave as is
        it('should be able to make a note', async function(){
            note.id = await helpers.request({
                method: 'POST',
                uri: helpers.baseUri+"/api/note",
                headers : {
                    Token: user1.token 
                },
                body: note,
                json: true
            })
            .then((res) => {
                expect(res).to.not.be.null;
                expect(res.id).to.be.a('number');
                return res.id;
            })
            .catch((err) => {
                expect(err).to.be.null;
            });
        });

        // TUTORIAL: But the note shouldn't appear in Eve's notes
        // it('should NOT have the note in all notes', async function(){ // remove this
        it('should NOT have the note in all notes', async function(){ //change to this
            expect(note.id).to.be.a('number');
            var result = await helpers.request({
                method: 'GET',
                uri: helpers.baseUri+"/api/note",
                headers : {
                    // Token: user1.token
                    Token: eve.token // change to this
                },
                json: true
            });

            filteredNotes = result.filter(function(n) { return n.title == note.title});//filter down to the right note
            // expect(filteredNotes.length).to.equal(1); // TURTORIAL: we should change this
            expect(filteredNotes.length).to.equal(0); // to this since 0 notes should be found
            // expect(filteredNotes[0].title).to.equal(note.title); // Remove these assertions
            // expect(filteredNotes[0].id).to.be.a('number');
        })

        // TUTORIAL: Eve shouldn't be able to GET the note
        // it('should be able to get a note', async function(){
        it('should NOT be able to get a note', async function(){ //change to this
            expect(note.id).to.be.a('number');
            var result = await helpers.request({
                method: 'GET',
                uri: helpers.baseUri+"/api/note/"+note.id,
                headers : {
                    // Token: user1.token // TUTORIAL: remove this
                    Token: eve.token // change to this
                },
                json: true
            });

            // TUTORIAL：modify these assertions to NOT equal
            expect(result.data).to.equal(note.data); 
            expect(result.title).to.equal(note.title);
        });

        // TUTORIAL: modify this test to see if Eve can update the note
        // it('should be able to update a note', async function(){ // Remove this
        it('should be able to update a note', async function(){ // Change this to something more descriptive
            expect(note.id).to.be.a('number');
            var newNote = {
                title : "woooohooo!",
                data : "LOREM IPSUM FTW!"
            }
            var update = await helpers.request({
                method: 'PUT',
                uri: helpers.baseUri+"/api/note/"+note.id,
                headers : {
                    Token: user1.token //TUTORIAL: modify this so Eve is taking the action
                },
                body : newNote,
                json: true
            }).then((res) => {
                expect(res).to.not.be.null;
            })
            .catch((err) => {
                expect(err).to.be.null;
            });

            var result = await helpers.request({ 
                method: 'GET',
                uri: helpers.baseUri+"/api/note/"+note.id,
                headers : {
                    Token: user1.token //TUTORIAL: leave this to see if the other user can see the changes 
                },
                json: true
            }).then(function(res){
                return res;
            })
            .catch(function(err){
                return err;
            });
            //TUTORIAL: modify these assertions so that it expects failure
            expect(result.data).to.equal(newNote.data);
            expect(result.title).to.equal(newNote.title);
            expect(result.data).to.not.equal(note.data);
            expect(result.title).to.not.equal(note.title);


            //TUTORIAL: Uncomment the next lines and try to get the envelope as Eve, see if it happens

            // var result = await helpers.request({ 
            //     method: 'GET',
            //     uri: helpers.baseUri+"/api/note/"+note.id,
            //     headers : {
            //         Token: user1.token
            //     },
            //     json: true
            // }).then(function(res){
            //     return res;
            // })
            // .catch(function(err){
            //     return err;
            // });
            // //TUTORIAL: modify these assertions so that it expects failure
            // expect(result.data).to.equal(newNote.data);
            // expect(result.title).to.equal(newNote.title);
            // expect(result.data).to.not.equal(note.data);
            // expect(result.title).to.not.equal(note.title);

        });

    });

    /* TUTORIAL PART 7: Sharing scenarios can have a lot of good things to test */
    describe("Sharing", function(){
        var note = {
            title: "myTitle",
            data: "myData"
        };

        var alice = {
            "username": "alice",
            "password": "alicePassword",
        };

        var bob = {
            "username": "bob",
            "password": "bobPassword",
        };
        //TUTORIAL: This are good preparation steps
        before(async function(){
            //make two users
            await helpers.createAccount(alice);
            alice.token = await helpers.getLoginToken(alice);

            await helpers.createAccount(bob);
            bob.token = await helpers.getLoginToken(bob);
        });
        
        beforeEach(async function(){
            //user one makes a note
            note.id = await helpers.request({
                method: 'POST',
                uri: helpers.baseUri+"/api/note",
                headers : {
                    Token: alice.token
                },
                body: note,
                json: true
            })
            .then((res) => {
                expect(res).to.not.be.null;
                expect(res.id).to.be.a('number');
                return res.id;
            })
            .catch((err) => {
                expect(err).to.be.null;
            });
        });

        // TUTORIAL: This is great! The QAs checked for some authorization. 
        // You should thank them. ;)
        it("should NOT be able to read other's notes", async function(){
            expect(note.id).to.be.a('number');
            var result = await helpers.request({
                method: 'GET',
                uri: helpers.baseUri+"/api/note/"+note.id,
                headers : {
                    Token: bob.token
                },
                json: true
            })
            .then(function(res){
                expect(res.statusCode).to.equal(404);
            })
            .catch(function(err){
                expect(err.statusCode).to.equal(404);
            });
        });

        // TUTORIAL: this is a good test we could change to do the following.
        // Go ahead and change the test to "should NOT be able to "...
        it("should be able to read other's notes after they share it", async function(){ // TUTORIAL: First, make the description match what you plan to test
            expect(note.id).to.be.a('number');

            /* TUTORIAL: 
                This is a preparation step where the user gets the user id of the user intends to share it
                You should leave this part as is.
            */
            bob.id = await helpers.request({
                method: 'GET',
                uri:helpers.baseUri+"/api/account/"+bob.username,
                headers:{
                    'Token': alice.token
                },
                json: true
            })
            .then(function(res){
                expect(res.username).to.equal(bob.username);
                expect(res.id).to.be.a('number');
                return res.id;              
            })
            .catch(function(err){
                expect(err.statusCode).to.be.null;
            }); 

            expect(bob.id).to.be.a('number');

            /* TUTORIAL: 
                This is the PUT call  that allows you to share a note with someone else.
                See if Eve can share Alice's note with Bob
            */
            var share = await helpers.request({
                method: 'PUT',
                uri: helpers.baseUri+"/api/note/"+note.id+"/share",
                headers : {
                    Token: alice.token // TUTORIAL: Change this to Eve
                },
                body: bob,
                json : true               
            })
            .then(function(res){
                return res;
            })
            .catch(function(err){
                expect(err).to.be.null;
            })

            var result = await helpers.request({
                method: 'GET',
                uri: helpers.baseUri+"/api/note/"+note.id,
                headers : {
                    Token: bob.token // TUTORIAL: Leave this as Bob
                },
                json: true
            })
            .then(function(res){
                return res;
            })
            .catch(function(err){
                expect(err).to.be.null;
                return err;
            });
            // TUTORIAL: Change the assertions to do negative testing
            expect(result.data).to.equal(note.data); 
            expect(result.title).to.equal(note.title);

        });
    });

    /* TUTORIAL:
        Modify the following code, and see if Eve can share someone else's note with herself.
        This is the last one, go ahead and try it on your own! :)
    */    
    it("should NOT able to read other's notes after Eve attacker shares it with herself", async function(){
        expect(note.id).to.be.a('number');

        bob.id = await helpers.request({
            method: 'GET',
            uri:helpers.baseUri+"/api/account/"+bob.username,
            headers:{
                'Token': alice.token
            },
            json: true
        })
        .then(function(res){
            expect(res.username).to.equal(bob.username);
            expect(res.id).to.be.a('number');
            return res.id;              
        })
        .catch(function(err){
            expect(err.statusCode).to.be.null;
        }); 

        expect(bob.id).to.be.a('number');

        var share = await helpers.request({
            method: 'PUT',
            uri: helpers.baseUri+"/api/note/"+note.id+"/share",
            headers : {
                Token: alice.token
            },
            body: bob,
            json : true               
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            expect(err).to.be.null;
        })

        var result = await helpers.request({
            method: 'GET',
            uri: helpers.baseUri+"/api/note/"+note.id,
            headers : {
                Token: bob.token
            },
            json: true
        })
        .then(function(res){
            return res;
        })
        .catch(function(err){
            expect(err).to.be.null;
            return err;
        });
        expect(result.data).to.equal(note.data);
        expect(result.title).to.equal(note.title);
    });

    after(function(){
        helpers.stopServer()
    });
});