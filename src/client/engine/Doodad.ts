import * as THREE from 'three';
import { DoodadDef } from '../../common/ChunkDef';
import Model from './graphics/Model';
import Chunk from './Chunk';
import { ChunkPoint } from '../../common/Point';

export default class Doodad {
    public def: DoodadDef;
    public model: Model;
    public chunk: Chunk;

    public constructor(def: DoodadDef, model: Model, chunk: Chunk) {
        this.def = def;
        this.model = model;
        this.chunk = chunk;
        this.model.obj.name = 'doodad';
        this.model.obj.userData = {
            doodad: this,
        };
        this.positionInWorld();
        // add the doodad model to the scene
        chunk.world.scene.add(this.model.obj);
        // add this as userdata to all children so we can access it via raycast
        this.model.obj.traverse((obj) => {
            obj.userData = {
                doodad: this,
            };
        });
    }

    public static async load(def: DoodadDef, chunk: Chunk): Promise<Doodad> {
        return new Promise((resolve) => {
            Model.loadDef(`assets/models/${def.model}`).then((model) => {
                resolve(new Doodad(def, model, chunk));
            });
        });
    }

    public positionInWorld(): void {
        this.model.obj.scale.set(this.def.scale, this.def.scale, this.def.scale);
        this.model.obj.rotation.set(0, this.def.rotation, 0);

        const worldPoint = new ChunkPoint(this.def.x, this.def.y, this.chunk).toWorld();
        worldPoint.add(new THREE.Vector3(0, this.def.elevation, 0));
        this.model.obj.position.copy(worldPoint);
    }
}
