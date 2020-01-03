import Scene from '../engine/scene/Scene';
import { Frame } from '../engine/interface/Frame';
import Button from '../engine/interface/Button';
import UIParent from '../engine/interface/UIParent';
import SceneManager from '../engine/scene/SceneManager';
import Character from '../../common/Character';
import Panel from '../engine/interface/Panel';
import ContextMenu from '../engine/interface/ContextMenu';
import Label from '../engine/interface/Label';
import Camera from '../engine/graphics/Camera';

export default class CharSelectScene extends Scene {
    private characters: Character[];
    private _selectedChar: Character;
    private camera: Camera;

    public constructor() {
        super('char-select');
    }

    public fetchCharacerList() {
        this.characters = [];
        this.characters.push(new Character('Arwic', 120));
        this.characters.push(new Character('Arwicdruid', 120));
        this.characters.push(new Character('Arwicdk', 120));
        this.characters.push(new Character('Arwicmage', 120));
        this.characters.push(new Character('Arwiclock', 120));
    }

    public get selectedChar(): Character {
        return this._selectedChar;
    }
    public set selectedChar(char: Character) {
        this._selectedChar = this.selectedChar;
    }

    public initGUI() {
        // build enter world button
        const btnEnterWorld = new Button('btn-enter-world', UIParent.get(), 'Enter World');
        btnEnterWorld.style.bottom = '50px';
        btnEnterWorld.centreHorizontal();
        btnEnterWorld.addEventListener('click', (self: Button, ev: MouseEvent) => {
            console.log('Entering world...');
        });
        this.addGUI(btnEnterWorld);
        // build character list
        const panelCharacters = new Panel('panel-characters', UIParent.get());
        panelCharacters.style.display = 'block';
        panelCharacters.style.margin = '10px 10px 60px 10px';
        panelCharacters.style.right = '0';
        panelCharacters.style.top = '0';
        panelCharacters.style.bottom = '0';
        panelCharacters.style.height = 'auto';
        panelCharacters.style.width = '300px';
        panelCharacters.style.backgroundColor = 'rgba(255,0,0,0.3)';
        panelCharacters.style.borderRadius = '5px';
        panelCharacters.style.padding = '10px';
        this.addGUI(panelCharacters);
        // realm label
        const charListLabel = new Label('lbl-characters', panelCharacters, 'Characters');
        charListLabel.style.position = 'initial';
        charListLabel.style.display = 'block';
        charListLabel.style.fontSize = '180%';
        charListLabel.style.textAlign = 'center';
        this.addGUI(charListLabel);
        // add characters to the panel
        for (const char of this.characters) {
            const btnChar = new Button(`btn-char-${char.name}`, panelCharacters, char.name);
            btnChar.style.position = 'initial';
            btnChar.style.marginTop = '10px';
            btnChar.style.width = '100%';
            btnChar.style.height = '60px';
            btnChar.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            this.addGUI(btnChar);
        }
        // build new character button
        const btnCreateCharacter = new Button('btn-create-character', panelCharacters, 'Create Character');
        btnCreateCharacter.style.position = 'fixed';
        btnCreateCharacter.style.display = 'block';
        btnCreateCharacter.style.width = '250px';
        btnCreateCharacter.style.float = 'bottom';
        btnCreateCharacter.style.bottom = '75px';
        btnCreateCharacter.style.right = '40px';
        btnCreateCharacter.addEventListener('click', (self: Button, ev: MouseEvent) => {
            console.log('Creating new character...');
        });
        this.addGUI(btnCreateCharacter);
        // build delete character button
        const btnDeleteChar = new Button('btn-create-character', panelCharacters, 'Delete Character');
        btnDeleteChar.style.position = 'fixed';
        btnDeleteChar.style.margin = '5px 10px';
        btnDeleteChar.style.display = 'block';
        btnDeleteChar.style.width = '200px';
        btnDeleteChar.style.float = 'bottom';
        btnDeleteChar.style.bottom = '5px';
        btnDeleteChar.addEventListener('click', (self: Button, ev: MouseEvent) => {
            console.log('Creating new character...');
        });
        this.addGUI(btnDeleteChar);
        // build bakc button
        const btnBack = new Button('btn-create-character', panelCharacters, 'Delete Character');
        btnDeleteChar.style.position = 'fixed';
        btnDeleteChar.style.margin = '5px 10px';
        btnDeleteChar.style.display = 'block';
        btnDeleteChar.style.width = '200px';
        btnDeleteChar.style.float = 'bottom';
        btnDeleteChar.style.bottom = '5px';
        btnDeleteChar.addEventListener('click', (self: Button, ev: MouseEvent) => {
            console.log('Creating new character...');
        });
        this.addGUI(btnDeleteChar);

        const contextMenu = new ContextMenu('ctxm-mymenu', UIParent.get());
        contextMenu.addOption('Option1', () => { console.log('option 1 clicked'); });
        contextMenu.addOption('Option2', () => { console.log('option 2 clicked'); });
        contextMenu.addOption('Option3', () => { console.log('option 3 clicked'); });
        contextMenu.addOption('Option4', () => { console.log('option 4 clicked'); });

        const canvas = <HTMLCanvasElement>document.getElementById('canvas');
        canvas.addEventListener('contextmenu', (ev: MouseEvent) => {
            contextMenu.open(ev.clientX, ev.clientY);
            ev.preventDefault();
        });
    }

    public init() {
        this.fetchCharacerList();
        this.initGUI();

        this.camera = new Camera();
    }

    public final() {
    }

    public update(delta: number) {

    }

    public draw() {

    }
}