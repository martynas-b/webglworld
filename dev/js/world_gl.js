window.GLWorld = window.GLWorld || {};

GLWorld.World = function (aOpt) {
	var self = this;
	var container = null;
	this.camera = null;
	
	this.cameraCtrl = null;
	
	this.scene = null;
	this.renderer = null;
	
	this.controls = null;
	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var prevTime = Date.now();
	var velocity = new THREE.Vector3();
	var canJump = false;
	
	var iRays = {/*front: null, back: null, left: null, right: null,*/ down: null, stepDown: 8};
	
	var iTerrain = null;
	
	this.player = {height: 2, minHgt: 2, maxHgt: 200, offsStep: 2};
	var iSkybox = null;
	
	this.sceneOptions = {size: {width: window.innerWidth, height: window.innerHeight}};
	var iOptions = {useControls: true, allowControls: true, usePointerLock: false, cubeSize: {x: 5000, y: 5000, z: 5000}};
	this.attrs = {cont3d: {id: "container_3d"}, instruct: {contId: "instructions_cont", noPLId: "instructions_no_pl"}};
	/*
	this.sceneObjects = null;
	
	this.multiplayer = null;
	this.main = null;
	
	var iAreaXml = null;
	*/
	var iProjUnit = null;
	this.center = {lat : 0, lon : 0, x: 0, y: 0, mFac : {x : 1, y : 1}};
	//this.center = {x : 0, y : 0, mFac : {x : 1, y : 1}, mXY : {x : null, y : null}};
	/*
	var iVR = null;
	
	this.map = null;
	
	var iObjects3D = null;
	
	this.positioning = null;
	
	this.mouse = null;
	
	var iListeners = null;
	*/
	function initOptions (aOpt) {
		/*
		if (Browser.touch) {
			iOptions.usePointerLock = false;
		}
		*/
		if (aOpt) {
			if (aOpt.width) { 
				self.sceneOptions.size.width = aOpt.width;
			}
			if (aOpt.height) {
				self.sceneOptions.size.height = aOpt.height;
			}
			if (aOpt.useControls) {
				iOptions.useControls = aOpt.useControls;
			}
		}
	}

	function initScene() {

		window.addEventListener( 'resize', onWindowResize, false );

		container = document.getElementById( self.attrs.cont3d.id );

		self.scene = new THREE.Scene();
		//self.scene.fog = new THREE.Fog( 0xAAAAAA, 100, 1000 );
		
		//self.sceneObjects = new THREE.Object3D();
		//self.scene.add( self.sceneObjects );
		
		self.camera = new THREE.PerspectiveCamera( 45, self.sceneOptions.size.width / self.sceneOptions.size.height, 0.5, 6000 );
	
		self.cameraCtrl = self.camera;
		
		self.scene.add( new THREE.AmbientLight( 0xAAAAAA ) );

		var light = new THREE.DirectionalLight( 0xFFFFFF, 0.9 );
		//light.castShadow = true;
		light.position.set( -1300, 700, 1240 );

		self.scene.add( light );

		light = new THREE.DirectionalLight( 0xFFFFFF, 0.7 );
		//light.castShadow = true;
		light.position.set( 1000, -500, -1200 );

		self.scene.add( light );
	
		self.renderer = new THREE.WebGLRenderer({  } );
		self.renderer.setPixelRatio( window.devicePixelRatio );
		self.renderer.setSize( self.sceneOptions.size.width, self.sceneOptions.size.height );
		self.renderer.setClearColor( 0xAAAAAA, 1);
	
		self.renderer.shadowMap.enabled = true;
		container.appendChild( self.renderer.domElement );
				
		initControls();
		/*
		iVR = new GLWorld.VR({
			world: self
		});
		*/
		iSkybox = new GLWorld.Skybox ({
			size: iOptions.cubeSize,
			scene: self.scene
		});
		
		iTerrain = new GLWorld.Terrain({
			world: self
		});
		
		/*
		//if (Browser.touch) {
			self.positioning = new ThreeD.Positioning({
				world: self
			});
			self.positioning.createIcon();
		//}
		*/
	}
	/*
	this.addEventListener = function (aEvt, aCallback) {
		if (!iListeners[aEvt]) {
			iListeners[aEvt] = new ThreeD.Listener();
		}
		iListeners[aEvt].addListener(aCallback);
	};
	
	this.cameraRotated = function () {
		self.mouse.enabled = false;
		if (iListeners.onrotate) {
			iListeners.onrotate.notifyListeners();			
		}
		if (self.map) {
			self.map.hs.rotateViewDir( self.cameraCtrl.rotation.y );
		}
	};
	
	this.vrStatusChange = function (aOn) {
		if (self.main) {
			self.main.vrStatusChange(aOn);
		}
		if (self.map) {
			self.map.setMapVisibility(!aOn);			
		}
	};
	
	this.setAllowControls = function (aAllow) {
		if (iOptions.useControls) {
			if (iOptions.usePointerLock) {
				var instructions = document.getElementById( self.attrs.instruct.contId );
				if (aAllow) {				
					instructions.style.display = '';
				}
				else {
					instructions.style.display = 'none';
				}
			}
			else {
				iOptions.allowControls = aAllow;
			}
		}
	};
	*/
	function initPointerLockControls () {
		
		var movecallback = null;
		/*
		if (iOptions.useMap) {
			movecallback = self.cameraRotated;
		}
		*/
		self.controls = new THREE.PointerLockControls( self.camera, movecallback, Browser.touch );
		
		self.cameraCtrl = self.controls.getObject();
		
		self.scene.add( self.cameraCtrl );
		/*		
		if (iOptions.usePointerLock) {	
		
			var instructions = document.getElementById( self.attrs.instruct.contId );
			instructions.style.display = '';
			
			var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
			if ( havePointerLock ) {				
				
				var element = document.body;
				var pointerlockchange = function ( event ) {
	
					if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
	
						self.controls.enabled = true;
						
						instructions.style.display = 'none';
	
					} else {
						self.controls.enabled = false;
						
						instructions.style.display = '';
					}
				};
	
				var pointerlockerror = function ( event ) {
	
					instructions.style.display = '';
				};				
				
				// Hook pointer lock state change events
				document.addEventListener( 'pointerlockchange', pointerlockchange, false );
				document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
				document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
	
				document.addEventListener( 'pointerlockerror', pointerlockerror, false );
				document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
				document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
				
				instructions.addEventListener( 'click', function ( event ) {
	
					instructions.style.display = 'none';
	
					// Ask the browser to lock the pointer
					element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
	
					if ( /Firefox/i.test( navigator.userAgent ) ) {
	
						var fullscreenchange = function ( event ) {
	
							if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
	
								document.removeEventListener( 'fullscreenchange', fullscreenchange );
								document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
	
								element.requestPointerLock();
							}
	
						};
	
						document.addEventListener( 'fullscreenchange', fullscreenchange, false );
						document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
	
						element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
	
						element.requestFullscreen();
	
					} else {
	
						element.requestPointerLock();
	
					}
	
				}, false );			
			}
			else {
				document.getElementById( 'instructions_msg' ).innerHTML = "This browser does not support Pointer Lock API which is used for looking around with mouse.<br/><br/>You can also try Oculus or Cardboard modes by click the icons in the upper right corner.";
			}
		}
		else {
		*/
			self.controls.speed = 0.004;			
			
			var enableControls = function (evt) {
				evt.preventDefault();
				//if (iOptions.allowControls) {
					self.controls.enabled = true;
				//}
				return false;
			};
			
			var disableControls = function (evt) {
				evt.preventDefault();
				self.controls.enabled = false;
				//self.mouse.enabled = true;				
				self.controls.prevEvent = null;		
				return false;
			};
			
			var cont3d = document.getElementById(self.attrs.cont3d.id);			
			
			if (!Browser.touch) {			
				cont3d.addEventListener( 'mousedown', enableControls, false );				
				cont3d.addEventListener( 'mouseup', disableControls, false );				
				cont3d.addEventListener( 'mouseout', disableControls, false );
			}
			else {
				cont3d.addEventListener( 'touchstart', enableControls, false );				
				cont3d.addEventListener( 'touchend', disableControls, false );
				cont3d.addEventListener( 'touchcancel', disableControls, false );
			}			
			
			$("#" + self.attrs.instruct.noPLId).show();
			
			setTimeout(function () {
				$("#" + self.attrs.instruct.noPLId).fadeOut("slow");				
			}, 5000);
			
		//}
	}
	
	function initControls () {
		
		if (iOptions.useControls) {			
			initPointerLockControls();	
		}
			
		var onKeyDown = function ( event ) {
			
			switch ( event.keyCode ) {

				case 38: // up
				case 87: // w
					moveForward = true; break;

				case 37: // left
				case 65: // a
					moveLeft = true; break;

				case 40: // down
				case 83: // s
					moveBackward = true; break;

				case 39: // right
				case 68: // d
					moveRight = true; break;
				
				case 32: // space
					if (event.target == document.body) {
						event.preventDefault();
					}
					if ( canJump === true ) {
						velocity.y += 55;
					}
					canJump = false;
					break;
					
				case 49: //1
					changePlayerHeight(-self.player.offsStep);
					canJump = false;
					break;
				case 50: //2
					changePlayerHeight(self.player.offsStep);
					canJump = false;
					break;
			}

		};

		var onKeyUp = function ( event ) {

			switch( event.keyCode ) {

				case 38: // up
				case 87: // w
					moveForward = false; break;

				case 37: // left
				case 65: // a
					moveLeft = false; break;

				case 40: // down
				case 83: // s
					moveBackward = false; break;

				case 39: // right
				case 68: // d
					moveRight = false; break;
			}

		};

		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );
		
		initRaycasters();
	}
	
	function initRaycasters () {
		iRays.down = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, -1, 0 ), 0, self.player.height + iRays.stepDown );
		
		/*
		var rayDist = 2;
		
		iRays.front = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, rayDist );
		iRays.back = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, rayDist );
		iRays.left = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, rayDist );
		iRays.right = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, rayDist );
		*/
	}
	/*
	function changePlayerHeight (aOffs) {
		if (iTerrain.onTerrain && !ThreeD.Tools.isActiveInput()) {			
			var newHgt = self.player.height + aOffs;
			if ((newHgt >= self.player.minHgt) && (newHgt <= self.player.maxHgt)) {				
				self.player.height = newHgt;				
				iRays.down.far = self.player.height + iRays.stepDown;
			}
		}
	}	
	*/
	function onWindowResize() {
		var width = window.innerWidth;
		var height = window.innerHeight;
		
		self.camera.aspect = width / height;
		self.camera.updateProjectionMatrix();
		
		/*
		if (iVR.vr.on) {
			iVR.setSize( width, height );
		}
		else {
		*/
			self.renderer.setSize( width, height );
		//}
				
		self.sceneOptions.size.width = width;
		self.sceneOptions.size.height = height;
	}
	
	function animate() {

		requestAnimationFrame( animate );

		render();
		
	}

	function render() {
		/*
		updateControls();
		
		//THREE.AnimationHandler.update( clock.getDelta() );
		
		if (iVR.vr.on) {
			iVR.update();
			iVR.render();
		}
		else {
		*/
			self.renderer.render( self.scene, self.camera );
		//}
		
	}	
	
	/*
	this.intersectTerrain = function (aRay) {
		var intersect = null;	
		if (iTerrain.onTerrain) {
				
			var intersects = aRay.intersectObjects( iTerrain.terrObj.children );
			if (intersects.length > 0) {
				intersect = intersects[0];
			}
		}
		return intersect;
	};
	
	function intersectSceneObjects (aRay) {
		return aRay.intersectObjects( self.sceneObjects.children, true );
	}
	
	function setRayPosAndDir (aRay, aPosVec, aDirVals) {
		aRay.ray.origin.copy( aPosVec );
		aRay.ray.direction.set( aDirVals.x, aDirVals.y, aDirVals.z );
	}
		
	function updateControls () {
		
		//if (self.controls) {
			var cObj = self.cameraCtrl;//self.controls.getObject();
			
			//var isOnObject = false;
	
			var time = Date.now();
			var delta = ( time - prevTime ) / 1000;
			
			if (delta > 0.5) {
				delta = 0;
			} 
	
			velocity.x -= velocity.x * 10.0 * delta;
			velocity.z -= velocity.z * 10.0 * delta;			
			
			var xzSpeed = 50.0;			
			var moved = false;
	
			if ( moveForward ) {				
				setRayPosAndDir(iRays.front, cObj.position, {x: -Math.sin(cObj.rotation.y), y: 0, z: -Math.cos(cObj.rotation.y)});
				if (intersectSceneObjects(iRays.front).length === 0) {
					velocity.z -= xzSpeed * delta;
					moved = true;
				}
			}
			if ( moveBackward ) {
				setRayPosAndDir(iRays.back, cObj.position, {x: Math.sin(cObj.rotation.y), y: 0, z: Math.cos(cObj.rotation.y)});
				if (intersectSceneObjects(iRays.back).length === 0) {
					velocity.z += xzSpeed * delta;
					moved = true;
				}
			}
	
			if ( moveLeft ) {
				setRayPosAndDir(iRays.left, cObj.position, {x: Math.cos(cObj.rotation.y), y: 0, z: Math.sin(cObj.rotation.y)});
				if (intersectSceneObjects(iRays.left).length === 0) {
					velocity.x -= xzSpeed * delta;
					moved = true;
				}
			}
			if ( moveRight ) {
				setRayPosAndDir(iRays.right, cObj.position, {x: -Math.cos(cObj.rotation.y), y: 0, z: -Math.sin(cObj.rotation.y)});
				if (intersectSceneObjects(iRays.right).length === 0) {
					velocity.x += xzSpeed * delta;
					moved = true;
				}
			}
			
			
			
			if (moved) {
				cObj.translateX( velocity.x * delta );
				
				cObj.translateZ( velocity.z * delta );
				
				if (iListeners.onmove) {
					iListeners.onmove.notifyListeners();			
				}
				
				if (self.map) {
					self.map.hs.onPlayerMove(iUserSettings.personId, cObj.position.x, cObj.position.z);
				}				
			}
				
			if (iTerrain.onTerrain) {
				if (moved || !canJump) {					
					if (delta < 0.2) {
						velocity.y -= 9.8 * 30.0 * delta; // 70.0 = mass
						
						cObj.translateY( velocity.y * delta );
					}
					
					iRays.down.ray.origin.copy( cObj.position );		
					var intersects = iRays.down.intersectObjects( iTerrain.terrObj.children );
					
					if (intersects.length > 0) {
						
						var dist = intersects[0].distance;
						
						if (dist <= self.player.height) {
							velocity.y = 0;
							cObj.translateY( self.player.height - dist );
							canJump = true;	
						}
					}
					else {					
						velocity.y = 30;					
						cObj.translateY( velocity.y * delta );
						
						//canJump = true;
					}
				}
			}
			
			//console.log(delta);
			
			//infoDiv2.innerHTML = cObj.position.x + "</br>" + cObj.position.y + "</br>" + cObj.position.z;

			
			prevTime = time;
		//}
	}
	
	*/
		
	this.calcOffs = function (aX, aY) {
		var xy = {x : '', y : ''};
		if (aX !== '') {
			xy.x = (Number(aX) - self.center.x) * self.center.mFac.x;
		}
		if (aY !== '') {
			xy.y = (self.center.y - Number(aY)) * self.center.mFac.y;
		}
		return xy;
	}
	
	this.calcCoords = function (aX, aY) {
		var x = self.center.x + (Number(aX) / self.center.mFac.x);
		var y = self.center.y - (Number(aY) / self.center.mFac.y);
		return {x : x, y : y};
	}
	/*
	function setSrid (aSrid) {
		if (aSrid !== null) {
			aSrid = aSrid + "";
		}
		if (self.center.srid !== aSrid) {
			self.center.srid = aSrid;
			//MultiplayerTools.getClients();
		}
	}
	*/
	function setCenter (aValues) {		
		self.center.lat = aValues.lat;
		self.center.lon = aValues.lon;
		
		var xy = GLWorld.Coord.WGS84ToMerc({x: self.center.lon, y: self.center.lat});
		
		self.center.x = xy.x;
		self.center.y = xy.y;
		
		var mFacXY = getMFac(self.center.x, self.center.y, null);
		self.center.mFac.x = mFacXY.x;
		self.center.mFac.y = mFacXY.y;
				
		console.log(self.center);
	}
	
	function getMFac (aX, aY, aSrid) {
		if (!iProjUnit) {
			iProjUnit = new ProjUnit();
		}
		iProjUnit.setCoords(aX, aY, aSrid);
		return iProjUnit.getProjUnitXY();
	}
	
	this.setCameraPosition = function (aCoord) {
		var offs = null;
		if (aCoord.offs) {
			offs = aCoord.offs;
		}
		else {
			offs = self.calcOffs(aCoord.x, aCoord.y);
		}
				
		var cX = offs.x;
		var cZ = offs.y;
		
		self.cameraCtrl.position.x = cX;	
		self.cameraCtrl.position.z = cZ;
		
		var cY = aCoord.elev;
		if (cY || (cY === 0)) {
			cY += self.player.height;
			self.cameraCtrl.position.y = cY;
		}
		
		var rY = aCoord.ry;
		if (rY || (rY === 0)) {
			self.cameraCtrl.rotation.y = rY;
		}
	};
	/*
	this.getAreaCoords = function () {
		var coords = null;
		if (iAreaXml) {
			coords = iXmlTools.getChildNodeValue(iAreaXml.getElementsByTagName("AREA3D_ITEM").item(0), "COORD");
		}
		return coords;
	};
	*/
	function initStartEnv () {
		var path = "media/img/skybox/";
		var urls = [path + "px.jpg", path + "nx.jpg",
					path + "py.jpg", path + "ny.jpg",
					path + "pz.jpg", path + "nz.jpg" ];
		iSkybox.addSkybox(urls);
		
		iTerrain.setTerrain({
			initPlain: true
		});		
		//iTerrain.onTerrain = true;
		
		setCenter({
			lat: 37.811158,
			lon: -122.477316
		})
				
		self.setCameraPosition({
			offs: {x: 0, y: 0},
			elev: 0,
			ry: 0
		});
	}
	/*
	this.loadArea = function (aAreaId, aSrid) {		
		
		iAreaXml = null;
		
		iObjects3D.remove();
		
		setSrid(aSrid);
		
		
		var url = "/lifepilotjs/Playground?action=get_area3d&language=10&area3d_id=" + aAreaId + "&srid=" + self.center.srid;
		var xmlHttp = new LP_XMLHTTP();
		xmlHttp.getUrl(url, onAreaBack, "xml");
	};
	
	function onAreaBack (aXmlDoc) {
		iAreaXml = aXmlDoc;
		
		setCenter(null, null);
						
		var startPos = getStartPos();
		
		self.setCameraPosition({
			offs: {x: startPos.x, y: startPos.y},						
			elev: 0,
			ry: startPos.ry
		});
		
		setTimeout(function () {
			iObjects3D.load(iAreaXml);
		}, 2000);
		
		iTerrain.setTerrain({
			areaCoords: self.getAreaCoords()
		});
		
		if (self.map) {
			self.map.hs.initPlayers(self.center.srid, self.cameraCtrl.position);
		}
		
		if (self.positioning) {
			self.positioning.positionOn(false);
		}
	}
	
	function getStartPos () {
		var x = 0;
		var y = 0;
		//var setElev = iAttrs.terrElev;
		//var savedElev = iAttrs.defElev;
		var yaw = 0;
		
		if (iAreaXml) {
			var startItems = iAreaXml.getElementsByTagName("START_POS_ITEM");
			var i = 0;
			var lng = startItems.length;
			for (i = 0; i < lng; i++) {
				var startItem = startItems.item(i);
				var shName = iXmlTools.getChildNodeValue(startItem, "POSITION_SH_NAME");
				if (shName === "3dw_pos1") {
					var coord = parseCoordAndCalc(startItem);
					if (coord) {
						x = coord[0];
						y = coord[1];
						coord = null;
					}
					var dir = iXmlTools.getChildNodeValue(startItem, "DIRECTION");
					if (dir) {
						yaw = -ThreeD.Tools.deg2rad(dir);
					}
					
					break;
				}
			}
		}
		
		//placeUnityCamera(lX, lY, setElev, yaw);
		
		//return Number(savedElev);
		
		return {x: x, y: y, ry: yaw};
	}
	
	function parseCoordAndCalc (aNode) {
		var cArr = null;
		var coord = iXmlTools.getChildNodeValue(aNode, "COORD");
		if (coord) {
			var cToks = coord.split(",");
			var offs = calcOffs(Number(cToks[0].substring(1)), Number(cToks[1]) * -1);
			cArr = [offs.x, offs.y];
		}		
		return cArr;
	}
	*/
	function init (aOpt) {
		initOptions(aOpt);
		initScene();
		animate();
		
		initStartEnv();
	}
	
	init(aOpt);
};

GLWorld.Skybox = function (aOpt) {
	var opt = null;
	var iSky = null;
	
	this.addSkybox = function (aUrls) {
		removeSkybox();
			
		var textureCube = new THREE.CubeTextureLoader( );

		var shader = THREE.ShaderLib.cube;
		shader.uniforms.tCube.value = textureCube.load( aUrls );

		var skyMaterial = new THREE.ShaderMaterial( {
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: shader.uniforms,
			depthWrite: false,
			side: THREE.BackSide
		} );
		
		iSky = new THREE.Mesh( new THREE.BoxGeometry( opt.size.x, opt.size.y, opt.size.z ), skyMaterial );
		opt.scene.add( iSky );
	};
		
	function removeSkybox () {
		if (iSky) {
			opt.scene.remove(iSky);
			iSky = null;
		}
	}
	
	function init (aOpt) {
		opt = aOpt;
	}	
	
	init(aOpt);
};
/*
ThreeD.Positioning = function (aOpt) {
	var iWorld = null;
	var iImg = {
		id: "gps_img",
		on: {
			src: ThreeD.Paths.path3d + "img/gps_64.png"
		},
		off: {
			src: ThreeD.Paths.path3d + "img/no_gps_64.png"
		}
	};
	var iStatus = {
		active: false,
		watchID: null
	};
	
	function initOptions (aOpt) {
		if (aOpt) {
			if (aOpt.world) { 
				iWorld = aOpt.world;
			}
		}
	}
	
	this.createIcon = function () {
		if (!document.getElementById(iImg.id)) {
			var src = "";
			if (iStatus.active) {
				src = iImg.on.src;
			}
			else {
				src = iImg.off.src;
			}
			
			var img = document.createElement("img");		
			img.src = src;
			img.id = iImg.id;
			img.title = "Positioning";
			img.style.cssText = "cursor:pointer;position:absolute;top:5px;left:" + (iWorld.sceneOptions.size.width - 140) + "px";
			img.onclick = togglePositioning;
		
			document.body.appendChild(img);
		}
	};
	
	this.removeIcon = function () {
		
		
	};
	
	this.positionOn = function (aTurnOn) {
		if ((aTurnOn && !iStatus.active) || (!aTurnOn && iStatus.active)) {
			togglePositioning();
		}
	};
	
	function togglePositioning () {
		var img = document.getElementById(iImg.id);
		if (!iStatus.active) {
			if ("geolocation" in navigator) {
				
				if (img) {
					img.src = iImg.on.src;
				}
				
				iStatus.active = true;				
				
				iStatus.watchID = navigator.geolocation.watchPosition(function (position) {
					var wgs84 = {x: position.coords.longitude, y: position.coords.latitude};
					var coords = null;
					
					if (iWorld.center.srid === ThreeD.Coord.srid.utm) {						
						coords = ThreeD.Coord.WGS84ToUTM(wgs84);
					}
					else {
						coords = ThreeD.Coord.WGS84ToMerc(wgs84);
					}
					
					var minMax = ThreeD.Coord.findMinMax(iWorld.getAreaCoords());
										
					if ((coords.x > minMax.minX) && (coords.x < minMax.maxX) && (coords.y > minMax.minY) && (coords.y < minMax.maxY)) {
						iWorld.setCameraPosition(coords);
						if (iWorld.map) {
							iWorld.map.hs.onPlayerMove(iUserSettings.personId, iWorld.cameraCtrl.position.x, iWorld.cameraCtrl.position.z);
						}
					}
					else {
						ThreeD.Tools.showUITooltip(iWorld.attrs.cont3d.id, iWorld.main.strings.getString("pos_out"), 5000, {my: "center center", at: "center center"});
						togglePositioning();
					}					
				},
				function (error) {
					ThreeD.Tools.showUITooltip(iWorld.attrs.cont3d.id, iWorld.main.strings.getString("loc_unavailable"), 5000, {my: "center center", at: "center center"});
					console.log(error);
					
					togglePositioning();
				},
				{
					enableHighAccuracy: true
					//maximumAge: 30000, 
					//timeout: 27000
				});
			}
		}
		else {
			navigator.geolocation.clearWatch(iStatus.watchID);
			
			if (img) {
				img.src = iImg.off.src;
			}
			
			iStatus.active = false;
		}
	}	
	
	function init (aOpt) {
		initOptions(aOpt);		
	}	
	
	init(aOpt);
	
};
*/