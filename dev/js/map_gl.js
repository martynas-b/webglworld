
GLWorld.Map = function (aOpt) {
	var self = this;
	var iWorld = null;
	var iOptions = {
		img: { src: "../dev/media/img/map_64.png" },
		mapDiv: {
			id: "parentMapDiv",
			btnId: "goButton"
		}
	};
	var map = null;
	var iLocation = {
		marker: null,
		latLng: null
	};
	
	function initOptions (aOpt) {
		if (aOpt) {
			if (aOpt.world) { 
				iWorld = aOpt.world;
			}
		}
	}
	
	function addMapButton () {
		var img = document.createElement("img");
		img.src = iOptions.img.src;
		img.title = "Choose location";
		img.style.cssText = "cursor:pointer;position:absolute;top:5px;left:" + (iWorld.sceneOptions.size.width - 69) + "px";
		img.onclick = showMap;
	
		document.body.appendChild(img);
	}
	
	function showMap () {
		document.getElementById(iOptions.mapDiv.id).style.display = "inline";
		
		iWorld.setAllowControls(false);
	}
	
	function hideMap () {
		iWorld.setAllowControls(true);
		
		document.getElementById(iOptions.mapDiv.id).style.display = "none";
	}
	
	function initGoogleMap () {
		map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 0, lng: 0},
          zoom: 2
        });
		
		google.maps.event.addListener(map, "click", function (e) {
			
			if (!iLocation.marker) {
				iLocation.marker = new google.maps.Marker({
				    position: e.latLng,
				    map: map,
				    title: 'Explore it!'
				  });
			}
			else {
				iLocation.marker.setPosition(e.latLng);
			}

			iLocation.latLng = e.latLng;
		});
	}
	
	this.go = function () {
		if (iLocation.latLng) {		
			hideMap();
			
			iWorld.goToLocation({
				position: {
					lat: iLocation.latLng.lat(),
					lon: iLocation.latLng.lng()
				}
			});
		}
	}
	
	function init (aOpt) {
		initOptions(aOpt);
		
		iWorld.setAllowControls(false);
		
		addMapButton();
		
		initGoogleMap();
		
		var btn = document.getElementById(iOptions.mapDiv.btnId);
		
		if (Browser.touch) {
			btn.addEventListener("touchstart", function() {
				self.go();
			}, false);
		}
		else {
			btn.addEventListener("click", function() {
				self.go();
			}, false);
		}
		
		var location = GLWorld.Tools.gup("location");
		if (location !== "") {
			hideMap();
			
			var toks = location.split(",");
			
			iWorld.goToLocation({
				position: {
					lat: Number(toks[0]),
					lon: Number(toks[1])
				}
			});
		}
	}	
	
	init(aOpt);
	
};