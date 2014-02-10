var VERSION = '0.2.8',
  http = require('http'),
  querystring = require('querystring'),
  oauth = require('oauth'),
  streamparser = require('./parser'),
	util = require('util'),
	utils = require('./utils');
	keys = require('./keys');

function Twitter(options) {
  if (!(this instanceof Twitter)) return new Twitter(options);

  var defaults = {
    consumer_key: null,
    consumer_secret: null,
    access_token_key: null,
    access_token_secret: null,

    headers: {
      'Accept': '*/*',
      'Connection': 'close',
      'User-Agent': 'ntwitter/' + VERSION
    },


    secure: false, // force use of https for login/gatekeeper
    cookie: 'twauth',
    cookie_options: {},
    cookie_secret: null
  };
  this.options = utils.merge(defaults, options, keys.urls);

  this.oauth = new oauth.OAuth(
    this.options.request_token_url,
    this.options.access_token_url,
    this.options.consumer_key,
    this.options.consumer_secret,
    '1.0', null, 'HMAC-SHA1', null,
    this.options.headers);
}
Twitter.VERSION = VERSION;
module.exports = Twitter;

/*
 * STREAM
 */
Twitter.prototype.stream = function(method, params, callback) {
  
  if (typeof params === 'function') {
    callback = params;
    params = null;
  }

  // Iterate on params properties, if any property is an array, convert it to comma-delimited string
  if (params) {
		Object.keys(params).forEach(function(item) {
			if (util.isArray(params[item])) {
				params[item] = params[item].join(','); // join return a string with csv, where the values are the values of cells of the arrays
			}
		});
  }

  var stream_base = this.options.stream_base,
      self = this;

  // Stream type customisations
  if (method === 'user') {
    stream_base = this.options.user_stream_base;
  } 
  else if (method === 'site') {
    stream_base = this.options.site_stream_base;
  } 
   //console.log(method + "\n" + stream_base);

  var url = stream_base + '/' + escape(method) + '.json';

  var request = this.oauth.post(
    url,
    this.options.access_token_key,
    this.options.access_token_secret,
    params, null
  );

  var stream = new streamparser();

  stream.destroySilent = function() {
    if ( typeof request.abort === 'function' )
      request.abort(); // node v0.4.0
    else
      request.socket.destroy();
  };
  stream.destroy = function() {
    // FIXME: should we emit end/close on explicit destroy?
    stream.destroySilent();

    // emit the 'destroy' event
    stream.emit('destroy','socket has been destroyed');
  };

  
  stream.on('_data', processTweet);

  function processTweet(tweet) {
    if (tweet['limit']) {
      stream.emit('limit', tweet['limit']); //the 2nd parameter of emit is the argument to pass to the functions litening to the events
    }
    else if (tweet['delete']) {
      stream.emit('delete', tweet['delete']);
    }
    else if (tweet['scrub_geo']) {
      stream.emit('scrub_geo', tweet['scrub_geo']);
    }
    else {
      stream.emit('data', tweet);
    }
  }

  request.on('response', function(response) {

    // Any response code greater then 200 from steam API is an error
    if(response.statusCode > 200) {
      stream.destroySilent();
      stream.emit('error', 'http', response.statusCode );
    }
    else
    {
      // FIXME: Somehow provide chunks of the response when the stream is connected
      // Pass HTTP response data to the parser, which raises events on the stream
      response.on('data', function(chunk) {
        stream.receive(chunk);
      });
      response.on('error', function(error) {
        stream.emit('error', error);
      });
      response.on('end', function() {
        stream.emit('end', response);
      });
      
      /* 
       * This is a net.Socket event.
       * When twitter closes the connectionm no 'end/error' event is fired.
       * In this way we can able to catch this event and force to destroy the 
       * socket. So, 'stream' object will fire the 'destroy' event as we can see above.
       */
      response.on('close', function() {
        stream.destroy();
      });
    }
  });
  request.on('error', function(error) {
    stream.emit('error', error);
  });
  request.end();

  if ( typeof callback === 'function' ) callback(stream);
  return this;
}
/*
 * POST
 */
Twitter.prototype.post = function(url, content, content_type, callback) {
  if (typeof content === 'function') {
    callback = content;
    content = null;
    content_type = null;
  } else if (typeof content_type === 'function') {
    callback = content_type;
    content_type = null;
  }

  if ( typeof callback !== 'function' ) {
    throw new Error('FAIL: INVALID CALLBACK.');
    return this;
  }

  if (url.charAt(0) == '/')
    url = this.options.rest_base + url;

  // Workaround: oauth + booleans == broken signatures
  if (content && typeof content === 'object') {
    Object.keys(content).forEach(function(e) {
      if ( typeof content[e] === 'boolean' )
        content[e] = content[e].toString();
    });
  }
  
  this.oauth.post(url,
    this.options.access_token_key,
    this.options.access_token_secret,
    content, content_type,
  function(error, data, response) {
    if ( error && error.statusCode ) {
      var err = new Error('HTTP Error '
        + error.statusCode + ': '
        + http.STATUS_CODES[error.statusCode]
        + ', API message: ' + error.data);
      err.data = error.data;
      err.statusCode = error.statusCode;
      callback(err);
    } 
    else if (error) {
      callback(error);
    }
    else {
      try {
        var json = JSON.parse(data);
      } 
      catch(err) {
        return callback(err);
      }
      callback(null, json);
    }
  });
  return this;
}

Twitter.prototype.updateStatus = function(text, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = null;
  }

  var url = '/statuses/update.json';
  var defaults = {
    status: text,
    include_entities: 1
  };
  params = utils.merge(defaults, params);
  this.post(url, params, null, callback);
  return this;
}

Twitter.prototype.verifyCredentials = function(callback) {
  var url = '/account/verify_credentials.json';
  this.get(url, null, callback);
  return this;
}

/*
 * GET
 */
Twitter.prototype.get = function(url, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = null;
  }

  if ( typeof callback !== 'function' ) {
    throw new Error('FAIL: INVALID CALLBACK.');
    return this;
  }

  if (url.charAt(0) == '/')
    url = this.options.rest_base + url;

  this.oauth.get(url + '?' + querystring.stringify(params),
    this.options.access_token_key,
    this.options.access_token_secret,
  function(error, data, response) {
    if ( error && error.statusCode ) {
      var err = new Error('HTTP Error '
        + error.statusCode + ': '
        + http.STATUS_CODES[error.statusCode]);
      err.statusCode = error.statusCode;
      err.data = error.data;
      callback(err);
    } 
    else if (error) {
      callback(error);
    }
    else {
      try {
        var json = JSON.parse(data);
      } 
      catch(err) {
        return callback(err);
      }
      callback(null, json);
    }
  });
  return this;
}