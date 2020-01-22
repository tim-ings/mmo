import { PointDef } from '../../common/Point';

export interface UnitSpawnDef {
    id: string;
    maxHealth: number;
    name: string;
    level: number;
    model: string;
}

export interface UnitSpawnGroup {
    id: string,
    unit: UnitSpawnDef; // the unit to spawn
    center: PointDef; // location of the group
    spawnRadius: PointDef, // number of tiles away from center that a new spawn can spaw in
    wanderRadius: PointDef, // number of tiles away from center a unit can pick to randomly wander to
    leashRadius: PointDef, // number of tiles a unit can be away from center before it leashes
    wanderRate: number, // number of ticks between new wander target
    minAlive: number, // instantly spawn a unit if count falls below this
    maxAlive: number, // stop spawning when this many units exist
    spawnRate: number, // ticks
}

// TODO: merge this with world def and add to editor
// probably as part of the world rather than chunks
export default interface UnitSpawnsDef {
    [key: string]: UnitSpawnGroup;
}
