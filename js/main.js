import Camera from './camera.js';
import Light from './light.js';
import Mesh from './mesh.js';
import MeshManager from './mesh_manager.js';

class Scene {
  #cam
  #gl
  #light
  #meshes

  constructor(gl) {
    this.#cam = new Camera(gl);
    this.#gl = gl;

    const yellow = [1.0, 1.0, 0.0, 0.5];
    const white = [1.0, 1.0, 1.0, 1.0];
    this.#light = [new Light([0.0, 3.0, 0.0, 1.0], yellow), new Light([6.0, 0.0, 0.0, 1.0], white)];

    this.#meshes = [new Mesh(), new Mesh()];
    
    //Bunny
    this.#meshes[0].position = [0.0, 0.0, 0.0];
    this.#meshes[0].rotateY = true;

    //Armadillo
    this.#meshes[1].position = [3.0, 0.0, 0.0];
    this.#meshes[1].rotateY = false;
  }

  get bunny() {
    return this.#meshes[0];
  }

  get armadillo() {
    return this.#meshes[1];
  }

  get meshes() {
    return this.#meshes;
  }

  get gl() {
    return this.#gl;
  }

  get light() {
    return this.#light;
  }

  set meshes(meshes) {
    this.#meshes = meshes;
  }

  async init() {
    await this.#meshes[0].loadMeshFromFile('/obj/bunny.obj');
    await this.#meshes[1].loadMeshFromFile('/obj/armadillo.obj');
    MeshManager.setScaleObjects(this.#meshes[0], this.#meshes[1], 3.0);
    this.#meshes[0].init(this.#gl, this.#light);
    this.#meshes[1].init(this.#gl, this.#light);
  }

  draw() {  
    this.#cam.update();
    let posCamera = this.#cam.position;
    this.#light[1].updatePos([...posCamera, 1.0], this.#meshes, this.#gl, 1);

    for(let i = 0; i < this.#meshes.length; i++) {
      this.#meshes[i].draw(this.#gl, this.#cam);
    }
  }
}

class Main {
  #gl
  #scene
  #eventsHandler

  constructor() {
    const canvas = document.querySelector("#glcanvas");

    this.#gl = canvas.getContext("webgl2");
    this.#setViewport();

    this.#scene = new Scene(this.#gl);
    this.#eventsHandler = new Event(this.#scene);
    this.#scene.init(this.#gl).then(() => {
      this.draw();
    });
  }

  #setViewport() {
    var devicePixelRatio = window.devicePixelRatio || 1;
    this.#gl.canvas.width = 1700 * devicePixelRatio;
    this.#gl.canvas.height = 930 * devicePixelRatio;

    this.#gl.viewport(0, 0, this.#gl.canvas.width, this.#gl.canvas.height);
  }

  draw() {
    this.#gl.clearColor(0.09, 0.09, 0.22, 1.0);
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);

    this.#scene.draw(this.#gl);

    requestAnimationFrame(this.draw.bind(this));
  }
}

window.onload = () => {
  const app = new Main();
  app.draw();
}

class Event {
  #armadilloInput
  #armadilloMessage
  #bunnyInput
  #bunnyMessage
  #vertexButton
  #clearButton
  #modelButton

  constructor(scene) {
    this.#armadilloInput = document.getElementById("armadillo_vertex");
    this.#armadilloMessage = document.getElementById("armadillo_message");
    
    this.#bunnyInput = document.getElementById("bunny_vertex");
    this.#bunnyMessage = document.getElementById("bunny_message");
    
    this.#vertexButton = document.getElementById("send_button");
    this.#clearButton = document.getElementById("clear_button");
    
    this.#modelButton = document.getElementById("model_button");
    
    this.#captureEntry(this, scene);
    this.#graphicModelListener();
    this.#clearStarMeshesListener(scene);
  }

  #showInputMessage(message) {
    if(message[0] === 'bunny') {
      this.#bunnyMessage.textContent = message[1];
      
      setTimeout(() => {
        this.#bunnyMessage.textContent = '';
      }, 3500);
    } else {
      this.#armadilloMessage.textContent = message[1];
      
      setTimeout(() => {
        this.#armadilloMessage.textContent = '';
      }, 3500);
    }
  }

  #clearInputs() {
    this.#bunnyInput.value = '';
    this.#armadilloInput.value = '';
  }

  computeStar (armadilloInput, bunnyInput, scene) {    
    let meshes = [];

    if(bunnyInput) {  
      const bunny = scene.bunny;
      bunnyInput = parseInt(bunnyInput);
      const bunnyCoordsNum = bunny.coordsNum;
      
      if(bunnyInput > bunnyCoordsNum) {
        this.#showInputMessage(['bunny', `Erro. Valor máximo: ${bunnyCoordsNum}`]);
      } else {
        meshes.push(bunny.heds.star(bunnyInput, bunny.translation, bunny.scale, bunny.angle, bunny.rotateY));
        this.#showInputMessage(['bunny', `Entrada computada`]);
      }
    }
    
    if(armadilloInput) { 
      const armadillo = scene.armadillo;  
      armadilloInput = parseInt(armadilloInput);
      const armadilloCoordsNum = armadillo.coordsNum;

      if(armadilloInput > armadilloCoordsNum) {
        this.#showInputMessage(['armadillo', `Erro. Valor máximo: ${armadilloCoordsNum}`]);
      } else {
        meshes.push(armadillo.heds.star(armadilloInput, armadillo.translation, armadillo.scale, armadillo.angle, armadillo.rotateY));
        this.#showInputMessage(['armadillo', `Entrada computada`]);
      }
    }

    this.#clearInputs();

    for(let i=0; i<meshes.length; i++) {
      MeshManager.addStarMesh(scene.meshes, scene.gl, scene.light, meshes[i])
    }
    
  }

  #captureEntry(object, scene) {
    this.#vertexButton.addEventListener('click', function() {
      const armadillo = object.#armadilloInput.value;
      const bunny = object.#bunnyInput.value;
      if(armadillo || bunny) object.computeStar(armadillo, bunny, scene);
    });
  }

  #graphicModelListener() {
    this.#modelButton.addEventListener('click', function() {
      window.open("https://www.geogebra.org/m/d5jy2gfu", "_blank");
    });
  }
  
  #clearStarMeshesListener(scene) {
    this.#clearButton.addEventListener('click', function() {
      scene.meshes = MeshManager.clearStarMeshes(scene.meshes);
    });
  }
}


