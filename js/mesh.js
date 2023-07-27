import vertShaderSrc from './phong.vert.js';
import fragShaderSrc from './phong.frag.js';

import Shader from './shader.js';
import { HalfEdgeDS } from './half-edge.js';

export default class Mesh {
  #heds;
  #model;
  #vertShd;
  #fragShd;
  #program;
  #coordsNum;
  #rotateY;
  #position;
  #vaoLoc;
  #indicesLoc;
  #uModelLoc;
  #uViewLoc;
  #uProjectionLoc;
  #limits;
  #angle;
  #translation;
  #scale;

  constructor() {
    this.#heds = new HalfEdgeDS();

    this.#model = mat4.create();

    this.#vertShd = null;
    this.#fragShd = null;
    this.#program = null;

    this.#translation = [];
    this.#scale = [];
    this.#angle = 0.0;

    // Data location
    this.#vaoLoc = -1;
    this.#indicesLoc = -1;

    this.#uModelLoc = -1;
    this.#uViewLoc = -1;
    this.#uProjectionLoc = -1;
  }

  get rotateY() {
    return this.#rotateY;
  }

  get program() {
    return this.#program;
  }

  get limits() {
    return this.#limits;
  }

  get scale() {
    return this.#scale;
  }

  get angle() {
    return this.#angle;
  }

  get translation() {
    return this.#translation;
  }

  get heds() {
    return this.#heds;
  }

  get coordsNum() {
    return this.#coordsNum;
  }

  set position(position) {
    this.#position = [];
    this.#position = position;
  }

  set scale(scale) {
    this.#scale = scale;
  }

  set rotateY(boolean) {
    this.#rotateY = boolean;
  }

  set angle(angle) {
    this.#angle = angle;
  }

  set translation(translation) {
    this.#translation = translation;
  }

  // Translação: novo ponto médio - ponto médio antigo
  // Ponto médio: min + (max-min)/2 => (min + max)/2
  #setTranslation(maxX, minX, maxY, minY, maxZ, minZ) {
    this.#translation[0] = this.#position[0] - (minX + maxX)/2;
    this.#translation[1] = this.#position[1] - (minY + maxY)/2;
    this.#translation[2] = this.#position[2] - (minZ + maxZ)/2;
  }

  #setObjectLimits(maxX, minX, maxY, minY, maxZ, minZ) {
    this.#limits = {};
    this.#limits.maxX = maxX;
    this.#limits.minX = minX;
    this.#limits.maxY = maxY;
    this.#limits.minY = minY;
    this.#limits.maxZ = maxZ;
    this.#limits.minZ = minZ;
  }

  async loadMeshFromFile(file) {
    const resp = await fetch(file);
    const text = await resp.text();
    const lines = text.split("\n");
    
    let coords = [];
    let normals = [];
    let trigs = [];

    let maxX, minX, maxY, minY, maxZ, minZ;

    for (let i = 0; i < lines.length; i++) {
      let data = lines[i].split(" ");

      if(data[0] === "v") {
        data = data.map(parseFloat);

        if (i === 0) {
          maxX = minX = data[1];
          maxY = minY = data[2];
          maxZ = minZ = data[3];
        } else {
          if (data[1] > maxX) maxX = data[1];
          if (data[1] < minX) minX = data[1];
          if (data[2] > maxY) maxY = data[2];
          if (data[2] < minY) minY = data[2];
          if (data[3] > maxZ) maxZ = data[3];
          if (data[3] < minZ) minZ = data[3];
        }
        
        for (let j=1; j<4; j++) coords.push(data[j]);
        coords.push(1.0);
      }
      else if (data[0] === "vn") {
        for (let j=1; j<4; j++) normals.push(parseFloat(data[j]));
        normals.push(0.0);
      } 
      else {
        for (let j=1; j<4; j++) if(data[j]) trigs.push(parseInt(data[j].split("//")[0])-1);
      }
    }

    this.#setObjectLimits(maxX, minX, maxY, minY, maxZ, minZ);

    this.#setTranslation(maxX, minX, maxY, minY, maxZ, minZ);

    this.#coordsNum = coords.length/4;

    const blue = [0.0, 0.7, 1.0, 1.0];
    this.#heds.build(coords, trigs, normals, blue);
  }

  loadMeshFromArray(coords, trigs, normals) {
    const red = [1.0, 0.0, 0.0, 1.0];
    this.#heds.build(coords, trigs, normals, red);
  }

  #createShader(gl) {
    this.#vertShd = Shader.createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
    this.#fragShd = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
    this.#program = Shader.createProgram(gl, this.#vertShd, this.#fragShd);

    gl.useProgram(this.#program);
  }

  #createUniforms(gl) {
    this.#uModelLoc = gl.getUniformLocation(this.#program, "u_model");
    this.#uViewLoc = gl.getUniformLocation(this.#program, "u_view");
    this.#uProjectionLoc = gl.getUniformLocation(this.#program, "u_projection");
  }

  #createVAO(gl) {
    const vbos = this.#heds.getVBOs();

    var coordsAttributeLocation = gl.getAttribLocation(this.#program, "position");
    const coordsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vbos[0]));

    var colorsAttributeLocation = gl.getAttribLocation(this.#program, "color");
    const colorsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vbos[1]));

    var normalsAttributeLocation = gl.getAttribLocation(this.#program, "normal");
    const normalsBuffer = Shader.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vbos[2]));

    this.#vaoLoc = Shader.createVAO(gl,
      coordsAttributeLocation, coordsBuffer, 
      colorsAttributeLocation, colorsBuffer, 
      normalsAttributeLocation, normalsBuffer);

    this.#indicesLoc = Shader.createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(vbos[3]));
  }  

  init(gl, light) {
    this.#createShader(gl);
    this.#createUniforms(gl);
    this.#createVAO(gl);
    for(let i=0; i<light.length; i++) light[i].createUniforms(gl, this.#program, i);
  }
  
  #updateModelMatrix() {
    this.#angle += 0.005;

    mat4.identity(this.#model);

    if (this.#rotateY)  mat4.rotateY(this.#model, this.#model, this.#angle);
    else  mat4.rotateZ(this.#model, this.#model, this.#angle);

    mat4.translate(this.#model, this.#model, this.#translation); 

    mat4.scale(this.#model, this.#model, this.#scale);
  }

  draw(gl, cam) {
    if (this.#uModelLoc === -1) return;

    // faces orientadas no sentido anti-horário
    gl.frontFace(gl.CCW);

    // depth test
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // face culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.useProgram(this.#program);

    this.#updateModelMatrix();
    
    // updates the model transformations
    gl.uniformMatrix4fv(this.#uModelLoc, false, this.#model);
    gl.uniformMatrix4fv(this.#uViewLoc, false, cam.view);
    gl.uniformMatrix4fv(this.#uProjectionLoc, false, cam.proj);
  
    gl.bindVertexArray(this.#vaoLoc);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#indicesLoc);
    gl.drawElements(gl.TRIANGLES, this.#heds.faces.length * 3, gl.UNSIGNED_INT, 0);

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
  }
}