const rope = (_world, _scene, texPath, _parentBody) => {
	const world = _world;
	const scene = _scene;

	const segments = 3;
	const parentBody = _parentBody;
	const constraints = [];
	const bodies = [];
	const size = 0.5;
    const dist = size*.5;
    const factor = Math.random() + .3;
    var textureLoader = new THREE.TextureLoader();
	const texture_diag = textureLoader.load( texPath, renderer );
	const tailObject = new THREE.Mesh(new THREE.BoxGeometry(2 * factor, 1* factor, 1* factor), new THREE.MeshLambertMaterial( { color: (texPath.indexOf('dots') != -1) ? 0xCCCCff : 0xffcccc, map:texture_diag } ) );
	tailObject.castShadow = true;
	tailObject.receiveShadow = true;
	const mass = 1;
    const GROUP1 = 1;
    const GROUP2 = 2;
    const GROUP3 = 4;
    
    let lastBody = parentBody;
    let isLinked = true;
    let points = [];

    

    for(var i=1; i<segments; i++){
    	let body;

    	if(i != segments -1 ){

    		if(body > 0){
    			body = new CANNON.Body({ 
		    		mass: mass, 
		    		collisionFilterGroup: GROUP1, // Put the sphere in group 1
		            collisionFilterMask: GROUP3
		    	});
		    	body.linearDamping = .04;
		    	body.angularDamping = 1;
				body.addShape(new CANNON.Particle());
    		}else{
    			body = parentBody;
    		}
    	}
		else{
			body = new CANNON.Body({ 
	    		mass:  1, 
	    		collisionFilterGroup: GROUP2, // Put the sphere in group 1
	            collisionFilterMask: GROUP2
	    	});
	    	body.linearDamping = .1;
	    	body.angularDamping = .75;
			body.addShape(new CANNON.Box(new CANNON.Vec3( 1* factor,.5* factor, .5* factor)));
		}

		
		if(i>0){
			body.position.set(_parentBody.position.x , _parentBody.position.y, _parentBody.position.z);
			world.addBody(body);
        	bodies.push(body);
		}
		
		points.push(new THREE.Vector3(body.position.x,body.position.y,body.position.z));

        
        if(i == segments-1)	
        	scene.add( tailObject );

        let c;
        if(lastBody!==null){
          world.addConstraint(c = new CANNON.DistanceConstraint(body, lastBody, dist));
          constraints.push(c);
        }

        lastBody = body;
    }

    const line = new THREE.Geometry().setFromPoints( points );
    line.dynamic = true;
    const lineMesh = new THREE.Line( line, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );

    scene.add(lineMesh);

	return {
		link: _ => {
			if(isLinked) return;

			for(let i=0; i<bodies.length; i++){
				bodies[i].velocity = new CANNON.Vec3(0,0,0);
				bodies[i].angularVelocity = new CANNON.Vec3(0,0,0);
			}
			for(let i=0; i<constraints.length; i++){
				constraints[i].distance = dist;
				world.addConstraint(constraints[i]);
			}

			
			scene.add(lineMesh);
			isLinked = true;
		},

		update: _ => {
			for(let k=0; k<bodies.length; k++){
				lineMesh.geometry.vertices[k].set(bodies[k].position.x, bodies[k].position.y, bodies[k].position.z);
			}

			lineMesh.geometry.verticesNeedUpdate = true;

			for(let i=0; i<constraints.length; i++){
				if(constraints[i].distance>.1){
					constraints[i].distance -= .00025	;
				}else{
					//if(isLinked){
						isLinked = false;
						scene.remove(lineMesh);
						world.removeConstraint(constraints[i]);
						//console.log(`constraint${i} is near 0.`)
					//}
				}
			}

			tailObject.position.copy(bodies[bodies.length-1].position);
            tailObject.quaternion.copy(bodies[bodies.length-1].quaternion);
		}
	}
}