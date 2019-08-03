


function Config(origin, host, database, login, passw, maxconn){

this.origin = origin;

this.host = host;

this.database = database;

this.login = login;

this.password = passw;

this.maxConnections = maxconn;

};







module.exports = Config;
