
GLWorld.VR = function (aOpt) {
	var self = this;
	var iWorld = null;
	this.vr = {on: null, effect: null};
	//this.oculus = {type: 1, img: { imgId: "oculus_img", src: ThreeD.Paths.path3d + "img/oculus_64.png", srcAct: ThreeD.Paths.path3d + "img/oculus_active_64.png"}};
	this.cb = {
		type: 2,
		img: { imgId: "cb_img", src: "../dev/media/img/cardboard_64.png", srcAct: "../dev/media/img/cardboard_active_64.png"},
		controls: null,
		//iOSSleepPreventInt: null
	};
	//var iFPControls = null;
	var clock = new THREE.Clock();
	//var oculuscontrol = null;
	
	function initOptions (aOpt) {
		if (aOpt) {
			if (aOpt.world) { 
				iWorld = aOpt.world;
			}
		}
	}
	
	function createBtn () {	
		/*
		var img = document.createElement("img");
		img.src = self.oculus.img.src;
		img.id = self.oculus.img.imgId;
		img.title = "Oculus";
		img.style.cssText = "cursor:pointer;position:absolute;top:5px;left:" + (iWorld.sceneOptions.size.width - 69) + "px";
		img.onclick = turnOculusOnOff;
	
		document.body.appendChild(img);
		*/
		var imgCB = document.createElement("img");
		imgCB.src = self.cb.img.src;
		imgCB.id = self.cb.img.imgId;
		imgCB.title = "Cardboard";
		imgCB.style.cssText = "cursor:pointer;position:absolute;top:74px;left:" + (iWorld.sceneOptions.size.width - 69) + "px";
		imgCB.onclick = turnCBOnOff;
	
		document.body.appendChild(imgCB);
	}
	
	function vrOn (aType) {
		self.vr.on = aType;
		
		//iWorld.vrStatusChange(true);
		/*
		var wp = window.parent;
		if (wp) {
			var frame = wp.document.getElementById("frame_PM_3d");
			if (frame) {
				wp.document.body.scrollTop = wp.document.body.scrollTop + frame.getBoundingClientRect().top;
			}
		}
		*/
	}
		
	function vrOff () {
		self.vr.on = null;
		
		//iWorld.vrStatusChange(false);
				
		resetWorld();
	}
	
	function turnCBOnOff () {
		//var imgOc = document.getElementById(self.oculus.img.imgId);
		var imgCB = document.getElementById(self.cb.img.imgId);
		
		if (!self.vr.on) {
			imgCB.src = self.cb.img.srcAct;
			//imgOc.style.display = "none";
						
			self.vr.effect = new THREE.StereoEffect( iWorld.renderer );
			
			self.vr.effect.setSize( iWorld.sceneOptions.size.width, iWorld.sceneOptions.size.height );
			/* jshint ignore:start */
			function setOrientationControls (e) {
				if (!e.alpha) {
					return;
				}
							
				self.cb.controls = new THREE.DeviceOrientationControls(iWorld.cameraCtrl, true);
				self.cb.controls.connect();
				self.cb.controls.update();	
				
				window.removeEventListener('deviceorientation', setOrientationControls, true);
			}
			window.addEventListener('deviceorientation', setOrientationControls, true);
			/* jshint ignore:end */
			/*
			if (Browser.touch) {
				self.cb.iOSSleepPreventInt = setInterval(function () {
				    window.location.href = "/new/page";
				    setTimeout(function () {
				        window.stop();
				    }, 0);
				}, 20000);
			}			
			*/
			if (Browser.touch) {
				iWorld.setAllowControls(false);
			}
						
			vrOn(self.cb.type);
		}
		else {
			vrOff();
			
			if (Browser.touch) {
				iWorld.setAllowControls(true);
			}
			
			//clearInterval(self.cb.iOSSleepPreventInt);			
			
			imgCB.src = self.cb.img.src;
			//imgOc.style.display = "inline";
			
			self.cb.controls = null;
			
			self.vr.effect = null;
		}
	}
	/*
	function turnOculusOnOff () {
		var imgOc = document.getElementById(self.oculus.img.imgId);
		var imgCB = document.getElementById(self.cb.img.imgId);
		
		if (!self.vr.on) {
			imgOc.src = self.oculus.img.srcAct;
			imgCB.style.display = "none";
				
			self.vr.effect = new THREE.OculusRiftEffect( iWorld.renderer, { worldFactor: 1, HMDVers: "DK1" } );
			//effect = new THREE.VREffect( renderer);			
			self.vr.effect.setSize( iWorld.sceneOptions.size.width, iWorld.sceneOptions.size.height );
			
			if (!oculuscontrol) {
				var url = 'http://localhost:50000';
				$.ajax({
					  url: url,
					  success: function () {			  
						  oculuscontrol = new THREE.OculusControls(iWorld.cameraCtrl);
						  oculuscontrol.connect();
						
						  iFPControls = new THREE.FirstPersonControls( iWorld.cameraCtrl, iWorld.renderer.domElement );
						  iFPControls.lookSpeed = 0.00125;
						  iFPControls.lookVertical = true;
						
						  iWorld.setAllowControls(false);					  
					  },
					  error: function () {					  
						  console.log("'" + url + "' is not available.");
					  }
				});
			}
			else {
				oculuscontrol.enabled = true;
				iFPControls.enabled = true;
				
				iWorld.setAllowControls(false);
			}
			
			vrOn(self.oculus.type);			
			
		}
		else {
			vrOff();
			
			imgOc.src = self.oculus.img.src;
			imgCB.style.display = "inline";
			
			if (oculuscontrol) {
				oculuscontrol.enabled = false;			
				iFPControls.enabled = false;
				
				iWorld.setAllowControls(true);
			}
			
			self.vr.effect.dispose();			
			self.vr.effect = null;
			
			//fullScreenMode(false, element);
		}
	}
	*/
	function resetWorld () {
		iWorld.renderer.setSize( iWorld.sceneOptions.size.width, iWorld.sceneOptions.size.height );		

		iWorld.cameraCtrl.rotation.x = 0;
		iWorld.cameraCtrl.rotation.z = 0;		
	}
	
	this.update = function () {
		/*if (self.vr.on === self.oculus.type) {
			if (oculuscontrol) {
				var t = clock.getElapsedTime();
				
				iFPControls.update(t);
		        oculuscontrol.update(t);
			}
		}
		else */if (self.vr.on === self.cb.type) {
			if (self.cb.controls) {
				self.cb.controls.update(clock.getDelta());
			}
		}		
	};
	
	this.render = function () {
		/*
		if (self.vr.on === self.oculus.type) {
			self.vr.effect.render( iWorld.scene,  iWorld.cameraCtrl );
		}
		else */if (self.vr.on === self.cb.type) {
			self.vr.effect.render( iWorld.scene,  iWorld.camera );
		}		
		
	};
	
	this.setSize = function (aWidth, aHeight) {
		self.vr.effect.setSize( aWidth, aHeight );
	};
	
	function init (aOpt) {
		initOptions(aOpt);
		
		createBtn();
	}	
	
	init(aOpt);
};