/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera, movecallback, touchDevice ) {

	var scope = this;

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var PI_2 = Math.PI / 2;
	
	this.prevEvent = null;
	this.speed = 0.002;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		
		if ((movementX === 0) && (movementY === 0)) {
			var x = 0;
			var y = 0;
			
			if (event.pageX) {
				x = event.pageX;
				y = event.pageY;
			}
			else if (event.touches) {
				x = event.touches[0].pageX;
				y = event.touches[0].pageY;
			}
			else if (event.screenX) {
				x = event.screenX;
				y = event.screenY;
			}
			
			if (scope.prevEvent) {					
				movementX = x - scope.prevEvent.x;
				movementY = y - scope.prevEvent.y;
			}
			else {
				scope.prevEvent = {x: 0, y: 0};
			}
			
			scope.prevEvent.x = x;
			scope.prevEvent.y = y;
		}
		
		yawObject.rotation.y -= movementX * scope.speed;
		pitchObject.rotation.x -= movementY * scope.speed;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
		
		if (movecallback) {
			movecallback();
		}

	};

	this.dispose = function() {		
		if (!touchDevice) {
			document.removeEventListener( 'mousemove', onMouseMove, false );
		}
		else {	
			document.removeEventListener( 'touchmove', onMouseMove, false );
		}
	};
	
	if (!touchDevice) {
		document.addEventListener( 'mousemove', onMouseMove, false );
	}
	else {
		document.addEventListener( 'touchmove', onMouseMove, false );
	}	

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		}

	}();

};
