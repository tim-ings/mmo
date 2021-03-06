import * as THREE from 'three';
import { DoodadDef } from '../../common/definitions/ChunkDef';
import Model from './graphics/Model';
import Chunk from './Chunk';
import { ChunkPoint } from '../../common/Point';
import AssetManager from './asset/AssetManager';

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
        // add this as userdata to all children so we can access it via raycast
        const userData = {
            doodad: this,
            interactable: this.def.interact != null,
        };
        this.model.obj.traverse((obj) => {
            obj.userData = userData;
        });
        // add the doodad model to the scene
        this.load();

        setTimeout(() => { // this fixes doodads sometimes being positioned at 0 elevation
            this.positionInWorld();
        }, 1000);
    }

    public dispose(): void {
        this.model.dispose();
    }

    public static load(def: DoodadDef, chunk: Chunk): Promise<Doodad> {
        return new Promise((resolve, reject) => {
            AssetManager.getModel(def.model)
                .then((model) => {
                    resolve(new Doodad(def, model, chunk));
                })
                .catch((err) => reject(err));
        });
    }

    public load(): void {
        this.positionInWorld();
        this.chunk.world.scene.add(this.model.obj);
    }

    public unload(): void {
        this.chunk.world.scene.remove(this.model.obj);
        this.model.dispose();
    }

    public positionInWorld(): void {
        this.model.obj.scale.set(this.def.scale, this.def.scale, this.def.scale);
        this.model.obj.rotation.set(0, this.def.rotation, 0);

        const worldPoint = new ChunkPoint(this.def.x, this.def.y, this.chunk).toWorld();
        worldPoint.add(new THREE.Vector3(0, this.def.elevation, 0));
        this.model.obj.position.copy(worldPoint);
    }
}
