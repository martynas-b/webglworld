
GLWorld.Map = function (aOpt) {
	var iWorld = null;
	var iOptions = {
		img: { src: "../dev/media/img/map_64.png" },
		mapDiv: {
			id: "parentMapDiv"
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
          zoom: 1
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
	}	
	
	init(aOpt);
	
};