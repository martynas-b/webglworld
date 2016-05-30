
GLWorld.Terrain = function (aOpt) {
	var self = this;
	var iWorld = null;
	this.terrObj = null;
	this.onTerrain = false;
	
	var iKMSTerr = {DTM10: {sn: "DTM", cs: 10}, DSM8: {sn: "DSM", cs: 8}, DSM3p2: {sn: "DSM", cs: 3.2}};
	var iSizes = {terr: {mercTerrGrid: 31, kmsCellSize: 10, kmsTerrGrid: 64}, map: {meters: 640, min: 420, initMapZoom: 17, kmsMax: 1320}, tiles: {min: 1, max: 5, def: 2}};	
	var iTerrAttrs = {size: null, mapCoords: null, maxMercPx: 640, /*currInx : -1,*/ step : 5, range : 10, currType : null, mapId: null, b3dBox: null, extraTiles: 1, kmsShortName: null, areaCoords: null};
	var iType = {terr: 0, map: 1};
	var iMercZooms = [{id: 19, m_px: 0.2986}, {id: 18, m_px: 0.5972}, {id: 17, m_px: 1.1943}, {id: 16, m_px: 2.3887}, {id: 15, m_px: 4.7773}];
	
	function initOptions (aOpt) {
		if (aOpt) {
			if (aOpt.world) { 
				iWorld = aOpt.world;
			}
		}
	}
		
	this.setTerrain = function (aOpt) {
		if (!self.terrObj) {
			self.terrObj = new THREE.Object3D();
			iWorld.scene.add( self.terrObj );
		}
		else {
			removeTerrain();
		}
				
		if (aOpt) {
			if (aOpt.initPlain) {
				initPlain();
			}
			else if (aOpt.areaCoords) {
				iTerrAttrs.areaCoords = aOpt.areaCoords;
				
				var kmsTerr = null;
				if (iWorld.center.srid !== ThreeD.Coord.srid.merc) {
					kmsTerr = iKMSTerr.DTM10;
				}
				createTerrain(iType.terr, kmsTerr);
			}			
		}
	};
	
	function formMapUrl (aType) {
		var mapUrl = "";
		
		if (iWorld.center.srid === ThreeD.Coord.srid.merc) {
			var mapType = "";		
			if (aType === iType.terr) {
				mapType = "satellite";
			}
			else {				
				switch (iTerrAttrs.mapId) {
					case "1210": mapType = "roadmap"; break;
					case "1211": mapType = "satellite"; break;
					default: mapType = "hybrid";
				}				
			}
			
			mapUrl = "http://maps.googleapis.com/maps/api/staticmap?scale=2&format=jpg-baseline&maptype=" + mapType + "&key=AIzaSyAk6N0fOjsoi-vgr2uHfNrWstewZyt4osM";
			//mapUrl = "http://dev.virtualearth.net/REST/v1/Imagery/Map/AerialWithLabels/insert_center_coords/insert_zoom?format=jpeg&key=Asl2wCXHHyEj-S9fK8nHf7k08R9fbMoQga7q46gsEVnXs9kXlHdgCweSRz3FG1Zr";
		}
		else {		
			var servicename = "";
			var layers = "";		
			if (aType === iType.terr) {
				servicename = "orto_foraar";
				layers = "orto_foraar";
			}
			else {
				switch (iTerrAttrs.mapId) {
					case "430": servicename = "orto_foraar"; layers = "orto_foraar"; break;
					default: servicename = "topo_skaermkort"; layers = "dtk_skaermkort";
				}
			}
			
			var imgWdt = iSizes.map.kmsMax;
			mapUrl = 'http://kortforsyningen.kms.dk/service?login=euman&password=psalewc23&servicename=' + servicename + '&service=WMS&version=1.1.1&request=GetMap&styles=&exceptions=application/vnd.ogc.se_inimage&layers=' + layers + '&format=image/jpeg&width=' + imgWdt + '&height=' + imgWdt + '&SRS=EPSG:25832';
		}
				
		return mapUrl;
	}
	/*
	this.calcAreaWidthFromTerr = function (aX, aY, aSrid, aCnt) {
		return calcAreaWidthFromTerr(aX, aY, aSrid, aCnt);
	};
	
	function calcAreaWidthFromTerr (aX, aY, aSrid, aCnt) {		
		var cnt = aCnt;
		if (!cnt) {
			cnt = iSizes.tiles.def;
		}
		var mFac = getMFac(aX, aY, aSrid);
		var meters = findTileMetersInPlace(aX, aY, aSrid, mFac) * cnt;
		
		return calcXYSizeInCoords(meters, meters, aSrid, mFac);
	}
	*/
	function calcXYSizeInCoords (aXSize, aYSize, aSrid, aMFac) {
		var xSize = aXSize;
		var ySize = aYSize;
		if (aSrid === ThreeD.Coord.srid.merc) {			
			xSize = Math.round(xSize / aMFac.x);
			ySize = Math.round(ySize / aMFac.y);
		}
		return {xSize : xSize, ySize : ySize};	
	}
	
	function calcXYSizeInMeters (aXSize, aYSize, aSrid, aMFac) {
		var xSize = aXSize;
		var ySize = aYSize;
		if (aSrid === ThreeD.Coord.srid.merc) {			
			xSize = Math.round(xSize * aMFac.x);
			ySize = Math.round(ySize * aMFac.y);
		}		
		return {xSize : xSize, ySize : ySize};	
	}
	
	function findTileMetersInPlace (aX, aY, aSrid, aMFac) {
		var meters = 0;
				
		if (ThreeD.Coord.findSRID(aX, aY, aSrid) === ThreeD.Coord.srid.merc) {
			meters = calcMercTileValues(aMFac, null).meters;					
		}
		else {
			meters = iSizes.terr.kmsCellSize * iSizes.terr.kmsTerrGrid;					
		}
			
		return meters;
	}
	
	function calcMercTileValues (aMFac, aMinMeters) {
		var zi = iArrayTools.findInObjectArray(iMercZooms, "id", iSizes.map.initMapZoom);
		var zoom = iMercZooms[zi].id;
		var m_px = iMercZooms[zi].m_px;
		
		var px_x = 0;
		var px_y = 0;
							
		var metersX = Math.floor(iTerrAttrs.maxMercPx * m_px * aMFac.x);
		var metersY = Math.floor(iTerrAttrs.maxMercPx * m_px * aMFac.y);
		
		var meters = Math.min(metersX, metersY);
		
		var minMeters = iSizes.map.min;
		if (aMinMeters) {
			minMeters = aMinMeters;
		}
		
		if (meters >= minMeters) {
			var pxXYM = calcMercPxXY(meters, m_px, aMFac);
			px_x = pxXYM.px_x;
			px_y = pxXYM.px_y;
		}
		else {
			meters = minMeters;
			
			var zInx = 0;
			var lng = iMercZooms.length;
									
			for (zInx = 0; zInx < lng; zInx++) {
				zoom = iMercZooms[zInx].id;
				m_px = iMercZooms[zInx].m_px;
				
				var pxXY = calcMercPxXY(meters, m_px, aMFac);
				px_x = pxXY.px_x;
				px_y = pxXY.px_y;
								
				if ((px_x <= iTerrAttrs.maxMercPx) && (px_y <= iTerrAttrs.maxMercPx)) {
					break;
				}			
			}
		}
		
		var vals = {zoom: zoom, px_x: px_x, px_y: px_y, meters: meters};
		
		return vals;
	}
	
	function calcMercPxXY (aMeters, aMPx, aMFac) {
		var px_x = Math.round(aMeters / (aMPx * aMFac.x));
		var px_y = Math.round(aMeters / (aMPx * aMFac.y));
		return {px_x: px_x, px_y: px_y};
	}
	/*
	this.calcTilesFromCoords = function (aCoords, aSrid, aMeters, aMFac) {
		return calcTilesFromCoords(aCoords, aSrid, aMeters, aMFac);
	};
	*/
	function calcTilesFromCoords (aCoords, aSrid, aMeters, aMFac) {
		var cnt = iSizes.tiles.def;
		if (aCoords) {
			var minMax = ThreeD.Coord.findMinMax(aCoords);
						
			var sizeCX = minMax.maxX - minMax.minX;
			var sizeCY = minMax.maxY - minMax.minY;
			
			var mFac = aMFac;
			var tileMeters = aMeters;
						
			if (!mFac || !tileMeters) {
				var cx = Math.round((minMax.minX + minMax.maxX) / 2);
				var cy = Math.round((minMax.minY + minMax.maxY) / 2);
			
				mFac = getMFac(cx, cy, aSrid);
				tileMeters = findTileMetersInPlace(cx, cy, aSrid, mFac);
			}
			
			var sizeMXY = calcXYSizeInMeters(sizeCX, sizeCY, aSrid, mFac);			
			
			var sizeM = Math.max(sizeMXY.xSize, sizeMXY.ySize);
			
			cnt = Math.round(sizeM / tileMeters);
			
			if (cnt < iSizes.tiles.min) {
				cnt = iSizes.tiles.min;
			}
			else if (cnt > iSizes.tiles.max) {
				cnt = iSizes.tiles.max;
			}
		}
		return cnt;
	}
	
	function createTerrain (aType, aKMSTerr) {
		//if (!iTerrainArr) {
		if (self.terrObj.children.length === 0) {
			var myXY = iWorld.calcCoords(iWorld.cameraCtrl.position.x, iWorld.cameraCtrl.position.z);
						
			var xy = {x : iWorld.center.x, y : iWorld.center.y};
			
			if ((xy.x !== null) && (xy.y !== null)) {
				iTerrAttrs.currType = aType;
								
				var size = {unity: 0, coords: 0, merc: null};
				
				if (iWorld.center.srid === ThreeD.Coord.srid.merc) {
					var mercVals = calcMercTileValues(iWorld.center.mFac, null);
					size.merc = mercVals;
					size.unity = mercVals.meters;
					size.meters = mercVals.meters;
				}
				else {
					if (aType === iType.terr) {
						iTerrAttrs.kmsShortName = aKMSTerr.sn;						
						iSizes.terr.kmsCellSize = aKMSTerr.cs;
						var kmsMeters = iSizes.terr.kmsCellSize * iSizes.terr.kmsTerrGrid;
						
						//1 unit = 1 meter
						size.unity = kmsMeters;
						size.meters = kmsMeters;
					}
					else {
						//1 unit = 1 meter
						size.unity = iSizes.map.meters;
						size.meters = iSizes.map.meters;
					}
				} 				
				
				iTerrAttrs.size = size;
				
				//iTerrainArr = [];
								
				var cnt = calcTilesFromCoords(iTerrAttrs.areaCoords, iWorld.center.srid, iTerrAttrs.size.meters, iWorld.center.mFac);
												
				cnt += iTerrAttrs.extraTiles;
								
				iTerrAttrs.mapCoords = calcXYSizeInCoords(iTerrAttrs.size.meters, iTerrAttrs.size.meters, iWorld.center.srid, iWorld.center.mFac);				
				
				var segm = 1;
				var offsetStep = {unity: 0, coord: {x: 0, y: 0}};
				if (aType === iType.terr) {
					if (iWorld.center.srid !== ThreeD.Coord.srid.merc) {
						segm = iSizes.terr.kmsTerrGrid;
						/*
						offsetStep.unity = iSizes.terr.kmsCellSize;
						offsetStep.coord.x = iSizes.terr.kmsCellSize;
						offsetStep.coord.y = iSizes.terr.kmsCellSize;
						*/
					}
					else {
						segm = iSizes.terr.mercTerrGrid;
						/*
						offsetStep.unity = iTerrAttrs.size.unity / segm;
						offsetStep.coord.x = iTerrAttrs.mapCoords.xSize / segm;
						offsetStep.coord.y = iTerrAttrs.mapCoords.ySize / segm;	
						*/						
					}
				}
												
				var i = 0;
				var j = 0;
				
				var coordOffsetFromPosX = Math.floor(cnt / 2) * iTerrAttrs.mapCoords.xSize;
				var coordOffsetFromPosY = Math.floor(cnt / 2) * iTerrAttrs.mapCoords.ySize;
				if (cnt % 2 !== 0) {
					coordOffsetFromPosX += iTerrAttrs.mapCoords.xSize / 2;
					coordOffsetFromPosY += iTerrAttrs.mapCoords.ySize / 2;
				}
								
				var coordXStart = 0;
				var coordY = 0;
				
				if ((aType === iType.terr) && (iWorld.center.srid !== ThreeD.Coord.srid.merc)) {
					coordXStart = Math.floor((xy.x - coordOffsetFromPosX) / iSizes.terr.kmsCellSize) * iSizes.terr.kmsCellSize;
					coordY = Math.floor((xy.y - coordOffsetFromPosY) / iSizes.terr.kmsCellSize) * iSizes.terr.kmsCellSize;
				}
				else {
					coordXStart = xy.x - coordOffsetFromPosX;
					coordY = xy.y - coordOffsetFromPosY;
				}				
							
				var offs = iWorld.calcOffs(coordXStart, coordY);
				var xStart = offs.x;
				var y = offs.y;
				/*				
				var edge = iTerrAttrs.range;
				if (iTerrAttrs.extraTiles > 0) {					
					edge = (iTerrAttrs.extraTiles / 2) * iTerrAttrs.size.unity;
				}
				
				var bLX = xStart + edge;
				var bBY = y + edge;
				var bRX = ((xStart + (iTerrAttrs.size.unity * cnt)) - ((cnt - 1) * offsetStep.unity)) - edge;
				var bTY = ((y + (iTerrAttrs.size.unity * cnt)) - ((cnt - 1) * offsetStep.unity)) - edge;				
				
				iTerrAttrs.b3dBox = {lX: bLX, bY: bBY, rX: bRX, tY: bTY};	
				*/			
				
				for (j = 0; j < cnt; j++) {
					var x = xStart;
					var coordX = coordXStart;
					for (i = 0; i < cnt; i++) {
						
						var placeCamera = false;
						if ((myXY.x >= coordX) && (myXY.x <= (coordX + iTerrAttrs.mapCoords.xSize)) && (myXY.y >= coordY) && (myXY.y <= (coordY + iTerrAttrs.mapCoords.ySize))) {
							//iTerrAttrs.currInx = iTerrainArr.length;
							placeCamera = true;
						}
						createTerrainTile(aType, 
										{x: coordX, y: coordY, xSize: iTerrAttrs.mapCoords.xSize, ySize: iTerrAttrs.mapCoords.ySize}, 
										{x: x, y: y, xSize: iTerrAttrs.size.unity, ySize: iTerrAttrs.size.unity, elev: 0}, 
										{placeCamera: placeCamera, /*addToArr: true,*/ img: null, id: null, segm: segm});
						
						x = x + iTerrAttrs.size.unity - offsetStep.unity;
						coordX = coordX + iTerrAttrs.mapCoords.xSize - offsetStep.coord.x;
					}				
					y = y - iTerrAttrs.size.unity + offsetStep.unity;
					coordY = coordY + iTerrAttrs.mapCoords.ySize - offsetStep.coord.y;
				}
			}
		}
	}
	
	function createTerrainTile (aType, aCoords, aUnits, aOpt) {
		var lX = aCoords.x;
		var rX = aCoords.x + aCoords.xSize;
		var tY = aCoords.y + aCoords.ySize;
		var bY = aCoords.y;
		
		var id = "";
		if (aOpt.id) {
			id = aOpt.id;
		}
		else {
			id = 'terr|' + lX + '|' + bY;
		}
		/*
		if (aOpt.addToArr) {
			iTerrainArr.push({id : id});
		}
		*/
		var trUrl = "";//formHost();
		if (aType === iType.map) {
			trUrl += i3DPath + "map_80.asc";
		}
		else {
			trUrl += "/lifepilotjs/Terrain?action=getTerrain";
			if (iWorld.center.srid !== ThreeD.Coord.srid.merc) {
				trUrl += "&startx=" + (Math.round((lX/* + iSizes.terr.kmsCellSize*/) * 10) / 10) + "&starty=" + (Math.round(tY * 10) / 10) + "&lengthx=" + (aCoords.xSize + iSizes.terr.kmsCellSize) + "&lengthy=" + (aCoords.ySize + iSizes.terr.kmsCellSize) + "&shortName=" + iTerrAttrs.kmsShortName + "&cellSize=" + iSizes.terr.kmsCellSize;
			}
			else {
				var grid = iSizes.terr.mercTerrGrid + 1;			
				//var cellSizeX = aCoords.xSize / grid;
				//var cellSizeY = aCoords.ySize / grid;
								
				trUrl += "&srs=" + ThreeD.Coord.epsg.merc + "&bbox=" + (lX/* + cellSizeX*/) + "%2c" + (bY/* + cellSizeY*/) + "%2c" + rX + "%2c" + tY + "&rows=" + grid + "&cols=" + grid;
			}
			trUrl += "&output=json";
		}
		
		var img = aOpt.img;
		if (!img) {
			img = formMapUrl(aType);
		}
				
		var trParams = {id: id, trUrl: trUrl, imgUrl: img, units: aUnits, type: aType, placeCamera: aOpt.placeCamera, segm: aOpt.segm};
				
		if (iWorld.center.srid !== ThreeD.Coord.srid.merc) {			
			if (!aOpt.img) {
				trParams.imgUrl += '&BBOX=' + lX + '%2c' + bY + '%2c' + rX + '%2c' + tY;
			}
			addTerrain(trParams);
		}
		else {
			if (!aOpt.img) {
				var wgs = ThreeD.Coord.mercToWGS84({x: (lX + rX) / 2, y: (bY + tY) / 2});
				trParams.imgUrl = addMercUrlParams(wgs.y, wgs.x, iTerrAttrs.size.merc, trParams.imgUrl);
			}
			addTerrain(trParams);
		}		
	}
	
	function addMercUrlParams (lat, lon, merc, aUrl) {
		var url = aUrl;
		if (url.indexOf("google") !== -1) {
			url += "&center=" + lat + "%2c" + lon + "&zoom=" + merc.zoom + "&size=" + merc.px_x + "x" + merc.px_y;				
		}
		else if (url.indexOf("virtualearth") !== -1) {
			url = url.replace("insert_center_coords", lat + "%2c" + lon);
			url = url.replace("insert_zoom", merc.zoom);
			url += "&mapSize=" + merc.px_x + "%2c" + merc.px_y;
		}
		url += "&.jpg";
		return url;
	}
	
	function addTerrain (aTrParams) {
		var tr = aTrParams;
		//if (tr.placeCamera) {
		$.getJSON( tr.trUrl, function( json ) {
						
			var geometry = new THREE.PlaneBufferGeometry( tr.units.xSize, tr.units.ySize, tr.segm, tr.segm );
			
			var elevations = json.elevations;
			/*
			var newEl = [];
			for (j = 0; j < 32 * 32; j++) {
				if (j % 32 == 0) {
					newEl.push(0);
				}
				newEl.push(elevations[j]);
			}
			for (j = 0; j < 33; j++) {
				newEl.push(0);
			}
			*/
			var vertices = geometry.attributes.position.array;
			var i = 0, lng = vertices.length;
			var tInx = 0;
			for ( i = 0; i < lng; i += 3 ) {
				var h = elevations[tInx];
				vertices[ i + 2 ] = h;
				tInx++;
			}			
			
			var material = new THREE.MeshLambertMaterial({ shading: THREE.SmoothShading });
			//THREE.ImageUtils.crossOrigin = "";/*r71*/
			//var grTx = THREE.ImageUtils.loadTexture( tr.imgUrl );/*r71*/
			var txLoader = new THREE.TextureLoader();/*r73*/
			txLoader.setCrossOrigin(true);
			material.map = txLoader.load(tr.imgUrl);//grTx;/*r71*/
			
			var terrTile = new THREE.Mesh( geometry, material);
			terrTile.receiveShadow = true;
			terrTile.rotation.x = -Math.PI / 2;
			
			terrTile.position.x = tr.units.x + (tr.units.xSize / 2);
			terrTile.position.z = tr.units.y - (tr.units.ySize / 2);
			
			self.terrObj.add( terrTile );
			
			if (tr.placeCamera) {
				self.onTerrain = true;
			}
		});
		//}
	}
	
	/*
	this.removeTerrain = function () {
		removeTerrain();
	};
	*/
	function removeTerrain () {
		GLWorld.Tools.removeChildren(self.terrObj);
		
		iTerrAttrs.currType = null;
		iTerrAttrs.mapId = null;
		iTerrAttrs.b3dBox = null;
		iTerrAttrs.areaCoords = null;
		self.onTerrain = false;		
	}
	
	function initPlain () {
		var plainGeo = new THREE.PlaneBufferGeometry( 5000, 5000, 1, 1 );
		var plainMat = new THREE.MeshLambertMaterial({ color: 0x165B31 });
		var plainTile = new THREE.Mesh( plainGeo, plainMat );
		plainTile.rotation.x = -Math.PI / 2;
		plainTile.position.y = -0.1;
		self.terrObj.add( plainTile );		
	}
		
	/*
	this.setTerrain = function () {			
		var size = 640;//603;
		var segm = 64;//32;
		
		//example elev url: http://dev.virtualearth.net/REST/v1/Elevation/Bounds?output=json&key=Asl2wCXHHyEj-S9fK8nHf7k08R9fbMoQga7q46gsEVnXs9kXlHdgCweSRz3FG1Zr&bounds=37.818184729,-122.530085727,37.823429844,-122.523471881&rows=32&cols=32
		//var tArr = [1296,1297,1296,1295,1293,1291,1290,1290,1290,1289,1290,1290,1289,1287,1285,1282,1267,1248,1229,1220,1215,1211,1208,1210,1212,1213,1215,1217,1222,1238,1256,1278,1298,1297,1296,1295,1293,1292,1292,1292,1292,1292,1293,1293,1292,1291,1289,1289,1288,1279,1262,1248,1224,1217,1211,1210,1211,1213,1215,1218,1225,1246,1267,1281,1299,1299,1297,1295,1293,1293,1293,1294,1293,1293,1294,1294,1293,1293,1292,1292,1291,1285,1283,1278,1252,1232,1220,1215,1213,1214,1215,1218,1227,1248,1271,1282,1301,1301,1299,1296,1294,1294,1293,1294,1295,1294,1294,1293,1292,1291,1290,1290,1289,1288,1288,1288,1283,1258,1242,1228,1218,1215,1216,1220,1232,1251,1269,1276,1304,1304,1303,1300,1298,1295,1293,1293,1299,1300,1292,1292,1291,1290,1288,1288,1287,1287,1288,1287,1286,1271,1257,1245,1228,1217,1215,1221,1237,1254,1270,1273,1308,1308,1310,1309,1305,1301,1298,1302,1315,1313,1299,1291,1291,1289,1287,1286,1285,1284,1284,1284,1283,1276,1267,1257,1243,1226,1217,1219,1235,1253,1268,1272,1317,1323,1331,1336,1337,1330,1320,1335,1354,1343,1310,1292,1291,1289,1286,1285,1284,1283,1282,1280,1281,1281,1278,1265,1254,1241,1230,1222,1228,1245,1257,1258,1345,1362,1369,1376,1383,1366,1362,1379,1385,1363,1320,1293,1291,1289,1287,1285,1284,1282,1281,1279,1280,1281,1278,1270,1262,1258,1251,1243,1235,1237,1243,1251,1390,1404,1406,1406,1406,1391,1392,1403,1402,1371,1331,1298,1291,1290,1287,1286,1285,1284,1282,1280,1279,1278,1276,1273,1270,1271,1269,1262,1257,1254,1250,1261,1422,1416,1411,1412,1409,1405,1406,1404,1390,1369,1339,1312,1302,1293,1289,1285,1284,1284,1282,1280,1279,1278,1276,1275,1277,1278,1277,1274,1271,1270,1267,1269,1432,1427,1420,1419,1414,1411,1409,1403,1385,1374,1362,1345,1328,1315,1306,1286,1282,1282,1282,1280,1279,1278,1278,1279,1281,1282,1282,1280,1276,1274,1272,1273,1436,1431,1429,1426,1420,1415,1410,1405,1399,1394,1382,1372,1357,1345,1331,1299,1285,1281,1281,1279,1279,1280,1281,1281,1282,1283,1283,1282,1280,1277,1276,1276,1439,1435,1433,1431,1427,1418,1412,1408,1405,1401,1391,1374,1366,1351,1328,1310,1294,1283,1280,1279,1280,1285,1285,1283,1284,1284,1284,1283,1281,1279,1278,1279,1442,1439,1437,1434,1429,1421,1415,1411,1407,1402,1392,1375,1358,1339,1326,1314,1295,1286,1282,1281,1286,1291,1291,1287,1286,1285,1284,1282,1281,1281,1281,1281,1449,1450,1446,1439,1433,1426,1418,1412,1408,1405,1398,1386,1357,1332,1319,1309,1294,1289,1286,1286,1290,1293,1292,1290,1287,1285,1283,1282,1281,1282,1282,1282,1454,1467,1463,1446,1437,1429,1419,1413,1409,1404,1391,1378,1354,1331,1316,1306,1299,1292,1289,1289,1292,1294,1293,1291,1288,1285,1283,1281,1282,1283,1284,1284,1455,1466,1474,1461,1445,1434,1424,1415,1410,1404,1389,1374,1350,1332,1318,1309,1302,1296,1294,1293,1295,1295,1295,1292,1288,1284,1282,1282,1282,1284,1284,1285,1455,1464,1479,1479,1458,1441,1430,1419,1411,1403,1389,1374,1346,1333,1322,1315,1308,1303,1301,1298,1298,1296,1295,1292,1288,1283,1282,1283,1284,1285,1286,1286,1455,1464,1477,1483,1465,1446,1434,1421,1411,1403,1389,1375,1344,1334,1328,1326,1320,1313,1308,1304,1300,1296,1293,1291,1288,1286,1285,1285,1286,1286,1287,1288,1453,1462,1475,1481,1465,1449,1437,1423,1413,1405,1396,1389,1350,1336,1333,1334,1330,1322,1313,1307,1302,1297,1293,1291,1289,1288,1287,1287,1287,1288,1289,1289,1451,1461,1474,1484,1476,1453,1438,1421,1412,1405,1397,1391,1370,1352,1352,1343,1334,1327,1318,1311,1302,1296,1293,1292,1290,1290,1289,1289,1289,1290,1290,1291,1446,1458,1471,1480,1480,1461,1437,1420,1411,1404,1398,1390,1380,1369,1358,1342,1334,1328,1323,1315,1305,1297,1293,1293,1291,1291,1291,1291,1291,1291,1292,1292,1443,1454,1465,1474,1475,1467,1447,1420,1411,1403,1398,1393,1386,1370,1350,1340,1338,1335,1330,1323,1311,1303,1295,1293,1292,1292,1293,1293,1293,1292,1293,1294,1440,1449,1459,1468,1472,1473,1467,1425,1410,1404,1400,1395,1391,1381,1368,1355,1350,1346,1336,1326,1315,1307,1296,1293,1293,1293,1294,1294,1294,1294,1293,1295,1436,1444,1453,1463,1469,1472,1473,1449,1418,1407,1402,1396,1392,1390,1383,1369,1357,1348,1338,1329,1320,1313,1303,1295,1293,1293,1294,1294,1295,1295,1295,1295,1432,1440,1449,1459,1467,1471,1476,1469,1443,1415,1405,1399,1395,1392,1383,1368,1356,1348,1342,1336,1330,1321,1310,1298,1293,1293,1294,1294,1295,1295,1296,1297,1425,1435,1446,1455,1463,1469,1475,1477,1466,1437,1418,1405,1395,1389,1378,1371,1364,1354,1349,1342,1334,1326,1315,1304,1295,1293,1293,1294,1294,1294,1295,1298,1418,1429,1441,1450,1460,1468,1472,1475,1477,1461,1441,1418,1403,1393,1387,1381,1370,1361,1355,1347,1339,1333,1326,1316,1304,1294,1293,1293,1293,1293,1295,1299,1415,1424,1437,1446,1456,1467,1469,1470,1474,1478,1468,1454,1430,1405,1393,1387,1375,1368,1362,1354,1347,1342,1336,1328,1318,1305,1295,1293,1293,1294,1298,1303,1413,1421,1433,1442,1449,1460,1464,1461,1457,1465,1480,1479,1465,1437,1404,1391,1382,1376,1368,1360,1355,1350,1345,1339,1331,1320,1307,1297,1294,1296,1299,1304,1412,1419,1429,1437,1441,1450,1453,1449,1443,1446,1458,1471,1481,1470,1440,1407,1397,1384,1375,1366,1361,1357,1352,1346,1339,1329,1319,1307,1299,1298,1300,1302,1410,1414,1417,1425,1433,1440,1440,1438,1435,1434,1423,1434,1464,1486,1469,1437,1414,1389,1380,1371,1367,1362,1357,1351,1343,1334,1325,1312,1302,1300,1301,1302];
		var tArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.53, 0.23, -0.03, -0.09, -0.1, -0.06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.76, 0.4, 0.83, 1.05, 1.21, 0.52, 0.33, -0.01, 0.04, -0.03, 0, -0.19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.77, 1.76, 4.05, 5.31, 4.04, 4.44, 3.14, 2.46, 2.11, 1.39, 0.85, 0.28, 0.02, 0, -0.19, -0.09, -0.16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.69, 1.58, 4.66, 12.54, 13.2, 11.15, 8.74, 8.58, 8.99, 8.82, 7.35, 4.65, 2.67, 1.49, 1.38, 1.28, 1.08, 0.1, -0.14, -0.08, -0.17, -0.14, -0.23, -0.26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.05, 1.27, 4.23, 9.73, 14.99, 13.94, 14.18, 14.05, 14.02, 13.87, 14.35, 15.55, 15.68, 14.15, 12.59, 10.95, 9.19, 4.81, 1.11, 0.88, 0.77, 0.58, 0.4, 0.32, 0.21, 0.01, -0.15, -0.16, -0.22, -0.24, -0.22, -0.28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.81, 6.47, 13.93, 14.01, 14.07, 14.03, 14.08, 13.95, 13.91, 13.74, 13.74, 14.01, 13.58, 13.88, 14.43, 14.42, 14.6, 12.3, 9.72, 4.84, 4.26, 2.94, 2.59, 1.89, 2.13, 1.49, 0.85, 0.56, 0.28, 0.22, 0.02, -0.1, -0.2, -0.16, -0.16, -0.25, -0.26, -0.26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.15, 1.56, 6.54, 12.88, 15.44, 14.09, 14.28, 14.15, 13.96, 13.75, 13.19, 12.93, 12.5, 12.02, 11.47, 10.88, 11.3, 11.46, 10.99, 10.8, 10.52, 5.91, 5.95, 10.4, 11.03, 12.24, 10.22, 3.91, 2.5, 1.53, 1.23, 1.21, 1.07, 0.91, 0.74, 0.69, 0.44, 0.28, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.22, 0.69, 3.54, 7.07, 12.81, 14.63, 15.17, 15.01, 13.63, 13.57, 13.17, 12.73, 12.33, 11.49, 11.33, 10.6, 9.98, 9.72, 9.8, 9.83, 10.34, 10.51, 10.45, 10.26, 10.21, 10.45, 11.9, 12.71, 11.68, 9.04, 8.08, 7.32, 8.79, 6.96, 5.1, 4.01, 2.11, 1.79, 1.67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.07, 0.25, 0.58, 1.96, 4.65, 5.45, 7.66, 8.19, 10.08, 10.93, 13.15, 13.12, 12.28, 11.08, 10.11, 9.6, 9.74, 10.22, 11.29, 11.27, 11.03, 10.19, 10.5, 10.25, 10.09, 10.01, 11.05, 12.37, 14.36, 15.9, 14.55, 14.94, 19.03, 16.81, 10.03, 7.99, 7.13, 8.21, 10.08, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.04, 0.27, 0.66, 1.2, 1.19, 1.54, 2.8, 3.44, 3.44, 7.42, 9, 11.53, 11.12, 10.99, 10.86, 11.42, 12.33, 12.66, 12.63, 11.74, 11.41, 11.51, 10.83, 10.9, 10.65, 11.12, 11.87, 13.4, 14.69, 16.87, 17.95, 18.48, 19.25, 14.85, 13.08, 10.14, 9.24, 10.75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.15, 0.33, 0.21, 0.24, 0.35, 0.57, 0.44, 0.64, 1.27, 3.36, 6.12, 9.52, 13.46, 13.48, 14.06, 14.03, 13.57, 12.61, 12.6, 12.24, 12.04, 11.94, 11.55, 11.56, 11.61, 12.53, 13.88, 15.04, 16.24, 17.03, 17.6, 18.17, 17.81, 16.2, 16.14, 15.04, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.1, 0.02, -0.05, -0.05, 0.04, 0.1, 0.13, 0, 0.24, 0.59, 1.03, 2.05, 5.47, 10, 13.45, 14.69, 14.24, 13.58, 13.4, 13.73, 13.63, 13.16, 12.71, 12.15, 11.86, 11.83, 12.52, 13.37, 14.14, 15.22, 16.01, 16.58, 17.31, 17.98, 18.11, 18.24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.11, -0.17, -0.02, 0.33, 0.89, 1.97, 3.86, 5.4, 5.73, 4.47, 4.99, 8.32, 11.71, 14.77, 14.05, 12.86, 12.07, 11.02, 11.53, 12.12, 12.59, 13.2, 13.78, 14.46, 15.36, 16.14, 16.67, 16.99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.05, 0.11, -0.04, 0.41, 0.43, 0.62, 0.71, 0.59, 0.52, 0.91, 2.92, 8.28, 11.34, 13.46, 12.72, 11.2, 10.67, 11.27, 11.81, 12.34, 12.29, 12.63, 13.06, 13.9, 14.77, 15.61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.12, -0.1, -0.05, -0.15, -0.07, -0.11, 0.05, 0.54, 1.36, 4.28, 7.55, 9.14, 11.96, 10.9, 9.99, 10.71, 10.96, 10.92, 11.05, 11.24, 11.7, 12.59, 13.56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.15, 0.26, 0.7, 1.21, 2.12, 4.87, 9.07, 10.37, 9.24, 8.58, 8.55, 8.49, 8.85, 9.44, 10.07, 10.92, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.23, 0.06, 0.31, 1.24, 2.8, 5.14, 6.71, 6.6, 6.71, 7.57, 7.12, 6.97, 7.05, 7.72, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.2, -0.09, 0.32, 1.27, 2.08, 3.68, 5.84, 7.79, 7.51, 6.94, 6.89, 6.99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.27, -0.15, -0.09, 0.62, 2.35, 3.79, 5.19, 7.59, 7.28, 7.38, 7.22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.21, -0.17, 0.61, 1.7, 4.53, 5.51, 8.95, 7.93, 7.69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.3, 0.18, 1.02, 2.52, 5.4, 9.18, 8.06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.25, -0.04, 0.75, 2.96, 8.06, 8.87, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.29, -0.18, 0.61, 2.37, 3.65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.34, -0.14, 0.17, 0.74, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.28, -0.13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		//var bingTArr = [37,47,55,61,62,62,60,60,60,61,62,62,61,54,54,55,56,57,57,56,56,55,54,53,51,48,47,46,45,44,41,39,33,44,53,58,61,60,59,58,59,60,61,61,61,55,54,54,54,55,56,55,55,54,52,51,49,47,46,45,43,41,39,37,33,44,52,56,58,58,56,56,57,59,60,60,60,56,54,53,54,54,54,54,53,51,50,48,47,47,45,43,42,40,38,36,30,41,50,55,56,56,56,56,57,59,60,59,58,56,55,54,53,53,53,52,51,49,48,46,46,45,44,43,41,39,36,35,27,38,48,54,56,56,56,56,56,58,59,58,57,56,56,55,54,53,51,50,48,47,46,45,44,44,43,42,40,38,35,33,29,40,49,56,60,57,56,56,57,58,58,57,57,56,56,55,54,53,50,48,47,46,45,44,44,43,42,41,40,38,34,31,29,41,51,57,62,59,56,57,58,58,58,57,57,57,56,55,55,53,49,47,46,45,44,43,42,41,40,40,38,35,31,28,28,40,50,57,62,60,57,59,59,59,58,57,57,56,56,55,54,52,48,46,45,44,43,42,41,40,39,38,36,33,30,25,25,37,47,54,61,61,60,60,59,59,57,57,56,55,55,54,53,51,49,47,45,44,42,41,40,39,38,36,34,32,28,20,21,30,41,52,60,62,61,60,59,59,57,56,55,54,54,53,51,49,48,46,44,43,41,40,39,37,36,35,33,31,26,16,21,27,39,51,59,62,62,60,59,58,57,55,55,53,52,51,50,48,46,45,43,42,40,39,37,36,34,33,31,28,23,14,21,28,37,47,55,61,62,60,59,57,56,55,54,52,50,49,48,47,45,44,43,41,39,38,36,33,32,30,29,26,21,12,20,27,34,45,54,58,58,59,58,57,55,54,52,49,47,47,47,46,45,44,42,40,38,37,35,32,29,28,26,24,18,8,17,24,32,42,51,55,55,56,57,56,55,53,50,47,45,45,45,45,44,43,41,40,39,39,38,33,28,25,23,21,16,8,13,22,31,41,48,50,52,54,55,56,56,55,51,47,44,43,44,43,42,41,40,40,39,38,35,31,26,22,20,17,11,7,8,21,32,41,45,46,49,51,53,54,54,51,46,44,40,40,42,41,40,39,36,34,33,31,29,27,24,20,16,11,8,6,6,16,30,39,42,44,45,48,49,48,46,45,43,39,36,39,40,37,33,30,28,27,27,26,24,21,18,14,9,7,6,4,5,13,28,37,40,41,41,41,42,41,40,39,38,32,27,27,26,23,21,19,17,16,15,13,11,9,8,7,6,4,3,2,5,13,29,35,38,38,36,35,35,35,35,34,27,18,12,9,8,7,7,7,6,6,6,5,5,4,4,3,3,2,1,1,4,14,29,33,34,32,31,29,26,22,19,14,9,7,6,5,4,3,3,2,2,2,2,2,1,1,1,1,1,0,0,0,4,14,28,30,31,29,26,21,15,9,7,6,4,3,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,14,27,27,28,27,22,14,8,5,3,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,13,23,24,26,25,16,8,4,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,12,20,22,25,23,11,6,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,11,18,20,23,18,9,5,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,8,12,12,12,10,7,4,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,7,7,7,6,5,3,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,5,6,5,5,3,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,4,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		
		var geometry = new THREE.PlaneBufferGeometry( size, size, segm - 1, segm - 1 );
		//geometry.computeFaceNormals();
		//geometry.computeVertexNormals();
		
		
		//var tArr = [];
		//var cells = 32;
		//for (var t1 = cells; t1 > 0; t1--) {
		//	var tBase = ((t1 - 1) * cells);
		//	for (var t2 = 0; t2 < cells; t2++) {
		//		var inx =  tBase + t2; 
		//		tArr.push(bingTArr[inx]);
		//	}
		//}		
		
		var vertices = geometry.attributes.position.array;
		var i = 0, lng = vertices.length;
		var tInx = 0;
		for ( i = 0; i < lng; i += 3 ) {
			var h = tArr[tInx];
			vertices[ i + 2 ] = h;
			tInx++;
		}		
		
		var material = new THREE.MeshLambertMaterial({ shading: THREE.SmoothShading });
		THREE.ImageUtils.crossOrigin = "";
		var grTx = THREE.ImageUtils.loadTexture( "http://kortforsyningen.kms.dk/service?login=euman&password=psalewc23&servicename=orto_foraar&service=WMS&version=1.1.1&request=GetMap&styles=&exceptions=application/vnd.ogc.se_inimage&layers=orto_foraar&format=image/jpeg&width=1320&height=1320&SRS=EPSG:25832&BBOX=617030%2c6178770%2c617670%2c6179410&.jpg" );
		//var grTx = THREE.ImageUtils.loadTexture( "http://maps.googleapis.com/maps/api/staticmap?scale=2&format=jpg-baseline&maptype=satellite&key=AIzaSyAk6N0fOjsoi-vgr2uHfNrWstewZyt4osM&center=37.80825872812958%2c-122.47460577518036&zoom=17&size=636x639&.jpg" );
		
		//var grTx = THREE.ImageUtils.loadTexture( "http://maps.googleapis.com/maps/api/staticmap?scale=2&format=jpg-baseline&maptype=satellite&key=AIzaSyAk6N0fOjsoi-vgr2uHfNrWstewZyt4osM&center=38.463149218042645%2c-109.7513599185295&zoom=17&size=637x639" );
		//grTx.wrapS = grTx.wrapT = THREE.RepeatWrapping; 
		//var grTxRep = size / 2;
		//grTx.repeat.set( grTxRep, grTxRep );
		//grTx.flipY = false;
		material.map = grTx;
		
		var terrTile = new THREE.Mesh( geometry, material);
		terrTile.receiveShadow = true;
		terrTile.rotation.x = -Math.PI / 2;
		
		self.terrObj = new THREE.Object3D();
		self.terrObj.add( terrTile );
		
		iWorld.scene.add( self.terrObj );
		
		
		//addEdgeFence({size: size});
		
		
		//var plainGeo = new THREE.PlaneBufferGeometry( 5000, 5000, 1, 1 );
		//var plainMat = new THREE.MeshLambertMaterial({ color: 0x26413C });
		//var plainTile = new THREE.Mesh( plainGeo, plainMat );
		//plainTile.rotation.x = -Math.PI / 2;
		//plainTile.position.y = -0.1;
		//iWorld.scene.add( plainTile );
		
	};
	
	function addEdgeFence (aOpt) {
		var hgt = 20;		
		var txSRep = (aOpt.size / 512) * 10, txTRep = 0.95;
		var eGeo = new THREE.PlaneBufferGeometry(aOpt.size, hgt);
		
		var trTexture = THREE.ImageUtils.loadTexture( 'media/img/trees1.png' );
		trTexture.wrapS = trTexture.wrapT = THREE.RepeatWrapping; 
		trTexture.repeat.set( txSRep, txTRep );
		var eMat = new THREE.MeshPhongMaterial( { map: trTexture, transparent: true } );
		
		var halfSize = aOpt.size / 2;
		var e1 = new THREE.Mesh(eGeo, eMat);
		e1.position.x = halfSize;
		e1.position.y = hgt / 2;
		e1.rotation.y = -Math.PI / 2;
		iWorld.sceneObjects.add( e1 );
		
		var e2 = new THREE.Mesh(eGeo, eMat);
		e2.position.z = halfSize;
		e2.position.y = hgt / 2;
		e2.rotation.y = -Math.PI;
		iWorld.sceneObjects.add( e2 );
		
		var e3 = new THREE.Mesh(eGeo, eMat);
		e3.position.x = -halfSize;
		e3.position.y = hgt / 2;
		e3.rotation.y = Math.PI / 2;
		iWorld.sceneObjects.add( e3 );
		
		var e4 = new THREE.Mesh(eGeo, eMat);
		e4.position.z = -halfSize;
		e4.position.y = hgt / 2;
		iWorld.sceneObjects.add( e4 );		
	}
	*/
	
	function init (aOpt) {
		initOptions(aOpt);
	}	
	
	init(aOpt);
};