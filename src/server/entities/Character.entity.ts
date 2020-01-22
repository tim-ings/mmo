import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne,
} from 'typeorm';
import CharacterDef, { Race } from '../../common/CharacterDef';
import AccountEntity from './Account.entity';

@Entity()
export default class CharacterEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type) => AccountEntity, (account) => account.characters)
    public account: AccountEntity;

    @Column()
    public posX: number;

    @Column()
    public posY: number;

    @Column()
    public positionMapID: number;

    @Column()
    public name: string;

    @Column({ transformer: { from: (val: number) => <Race>val, to: (val: Race) => <number>val } })
    public race: Race;

    @Column()
    public level: number;

    // converts a db entity to a network character
    public toNet(): CharacterDef {
        const char = <CharacterDef>{
            id: this.id.toString(),
            charID: this.id,
            name: this.name,
            level: this.level,
            race: this.race,
            position: {
                x: this.posX,
                y: this.posY,
            },
        };
        return char;
    }

    // converts a network character to a db entity
    public static fromNet(c: CharacterDef): Promise<CharacterEntity> {
        return new Promise((resolve) => {
            this.findOne({ id: c.charID }).then((ce) => {
                ce.level = c.level;
                ce.posX = c.position.x;
                ce.posY = c.position.y;
                ce.save();
                resolve(ce);
            });
        });
    }
}
