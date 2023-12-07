console.log("3d module")

function make3D() {

    var showing = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );


    //dir = "static/nback_app/pics/"
    //file = "gold-mosaic-tile.jpg"

    //const loader = new THREE.CubeTextureLoader();
    //loader.setPath( dir );

    //const textureCube = loader.load( [
    //	file, file,
    //	file, file,
    //	file, file
    //] );

    //textureCube.minFilter = THREE.LinearFilter


    //const geometry = new THREE.BoxGeometry( 0.70, 0.70, 0.7 );
    //const material_cube = new THREE.MeshBasicMaterial( { color: "gray" } );
    //const material_cube = new THREE.MeshStandardMaterial( { color: "gray", envMap: textureCube } );
    //const cube = new THREE.Mesh( geometry, material_cube );

    // Cubes locations [y, z] in the grid
    var cube_coords = {1: [0.5, 1.0],
                    2: [0.5, 0.0],
                    3: [0.5, -1.0],
                    4: [-0.5, 1.0],
                    5: [-0.5, 0.0],
                    6: [-0.5, -1.0],
                    7: [-1.5, 1.0],
                    8: [-1.5, 0.0],
                    9: [-1.5, -1.0]}


    const geometry = new THREE.BoxBufferGeometry(0.7, 0.7, 0.7);
    const material = new THREE.MeshStandardMaterial({ color: 'orange' });
    const cube = new THREE.Mesh(geometry, material);



    cube.position.x = 0.0
    cube.position.y = -1.5
    cube.position.z = 0.0
    cube.rotation.y = 0


    const geo_x1_a = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x1_a = new THREE.MeshStandardMaterial( { color: "yellow"} );
    const grid_x1_a = new THREE.Mesh( geo_x1_a, material_x1_a );
    grid_x1_a.position.y = 0
    grid_x1_a.renderOrder = 1;



    const geo_x1_b = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x1_b = new THREE.MeshStandardMaterial( { color: "yellow"} );
    const grid_x1_b = new THREE.Mesh( geo_x1_b, material_x1_b );
    grid_x1_b.position.y = 0;
    grid_x1_b.position.z = -1;
    grid_x1_b.renderOrder = 2;


    const geo_x1_c = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x1_c = new THREE.MeshStandardMaterial( { color: "yellow"} );
    const grid_x1_c = new THREE.Mesh( geo_x1_c, material_x1_c );
    grid_x1_c.position.y = 0;
    grid_x1_c.position.z = 1;
    grid_x1_c.renderOrder = 2;



    // Draw grid. X-axis is divided in 3 sections to prevent z-fighting (flickering)
    const geo_x2_a = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x2_a = new THREE.MeshStandardMaterial( { color: "cyan" } );
    const grid_x2_a = new THREE.Mesh( geo_x2_a, material_x2_a );
    grid_x2_a.position.y = -1


    const geo_x2_b = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x2_b = new THREE.MeshStandardMaterial( { color: "cyan" } );
    const grid_x2_b = new THREE.Mesh( geo_x2_b, material_x2_b );
    grid_x2_b.position.y = -1
    grid_x2_b.position.z = -1


    const geo_x2_c = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x2_c = new THREE.MeshStandardMaterial( { color: "cyan" } );
    const grid_x2_c = new THREE.Mesh( geo_x2_c, material_x2_c );
    grid_x2_c.position.y = -1
    grid_x2_c.position.z = 1


    const geo_y1 = new THREE.BoxGeometry( 0.5, 3, 0.05 );
    const material_y1 = new THREE.MeshStandardMaterial( { color: "green" } );
    const grid_y1 = new THREE.Mesh( geo_y1, material_y1 );
    grid_y1.position.z = 0.5;
    grid_y1.position.y = -0.5;
    grid_y1.renderOrder = 3;

    const geo_y2 = new THREE.BoxGeometry( 0.5, 3, 0.05 );
    const material_y2 = new THREE.MeshStandardMaterial( { color: "red" } );
    const grid_y2 = new THREE.Mesh( geo_y2, material_y2 );
    grid_y2.position.z = -0.5;
    grid_y2.position.y = -0.5;
    grid_y2.renderOrder = 4;


    const group = new THREE.Group();
    group.add(grid_x1_a);
    group.add(grid_x1_b);
    group.add(grid_x1_c);
    group.add(grid_x2_a);
    group.add(grid_x2_b);
    group.add(grid_x2_c);
    group.add(grid_y1)
    group.add(grid_y2)
    group.add(cube)

    scene.add(group);

    var ambientLight = new THREE.AmbientLight({color: 0x0c0c0c, intensity: 10});
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight( {color: 0xffffff, intensity: 10});
    spotLight.position.set(0, 10, -20);

    spotLight.castShadow = true;

    scene.add(spotLight);



    group.position.x = -1.0
    group.rotation.y = 0.6


    camera.position.z = -1;
    camera.position.x = 2;
    camera.position.y = 0.0;
    //camera.lookAt(0,0,0);
    camera.lookAt( grid_y1.position.clone().add( new THREE.Vector3(-1.5,0,0) ) );

    //cube.rotation.x += 10.01;
    //cube.rotation.y += 10.01;



    //var showing = true;

    //setInterval(function () {
    //    if (showing === true) {
    //        showing = false;
    //        cube.visible = false}
    //    else {showing = true;
    //        cube.visible = true;}
    //    }
    //, 1500)


    function animate() {
        requestAnimationFrame( animate );

        //cube.rotation.x += 0.01;
        //cube.rotation.y += 0.01;
        //group.rotation.x += 0.005;
        //group.rotation.y += 0.005;

        renderer.render( scene, camera );
        
    };

    animate();

    }


function test() {
    console.log("ONNISTUI!!!!!!!!!!!!!!")
}

export {make3D};
//export {test};


