var nbackGame;
var gameFrame;

var animation_id;

var box_location = 1

var parent;   // Parent column containing canvas
var canvas_height = 400;
var canvas_width;

var show_box = false;
var box_visible = false;
var distraction_box_visible = false;
var random_box_location;

var nback = 2;
var sequence_length = 20;
const num_nbacks = 6;

var sequence_pointer = -1;
var grid_sequence = [];
var sound_sequence = [];
var user_answers = [];
var take_place_answer_flag = false;
var take_sound_answer_flag = false;
var right_answers = 0;
var wrong_answers = 0;
var box_interval = 2000;
var distraction_interval;

var grid_matches_total = 0;
var sound_matches_total = 0;

var running = false;
var rotate = true;
var rotation_speed = 0.2;
var rotation_direction = 1;
var rotate3d = false;

var distraction = false;

var colored_grid;
var sounds_on = true;
var audio_volume = 1.0;
var note_sounds = [];
var ad_container = document.getElementById("ad");
var ad_container2 = document.getElementById("ad");

const button_success_color = "green";
const button_fail_color = "red";
const button_default_color = document.getElementById("place_button").style.backgroundColor;




// Make random integer
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
};


// Get user settings
async function load_data() {

  const response = await fetch('/userdata');
  const userdata = await response.json();

    rotate = userdata["rotate"];
    rotation_speed = userdata["rotation_speed"];
    nback = userdata["nbacks"];
    colored_grid = userdata["colored_grid"];
    sequence_length = userdata["sequence_length"];
    sounds_on = userdata["sounds"];
    distraction = userdata["distraction"];
    rotate3d = userdata["rotate3d"];

    box_interval = userdata["box_interval"]
    distraction_interval = userdata["distraction_interval"];
    audio_volume = userdata["audio_volume"];
    place_letter = userdata["place_letter"];
    sound_letter = userdata["sound_letter"];

    document.getElementById("place_button").innerHTML = place_letter + `\xa0\xa0PLACE`;
    document.getElementById("sound_button").innerHTML = sound_letter + `\xa0\xa0SOUND`;
    return "ready";
};


function prePopulate() {
      // Prepopulate fields with current settings
      try {
        document.getElementById("id_rotate").checked = rotate;
        document.getElementById("id_rotation_speed").value = rotation_speed;
        document.getElementById("id_nbacks").value = nback;
        document.getElementById("id_sequence_length").value = sequence_length;
        document.getElementById("id_sounds").checked = sounds_on;
        document.getElementById("id_distraction").checked = distraction;
        document.getElementById("id_colored_grid").checked = colored_grid;
        document.getElementById("id_rotate3d").checked = rotate3d;
    } catch (error) {
        console.log("Error prepopulating fields.")
    };
};


// Used to pass data from JS to Python
function sendDataToViews(url, data) {
  var token = $('input[name="csrfmiddlewaretoken"]').prop('value');
  data['csrfmiddlewaretoken'] = token;
  $.post(url, data);
};


// Collect results data from current game after it's finished and send to views
function passResults() {

  // Data = results and difficulty settings. These are used to calculate score.
  data = {
    "right_answers": right_answers,
    "wrong_answers": wrong_answers,
    "nback": nback,
    "total_nbacks": (grid_matches_total + sound_matches_total),
    "rotate": rotate,
    "rotation_speed": rotation_speed,
    "distraction": distraction,
    "sounds_on": sounds_on,
    "sequence_length": sequence_length,
    "rotate3d": rotate3d
  };
  sendDataToViews("register_results", data);
};


// Show results after finishing a sequence
function resultsPopup() {
  message = "Your results\r\n";
  message += "Correct answers: ";

  if (sounds_on === true) {
    message += right_answers + " / " + (grid_matches_total + sound_matches_total);
  } else {
    message += right_answers + " / " + (grid_matches_total);
  };

  message += "\r\nWrong answers:   ";

  if (sounds_on === true) {
    message += wrong_answers + " / " + (((sequence_length * 2) - grid_matches_total - sound_matches_total));
  } else {
    message += wrong_answers + " / " + ((sequence_length - grid_matches_total));
  };
  alert(message);
};


// Set event listeners
function setEventListeners() {

  let sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
    };

    // Listen place and sound keys, or mouseclick, from user
    // Use flag to signal that only one keypress in a cycle is accepted
    document.addEventListener('keypress', processKey);
    document.addEventListener('keypress', processKey);

    place_button = document.getElementById("place_button");
    place_button.style.backgroundColor = button_default_color;

    sound_button = document.getElementById("sound_button");
    sound_button.style.backgroundColor = button_default_color;

    place_button.addEventListener("click", function () {
      processKey("place_click");
    });

    if (sounds_on === true) {
      sound_button.addEventListener("click", function () {
        processKey("sound_click");
      });
    };


    // Change color of place and sound buttons if right/wrong answer
    function changeColor(elem, result) {
      if (result === "fail") {
        elem.style.backgroundColor = button_fail_color;
        sleep(500).then(() => {elem.style.backgroundColor = button_default_color;})
        };

        if (result === "success") {
          elem.style.backgroundColor = button_success_color;
        sleep(500).then(() => {elem.style.backgroundColor = button_default_color;})
        };
    };


    // Check result of key and mouse button press
    function processKey(feedback) {

    // Check if signal is click (string from setEventListeners) or keypress
    // Because data must be extracted in different ways
    if (typeof feedback === "string") {
      key = feedback;
    } else {
      key = feedback.key.toUpperCase();
    };

      if (take_sound_answer_flag && (key === "sound_click" || key === sound_letter.toUpperCase() )) {
          take_sound_answer_flag = false;
          result = checkAnswer(sound_sequence);
          changeColor(sound_button, result);
        };

      if (take_place_answer_flag && (key === "place_click" || key === place_letter.toUpperCase() )) {
        take_place_answer_flag = false;
        result = checkAnswer(grid_sequence);
        changeColor(place_button, result);
      };
    };


    // Check users answer and log result
    function checkAnswer(sequence) {
      console.log(sequence[sequence_pointer]);
      console.log(sequence[(sequence_pointer-nback)]);

      // Use pointer to find element in sequence
      // Compare current element with element which is nback-amount places before current place in the sequence
      if (sequence_pointer >= nback && sequence[sequence_pointer] == sequence[(sequence_pointer-nback)]) {
        console.log("Success!!");
        right_answers++;
        document.querySelector("correct").innerHTML = right_answers;
        return "success";
      } else {
        wrong_answers++;
        document.querySelector("wrong").innerHTML = wrong_answers;
        return "fail" };
    };
};



// Make sequence of events
function makeSequence() {
  let matches_total = 0;
  let temp_sequence = [];

  // First make whole sequence with random numbers
  for (let i = 1; i < sequence_length + 1; i++) {
    num = getRndInteger(1, 9);
    temp_sequence.push(num);
  };

  // Add nbacks (=matches) in the sequence so that there is always some matches
  for (let a = 0; a < num_nbacks; a++) {
    num = getRndInteger(1, 9);
    place = getRndInteger(0, sequence_length - 1);
    temp_sequence[place] = num;

    // Don't add matches at the beginning
    if ((place + nback) <= temp_sequence.length - nback) {
      temp_sequence[place + nback] = num;
    };

  };
  // Count all nback-matches in sequence. This is shown at end results.
  for (let a = nback - 1; a < temp_sequence.length; a++) {
    if (temp_sequence[a] === temp_sequence[a - nback]) {
      matches_total++;
    };
  };

  return [temp_sequence, matches_total];
};



// Load all piano notes to array
function initSounds() {
  for (let a = 1; a < 10; a++) {
    sound_item = new Audio(`./static/nback_app/sounds/${a}.mp3`);
    sound_item.volume = audio_volume;
    note_sounds.push(sound_item);
  }
};


// Use grid place number to pick sound effect from sound sequence list
// Find corresponding sound from array
function playSound(place) {
  if (sounds_on) {
    note_sounds[place].play()
  };
};



// Initialize game field and get settings
function init() {
  const promise = load_data();
  initSounds();
  promise.then((data) => {
    if (rotate3d === true) {
      make3D();
    } else {
      // Run 2D loop once at init to show the grid
      gameFrame = playField;
      setEventListeners();
      gameFrame.start();
      gameFrame.stop();
      running = false;
    }
  });
};

// Run when user data received
function runGame() {
  ad_container = document.getElementById("ad");
  ad_container2 = document.getElementById("ad2");
  console.log(ad_container);
  try{
    (document.body||document.documentElement).removeChild(ad_container);
    (document.body||document.documentElement).removeChild(ad_container2);
  } catch(e) {
      console.log(e)
    };

  const promise = load_data();
  promise.then((data) => {
    load_data();
    gameFrame = playField;
    setEventListeners();
    gameFrame.start();
  })
};



// ****************************************************************************
//                                                                            *
//  Game Action                                                               *
//                                                                            *
// ****************************************************************************


// Cycle routine
var playField = {

  canvas : document.getElementById("myCanvas"),

    start : function() {

        if (running === true) { return };
        running = true;

        var start_btn = document.getElementById("start_button");
        var stop_btn = document.getElementById("stop_button");
        if (start_btn.style.display === "block") {
          start_btn.style.display = "none";
          stop_btn.style.display = "block";
        };

        document.querySelector("cycle").innerHTML = 0;
        document.querySelector("correct").innerHTML = 0;
        document.querySelector("wrong").innerHTML = 0;

        // Choose routine for 2D and 3D modes
        if (rotate3d === true) {
          make3D();

        } else {

            this.context = this.canvas.getContext("2d");

            // Store canvas width and height globally so that it can be used in drawing of grid
            parent = document.getElementById("parent_column");
            canvas_width = parent.offsetWidth;
            this.canvas.width = canvas_width;
            canvas_height = parent.offsetHeight;
            this.canvas.height = canvas_height;

            // Monitor changes in window size and adjust canvas size so that grid is always horizontally centered
            window.addEventListener('resize', () => {
              parent = document.getElementById("parent_column");
              canvas_width = parent.offsetWidth;
              canvas_height = parent.offsetHeight;
              this.canvas.width = canvas_width;
              this.canvas.height = canvas_height;

              // If game is not running and window is resized, run loop once to redraw grid
              if (!running) {
                nbackGame = new component();
                updateGameArea();
              }
          })

            // Create game component with time interval for rotation
            nbackGame = new component();

            updateGameArea();
      };

        // Make sequences
        [grid_sequence, grid_matches_total] = makeSequence();
        [sound_sequence, sound_matches_total] = makeSequence();

        // Play cycle, time interval follows box show/hide cycle
        this.interval_box = setInterval(function () {
          if (show_box === false) {
            console.log(sequence_pointer);

            // Stop when sequence is finished
            if (sequence_pointer >= sequence_length -1) {
              gameFrame.stop();
              passResults();
              resultsPopup();

            } else {

              // Update cycle status
              sequence_pointer++;
              let cycle_counter = (sequence_pointer + 1) + " / " + sequence_length;
              document.querySelector("cycle").innerHTML = cycle_counter;

              // Pick next item in the sequence, show rectangle and play sound
              box_location = grid_sequence[sequence_pointer];

              if (sounds_on === true) {
                playSound(sound_sequence[sequence_pointer]);
              };

            show_box = true;

            // Signal that user's click can be registered, only one click per cycle allowed
            take_place_answer_flag = true;
            take_sound_answer_flag = true;
            }

          } else { show_box = false};
        }, box_interval * 100);

        // Interval for showing distractions
        this.interval_distraction_box = setInterval(function () {
          random_box_location = getRndInteger(1, 9);

          if (distraction_box_visible === false) {
            distraction_box_visible = true;
          } else { distraction_box_visible = false;
          };
        }, distraction_interval * 100);
    },

    stop : function() {
        // Reset objects when stopped
        running = false;
        show_box = false;
        distraction_box_visible = false;
        clearInterval(this.interval);
        clearInterval(this.interval_box);
        clearInterval(this.interval_distraction_box);
        sequence_pointer = -1;
        document.getElementById("start_button").style.display = "block";
        document.getElementById("stop_button").style.display = "none";
        try{
          (document.body).appendChild(ad_container);
          (document.body).appendChild(ad_container2);
        }
        catch(e){
            console.log(e)
          };
        
    },

    clear : function() {
        this.context.clearRect(0, 0, canvas_width, canvas_height);
    }
}


// 2D graphics

function component() {
    angle = 0;
    ctx = gameFrame.context;
    this.box_location = 1;
    this.update = function() {

        gameFrame.clear();

        // Grid will be placed to the center point
        this.center_horizontal = Math.round(canvas_width / 2);
        this.center_vertical = Math.round(canvas_height / 2);

        // Resize grid lines with canvas size
        this.line_length = canvas_height * 0.6;

        ctx.save();
        ctx.translate(this.center_horizontal, this.center_vertical);
        ctx.rotate(this.angle);

        box_size = this.line_length / 3;
        padding = this.line_length * 0.05;

        // Starting points of each frame in the grid [x, y]
        // x=0, y=0 is the middle of the canvas. Thats why whole grid width is line lengt divided in 2 sections
        // Height is line length by 6 divisions.

        const points = {
          1: [0 - this.line_length / 2, 0 - this.line_length / 2],
          2: [0 - this.line_length / 6, 0 - this.line_length / 2],
          3: [this.line_length / 6, 0 - this.line_length / 2],

          4: [0 - this.line_length / 2, 0 - this.line_length / 6],
          5: [0 - this.line_length / 6, 0 - this.line_length / 6],
          6: [this.line_length / 6, 0 - this.line_length / 6],

          7: [0 - this.line_length / 2,this.line_length / 6],
          8: [0 - this.line_length / 6, this.line_length / 6],
          9: [this.line_length / 6, this.line_length / 6]
        };

        // Draw and remove rectangles
        function make_box (box_loc, box_color, pointsA) {
            box_coords =  [pointsA[box_loc][0] + padding,
            pointsA[box_loc][1] + padding,
            box_size - padding *2,
            box_size - padding *2];

          ctx.fillStyle = box_color;
          ctx.fillRect(...box_coords);
        };

        if (show_box === true) {
           make_box(box_location, "red", points);
        };

        if (distraction === true && distraction_box_visible === true) {
          ctx.globalAlpha = 0.2;
          make_box(random_box_location, "green", points);
          ctx.globalAlpha = 1.0;
        };


        // Choose box color from settings
        // These are in dictionary, it is later possible to implement advanced settings feature
        // so that user can choose custom colors
        if (colored_grid) { var line_colors = {
          1: "red",
          2: "blue",
          3: "orange",
          4: "green" }
        } else { var line_colors = {
          1: "black",
          2: "black",
          3: "black",
          4: "black" }
        };

        // Draw grid lines
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.strokeStyle = line_colors[1];
        ctx.moveTo(points[2][0], points[2][1]);
        ctx.lineTo(points[2][0], this.line_length / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = line_colors[2];
        ctx.moveTo(points[3][0], points[3][1]);
        ctx.lineTo(points[3][0], this.line_length / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = line_colors[3];
        ctx.moveTo(points[4][0], points[4][1]);
        ctx.lineTo(this.line_length / 2, points[4][1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = line_colors[4];
        ctx.moveTo(points[7][0], points[7][1]);
        ctx.lineTo(this.line_length / 2, points[7][1]);
        ctx.stroke();

        ctx.restore();

        // Loop update and check stop
        if (rotate === true) {
          angle += rotation_speed * Math.PI / 180;
        }

        animation_id = requestAnimationFrame(nbackGame.update);
        if (running === false) {
          cancelAnimationFrame(animation_id);
        }
    }
};


// Start update loop
function updateGameArea() {
  gameFrame.clear();
  nbackGame.angle += rotation_speed * Math.PI / 180;
  requestAnimationFrame(nbackGame.update);
};



// 3D Graphics

function make3D() {

    const canvas = document.querySelector('#myCanvas');
    const scene = new THREE.Scene();
    const loader = new THREE.TextureLoader();
    //const loader = new THREE.FileLoader();

    // After loading background run loop once to update canvas with picture
    // User can see the pic before starting the game
    scene.background = loader.load( 'static/nback_app/pics/sky2.jpg', function() {runLoop();});

    const camera = new THREE.PerspectiveCamera(-70, 2, 1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true});



    // Scale image if window resized
    function resizeCanvas() {
      const canvas = renderer.domElement
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width <= 540) {
        camera.lookAt( grid_y1.position.clone().add( new THREE.Vector3(-2.0,0.2,0) ));
        camera.position.x = 3.0;    // Was 2.0
        camera.position.y = 1.0;
        camera.position.z = -2.5;   // -2.0
      } else {
        camera.lookAt( grid_y1.position.clone().add( new THREE.Vector3(-2.0,0,0) ));
        camera.position.x = 2.0;    // Was 2.0
        camera.position.y = 1.0;
        camera.position.z = -2.5;   // -2.0
      }

      if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
      };
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

      window.addEventListener('resize', () => {
        resizeCanvas();
      });


    // In future: Textures on cube surface:

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


    // Cube's locations [y, z] in the grid. X is constant.
    const cube_coords = {
                    1: [0.5, 1.0],
                    2: [0.5, 0.0],
                    3: [0.5, -1.0],
                    4: [-0.5, 1.0],
                    5: [-0.5, 0.0],
                    6: [-0.5, -1.0],
                    7: [-1.5, 1.0],
                    8: [-1.5, 0.0],
                    9: [-1.5, -1.0]};

    if (colored_grid === true) {
      var colors = {
        1: "yellow",
        2: "blue",
        3: "green",
        4: 0xe65e9d,
        "cube": "red",
        "distraction_cube": "gray"
      };

    } else {
      var colors = {
        1: 0x484e57,
        2: 0x484e57,
        3: 0x484e57,
        4: 0x484e57,
        "cube": "red",
        "distraction_cube": "gray"
      };
    };


    // Draw cubes
    const cube_geo = new THREE.BoxBufferGeometry(0.7, 0.7, 0.7);
    const cube_material = new THREE.MeshStandardMaterial({ color: colors["cube"] });
    const cube = new THREE.Mesh(cube_geo, cube_material);
    cube.rotation.y = 0;


    const distraction_geo = new THREE.BoxBufferGeometry(0.7, 0.7, 0.7);
    const distraction_material = new THREE.MeshStandardMaterial({ color: colors["distraction_cube"] });
    const distraction_cube = new THREE.Mesh(distraction_geo, distraction_material);
    distraction_cube.rotation.y = 0;


    const geo_x1_a = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x1_a = new THREE.MeshStandardMaterial( { color: colors[1]} );
    const grid_x1_a = new THREE.Mesh( geo_x1_a, material_x1_a );
    grid_x1_a.position.y = 0;
    grid_x1_a.renderOrder = 1;



    const geo_x1_b = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x1_b = new THREE.MeshStandardMaterial( { color: colors[1]} );
    const grid_x1_b = new THREE.Mesh( geo_x1_b, material_x1_b );
    grid_x1_b.position.y = 0;
    grid_x1_b.position.z = -1;
    grid_x1_b.renderOrder = 2;


    const geo_x1_c = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x1_c = new THREE.MeshStandardMaterial( { color: colors[1]} );
    const grid_x1_c = new THREE.Mesh( geo_x1_c, material_x1_c );
    grid_x1_c.position.y = 0;
    grid_x1_c.position.z = 1;
    grid_x1_c.renderOrder = 2;



    // Draw grid. X-axis is divided in 3 sections to prevent z-fighting (flickering)
    const geo_x2_a = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x2_a = new THREE.MeshStandardMaterial( { color: colors[2] } );
    const grid_x2_a = new THREE.Mesh( geo_x2_a, material_x2_a );
    grid_x2_a.position.y = -1;


    const geo_x2_b = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x2_b = new THREE.MeshStandardMaterial( { color: colors[2] } );
    const grid_x2_b = new THREE.Mesh( geo_x2_b, material_x2_b );
    grid_x2_b.position.y = -1;
    grid_x2_b.position.z = -1;


    const geo_x2_c = new THREE.BoxGeometry( 0.5, 0.05, 0.95 );
    const material_x2_c = new THREE.MeshStandardMaterial( { color: colors[2] } );
    const grid_x2_c = new THREE.Mesh( geo_x2_c, material_x2_c );
    grid_x2_c.position.y = -1;
    grid_x2_c.position.z = 1;


    const geo_y1 = new THREE.BoxGeometry( 0.5, 3, 0.05 );
    const material_y1 = new THREE.MeshStandardMaterial( { color: colors[3] } );
    const grid_y1 = new THREE.Mesh( geo_y1, material_y1 );
    grid_y1.position.z = 0.5;
    grid_y1.position.y = -0.5;
    grid_y1.renderOrder = 3;

    const geo_y2 = new THREE.BoxGeometry( 0.5, 3, 0.05 );
    const material_y2 = new THREE.MeshStandardMaterial( { color: colors[4] } );
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
    group.add(grid_y1);
    group.add(grid_y2);
    group.add(cube);
    group.add(distraction_cube);
    scene.add(group);

    var ambientLight = new THREE.AmbientLight({color: 0x0c0c0c, intensity: 10});
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight( {color: 0xffffff, intensity: 10});
    //spotLight.position.set(0, 10, -20);
    spotLight.position.set(80, 20, 40);
    spotLight.castShadow = true;
    scene.add(spotLight);

    // Initial positions
    group.position.x = -0.8;
    group.position.y = -0.3;
    group.rotation.y = 0.6;
    group.rotation.x += -0.0;
    group.rotation.y += -0.3;

    camera.position.x = 2.0;    // Was 2.0
    camera.position.y = 1.0;
    camera.position.z = -2.5;   // -2.0

    //camera.lookAt(0,0,0);
    camera.lookAt( grid_y1.position.clone().add( new THREE.Vector3(-2.0,0,0) ));    // -1.5


    function runLoop() {
        resizeCanvas();
        cube.position.y = cube_coords[box_location][0];
        cube.position.z = cube_coords[box_location][1];

        if (show_box === true) {
          cube.visible = true;
        } else {
          cube.visible = false;
        };

        if (distraction && distraction_box_visible === true) {
          distraction_cube.position.y = cube_coords[random_box_location][0];
          distraction_cube.position.z = cube_coords[random_box_location][1];
          distraction_cube.visible = true;
        } else {
          distraction_cube.visible = false;
        }

        if (rotate) {
        group.rotation.x += rotation_speed / 100;
        group.rotation.y += rotation_speed / 100;
        };

        renderer.render( scene, camera );
        if (running === true) {
          requestAnimationFrame(runLoop);
        };
    };

    runLoop();
};


