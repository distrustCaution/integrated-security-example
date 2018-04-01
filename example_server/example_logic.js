//example_logic.js

var models = require('./example_models');

var createNote = async function(user, note){
    var newVersion = await models.tables.Version.create(
        {
            title: note.title,
            data: note.data
        }
    );
    var newNote = await models.tables.Note.create({
        current_version_id: newVersion.id
    });
    var newOwnership = await models.tables.Ownership.create({
        note_id : newNote.id,
        account_id: user.id
    });

    return newNote;
}

var listNotes = async function(owner){
    //example for sqli
    return await models.sequelize.query(`
        Select Versions.title, Versions.id as version, Notes.id as id
        from Users 
        inner join Ownerships on Ownerships.account_id = Users.id
        inner join Notes on Ownerships.note_id = Notes.id 
        inner join Versions on Notes.current_version_id = Versions.id
        where Users.username = '`+owner.username+`';
    `).then(function(results, metadata){
        return results[0];
    }).catch(function(err){
        return [];
    });
}

var readNote = async function(owner, note_id){
    //example for sqli
    return await models.sequelize.query(
        `
        Select Versions.title, Versions.data, Versions.id as version, Notes.id as id
        from Users 
        inner join Ownerships on Ownerships.account_id = Users.id
        inner join Notes on Ownerships.note_id = Notes.id 
        inner join Versions on Notes.current_version_id = Versions.id
        where Users.username = '`+owner.username+`'
        and Notes.id = `+note_id+`
        limit 1;
        `
    ).then(function(results){
        return results[0][0];
    }).catch(function(err){
        throw err;
    });
}

var updateNote = async function(note, note_id){
    
    //example for authz + blind sqli
    // in the real world, I would use transactions to be able rewind this

    // get current version
    var oldVersion = await models.sequelize.query(`
        Select Versions.id
        from Versions
        inner join Notes on Notes.current_version_id = Versions.id
        where Notes.id = `+note_id+` limit 1;
    `).then(function(results, metadata){
        return results[0][0];
    }).catch(function(err){
        throw err;
    });
    //make new version 
    var newVersion = await models.tables.Version.create({
        title: note.title,
        data: note.data,
        previous_version_id: oldVersion.id
    }).then(function(results, metadata){
        return results;
    }).catch(function(err){
        throw err;
    });
    //update current version 
    return await models.sequelize.query(`
        Update Notes
        Set current_version_id = `+newVersion.id+`
        where id =`+note_id+`;
    `).then(function(results, metadata){
        return true; //succeeded
    }).catch(function(err){
        throw err;
    });
}

var shareNote = async function(owner, note_id){
    //example for authz issues
    return await models.tables.Ownership.create({
        note_id : note_id,
        account_id: owner.id
    }).then(function(results){
        return results;
    }).catch(function(err){
        throw err;
    });
}

var readUser = async function(username){
    return await models.tables.Users
    .findOne({where: {username: username}})
    .then(function(user){
        return user;
    }).catch(function(err){
        return false;
    });
}

var createUser = async function(user){
    var existing = await models.tables.Users
    .findOne({where: {username: user.username}})
    .then(function(results){
        return results;
    }).catch(function(err){
        return false;
    });
    if(!existing){
        var success = await models.scripts.createUser(
            user.username,
            user.password,
            user.firstname,
            user.lastname,
            "none"
        );
        return success;
    } else {
        return false;
    }

}

module.exports = {
    notes : {
        create : createNote,
        read : readNote,
        update : updateNote,
        list : listNotes,
        share : shareNote
    },
    users : {
        read : readUser,
        create : createUser
    }
}