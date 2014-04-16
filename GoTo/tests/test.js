var expect = require("chai").expect,
	lib = require("../js/clientLibTest");
    
var FRIEND_CLOSE = 0;
var SHOULD_BE_GOING_TO_BECAUSE_OF_EVENT = 1;
var SHOULD_BE_GOING_TO_BECAUSE_OF_FRIEND = 2;
var SHOULD_NOT_BE_GOING_TO = 3;
var SHOULD_TAKE_TRAM = 4;
//var url = "127.0.0.1:8081"
var vub;
function getVub(hasCoordinates){
	if(!vub)
		vub = new hasCoordinates ({placeId : "VUB" , latBL : 50.821410, longBL: 4.394920, latUR : 50.821430, longUR:4.394940});
	return vub;
}
describe("GoTo",function(){

	/*beforeEach(function(done){
    	db.clear(function(err){
      		if (err) return done(err);
      db.save([tobi, loki, jane], done);
    });
  	}	)*/

	it("should go because of event",function(done){
		lib.requireTemplate("friends","isEvent","isPartecipating", function(err,Friends,isEvent,isPartecipating){
			var f1 = new Friends({personId1: "Carlo",personId2: "Simon"});
			var f2 = new Friends({personId1: "Simon",personId2: "Carlo"});
			var d = new Date();
			d.setHours(d.getHours() +2);
			var e = new isEvent({eventId: 1 , name: "class" , placeId : "vub" , startTime : new Date(), endTime : d });
			var ip = new isPartecipating({personId: "Carlo", eventId: 1});
			lib.addEventListener(SHOULD_BE_GOING_TO_BECAUSE_OF_EVENT, function(event){
				console.log(event);
				expect(event.eventId).to.equal(e.eventId);
				done();
			});
			
		});
	});

	it("laving place",function(done){
		lib.requireTemplate("isAtPlace","isAtCoordinates","hasCoordinates", function(err,isAtPlace,isAtCoordinates,hasCoordinates){
			var iap = new isAtPlace({personId: "Carlo",placeId: "VUB"});
			var iac = new isAtCoordinates( {personId: "Carlo" , lat : 50.821400,long : 4.394918});
			var hc = getVub(hasCoordinates);
			done();
			//should print retract on the console
		});
	});	

	it("should be going retract",function(done){
		lib.requireTemplate("isGoingTo","shouldGoTo", function(err,isGoingTo,shouldGoTo){
			var gt = new isGoingTo ({placeId : "VUB", personId: "Carlo"});
			var sg = new shouldGoTo ({personId : "Carlo", placeId : "ULB"});
			done();
			//should print retract on the console
		});
	});	


	it("is at place ",function(done){
		lib.dispose();
		lib.requireTemplate("hasCoordinates","isAtCoordinates", function(err,hasCoordinates,isAtCoordinates){
			var vub = new hasCoordinates ({placeId : "VUB" , latBL : 50.821410, longBL: 4.394920, latUR : 50.821430, longUR:4.394940});
			var sg = new isAtCoordinates( {personId: "Carlo" , lat : 50.821415, long : 4.394928});
			done();
			//should print assert on the console
		});
	});	

	it("retractshouldBeGoingToBecauseofFriend ",function(done){
		lib.dispose();
		lib.requireTemplate("friends","isAtPlace", "hasCoordinates","isAtCoordinates","wantToAvoid","shouldGoTo", function(err,Friends ,isAtPlace,hasCoordinates,
			isAtCoordinates,wantToAvoid,shouldGoTo){
			if(err)
				throw new Error(err);
			var f1 = new Friends({personId1: "Carlo",personId2: "Simon"});
			new Friends({personId1: "Simon",personId2: "Carlo"});
			var f2 = new Friends({personId1: "Carlo",personId2: "Flo"});
			new Friends({personId1: "Flo",personId2: "Carlo"});
			var iap1 = new isAtPlace({personId: "Simon",placeId: "VUB"});
			var iap2 = new isAtPlace({personId: "Flo",placeId: "VUB"});
			var iap2 = new isAtPlace({personId: "Carlo",placeId: "VUB"});
			var sg = new shouldGoTo ({personId : "Carlo", placeId : "VUB"});
			done();
			//should print retract on the console
		});
	});	


	it("shouldBeGoingToBecauseofFriend ",function(done){
		lib.dispose();
		lib.requireTemplate("friends","isAtPlace", "hasCoordinates","isAtCoordinates","wantToAvoid","shouldGoTo", function(err,Friends ,isAtPlace,hasCoordinates,
			isAtCoordinates,wantToAvoid,shouldGoTo){
			
			if(err)
				throw new Error(err);
			
			var f1 = new Friends({personId1: "Carlo",personId2: "Simon"});
			new Friends({personId1: "Simon",personId2: "Carlo"});
			var f2 = new Friends({personId1: "Carlo",personId2: "Flo"});
			new Friends({personId1: "Flo",personId2: "Carlo"});
			var iap1 = new isAtPlace({personId: "Simon",placeId: "VUB"});
			lib.addEventListener(SHOULD_BE_GOING_TO_BECAUSE_OF_FRIEND, function(event){
				console.log(event);
				//expect(event.friend1.personId1).to.equal(f2.personId2);
				expect([event.friend1.personId1, event.friend2.personId1]).to.include.members([f2.personId2, f1.personId2]);
				done();
			});
			var iap2 = new isAtPlace({personId: "Flo",placeId: "VUB"});
			new isAtCoordinates( {personId: "Carlo" , lat : 50.821405, long : 4.394918}); //the coordinates has to be that I am close but no at the place
			var vub = new hasCoordinates ({placeId : "VUB" , latBL : 50.821410, longBL: 4.394920, latUR : 50.821430, longUR:4.394940});
			
		});
	});	

	it("avoid ",function(done){
		lib.dispose();
		lib.requireTemplate("friends","isAtPlace", "hasCoordinates","isAtCoordinates","wantToAvoid","shouldNotGoTo", 
			function(err,Friends ,isAtPlace,hasCoordinates,	isAtCoordinates,wantToAvoid,shouldNotGoTo){
			if(err)
				throw new Error(err);
			var iap1 = new isAtPlace({personId: "Simon",placeId: "VUB"});
			var f1 = new wantToAvoid({avoiderId: "Carlo",avoidedId: "Simon"});
			new isAtCoordinates( {personId: "Carlo" , lat : 50.821405, long : 4.394918}); //the coordinates has to be that I am close but no at the place
			lib.addEventListener(SHOULD_NOT_BE_GOING_TO, function(event){
				console.log(event);
				expect(event.place).to.equal("VUB");
				done();
			});
			var vub = new hasCoordinates ({placeId : "VUB" , latBL : 50.821410, longBL: 4.394920, latUR : 50.821430, longUR:4.394940});
			
		});
	});	

	it("close riend retract ",function(done){
		lib.dispose();
		lib.requireTemplate("friends","isAtPlace", "hasCoordinates","isAtCoordinates","wantToAvoid","shouldNotGoTo","notifyCloseFriend" ,
			function(err,Friends ,isAtPlace,hasCoordinates,	isAtCoordinates,wantToAvoid,shouldNotGoTo,notifyCloseFriend){
			
			if(err)
				throw new Error(err);
			var f1 = new Friends({personId1: "Carlo",personId2: "Simon"});
			new Friends({personId1: "Simon",personId2: "Carlo"});
			new isAtCoordinates( {personId: "Carlo" , lat : 50.821405, long : 4.394918}); //the coordinates has to be that I am close but no at the place
			new isAtCoordinates( {personId: "Simon" , lat : 50.721404, long : 4.394917});
			new notifyCloseFriend({personIdNotified: "Simon", personIdNotification: "Carlo"});
			new notifyCloseFriend({personIdNotified: "Carlo", personIdNotification: "Simon"});
			done();

			
		});
	});	

	it("close friend  ",function(done){
		lib.dispose();
		lib.requireTemplate("friends","isAtPlace", "hasCoordinates","isAtCoordinates","wantToAvoid","shouldNotGoTo","notifyCloseFriend" ,
			function(err,Friends ,isAtPlace,hasCoordinates,	isAtCoordinates,wantToAvoid,shouldNotGoTo,notifyCloseFriend){
			
			if(err)
				throw new Error(err);
			var f1 = new Friends({personId1: "Carlo",personId2: "Simon"});
			
			new isAtCoordinates( {personId: "Carlo" , lat : 50.821405, long : 4.394918}); //the coordinates has to be that I am close but no at the place
			new isAtCoordinates( {personId: "Simon" , lat : 50.821404, long : 4.394917});
			
			lib.addEventListener(FRIEND_CLOSE, function(event){
				console.log(event);
				//expect(event.place).to.equal("VUB");
				done();
			});
		});
	});	

	it("retract tram  ",function(done){
		lib.dispose();
		lib.requireTemplate("isEvent","timeTable", "isPartecipating","isAtCoordinates","goHomeBy","notifyPT",
			function(err,isEvent ,timeTable,isPartecipating, isAtCoordinates,goHomeBy,notifyPT){
			
			if(err)
				throw new Error(err);
			var d = new Date();
			var da = new Date();
			da.setMinutes(da.getMinutes() +5)
			d.setHours(d.getHours() -2);
			new isEvent({eventId:"class", placeId:"VUB", startTime: d, endTime: new Date() });
			new timeTable({publicTransportation: 7, direction:"Heysel", time: da , lat : 50.821405, long : 4.394918});
			new isPartecipating ({personId : "Carlo",eventId :"class"});
			new isAtCoordinates( {personId: "Carlo" , lat : 50.821404, long : 4.394917});
			new goHomeBy ({personId: "Carlo" ,publicTransportation: 7, direction: "Heysel"});
			new notifyPT ({personIdNotified:"Carlo", publicTransportation:7, direction:"Heysel", time: da });
			done();
			});
	});	
	
	it("retract tram  too far",function(done){
		lib.dispose();
		lib.requireTemplate("isEvent","timeTable", "isPartecipating","isAtCoordinates","goHomeBy","notifyPT",
			function(err,isEvent ,timeTable,isPartecipating, isAtCoordinates,goHomeBy,notifyPT){
			
			if(err)
				throw new Error(err);
			var d = new Date();
			var da = new Date();
			da.setMinutes(da.getMinutes() +5)
			d.setHours(d.getHours() -2);
			
			new timeTable({publicTransportation: 7, direction:"Heysel", time: da , lat : 50.821405, long : 4.394918});
			
			new isAtCoordinates( {personId: "Carlo" , lat : 50.721404, long : 4.294917});
			new goHomeBy ({personId: "Carlo" ,publicTransportation: 7, direction: "Heysel"});
			new notifyPT ({personIdNotified:"Carlo", publicTransportation:7, direction:"Heysel", time: da });
			done();
			});
	});	


	it("retract tram  too late",function(done){
		lib.dispose();
		lib.requireTemplate("isEvent","timeTable", "isPartecipating","isAtCoordinates","goHomeBy","notifyPT",
			function(err,isEvent ,timeTable,isPartecipating, isAtCoordinates,goHomeBy,notifyPT){
			
			if(err)
				throw new Error(err);
			var d = new Date();
			var da = new Date();
			da.setMinutes(da.getMinutes() -30)
			d.setHours(d.getHours() -2);
			
			new timeTable({publicTransportation: 7, direction:"Heysel", time: da , lat : 50.821405, long : 4.394918});
			
			new isAtCoordinates( {personId: "Carlo" , lat : 50.821404, long : 4.394917});
			new goHomeBy ({personId: "Carlo" ,publicTransportation: 7, direction: "Heysel"});
			new notifyPT ({personIdNotified:"Carlo", publicTransportation:7, direction:"Heysel", time: da });
			done();
			});
	});	

	it("take tram  ",function(done){
		lib.dispose();
		lib.requireTemplate("isEvent","timeTable", "isPartecipating","isAtCoordinates","goHomeBy","notifyPT",
			function(err,isEvent ,timeTable,isPartecipating, isAtCoordinates,goHomeBy,notifyPT){
			
			if(err)
				throw new Error(err);
			var d = new Date();
			var da = new Date();
			da.setMinutes(da.getMinutes() +5)
			d.setHours(d.getHours() -2);
			new isEvent({eventId:"class", placeId:"VUB", startTime: d, endTime: new Date() });
			new timeTable({publicTransportation: 7, direction:"Heysel", time: da , lat : 50.821405, long : 4.394918});
			new isPartecipating ({personId : "Carlo",eventId :"class"});
			new isAtCoordinates( {personId: "Carlo" , lat : 50.821404, long : 4.394917});
			new goHomeBy ({personId: "Carlo" ,publicTransportation: 7, direction: "Heysel"});
			lib.addEventListener(SHOULD_TAKE_TRAM, function(event){
				console.log(event);
				expect(event.direction).to.equal("Heysel");
				done();
			});

			lib.addEventListener(SHOULD_BE_GOING_TO_BECAUSE_OF_EVENT, function(event){
				console.log(event);
			});

		});
	});

})
