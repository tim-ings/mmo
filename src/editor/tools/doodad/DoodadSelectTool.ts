import { Key } from 'ts-key-enum';
import Tool from '../../Tool';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input, { MouseButton } from '../../../client/engine/Input';
import Graphics from '../../../client/engine/graphics/Graphics';
import { Point } from '../../../common/Point';
import DoodadMoveTool from './DoodadMoveTool';
import BaseDoodadTool from './BaseDoodadTool';
import DoodadProp from '../../panelprops/DoodadProp';

enum DoodadToolMode {
    SELECT,
    POSITION,
    ROTATE,
    ELEVATION,
}

export default class DoodadSelectTool extends Tool {
    private mode: DoodadToolMode;
    private mouseStart: Point;
    private intialTheta: number;
    private initialElevation: number;
    private doodadProp: DoodadProp;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-select',
            '- Select doodads with left click.\n'
            + '- Control + left click to move the selected doodad.\n'
            + '- Alt + left click to rotate the selected doodad (Alt+Shift for snapping).\n'
            + '- Shift + left click to adjust the selected doodad\'s elevation.',
            'assets/icons/doodad_select.png',
            props, panel,
        );

        this.doodadProp = new DoodadProp(this.propsPanel, this.props);
        this.propsPanel.addProp(this.doodadProp);
    }

    public onSelected(): void {
        super.onSelected();
        this.doodadProp.show();
    }

    private usePosition(): void {
        const chunkPoint = this.props.point.toChunk();

        // check if we need to transfer the doodad to another chunk
        const oldChunk = this.props.selectedDoodad.chunk;
        const newChunk = chunkPoint.chunk;
        if (oldChunk.def.id !== newChunk.def.id) {
            DoodadMoveTool.transferDoodad(this.props.selectedDoodad.def.uuid, oldChunk, newChunk);
        }

        this.props.selectedDoodad.def.x = chunkPoint.x;
        this.props.selectedDoodad.def.y = chunkPoint.y;
    }

    private useRotate(): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.props.selectedDoodad.def.rotation = Graphics.normaliseRadians(this.intialTheta + mouseDelta.x / 100);
        // snapping
        if (Input.isKeyDown(Key.Shift)) {
            this.props.selectedDoodad.def.rotation = Graphics.snapAngle(this.props.selectedDoodad.def.rotation, 8);
        }
    }

    private useElevation(): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.props.selectedDoodad.def.elevation = this.initialElevation - mouseDelta.y / 100;
    }

    public use(delta: number): void {
        if (this.props.selectedDoodad) {
            switch (this.mode) {
            case DoodadToolMode.POSITION: this.usePosition(); break;
            case DoodadToolMode.ROTATE: this.useRotate(); break;
            case DoodadToolMode.ELEVATION: this.useElevation(); break;
            default: break;
            }
            this.props.selectedDoodad.positionInWorld();
        }
    }

    public update(delta: number): void {
        this.mode = DoodadToolMode.SELECT; // default to select

        // get mode from modifier keys
        if (Input.isKeyDown(Key.Control)) {
            this.mode = DoodadToolMode.POSITION;
        } else if (Input.isKeyDown(Key.Alt)) {
            this.mode = DoodadToolMode.ROTATE;
        } else if (Input.isKeyDown(Key.Shift)) {
            this.mode = DoodadToolMode.ELEVATION;
        }

        // handle select
        if (this.mode === DoodadToolMode.SELECT && Input.wasMousePressed(MouseButton.LEFT)) {
            const intersects = this.props.camera.rcast(this.props.scene.children, Input.mousePos());
            for (const ints of intersects) {
                if (ints.object.userData.doodad) {
                    this.props.selectedDoodad = ints.object.userData.doodad;
                    break;
                }
            }
        }

        // handle rotation initialisation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.mouseStart = Input.mousePos();
            if (this.props.selectedDoodad) {
                this.intialTheta = this.props.selectedDoodad.def.rotation;
                this.initialElevation = this.props.selectedDoodad.def.elevation;
            }
        }

        if (Input.wasKeyPressed(Key.Delete)) {
            BaseDoodadTool.deleteSelected(this.props);
        }
    }
}
