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

var client_id = '31990f16afb4474ca0429bc69467dbf7'; // Your client id
var client_secret = 'secret'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

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
  var scope = 'user-read-private user-read-email user-read-recently-played user-top-read user-library-read';
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
        request.get(options, function(error, response, body) {
          console.log("Usuario Requisitado:" + body.display_name);
        });

        options = {
          url: 'https://api.spotify.com/v1/me/player/recently-played',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          var count = 0;
          for(i in body.items){
            console.log("RRP"+i+" ID:"+ body.items[i].track.id);
            var options2 = {
              url: 'https://api.spotify.com/v1/recommendations?limit=5&seed_tracks=' + body.items[i].track.id,
              headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + access_token },
              json: true
            };
            // use the access token to access the Spotify Web API
            request.get(options2, function(error2, response2, body2) {
              for(i in body2.tracks){
                console.log("SRP"+count+" ID:"+ body2.tracks[i].id);
                count++;
              }
            });
          }
        });

        options = {
          url: 'https://api.spotify.com/v1/me/top/tracks',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          var count = 0;
          for(i in body.items){            
            console.log("RTT"+i+" ID:"+ body.items[i].id);
            var options2 = {
              url: 'https://api.spotify.com/v1/recommendations?limit=5&seed_tracks=' + body.items[i].id,
              headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + access_token },
              json: true
            };
            // use the access token to access the Spotify Web API
            request.get(options2, function(error2, response2, body2) {
              for(i in body2.tracks){
                console.log("STT"+count+" ID:"+ body2.tracks[i].id);
                count++;
              }
            });
          }
        });

        //console.log(recTracks);
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

var recom = (function(){
  var my = {};
  my.isLigation = function(trackA,trackB,threeshold){
    var dist_key = trackB.key - trackA.key;
    var dist_mode = trackB.mode - trackA.mode;
    var dist_time = trackB.time_signature - trackA.time_signature;
    var dist_acous = trackB.acousticness - trackA.acousticness;
    var dist_dance = trackB.danceability - trackA.danceability;
    var dist_energ = trackB.energy - trackB.energy;
    var dist_instr = trackB.instrumentalness - trackA.instrumentalness;
    var dist_live = trackB.liveness - trackA.liveness;
    var dist_loud = trackB.loudness - trackA.loudness;
    var dist_speec = trackB.speechiness - trackA.speechiness;
    var dist_vale = trackB.valence - trackA.valence;
    var dist = Math.hypot(dist_key,dist_mode,dist_time,dist_acous,dist_dance,dist_energ,dist_instr,dist_live,dist_loud,dist_speec,dist_vale);
    if(dist <= threeshold){
      return true;
    }
    else{
      return false;
    }
  };
  my.normalization = function(matrizOrig){
    var matriz = matrizOrig.slice();
    var min_key = matriz[0].key;
    var min_mode = matriz[0].mode;
    var min_time = matriz[0].time_signature;
    var min_acous = matriz[0].acousticness;
    var min_dance = matriz[0].danceability;
    var min_energ = matriz[0].energy;
    var min_instr = matriz[0].instrumentalness;
    var min_live = matriz[0].liveness;
    var min_loud = matriz[0].loudness;
    var min_speec = matriz[0].speechiness;
    var min_vale = matriz[0].valence;   
    var max_key = matriz[0].key;
    var max_mode = matriz[0].mode;
    var max_time = matriz[0].time_signature;
    var max_acous = matriz[0].acousticness;
    var max_dance = matriz[0].danceability;
    var max_energ = matriz[0].energy;
    var max_instr = matriz[0].instrumentalness;
    var max_live = matriz[0].liveness;
    var max_loud = matriz[0].loudness;
    var max_speec = matriz[0].speechiness;
    var max_vale = matriz[0].valence;
    for(var i = 1; i < matriz.lenght; i++){
      if(matriz[i].key > max_key)
        max_key = matriz[i].key;
      else{
        min_key = matriz[i].key;
      }
      if(matriz[i].mode > max_mode)
        max_mode = matriz[i].mode;
      else{
        min_mode = matriz[i].mode;
      }
      if(matriz[i].time_signature > max_time)
        max_time = matriz[i].time_signature;
      else{
        min_time = matriz[i].time_signature;
      }
      if(matriz[i].acousticness > max_acous)
        max_acous = matriz[i].acousticness;
      else{
        min_acous = matriz[i].acousticness;
      }
      if(matriz[i].danceability > max_dance)
        max_dance = matriz[i].danceability;
      else{
        min_dance = matriz[i].danceability;
      }
      if(matriz[i].energy > max_energ)
        max_energ = matriz[i].energy;
      else{
        min_energ = matriz[i].energy;
      }
      if(matriz[i].instrumentalness > max_instr)
        max_instr = matriz[i].instrumentalness;
      else{
        min_instr = matriz[i].instrumentalness;
      }
      if(matriz[i].liveness > max_live)
        max_live = matriz[i].liveness;
      else{
        min_live = matriz[i].liveness;
      }
      if(matriz[i].loudness > max_loud)
        max_loud = matriz[i].loudness;
      else{
        min_loud = matriz[i].loudness;
      }
      if(matriz[i].speechiness > max_speec)
        max_speec = matriz[i].speechiness;
      else{
        min_speec = matriz[i].speechiness;
      }
      if(matriz[i].valence > max_vale)
        max_vale = matriz[i].valence;
      else{
        min_vale = matriz[i].valence;
      }
    }
    for(var i = 1; i < matriz.lenght; i++){
      matriz[0].key = (matriz[0].key - min_key)/(max_key - min_key);
      matriz[0].mode = (matriz[0].mode - min_mode)/(max_mode - min_mode);
      matriz[0].time_signature = (matriz[0].time_signature - min_time)/(max_time - min_time);
      matriz[0].acousticness = (matriz[0].acousticness - min_acous)/(max_acous - min_acous);
      matriz[0].danceability = (matriz[0].danceability - min_dance)/(max_dance - min_dance);
      matriz[0].energy = (matriz[0].energy - min_energ)/(max_energ - min_energ);
      matriz[0].instrumentalness = (matriz[0].instrumentalness - min_instr)/(max_instr - min_instr);
      matriz[0].liveness = (matriz[0].liveness - min_live)/(max_live - min_live);
      matriz[0].loudness = (matriz[0].loudness - min_loud)/(max_loud - min_loud);
      matriz[0].speechiness = (matriz[0].speechiness - min_speec)/(max_speec - min_speec);
      matriz[0].valence = (matriz[0].valence - min_vale)/(max_vale - min_vale);
    }
    return matriz;
  };
  my.search = function(matriz, id){
    for (var i = matriz.length - 1; i >= 0; i--) {
      if(matriz[i].id == id)
        return i;
    };
    return -1;
  }
  return my;
}());

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
    recTracksFeatures = recTracksFeatures.concat(body.audio_features);
    for(i in body.audio_features){
      console.log("F"+i+" ID:"+ body.audio_features[i].id);
    }
  });

  options = {
    url: 'https://api.spotify.com/v1/audio-features/?ids=' + ids2,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    recTracksFeatures = recTracksFeatures.concat(body.audio_features);
    var count = 100;
    for(i in body.audio_features){
      console.log("F"+count+" ID:"+ body.audio_features[i].id);
      count++;
    }
  });

  var matrizAdj = [];
  var myAdj = setTimeout(function(){
    for(var i = 0; i < recTracksFeatures.length; i++){
      var line = [];
      for (var j = 0; j < recTracksFeatures.length; j++) {
        if(i == j) continue;
        if(recom.isLigation(recTracksFeatures[i],recTracksFeatures[j],threeshold)){
          line.push(j);
        }
      }
      matrizAdj.push(line);
    }
  }, 3000); 
  var myResp = setTimeout(function(){
    console.log(matrizAdj);
    res.send({
      'matrizAdj' : matrizAdj
    }); 
  }, 20000); 
  /**
  var authOptions = {
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
  });**/
});

console.log('Listening on 8888');
app.listen(8888);
