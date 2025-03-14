import MeshManager from './mesh_manager.js';

export class Vertex {
  #vid;
  #position;
  #normal;
  #color;
  #he;

  constructor(vid, position, normal, color) {
    this.#vid = vid;

    this.#position = position;
    this.#normal = normal;

    this.#color = color;

    this.#he = null;
  }

  get vid() {
    return this.#vid;
  }

  get color() {
    return this.#color;
  }

  get position() {
    return this.#position;
  }

  get normal() {
    return this.#normal;
  }

  get HE() {
    return this.#he;
  }

  set HE(he) {
    this.#he = he;
  }
}
  
export class HalfEdge {
  #vertex;
  #next;
  #face;
  #opposite;

  constructor(vertex) {
    this.#vertex = vertex;

    this.#next = null;
    this.#face = null;

    this.#opposite = null;
  }

  get next() {
    return this.#next;
  }

  get vertex() {
    return this.#vertex;
  }

  get opposite() {
    return this.#opposite;
  }

  set opposite(opposite) {
    this.#opposite = opposite;
  }

  set next(next) {
    this.#next = next;
  }

  set face(face) {
    this.#face = face;
  }
}

export class Face {
  #baseHe;

  constructor(baseHe) {
    this.#baseHe = baseHe;
  }
}

export class HalfEdgeDS {
  #vertices;
  #halfEdges;
  #faces;

  constructor() {
    this.#vertices = [];
    this.#halfEdges = [];
    this.#faces = [];
  }

  get faces() {
    return this.#faces;
  }

  build(coords, trigs, normals, color) {
    // construção dos vértices
    for (let vid = 0; vid < coords.length; vid += 4) {
      const id = vid / 4;
      const position = coords.slice(vid, vid + 4);
      const normal = normals.slice(vid, vid + 4);

      const v = new Vertex(id, position, normal, color);
      this.#vertices.push(v);
    }
    // construção das faces & half-edges
    for (let tid = 0; tid < trigs.length; tid += 3) {
      let he = [];
      
      for (let i=0; i<3; i++) {
        const v =  this.#vertices[ trigs[tid + i] ];
        he.push(new HalfEdge(v));
      }

      const face = new Face(he[0]);
      this.#faces.push(face);

      for(let i=0; i<3; i++) {
        he[i].face = face;
        he[i].next = he[(i+1)%3];
        this.#halfEdges.push(he[i]);
      }
    }

    this.#computeOpposites();
    this.#computeVertexHe();
  }

  #computeOpposites() {
    const visited = {};

    for (let hid = 0; hid < this.#halfEdges.length; hid ++) {
      const a = this.#halfEdges[hid].vertex.vid;
      const b = this.#halfEdges[hid].next.vertex.vid;

      const k = `k${Math.min(a,b)},${Math.max(a,b)}`;

      if (visited[k]) {
        const op = visited[k];
        op.opposite = this.#halfEdges[hid];
        this.#halfEdges[hid].opposite = op;

        delete visited[k];
      }
      else {
        visited[k] = this.#halfEdges[hid];
      }
    }
  }

  #computeVertexHe() {
    for (let hid = 0; hid < this.#halfEdges.length; hid ++) {
      const v = this.#halfEdges[hid].vertex;

      if (!v.HE) {
        v.HE = this.#halfEdges[hid];
      }
      else if(!this.#halfEdges[hid].opposite) {
        v.HE = this.#halfEdges[hid];
      }
    }
  }

  getVBOs() {
    const coords  = [];
    const colors  = [];
    const normals = [];
    const indices = [];

    for (let vId = 0; vId < this.#vertices.length; vId++) {
      const v = this.#vertices[vId];

      coords.push(...v.position);
      colors.push(...v.color);
      normals.push(...v.normal);
    }

    for (let hid = 0; hid < this.#halfEdges.length; hid++) {
      indices.push(this.#halfEdges[hid].vertex.vid);
    }

    return [coords, colors, normals, indices];
  }

  star(v, translation, scale, angle, rotateY) {
    const heInput = this.#vertices[v].HE;
    
    if (!heInput) return;

    let heAux = heInput;
    let coords = [...heInput.vertex.position];
    let trigs = [];
    let normals = [];
    let vertex;

    do {
      vertex = heAux.next.vertex;
      coords.push(...vertex.position);
      normals.push(...vertex.normal);
      heAux = heAux.opposite.next;
    } while (heAux !== heInput && heAux);

    for(let i = 1; i < coords.length/4; i++) {
      const index = i===1 ? coords.length/4-1 : i-1;
      trigs.push(0, i, index);
    }

    const mesh = MeshManager.createStarMesh(translation, scale, angle, rotateY, coords, trigs, normals);

    return mesh;
  }
}