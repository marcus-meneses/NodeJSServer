var path = require('path');
var fs = require('fs');
var express = require('express');
var formidable = require('express-formidable');
var app = express();
var MySQL = require('./mysql'); 
var Config = require('./config');
var Session = require('./session');


/*
this.origin = '127.0.0.1:3000'
this.host = 'localhost';
this.database = 'wavemedical';
this.login = 'root';
this.password = 'root';
this.maxConnections = 100;
*/

var config = new Config('174.138.72.41:3000', 'localhost', 'wavemedical', 'root', '$mvmM1985', 100);
var session = new Session();
var mysql = new MySQL(config.host, config.database, config.login, config.password, config.maxConnections, config.origin);



function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var date = + new Date();

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));


	text= text+date;
    return text;
}


var dir = path.join(__dirname, 'resources');
app.use(express.static(dir));


var logger = function (req, res, next) {
 // console.log('Logging Function Triggered');
  next();
}



var authorization  = function (req, res, next) {
  //req.fields.token
  
  
 //console.log(req.method); 
 //console.log(req.fields.token); 
 
 if(req.method=='POST') {
 
 	if ( (req.url=='/login') || (req.url=='/mailexists') || (req.url=='/loginbytoken') || (req.url=='/cadastrausuario') ) { 
 		console.log('sign in, login, token & mail validation sequence ignores token check');
 		next();
 	} else {
 		console.log('token check');
		mysql.find('usuario', 'token', req.fields.token, null, function (items){ 
 		//console.log(req.fields.token);
		//console.log(items);
 		next();
 		 });
 	
 	}
 	
 	

 
 } else {
 
  	console.log('get urls are not subject to token check');
 	next();
 }
 
 
}

app.use(logger);
//app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());

app.use(formidable({
  encoding: 'utf-8',
  uploadDir: './resources/temp',
  multiples: true, // req.files to be arrays of files 
}));

app.use(authorization);


app.get('/', function (req, res) {
//return api description here
 res.send(req.params);
});



//BACK-END login uri -----------------------------------------------------------------------------------------
app.post('/login', function (req, res) {

  
 mysql.login(req.fields.login, req.fields.password, function (items){ 
 	if (items[0]===undefined) {
 	res.send(JSON.stringify({error:'undefined user',token:'-1'})); 
 	} else {
 	session.start(items[0]);
 	res.send(JSON.stringify({token: items[0].token, nome:items[0].nome, classe:items[0].classe, remoteid:items[0].id})); 
 	}
 });
 
});


//dump all session data --------------------------------------------------------------------------------------
app.get('/session_dump', function (req, res) {
	session.dump();
	res.send('{ok:\'true\'}') ;
});


//create new product ----------------------------------------------------------------------------------------
app.post('/cadastraproduto/:caid', function (req, res) {


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may add products to category '+req.params.caid);

}) ) {



var nome = req.fields.nome;
var anvisa = req.fields.anvisa;
var marca = req.fields.marca;
var categoria = req.fields.categoria;
var descricao = req.fields.descricao;
var proprio = req.fields.proprio;
var importado = req.fields.importado;
var tabela = req.fields.tabela;

mysql.insert('produto', ['nome','anvisa','marca','categoria','descricao','proprio','importado','tabela'], 
						[nome,anvisa,marca,categoria,descricao,proprio,importado,tabela], function(data){

console.log(data);

//TODO
//validar existencia de data.insertId!!!

res.send('{"ok":"true", "id":"'+data.insertId+'"}') ;
});





	
	//res.send('{ok:\'true\'}') ; 

} else {
	console.log('you may not add products');
	res.send('{error:\'unauthorized\'}');
}

 
});




//remove product -----------------------------------------------------------------------------------------
app.post('/removeproduto/:id', function (req, res) {


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may remove product '+req.params.id);

}) ) {
	
	mysql.remove('produto', 'id', req.params.id, function(){
		res.send('{ok:\'true\'}') ; 
	});

} else {
	console.log('you may not remove products');
	res.send('{error:\'unauthorized\'}');
}

 
});


//edit product -------------------------------------------------------------------------------------------
app.post('/editaproduto/:id', function (req, res) {


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may edit product '+req.params.id);

}) ) {
	

var nome = req.fields.nome;
var anvisa = req.fields.anvisa;
var marca = req.fields.marca;
var categoria = req.fields.categoria;
var descricao = req.fields.descricao;
var proprio = req.fields.proprio;
var importado = req.fields.importado;
var tabela = req.fields.tabela;

mysql.update('produto','id', req.params.id, ['nome','anvisa','marca','categoria','descricao','proprio','importado','tabela'], 
											[nome,anvisa,marca,categoria,descricao,proprio,importado,tabela], function(data){

console.log(data);

res.send('{"ok":"true"}') ;
});




	 

} else {
	console.log('you may not edit products');
	res.send('{error:\'unauthorized\'}');
}

 
});


//list product ------------------------------------------------------------------------------------------
app.post('/listaproduto/:cid/:id', function (req, res) {

//polymorph!!!
/*

if (cid==undefined) and (:id==undefined) -> list all products from all classes
if (cid!=undefined) and (:id!=undefined) -> list all products within class cid
if (cid!=undefined) and (:id!=undefined) -> return product id from within class cid

*/



if ( session.authorize(req.fields.token, 'any',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may list products');

}) ) {


if ((req.params.cid<0)&&(req.params.id<0)){


	 mysql.find('produto', 'id>', '0', null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify(items)) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
	//res.send('{\'false\'}') ; 
	});





} else if ((req.params.cid>0)&&(req.params.id<0)) {




		 mysql.find('produto', 'categoria', req.params.cid, null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify(items)) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
	//res.send('{\'false\'}') ; 
});



} else if ((req.params.cid>0)&&(req.params.id>0)) {




		 mysql.find('produto', 'id', req.params.id, null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify(items)) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
	//res.send('{\'false\'}') ; 
});



}




	
	//res.send('{ok:\'true\'}') ; 

} else {
	console.log('you may not list products');
	res.send('{error:\'unauthorized\'}');
}

 
});







//add photo to product -----------------------------------------------------------------------------------
app.post('/inserefoto/:id', function (req, res) {


if ( session.authorize(req.fields.token, 'admin', function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may add photos to product '+req.params.id);

}) ) {
	
console.log(req.files.imagem.name);
console.log(req.files.imagem.path);

var newname = Date.now()+req.files.imagem.name;
var newpath = 'resources/img/'+newname;
var newrpath = 'img/'+newname;
console.log(newname);


fs.rename(req.files.imagem.path, './'+newpath, function(err){
    if (err) res.send('{error:\'cannot copy file\'}');
  
       mysql.insert('foto', ['url','produto'], 
					      ['http://'+config.origin+'/'+newrpath,req.params.id], function(data){

						 	console.log(data);

							res.send('{"ok":"true"}') ;
	});


});


} else {
	console.log('you may not add photos to product');
	res.send('{error:\'unauthorized\'}');
}

 
});






//add photo to product -----------------------------------------------------------------------------------
app.post('/inserepdf/:id', function (req, res) {


if ( session.authorize(req.fields.token, 'admin', function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may add pdf to product '+req.params.id);

}) ) {
	
console.log(req.files.pdf.name);
console.log(req.files.pdf.path);

var newname = Date.now()+req.files.pdf.name;
var newpath = 'resources/pdf/'+newname;
var newrpath = 'pdf/'+newname;
console.log(newname);


fs.rename(req.files.pdf.path, './'+newpath, function(err){
    if (err) res.send('{error:\'cannot copy file\'}');
  
       mysql.update('produto', 'id', req.params.id,  ['pdf'], 
			    			     ['http://'+config.origin+'/'+newrpath], function(data){

						 	console.log(data);

							res.send('{"ok":"true"}') ;
	});


});


} else {
	console.log('you may not add pdf to product');
	res.send('{error:\'unauthorized\'}');
}

 
});



//fetch product photo urls --------------------------------------------------------------------------------------
app.post('/listafoto/:id', function (req, res) {


if ( session.authorize(req.fields.token, 'any',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may fetch photos from product '+req.params.id);

}) ) {
	
 		 mysql.find('foto', 'produto', req.params.id, null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify(items)) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
	//res.send('{\'false\'}') ; 
});

} else {
	console.log('you may not list photos from product');
	res.send('{error:\'unauthorized\'}');
}

 
});




//remove photo from product -------------------------------------------------------------------------------------
app.post('/removefoto/:pid/:id', function (req, res) {


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may remove photo '+req.params.id+' from product '+req.params.pid);

}) ) {
	


	mysql.remove('foto', 'id', req.params.id, function(){
		res.send('{ok:\'true\'}') ; 
	});


	

} else {
	console.log('you may not remove photos from product');
	res.send('{error:\'unauthorized\'}');
}

 
});






//add category -----------------------------------------------------------------------------------------------
app.post('/cadastracategoria', function (req, res) {


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may add category');

}) ) {
	
var nome = req.fields.nome;
var descricao = req.fields.descricao;

mysql.insert('categoria', 	['nome','descricao'], 
							[nome,descricao], function(data){

console.log(data);

res.send('{"ok":"true"}') ;
});

} else {
	console.log('you may not add category');
	res.send('{error:\'unauthorized\'}');
}

 
});




//edit category -----------------------------------------------------------------------------------------------
app.post('/editacategoria/:caid', function (req, res) {


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may edit category '+req.params.caid);

}) ) {
	
var nome = req.fields.nome;
var descricao = req.fields.descricao;

mysql.update('categoria', 'id', req.params.caid, 	['nome','descricao'], 
													[nome,descricao], function(data){

console.log(data);

res.send('{"ok":"true"}') ;
});


} else {
	console.log('you may not add category');
	res.send('{error:\'unauthorized\'}');
}

 
});




//remove category --------------------------------------------------------------------------------------------
app.post('/removecategoria/:caid', function (req, res) {


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may remove category '+req.params.caid);

}) ) {
	
	mysql.remove('categoria', 'id', req.params.caid, function(){
		res.send('{ok:\'true\'}') ; 
	});


} else {
	console.log('you may not remove category');
	res.send('{error:\'unauthorized\'}');
}

 
});



//list category ----------------------------------------------------------------------------------------------
app.post('/listacategoria/:caid', function (req, res) {
console.log(";)");

//polymorph!!!
/*

if (caid==undefined) -> list all classes
if (caid!=undefined) -> retrieve class info
 

*/


if ( session.authorize(req.fields.token, 'any',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may list categories ');

}) ) {

if(req.params.caid<0){


	 mysql.find('categoria', 'classe', '0', null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify(items)) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
	//res.send('{\'false\'}') ; 
	});





} else {




		 mysql.find('categoria', 'id', req.params.caid, null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify(items)) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
	//res.send('{\'false\'}') ; 
});



}


	
	//res.send('{ok:\'true, nice\'}') ; 

} else {
	console.log('you may not list category');
	res.send('{error:\'unauthorized\'}');
}

 
});







//add user -------------------------------------------------------------------------------------------------
app.post('/cadastrausuario', function (req, res) {

var tok = makeid();

//console.log(req.fields);
var nome = req.fields.nome;
var email = req.fields.email;
var cidade = req.fields.cidade;
var estado = req.fields.estado;
var senha = req.fields.senha;

mysql.insert('usuario', ['nome','email','cidade','estado','senha','classe','token'], 
						[nome,email,cidade,estado,senha,'user',tok], function(data){

console.log(data);

res.send('{"ok":"true"}') ;
});


 
});



//edituser -------------------------------------------------------------------------------------------------
app.post('/editausuario/:uid', function (req, res) {


if ( session.authorize(req.fields.token, 'any',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may edit user ' + req.params.uid );

}) ) {
	

var nome = req.fields.nome;
var email = req.fields.email;
var cidade = req.fields.cidade;
var estado = req.fields.estado;
var senha = req.fields.senha;

mysql.update('usuario', 'id', req.params.uid, 	['nome','email','cidade','estado','senha','classe'], 
												[nome,email,cidade,estado,senha,'user'], function(data){

console.log(data);

res.send('{"ok":"true"}') ;
});


} else {
	console.log('you may not edit user');
	res.send('{error:\'unauthorized\'}');
}

 
});


//remove user -------------------------------------------------------------------------------------------------
app.post('/removeusuario/:uid', function (req, res) {


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may remove user ' + req.params.uid  );

}) ) {
	
	mysql.remove('usuario', 'id', req.params.uid, function(){
		res.send('{ok:\'true\'}') ; 
	});


} else {
	console.log('you may not remove user');
	res.send('{error:\'unauthorized\'}');
}

 
});



//list users -------------------------------------------------------------------------------------------------
app.post('/listausuario/:uid', function (req, res) {


//polymorph!!!
/*

if (uid==undefined) -> list all users
if (uid!=undefined) -> retrieve user info
 

*/

if (req.params.uid==-1){

}


if ( session.authorize(req.fields.token, 'admin',function(){
// mysql.insert(table, keylist, varlist, callback);
console.log('you may list users ');

}) ) {
	


if (req.params.uid<0){

 		 mysql.find('usuario', 'id>', '0', null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify(items)) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
		//res.send('{\'false\'}') ; 
		});
} else {

 		 mysql.find('usuario', 'id', req.params.uid, null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify(items)) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
		//res.send('{\'false\'}') ; 
		});



}




} else {
	console.log('you may not list users');
	res.send('{error:\'unauthorized\'}');
}

 
});





//verify if email field is already used -------------------------------------------------------------------------------------------------
app.post('/mailexists', function (req, res) {

 

	 mysql.find('usuario', 'email', req.fields.email, null, function (items){ 
		 
		// res.send(items)
		if (items.length>0) {
				res.send( JSON.stringify({result:'true'})) ; 
		} else {
				res.send( JSON.stringify({result:'false'})) ; 

		}
	//res.send('{\'false\'}') ; 
	});
	


 

 
});


//verify if token is already in use. If not, authorize by token -------------------------------------------------------------------------------------------------
app.post('/loginbytoken', function (req, res) {

 mysql.loginByToken(req.fields.token, function (items){ 
 	if (items[0]===undefined) {
 	res.send(JSON.stringify({error:'undefined user',token:'-1'})); 
 	} else {
 	session.start(items[0]);
 	res.send(JSON.stringify({token: items[0].token,nome:items[0].nome,classe:items[0].classe,remoteid:items[0].id})); 
 	}
 }); 
 
});



//verify if token is already in use. If not, authorize by token
app.post('/logoutbytoken', function (req, res) {

 
 
});







app.get('/find', function (req, res) {
 mysql.find('test', 'id>', '1', null, function (items){ res.send(items)} );
});



app.get('/tables', function (req, res) {
 mysql.tables( function (items){ res.send(items)} );
});



app.get('/fields/:table', function (req, res) { 
 mysql.fields(req.params.table, function (items){ res.send(items)} );
});



app.listen(3000, function () {
  console.log('Wave Medical app listening on port 3000!');
});
