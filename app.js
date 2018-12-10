/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var pagerank = require('./pagerank.js');
var recom = require('./recom.js');

var client_id = '31990f16afb4474ca0429bc69467dbf7'; // Your client id
var client_secret = '100561904f354f1d9eb53118b37dcdc5'; // Your secret
var redirect_uri = 'https://recomsong.herokuapp.com:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());


var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-recently-played user-top-read user-library-read playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error2, response2, body2) {
          if (!error2 && response2.statusCode === 200) 
            console.log("Usuario Requisitado:" + body2.display_name);
        });

        options = {
          url: 'https://api.spotify.com/v1/me/player/recently-played',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error2, response2, body2) {
          if (!error2 && response2.statusCode === 200) {
            var count = 0;
            for(i in body2.items){
              console.log("RRP"+i+" ID:"+ body2.items[i].track.id);
              var options2 = {
                url: 'https://api.spotify.com/v1/recommendations?limit=5&seed_tracks=' + body2.items[i].track.id,
                headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + access_token },
                json: true
              };
              // use the access token to access the Spotify Web API
              request.get(options2, function(error3, response3, body3) {
                if (!error3 && response3.statusCode === 200) {
                  for(i in body3.tracks){
                    console.log("SRP"+count+" ID:"+ body3.tracks[i].id);
                    count++;
                  }
                }
              });
            }
          }
        });

        options = {
          url: 'https://api.spotify.com/v1/me/top/tracks',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error2, response2, body2) {
          if (!error2 && response2.statusCode === 200) {
            var count = 0;
            for(i in body2.items){            
              console.log("RTT"+i+" ID:"+ body2.items[i].id);
              var options2 = {
                url: 'https://api.spotify.com/v1/recommendations?limit=5&seed_tracks=' + body2.items[i].id,
                headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + access_token },
                json: true
              };
              // use the access token to access the Spotify Web API
              request.get(options2, function(error3, response3, body3) {
                if (!error3 && response3.statusCode === 200) {
                  for(i in body3.tracks){
                    console.log("STT"+count+" ID:"+ body3.tracks[i].id);
                    count++;
                  }
                }
              });
            }
          }
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    method: "POST",
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.post('/recomend', function(req, res) {

  var recTracks = req.body.recTracks;
  var access_token = req.body.access_token;
  var recTracksFeatures = [];
  var threeshold = 1;
  var ids1 = "", ids2 = "";
  for(var i = 0; i < 99; i++){
    ids1 = ids1 + recTracks[i].id + ",";
    ids2 = ids2 + recTracks[100 + i].id + ",";
  }
  ids1 = ids1 + recTracks[99].id; 
  ids2 = ids2 + recTracks[199].id;
  var options = {
    url: 'https://api.spotify.com/v1/audio-features/?ids=' + ids1,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      recTracksFeatures = recTracksFeatures.concat(body.audio_features);
      for(i in body.audio_features){
        console.log("F"+i+" ID:"+ body.audio_features[i].id);
      }
    }
  });

  options = {
    url: 'https://api.spotify.com/v1/audio-features/?ids=' + ids2,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      recTracksFeatures = recTracksFeatures.concat(body.audio_features);
      var count = 100;
      for(i in body.audio_features){
        console.log("F"+count+" ID:"+ body.audio_features[i].id);
        count++;
      }
    }
  });

  var matrizAdj = [];
  var myAdj = setTimeout(function(){
    var matrizFeatures = recom.normalization(recTracksFeatures);
    for(var i = 0; i < matrizFeatures.length; i++){
      var line = [];
      for (var j = 0; j < matrizFeatures.length; j++) {
        if(i == j) continue;
        if(recom.isLigation(matrizFeatures[i],matrizFeatures[j],threeshold)){
          line.push(j);
        }
      }
      matrizAdj.push(line);
    }
  }, 3000); 
  var pgTracks;
  var myPagerank = setTimeout(function(){
    var damping_factor = 0.85; //fator de amortecimento
    var tolerance = 0.0001; //sensibilidade da convergência
    pagerank(matrizAdj, damping_factor, tolerance,function(err, res){
      if (err) throw new Error(err);
      pgTracks = res;
    });
  }, 8000);
  var myResp = setTimeout(function(){
    var pgOrder = recom.orderGrowing(pgTracks,30);
    var tracksPlaylist = {"tracks":[]};
    for(var i = 0; i < pgOrder.length; i++){
      var ind = recom.search(recTracks, recTracksFeatures[pgOrder[i]].id);
      if(ind != -1)
        tracksPlaylist.tracks.push(recTracks[ind]);
    }
    setTimeout(function(){
      res.send({
        'tracksPlaylist' : tracksPlaylist
      }); 
    }, 3000);
  }, 16000); 
});

app.post('/playlist', function(req, res) {
  var tracksPlaylist = req.body.tracksPlaylist;
  var access_token = req.body.access_token;
  var userInfo = req.body.userInfo;
  var options = {
    url: 'https://api.spotify.com/v1/users/'+userInfo.id+'/playlists',
    body: JSON.stringify({
        'name': 'RecomSong',
        'public': false
    }),
    dataType:'json',
    headers: {
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/json',
    }
  };
  // use the access token to access the Spotify Web API
  request.post(options, function(error, response, body) {
    if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
      var playlist = JSON.parse(body);
      console.log("Nome da playlist:" + playlist.name);
      console.log("ID:" + playlist.id); 
      var uriTracks = [];  
      for(var i = 0; i < tracksPlaylist.tracks.length; i++) {
        uriTracks.push("spotify:track:"+tracksPlaylist.tracks[i].id);
      }  
      var options2 =  {
        url: 'https://api.spotify.com/v1/playlists/'+playlist.id+'/tracks',
        body: JSON.stringify({
          'uris' : uriTracks
        }),
        dataType:'json',
        headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json',
        }
      }; 
      request.post(options2, function(error2, response2, body2) {
        if (!error2 && (response2.statusCode === 200 || response2.statusCode === 201)) {
          res.send({
            'playlist' : playlist.name
          }); 
        }
      });   
    }
  });
});

app.get('/logout', function(req, res) {  
  console.log("Logout");
  res.send({'status': true});
});

console.log('Listening on 8888');
app.listen(8888);
