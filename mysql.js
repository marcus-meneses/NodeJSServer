var mysql     =    require('mysql');
var pool={};



function MySQL(host, database, user, password, limit, origin){
	
global.pool      =    mysql.createPool({
    		              connectionLimit : limit, //important
   		                host     : host,
   		                user     : user,
    		              password : password,
   		                database : database,
   		                debug    :  false,
   		                port: '/var/run/mysqld/mysqld.sock'	//for ubuntu only. Check for other ports
	});

this.origin = origin;

};



// Run mysql query (without any sugar) ---------------------------------------------------------

MySQL.prototype.query = function(query, callback) {
var context=this;
    global.pool.getConnection(function(err,connection){
        if (err) {
        console.log(err);
          connection.release();
          callback([{"code" : 100, "status" : "Error in database connection"}]);
          return;
         // return;
        }   

         //console.log('connected as id ' + connection.threadId);

        connection.query(query,function(err,rows){
            connection.release();
            if(!err) { 
                callback( rows  );
                return;
            } else {
               console.log(err);
              callback([{"code" : 101, "status" : "Error in database connection"}]);
             return;
            }          
        });

        connection.on('error', function(err) {  
          connection.release();    
          callback([{"code" : 100, "status" : "Error in database connection"}]);
          return;
        });
  });
}



// Crud --------------------------------------------------------------------------------

MySQL.prototype.insert = function(table, keylist, varlist, callback){

var context=this;

if (keylist.length!=varlist.length) {
   return JSON.stringify( {"code" : 101, "status" : "Impossible query"});
}
var keys = keylist.join();
var vars = varlist.join('\',\'');
  
var querystring = 'INSERT INTO '+table+' ('+keys+') VALUES (\''+vars+'\');';
 
//console.log(querystring);
 
 this.query(querystring, callback);

}



// cRud  ------------------------------------------------------------------------------------

MySQL.prototype.find = function(table, key, value, list, callback) {
var context=this;
var querystring='';

	if (list==null) {
		 querystring='SELECT * FROM ' + table+' WHERE '+key+'=\''+value+'\';';
	} else {
		 querystring='SELECT ('+ list +') FROM ' + table+' WHERE '+key+'=\''+value+'\';';	
	}

 this.query(querystring, callback);
 

}


// crUd  -----------------------------------------------------------------------------------------

MySQL.prototype.update = function(table, key, value, fields, values, callback){
var context=this;


if (fields.length!=values.length) {
   return JSON.stringify( {"code" : 101, "status" : "Impossible query"});
}

var complexstring="UPDATE "+table+" SET "+fields[0]+"='"+values[0]+"'";

for (var i=1; i<fields.length; i++){
complexstring=complexstring+", "+fields[i]+"='"+values[i]+"'";
}

complexstring=complexstring+' WHERE '+key+'='+value+';';
var querystring = complexstring;
 

 this.query(querystring, callback);
 

}


// cruD  -----------------------------------------------------------------------------------------------

MySQL.prototype.remove =function(table, key, value, callback){
var context=this;
var querystring='DELETE FROM '+table+' WHERE '+key+'='+value+';';


  this.query(querystring, callback);
 
                
}


// List Tables within DB  --------------------------------------------------------------------------

MySQL.prototype.tables =function(callback){
var context=this;
var querystring='SHOW TABLES;';

 this.query(querystring, callback);
                  
}


// list Fields within Table -------------------------------------------------------------------------

MySQL.prototype.fields =function(table, callback){
var context=this;
var querystring='DESCRIBE '+table+';';

 this.query(querystring, callback);
                  
}


//login  ->   login & password pair match -----------------------------------------------------------

MySQL.prototype.login = function(login, password, callback) {
var context=this;
var querystring='';

		 querystring='SELECT * FROM usuario WHERE  email = \''+login+'\'  AND   senha =\''+password+'\';';
 //console.log(querystring);
 this.query(querystring, callback);
 

}


// login by token -> logs user in by means of token identification ---------------------------------
MySQL.prototype.loginByToken = function(token, callback) {
var context=this;
var querystring='';

 querystring='SELECT * FROM usuario WHERE  token = \''+token+'\';';
 //console.log(querystring);
 this.query(querystring, callback);
 

}





module.exports = MySQL;
