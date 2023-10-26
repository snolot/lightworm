function TubeBufferGeometry( path, tubularSegments, radius, radialSegments, closed ) {
	THREE.BufferGeometry.call( this );

	this.type = 'TubeBufferGeometry';

	this.parameters = {
		path: path,
		tubularSegments: tubularSegments,
		radius: radius,
		radialSegments: radialSegments,
		closed: closed
	};

	tubularSegments = tubularSegments || 64;
	radius = radius || 1;
	radialSegments = radialSegments || 8;
	closed = closed || false;

	var frames = path.computeFrenetFrames( tubularSegments, closed );

	this.tangents = frames.tangents;
	this.normals = frames.normals;
	this.binormals = frames.binormals;

	var vertex = new THREE.Vector3();
	var normal = new THREE.Vector3();
	var uv = new THREE.Vector2();

	var vertices = [];
	var normals = [];
	var uvs = [];
	var _indices = [];
	var indices = [];

	generateBufferData();

	this.setIndex( indices );
	console.log(indices);

	this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	this.setAttribute( 'orgPosition', new THREE.Float32BufferAttribute( vertices, 3 ) );
	this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
	this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
	this.setAttribute( 'jointIndices', new THREE.Float32BufferAttribute( _indices, 1 ) );

	this.attributes['position'].usage = true;

	// functions

	function generateBufferData() {

		
		for ( var i = 0; i < tubularSegments; i ++ ) {
			generateSegment( i );
		}

		generateSegment( ( closed === false ) ? tubularSegments : 0 );
		generateUVs();		
		generateIndices();
	}

	function generateSegment( i ) {

		// we use getPointAt to sample evenly distributed points from the given path
		var P = path.getPointAt( i / tubularSegments );

		// retrieve corresponding normal and binormal
		var N = frames.normals[ i ];
		var B = frames.binormals[ i ];

		// generate normals and vertices for the current segment
		for ( var j = 0; j <= radialSegments; j ++ ) {
			var v = j / radialSegments * Math.PI * 2;
			var sin =   Math.sin( v );
			var cos = - Math.cos( v );

			// normal
			normal.x = ( cos * N.x + sin * B.x );
			normal.y = ( cos * N.y + sin * B.y );
			normal.z = ( cos * N.z + sin * B.z );
			normal.normalize();
			normals.push( normal.x, normal.y, normal.z );

			// vertex
			vertex.x = P.x + radius * normal.x;
			vertex.y = P.y + radius * normal.y;
			vertex.z = P.z + radius * normal.z;
			vertices.push( vertex.x, vertex.y, vertex.z );

			_indices.push(i);
			
		}

		
		//console.log(i,  _indices);
	}

	function generateIndices() {
		for ( var j = 1; j <= tubularSegments; j ++ ) {

			for ( var i = 1; i <= radialSegments; i ++ ) {
				var a = ( radialSegments + 1 ) * ( j - 1 ) + ( i - 1 );
				var b = ( radialSegments + 1 ) * j + ( i - 1 );
				var c = ( radialSegments + 1 ) * j + i;
				var d = ( radialSegments + 1 ) * ( j - 1 ) + i;

				indices.push( a, b, d );
				indices.push( b, c, d );
			}
		}
	}

	function generateUVs() {
		for ( var i = 0; i <= tubularSegments; i ++ ) {
			for ( var j = 0; j <= radialSegments; j ++ ) {
				uv.x = i / tubularSegments;
				uv.y = j / radialSegments;
				uvs.push( uv.x, uv.y );
			}
		}
	}

	this.updateRingIndex = function(idx, mat){
		var pos = geometry['attributes']['position'];
		var originalPos = geometry['attributes']['orgPosition'];

		for (var i = idx * radialSegments * pos.itemSize; i < ((idx+1)* radialSegments) * pos.itemSize; i += pos.itemSize) {
			
			var P = path.getPointAt( i / tubularSegments );

			var N = frames.normals[ idx ];
			var B = frames.binormals[ idx ];

			var vertex = new THREE.Vector3();
			var normal = new THREE.Vector3();

			var v = i / radialSegments * Math.PI * 2;
			var sin =   Math.sin( v );
			var cos = - Math.cos( v );

			// normal
			normal.x = ( cos * N.x + sin * B.x );
			normal.y = ( cos * N.y + sin * B.y );
			normal.z = ( cos * N.z + sin * B.z );
			normal.normalize();
			// vertex
			vertex.x = P.x + radius * normal.x;
			vertex.y = P.y + radius * normal.y;
			vertex.z = P.z + radius * normal.z;
			
			vertex.applyMatrix4(mat);

			pos.array[i] = vertex.x;
			pos.array[i+1] = vertex.y;
			pos.array[i+2] = vertex.z;
			
		}

		geometry['attributes']['position'].needsUpdate = true;
	}

}

TubeBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
TubeBufferGeometry.prototype.constructor = TubeBufferGeometry;