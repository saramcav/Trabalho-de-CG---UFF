export default class Light {
  #pos
  #amb_c
  #amb_k
  #dif_c
  #dif_k
  #esp_c
  #esp_k
  #esp_p

  constructor(position, color) {
    this.#pos = vec4.fromValues(...position);

    this.#amb_c = vec4.fromValues(...color);
    this.#amb_k = 0.15;

    this.#dif_c = vec4.fromValues(...color);
    this.#dif_k = 0.45;

    this.#esp_c = vec4.fromValues(...color);
    this.#esp_k = 0.4;
    this.#esp_p = 100.0;
  }

  updatePos(position, meshes, gl, index) {
    const pos = vec4.fromValues(...position);
    for(let i = 0; i < meshes.length; i++) {
      if(!gl.isProgram(meshes[i].program)) continue;
  
      gl.useProgram(meshes[i].program);
      const posLoc = gl.getUniformLocation(meshes[i].program, `light_pos${index}`);
      gl.uniform4fv(posLoc, pos);
    }
  }

  createUniforms(gl, program, index){
    const posLoc = gl.getUniformLocation(program, `light_pos${index}`);
    gl.uniform4fv(posLoc, this.#pos);

    const ambCLoc = gl.getUniformLocation(program, `light_amb_c${index}`);
    gl.uniform4fv(ambCLoc, this.#amb_c);
    const ambKLoc = gl.getUniformLocation(program, `light_amb_k${index}`)
    gl.uniform1f(ambKLoc, this.#amb_k);

    const difCLoc = gl.getUniformLocation(program, `light_dif_c${index}`);
    gl.uniform4fv(difCLoc, this.#dif_c);
    const difKLoc = gl.getUniformLocation(program, `light_dif_k${index}`)
    gl.uniform1f(difKLoc, this.#dif_k);

    const espCLoc = gl.getUniformLocation(program, `light_esp_c${index}`);
    gl.uniform4fv(espCLoc, this.#esp_c);
    const espKLoc = gl.getUniformLocation(program, `light_esp_k${index}`)
    gl.uniform1f(espKLoc, this.#esp_k);
    const espPLoc = gl.getUniformLocation(program, `light_esp_p${index}`)
    gl.uniform1f(espPLoc, this.#esp_p);
  }

}