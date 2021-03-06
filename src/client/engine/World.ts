import * as THREE from 'three';
import { EventEmitter } from 'events';
import Scene from './graphics/Scene';
import LocalPlayer from './LocalPlayer';
import NetClient from './NetClient';
import {
    PacketHeader, TickPacket, ChunkListPacket, WorldInfoPacket,
} from '../../common/Packet';
import LocalUnit from './LocalUnit';
import UnitDef from '../../common/definitions/UnitDef';
import ChunkWorld from './ChunkWorld';
import Chunk from './Chunk';
import { TilePoint, WorldPoint } from '../../common/Point';
import CharacterDef from '../../common/definitions/CharacterDef';
import { GroundItemDef } from '../../common/definitions/ItemDef';
import LocalGroundItem from './LocalGroundItem';

declare interface World {
    emit(event: 'tick', self: World, tick: number): boolean;
    emit(event: 'unitAdded', self: World, unit: LocalUnit): boolean;
    emit(event: 'unitRemoved', self: World, unit: LocalUnit): boolean;
    emit(event: 'groundItemAdded', self: World, item: LocalGroundItem): boolean;
    emit(event: 'groundItemRemoved', self: World, item: LocalGroundItem): boolean;

    on(event: 'tick', listener: (self: World, tick: number) => void): this;
    on(event: 'unitAdded', listener: (self: World, unit: LocalUnit) => void): this;
    on(event: 'unitRemoved', listener: (self: World, unit: LocalUnit) => void): this;
    on(event: 'groundItemAdded', listener: (self: World, item: LocalGroundItem) => void): this;
    on(event: 'groundItemRemoved', listener: (self: World, item: LocalGroundItem) => void): this;
}

class World extends EventEmitter {
    public scene: Scene;
    public chunkWorld: ChunkWorld;
    public units: Map<string, LocalUnit> = new Map();
    public players: Map<string, LocalPlayer> = new Map();
    public groundItems: Map<string, LocalGroundItem> = new Map();
    private _player: LocalPlayer;
    private _tickTimer: number;
    private _tickRate: number;
    private _currentTick: number;
    private chunkViewDist: number;
    public get player(): LocalPlayer { return this._player; }
    public get tickTimer(): number { return this._tickTimer; }
    public get tickRate(): number { return this._tickRate; }
    public get tickProgression(): number { return this._tickTimer / this._tickRate; }
    public get currentTick(): number { return this._currentTick; }

    public constructor(scene: Scene, info: WorldInfoPacket) {
        super();
        this.scene = scene;
        this._player = new LocalPlayer(this, info.self);
        this._player.on('loaded', () => {
            this.emit('unitAdded', this, this._player);
        });
        this._tickRate = info.tickRate;
        this.chunkViewDist = info.chunkViewDist;
        this.chunkWorld = new ChunkWorld(this.scene, info.chunkSize, info.chunkViewDist);

        NetClient.on(PacketHeader.WORLD_TICK, (p: TickPacket) => {
            this.onTick(p);
        });
        NetClient.on(PacketHeader.CHUNK_LOAD, (p: ChunkListPacket) => {
            const chunkLoads: Promise<Chunk>[] = [];
            for (const def of p.chunks) {
                chunkLoads.push(this.chunkWorld.loadChunk(def));
            }
            Promise.all(chunkLoads).then(() => {
                this.chunkWorld.pruneChunks(new TilePoint(p.center.x, p.center.y, this.chunkWorld));
                this.chunkWorld.stitchChunks();
                this.chunkWorld.stitchChunks(); // this ensures south east corners are stitched
            });
        });
        NetClient.send(PacketHeader.CHUNK_LOAD);
    }

    public getUnit(id: string): LocalUnit {
        const unit = this.units.get(id);
        if (unit) {
            return unit;
        }
        if (id === this.player.data.id) {
            return this.player;
        }
        return this.players.get(id);
    }

    private tickUnits(tick: number, unitDefs: UnitDef[]): void {
        for (const def of unitDefs) {
            let unit = this.units.get(def.id);
            if (!unit) {
                unit = new LocalUnit(this, def);
                this.units.set(def.id, unit);
                unit.on('loaded', () => {
                    this.emit('unitAdded', this, unit);
                });
            }
            unit.onTick(def);
            unit.lastTickUpdated = tick;
        }
    }

    private tickPlayers(tick: number, playerDefs: CharacterDef[]): void {
        for (const def of playerDefs) {
            let player = this.players.get(def.id);
            if (!player) {
                player = new LocalPlayer(this, def);
                this.players.set(def.id, player);
                player.on('loaded', () => {
                    this.emit('unitAdded', this, player);
                });
            }
            player.onTick(def);
            player.lastTickUpdated = tick;
        }
    }

    private tickGroundItems(tick: number, giDefs: GroundItemDef[]): void {
        for (const def of giDefs) {
            let gi = this.groundItems.get(def.item.uuid);
            if (!gi) {
                gi = new LocalGroundItem(this, def);
                this.groundItems.set(def.item.uuid, gi);
                this.emit('groundItemAdded', this, gi);
            }
            gi.lastTickUpdated = tick;
        }
    }

    private removeStaleUnits(): void {
        for (const [id, u] of this.units) {
            if (u.lastTickUpdated !== this._currentTick) {
                if (u.data.health <= 0 && !u.stale) {
                    u.kill();
                } else {
                    this.emit('unitRemoved', this, u);
                    u.dispose();
                    this.units.delete(id);
                }
            }
        }
    }

    private removeStalePlayers(): void {
        for (const [id, p] of this.players) {
            if (p.lastTickUpdated !== this._currentTick) {
                if (p.data.health <= 0 && !p.stale) {
                    p.kill();
                } else {
                    this.emit('unitRemoved', this, p);
                    p.dispose();
                    this.players.delete(id);
                }
            }
        }
    }

    private removeStaleGroundItems(): void {
        for (const [id, gi] of this.groundItems) {
            if (gi.lastTickUpdated !== this._currentTick) {
                gi.dispose();
                this.groundItems.delete(id);
                this.emit('groundItemRemoved', this, gi);
            }
        }
    }

    public onTick(packet: TickPacket): void {
        this._tickTimer = 0; // reset tick timer
        this._currentTick = packet.tick; // update the current tick

        this.player.onTick(packet.self);
        this.tickUnits(packet.tick, packet.units);
        this.tickPlayers(packet.tick, packet.players);
        this.tickGroundItems(packet.tick, packet.groundItems);
        this.removeStaleUnits();
        this.removeStalePlayers();
        this.removeStaleGroundItems();

        this.emit('tick', this, this.currentTick);
    }

    private updateUnits(delta: number): void {
        for (const [_, u] of this.units) {
            u.update(delta);
        }
    }

    private updatePlayers(delta: number): void {
        for (const [_, p] of this.players) {
            p.update(delta);
        }
    }

    public update(delta: number, mousePoint: WorldPoint, intersects: THREE.Intersection[]): void {
        this.chunkWorld.update(delta);
        this.player.update(delta);
        this.player.updateClientPlayer(mousePoint, intersects);
        this.updateUnits(delta);
        this.updatePlayers(delta);

        // increment tick timer
        this._tickTimer += delta;
    }
}

export default World;
