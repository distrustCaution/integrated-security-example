//example models
const sqlite3 = require('sqlite3').verbose();
var Sequelize = require('sequelize');
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
//make DB
const sequelize = new Sequelize('database', 'username', 'password', {
    // sqlite! now!
    dialect: 'sqlite',
    logging: false
    // the storage engine for sqlite
    // - default ':memory:'
    // storage: 'path/to/database.sqlite'
});

var Users = sequelize.define('Users', {
    username: { type: Sequelize.STRING, allowNull: false},
    firstname: { type: Sequelize.STRING, allowNull: true},
    lastname: { type: Sequelize.STRING, allowNull: true},
    salt: { type: Sequelize.STRING, allowNull: false},
    password: { type: Sequelize.STRING, allowNull: false},
    active: {type: Sequelize.BOOLEAN, defaultValue: true },
    adminRights: {type: Sequelize.STRING, allowNull: true }
});

var Note = sequelize.define('Note', {
    current_version_id: {type: Sequelize.INTEGER, allowNull: false }
});

var Version = sequelize.define('Version', {
    title: Sequelize.TEXT,
    data: Sequelize.TEXT,
    previous_version_id: {type: Sequelize.INTEGER, allowNull: true }
});

var Ownership = sequelize.define('Ownership', {
    note_id : {type: Sequelize.INTEGER, allowNull: false },
    account_id: {type: Sequelize.INTEGER, allowNull: false }
});

async function createUser(username,password,firstname,lastname,adminRights){
    var salt = bcrypt.genSaltSync();
    var hashedPassword = bcrypt.hashSync(password, salt);
    return Users.create({
        username: username,
        salt: salt,
        firstname: firstname,
        lastname: lastname,
        password: hashedPassword,
        adminRights: adminRights
    });
}

//totally amazing & secret way of doing this
var secret = uuidv4();

function createJwt(data, expires){
    if (!data) throw "Must provide a data object"
    if (!expires) expires = '6h';
    return jwt.sign(
        {
            data: data,
        },
        secret,
        {
            expiresIn: expires
        }
    )
}

function readJwt(token){
    try {
        return jwt.verify(
            token,
            secret
        )
    }
    catch(error) {
        return false;
    }
}

// returns a jwt if logged in, or false if not
async function loginUser(username, password){
    return await Users.findOne({where: {username: username}})
    .then((user)=>{
        if (user){
            var myUser = user.dataValues;
            if(bcrypt.compareSync(password, myUser.password)) {
                return createJwt(myUser);
            } else {
                return false;
            }
        } else {
            //User does not exist
            return false;
        }
    })
}

async function sync(){
    return sequelize
    .sync({ force: true })
    .then(function(err) {
        return true;
    }, function (err) {
        console.log('An error occurred while creating the table:', err);
        return false;
    });
}

module.exports = {
    sync: sync,
    sequelize: sequelize,
    tables: {
        Users: Users,
        Note: Note,
        Version: Version,
        Ownership: Ownership
    },
    scripts : {
        createUser : createUser,
        loginUser : loginUser,
        readJwt : readJwt,
        createJwt : createJwt
    }
}