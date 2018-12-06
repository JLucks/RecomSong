var Recom = (function(){
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
  my.orderGrowing = function(vet, lim = 0){
    var maxV = -1, indi = 0, tam;
    var tVet = vet.slice();
    var nVet = [];
    if(lim>0)
      tam = lim;
    else{
      tam = vet.length;
    }
    for(var i = 0; i < tam; i++){
      for(var j = 0; j < 200; j++){
        if (tVet[j] != -1){  
          if(tVet[j] > maxV){
            maxV = tVet[j];
            indi = j;
          }
        }
      }
      nVet.push(indi);
      tVet[indi] = -1;
      maxV = -1;
      indi = 0;
    }
    return nVet;
  }
  return my;
}());

module.exports = Recom;