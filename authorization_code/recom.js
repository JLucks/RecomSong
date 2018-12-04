//Module Pattern 
var recom = (function(){
	var my = {};
	my.isLigation = function(trackA,trackB,threeshold){
		var dist_key = trackB.key - trackA.key;
		var dist_mode = trackB.mode - trackA.mode;
		var dist_time = trackB.time_signature - trackA.time_signature;
		var dist_acous = trackB.acousticness - trackA.acousticness;
		var dist_dance = trackB.danceability - trackA.danceability;
		var dist_energ = trackB.energy - trackB.energy
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
	return my;
}());