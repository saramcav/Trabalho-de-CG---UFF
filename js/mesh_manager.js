import Mesh from './mesh.js';

export default class MeshManager {
    //  Coelho aumentado proporcionalmente com base no eixo x do tatu
    static setScaleObjects(bunny, armadillo, value) {
        const bunnyLimits = bunny.limits;
        const armadilloLimits = armadillo.limits;
        const bunnyScale = 0.4 * (armadilloLimits.maxX - armadilloLimits.minX)/(bunnyLimits.maxX - bunnyLimits.minX) * value;
        
        bunny.scale = [bunnyScale, bunnyScale, bunnyScale];
        armadillo.scale = [0.4, 0.4, 0.4];
    }

    static createStarMesh(translation, scale, angle, rotateY, coords, trigs, normals) {
        let mesh = new Mesh();
        mesh.translation = translation;
        mesh.scale = scale;
        mesh.angle = angle;
        mesh.rotateY = rotateY;
        mesh.loadMeshFromArray(coords, trigs, normals);

        return mesh;
    }

    static addStarMesh(meshes, gl, light, mesh) {
        meshes.push(mesh);
        meshes[meshes.length-1].init(gl, light);
    }
    
    static clearStarMeshes(meshes) {
        return meshes.slice(0, 2);
    }
}
