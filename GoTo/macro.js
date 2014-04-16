macro toString {
  case {_ $x} => {
    var pattern = #{$x};
    var tokenString = pattern[0].token.value.toString();
    var stringValue = makeValue(tokenString, #{$here});
    return withSyntax($val = [stringValue]) {
      return #{$val};
    }
  }
}

macro myVar {
  rule {  $x = { $y (,) ... } } => { 
  var tmp = {};
  (tmp [toString $y] = undefined)(;) ...
  var lib  = require("./lib");
  var $x = lib.defineTemplate( toString $x ,tmp)
  }
}

export myVar;

//myVar Taxi = {destintion,time,radius,person,price,long,lat,username,phone}


/*
macro basic {
  rule { { $x (,) ... } } => {
    var tmp = {};
  (tmp [toString $x] = undefined)(;)
  ... 
  }
}*/

/*
macro myVar {
  rule {  $x = $expr } => { 
  var $x = lib.defineTemplate( toString $x , $expr)
  }
}*/



