import './styles/style.scss'
import * as THREE from 'three';
import { Collapse } from 'bootstrap';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Setup
const cameraSettings = {
    fov: 75,
    width: 600,
    height: 600,
    near: 0.1,
    far: 1000,
    position: {
        x: 5,
        y: 2,
        z: -5,
    },
    rotation: {
        x: -135,
        y: 42,
        z: 135
    }
};

const colors = [
    {
        name: 'red',
        contrast: 'white',
        hex: '#9D0000',
        threeHex: 0x9D0000
    },
    {
        name: 'orange',
        contrast: 'black',
        hex: '#C07E00',
        threeHex: 0xC07E00
    },
    {
        name: 'yellow',
        contrast: 'black',
        hex: '#D9D900',
        threeHex: 0xD9D900
    },
    {
        name: 'green',
        contrast: 'white',
        hex: '#009D00',
        threeHex: 0x009D00
    },
    {
        name: 'blue',
        contrast: 'white',
        hex: '#00009D',
        threeHex: 0x00009D
    },
    {
        name: 'purple',
        contrast: 'white',
        hex: '#9D009D',
        threeHex: 0x9D009D
    },
    {
        name: 'violet',
        contrast: 'black',
        hex: '#D900CC',
        threeHex: 0xD900CC
    },
];

const defaultValues = {
    boxPos: 1,
    boxSize: 1,
    boxColor: 'red'
}

let camera, container, controls, cubeNum, renderer, scene;

const init = () => {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    container = document.querySelector('#scene-container');
    container.appendChild(renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const environment = new RoomEnvironment(renderer);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbbbbbb);
    scene.environment = pmremGenerator.fromScene(environment).texture;
    environment.dispose();

    const grid = new THREE.GridHelper(50, 50, 0xffffff, 0xffffff);
    grid.material.opacity = 0.5;
    grid.material.depthWrite = false;
    grid.material.transparent = true;
    grid.position.y = -0.5;
    scene.add(grid);

    camera = new THREE.PerspectiveCamera(cameraSettings.fov, window.innerWidth / window.innerHeight, cameraSettings.near, cameraSettings.far);

    //Create a DirectionalLight and turn on shadows for the light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 9, 3); //default; light shining from top
    scene.add(light);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;

    //controls.update() must be called after any manual changes to the camera's transform
    camera.position.set(cameraSettings.position.x, cameraSettings.position.y, cameraSettings.position.z);
    controls.target.set(convertDegToRads(cameraSettings.rotation.x), convertDegToRads(cameraSettings.rotation.y), convertDegToRads(cameraSettings.rotation.z));

    controls.update();
    camera.updateProjectionMatrix();

    cubeNum = 0;
    addBoxToScene(1, 0x009D00, { x: 0, y: 0, z: 0 });
}

// addCubeToScene is the event-driven call from the form that converts vals in preparation for adding,
// addBoxToScene actually takes those params and adds them to the scene
// size: int, hexColor: 0x00000, position {x, y, z}
function addBoxToScene(size, hexColor, pos) {
    const color = new THREE.Color(hexColor);
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = pos.x;
    cube.position.y = pos.y;
    cube.position.z = pos.z;
    cube.name = `cube${cubeNum}`;
    cubeNum++;
    scene.add(cube);
    addCurrentCubesToMenu();
}

function addCubeToScene(e) {
    e.preventDefault();
    let validated = true;
    const targetForm = e.target.form;
    const size = targetForm.querySelector('#box-size').value;
    const color = colors.find(c => c.name === targetForm.querySelector('#box-color').value);
    const colorHex = color.threeHex;

    let cubePos = { x: targetForm.querySelector('#box-x').value, y: targetForm.querySelector('#box-y').value, z: targetForm.querySelector('#box-z').value }
    if (!size || !Number(size) || size < 1 || size > 10) {
        validated = false;
        alert('Invalid value for "size"');
    }
    if (!colorHex) {
        validated = false;
        alert('Invalid value for "color"');
    }
    if (!cubePos.x || !cubePos.y || !cubePos.z) {
        validated = false;
        alert('Invalid value for cube position');
    }
    if (validated) {
        addBoxToScene(size, colorHex, cubePos);
    }

    // Clear Form
    targetForm.querySelector('#box-color').value = defaultValues.boxColor;
    targetForm.querySelector('#box-size').value = defaultValues.boxSize;
    targetForm.querySelector('#box-size-display').innerHTML = defaultValues.boxSize;
    targetForm.querySelector('#box-x').value = defaultValues.boxPos;
    targetForm.querySelector('#box-y').value = defaultValues.boxPos;
    targetForm.querySelector('#box-z').value = defaultValues.boxPos;
}

// add cubes to the menu for editing / deleting
function addCurrentCubesToMenu() {
    document.querySelector('#current-cubes').innerHTML = ``;

    const sceneChildren = scene.children.filter(child => child.name.indexOf('cube') > -1);
    sceneChildren.forEach((cube) => {
        const camelName = stringToCamel(cube.name);
        const rgbColor = cube.material.color;
        const hexColor = rgbColor.getHexString();
        const color = colors.find(c => c.hex === `#${hexColor.toUpperCase()}`);
        const colorName = (color?.name) ? color.name : 'red';
        let cubeDom = document.createElement('div');
        cubeDom.setAttribute('id', `${cube.name}-container`);
        cubeDom.setAttribute('class', `row mb-3 cube-row custom-form`);
        // this is simplified, boxSize should be an obj with x, y, z, but for simplicity, only working with equilateral cubes
        let boxSize = cube.geometry.parameters.height;

        cubeDom.innerHTML = `
        <div class="row mb-2">
            <div class="col-2">
                <span class="material-symbols-outlined remove-cube" id="remove-${cube.name}">delete</span>
            </div>
            <div class="col-10">
                <div class="row">
                    <div class="col-9 text-center">
                        <span class="cube-edit-title">${cube.name}</span>
                    </div>
                    <div class="col-1">
                        <button class="btn btn-secondary collapse-button ml-1 collapsed" id="collapse${camelName}" type="button"
                            data-bs-toggle="collapse" data-bs-target="#edit${camelName}" aria-expanded="false" 
                            aria-controls="#edit${camelName}">
                            <span class="material-symbols-outlined expand-more">expand_more</span>
                            <span class="material-symbols-outlined expand-less">expand_less</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div id="edit${camelName}" class="collapse">
            <div class="col-12">
                <div class="row mb-3">
                    <div class="input-group">
                        <span class="input-group-text">Size:</span>
                        <button id="${cube.name}-size-minus" class="btn btn-outline-primary cube-size-change">-</button>
                        <input class="form-control" type="number" name="${cube.name}-size" id="${cube.name}-size" value="${boxSize}" />
                        <button id="${cube.name}-size-add" class="btn btn-outline-primary cube-size-change">+</button>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="input-group">
                        <label class="input-group-text" for="${cube.name}-color">Color:</label>
                        <select class="form-select cube-color-select" name="${cube.name}-color" id="${cube.name}-color" value="${colorName}"></select>
                    </div>
                </div>
                <div class="row">
                    <label>Position (X/Y/Z):</label>
                    <div class="input-group mb-3">
                        <span class="input-group-text">X:</span>
                        <button id="${cube.name}-x-minus" class="btn btn-outline-primary cube-update-pos">-</button>
                        <input class="form-control" type="number" name="${cube.name}-x" id="${cube.name}-x" value="${cube.position.x}" />
                        <button id="${cube.name}-x-add" class="btn btn-outline-primary cube-update-pos">+</button>
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Y:</span>
                        <button id="${cube.name}-y-minus" class="btn btn-outline-primary cube-update-pos">-</button>
                        <input class="form-control" type="number" name="${cube.name}-y" id="${cube.name}-y" value="${cube.position.y}" />
                        <button id="${cube.name}-y-add" class="btn btn-outline-primary cube-update-pos">+</button>
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Z:</span>
                        <button id="${cube.name}-z-minus" class="btn btn-outline-primary cube-update-pos">-</button>
                        <input class="form-control" type="number" name="${cube.name}-z" id="${cube.name}-z" value="${cube.position.z}" />
                        <button id="${cube.name}-z-add" class="btn btn-outline-primary cube-update-pos">+</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        document.querySelector('#current-cubes').appendChild(cubeDom);
        populateColorSelect(`${cube.name}-color`, colorName);
    });

    const collapseElementList = [].slice.call(document.querySelectorAll('.collapse'))
    collapseElementList.map(function (collapseEl) {
        new Collapse(collapseEl)
    })

    // Once DOM is populated, update our Event Listeners
    const delCubeButtons = document.querySelectorAll('.remove-cube');
    delCubeButtons.forEach((b) => {
        b.addEventListener('click', removeCube);
    });

    const addMinusButtons = document.querySelectorAll('.cube-size-change');
    addMinusButtons.forEach((b) => {
        b.addEventListener('click', updateCubeSize);
    });

    const changePosButtons = document.querySelectorAll('.cube-update-pos');
    changePosButtons.forEach((b) => {
        b.addEventListener('click', updateCubePosition);
    })

    const colorSelectors = document.querySelectorAll('.cube-color-select');
    colorSelectors.forEach((b) => {
        b.addEventListener('change', updateCubeColor);
    });
}

function stringToCamel(thisName) {
    const nameRay = thisName.split('');
    let newName = '';
    nameRay.forEach((c, i) => {
        newName += (i === 0) ? c.toUpperCase() : c;
    });
    return newName;
}

function updateCubeSize(e) {
    e.preventDefault();
    const splitId = e.target.id.split(/-/g);
    const cubeName = splitId[0];
    const cube = scene.getObjectByName(cubeName);
    const oldVal = document.getElementById(`${cubeName}-size`).value;
    const newValue = (splitId[2] === 'add') ? Number(oldVal) + 1 : Number(oldVal) - 1;
    document.getElementById(`${cubeName}-size`).value = newValue;
    cube.geometry = new THREE.BoxGeometry(newValue, newValue, newValue);
    animate();
}

function updateCubePosition(e) {
    const splitId = e.target.id.split(/-/g);
    const axis = splitId[1];
    const direction = splitId[2];
    const cube = scene.getObjectByName(splitId[0]);
    const thisInput = document.querySelector(`#${splitId[0]}-${axis}`);
    let newVal = Number(thisInput.value);
    if (axis === 'x') {
        newVal = (direction === 'add') ? cube.position.x + 1 : cube.position.x - 1;
        thisInput.value = cube.position.x = newVal;
    } else if (axis === 'y') {
        newVal = (direction === 'add') ? cube.position.y + 1 : cube.position.y - 1;
        thisInput.value = cube.position.y = newVal;
    } else if (axis === 'z') {
        newVal = (direction === 'add') ? cube.position.z + 1 : cube.position.z - 1;
        thisInput.value = cube.position.z = newVal;
    }
    animate();
}

function updateCubeColor(e) {
    const color = colors.find(c => c.name === e.target.value);
    const splitId = e.target.id.split(/-/g); // ${cube.name}-color
    const cube = scene.getObjectByName(splitId[0]);
    if (cube && cube.material) {
        cube.material.color.setHex(color.threeHex);
    }
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Radians = Degrees × (π/180)
function convertDegToRads(deg) {
    const PI = 22 / 7;
    return (deg * (PI / 180));
}

function convertRadsToDeg(rads) {
    const PI = 22 / 7;
    return (rads / (PI / 180));
}

function incrementButton(e) {
    e.preventDefault();
    const thisId = e.target.id;
    let dir = 0;
    let idData = undefined;
    if (thisId.indexOf('-add') > -1) {
        idData = thisId.split('-add');
        dir = 1;
    } else if (thisId.indexOf('-minus') > -1) {
        idData = thisId.split('-minus')
        dir = -1;
    }
    const targetInput = document.querySelector(`#${idData[0]}`);
    // positions can be 0 and negative, but not size
    if (idData[0] === 'box-size' && dir < 0 && targetInput.value <= 1) {
        return;
    }
    targetInput.value = Number(targetInput.value) + dir;
}

function populateColorSelect(targetId, selectedColor) {
    colors.forEach((color, i) => {
        let newOpt = document.createElement("option");
        newOpt.value = color.name;
        newOpt.setAttribute('style', `background-color:${color.hex}; color: ${color.contrast};`);
        newOpt.textContent = stringToCamel(color.name);
        if (color.name === selectedColor) newOpt.setAttribute('selected', 'selected');
        document.querySelector(`#${targetId}`).appendChild(newOpt);
    })
}

function removeCube(e) {
    e.preventDefault();
    const cubeName = e.target.id.replace('remove-', '');
    const doomedCube = scene.getObjectByName(cubeName);
    scene.remove(doomedCube);
    animate();
    addCurrentCubesToMenu();
}

function updateBoxSizeDisplay(e) {
    document.querySelector('#box-size-display').innerHTML = e.target.value;
}

document.querySelector('#app').innerHTML = `
    <div class="main-container">
        <div id="scene-container"></div>
        <div id="edit-container" class="container controls-container">
            <div class="row mb-1">
                <p>Current Cubes:</p>
            </div>
            <div id="current-cubes"></div>
        </div>
        <div id="add-box-container" class="container controls-container">
            <form id="add-box-form" action="" onsubmit="return false;" class="col custom-form">
                <div class="row mb-1">
                    <p>Add new cube:</p>
                </div>
                <div class="mb-1">
                    <label for="box-size">Size (1-10):</label>
                    <span id="box-size-display">1</span>
                </div>
                <div class="input-group mb-3">
                    <input type="range" class="form-range" name="box-size" id="box-size" value="1" step="1" min="1" max="10" />
                </div>
                <div class="input-group mb-3">
                    <label class="input-group-text" for="box-color">Color:</label>
                    <select class="form-select" name="box-color" id="box-color"></select>
                </div>
                <div class="input-group mb-3">
                    <p>Position (X/Y/Z):</p>
                    <div class="input-group mb-1">
                        <span class="input-group-text">X:</span>
                        <button id="box-x-minus" class="btn btn-outline-primary box-x-button">-</button>
                        <input class="form-control" type="number" placeholder="X" name="box-x" id="box-x" value="1" />
                        <button id="box-x-add" class="btn btn-outline-primary box-x-button">+</button>
                    </div>
                    <div class="input-group mb-1">
                        <span class="input-group-text">Y:</span>
                        <button id="box-y-minus" class="btn btn-outline-primary box-y-button">-</button>
                        <input class="form-control" type="number" placeholder="Y" name="box-y" id="box-y" value="0" />
                        <button id="box-y-add" class="btn btn-outline-primary box-y-button">+</button>
                    </div>
                    <div class="input-group mb-1">
                        <span class="input-group-text">Z:</span>
                        <button id="box-z-minus" class="btn btn-outline-primary box-z-button">-</button>
                        <input class="form-control" type="number" placeholder="Z" name="box-z" id="box-z" value="1" />
                        <button id="box-z-add" class="btn btn-outline-primary box-z-button">+</button>
                    </div>
                </div>
                <button class="btn btn-primary" id="add-cube">Add Cube</button>
            </form>
        </div>
    </div>
`;

populateColorSelect('box-color', 'red');

// Set up events after DOM load
document.querySelector('#add-cube').addEventListener('click', addCubeToScene);
document.querySelector('#box-size').addEventListener('input', updateBoxSizeDisplay);

const boxXButtons = document.querySelectorAll('.box-x-button');
boxXButtons.forEach((b) => {
    b.addEventListener('click', incrementButton);
});

const boxYButtons = document.querySelectorAll('.box-y-button');
boxYButtons.forEach((b) => {
    b.addEventListener('click', incrementButton);
});

const boxZButtons = document.querySelectorAll('.box-z-button');
boxZButtons.forEach((b) => {
    b.addEventListener('click', incrementButton);
});

init();
animate();
