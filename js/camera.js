export default class Camera {
    #eye;
    #at;
    #up;
    #angle;
    #fovy;
    #aspect;
    #near;
    #far;
    #view;
    #proj;

    constructor(gl) {
      this.#eye = null;
      this.#at  = vec3.fromValues(0.0, 0.0, 0.0);
      this.#up  = vec3.fromValues(0.0, 1.0, 0.0);
  

      this.#angle = 0.0;

      // Parâmetros da projeção
      this.#fovy = Math.PI / 2.0;
      this.#aspect = gl.canvas.width / gl.canvas.height;
  
      this.#near = 1.5;
      this.#far = 10.0;
  
      // Matrizes View e Projection
      this.#view = mat4.create();
      this.#proj = mat4.create();
    }
  
    get view() {
      return this.#view;
    }
  
    get proj() {
      return this.#proj;
    }

    get position() {
      return this.#eye;
    }
  
    #updateViewMatrix() {
      this.#angle +=  0.005;

      mat4.identity( this.#view );

      //constantes: a = 6, b = 4, câmera fixada em y = 0.0
      this.#eye = vec3.fromValues(6.0 * Math.cos(this.#angle), 0.0, 4.0 * Math.sin(this.#angle));

      mat4.lookAt(this.#view, this.#eye, this.#at, this.#up);
    }
  
    #updateProjectionMatrix() {
      mat4.identity( this.#proj );
      mat4.perspective(this.#proj, this.#fovy, this.#aspect, this.#near, this.#far);
    }

    update() {
      this.#updateViewMatrix();
      this.#updateProjectionMatrix();
    }
  }