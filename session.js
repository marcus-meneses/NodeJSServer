

function Session(){
 
 this.authorized = [];
 this.ttl = 86400; //each token has a ttl of 24hs. Set this as you see fit.
 
};

//NOTE: these functions may not access database at any moment


Session.prototype.start = function(userdata) {
//push userdata into this.authorized

//console.log(userdata);

var udata = {
		id:userdata.id,
		token:userdata.token,
		name:userdata.nome,
		class:userdata.classe

		}
		

for (var i=0; i<this.authorized.length; i++){	
	if (this.authorized[i].id==udata.id) { 
	return 0;
	}
}


this.authorized.push(udata);
return 1;
 

}

Session.prototype.stop = function(token) {
//splice user containing token from this.authorized
//TODO
}


Session.prototype.authorize = function(token, userclass, callback) {
//if userdata.token equals token AND userdata.class equals userclass, run callback, else returns 0;



for (var i=0; i<this.authorized.length; i++){	
	console.log(token+' vs '+this.authorized[i].token);
	if (this.authorized[i].token==token) {
	

	console.log(userclass+' vs '+this.authorized[i].class);

		if (userclass=='any') {
			callback();
			return 1;		
		}
	
	 
		if (this.authorized[i].class==userclass) {
			callback();
			return 1;
		}
	}
}

return 0;

}


Session.prototype.dump = function() {
//dump contents of this.authorized
console.log(this.authorized);
}




module.exports = Session;
