function msg2json(username, message){
    const jsonObj = {
        'username':username,
        'message':message
    }
    return JSON.stringify(jsonObj);
}

exports.msg2json = msg2json;