import './styles/style.scss'
import * as THREE from 'three';
// Bootstrap imports look unused, but only because DOM is generated
import { Collapse } from 'bootstrap';
import { Modal } from 'bootstrap';

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
        x: 0,
        y: 2,
        z: -5,
    },
    rotation: {
        x: 135,
        y: 42,
        z: 135
    }
};

const colors = [
    {
        name: 'white',
        contrast: 'black',
        hex: '#FFFFFF',
        threeHex: 0xFFFFFF
    },
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
    {
        name: 'gray',
        contrast: 'white',
        hex: '#666666',
        threeHex: 0x666666
    },
    {
        name: 'black',
        contrast: 'white',
        hex: '#030303',
        threeHex: 0x030303
    },
];

const defaultValues = {
    boxPos: { x: 0, y: 1, z: 0 },
    boxSize: { x: 1, y: 1, z: 1 },
    boxColor: 'red',
    incrementStep: 0.5,
    sizeMin: 0.5,
    sizeMax: 10
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

// prepCubeForScene is the event-driven call from the form that converts vals in preparation for adding,
// addBoxToScene actually takes those params and adds them to the scene
// size: int, hexColor: 0x00000, position {x, y, z}
function addBoxToScene(size, hexColor, pos) {
    const color = new THREE.Color(hexColor);
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
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

function prepCubeForScene(e) {
    e.preventDefault();
    let errorMessages = [];
    const targetForm = e.target.form;

    const cubePos = {
        x: Number(targetForm.querySelector('#pos-x').value),
        y: Number(targetForm.querySelector('#pos-y').value),
        z: Number(targetForm.querySelector('#pos-z').value)
    };
    const cubeSize = {
        x: Number(targetForm.querySelector('#size-x').value),
        y: Number(targetForm.querySelector('#size-y').value),
        z: Number(targetForm.querySelector('#size-z').value)
    };
    const color = colors.find(c => c.name === targetForm.querySelector('#box-color').value);
    const colorHex = color?.threeHex;

    for (const pos in cubePos) {
        const posVal = cubePos[pos];
        if (posVal === undefined || typeof (posVal) !== 'number') errorMessages.push(`Invalid Position for ${pos}: ${posVal}`);
    }

    for (const size in cubeSize) {
        const sizeVal = cubeSize[size];
        if (sizeVal === undefined || typeof (sizeVal) !== 'number' || sizeVal <= 0) errorMessages.push(`Invalid Size for ${size}: ${sizeVal}`);
    }

    if (!color || !colorHex) {
        errorMessages.push(`Invalid Color`);
    }

    if (errorMessages.length === 0) {
        addBoxToScene(cubeSize, colorHex, cubePos);
    } else {
        errorModal(`Error adding cube:`, errorMessages);
    }
}

function errorModal(errorTitle, errorMessages) {
    if (errorMessages.length > 0) {
        const modalEl = document.querySelector('.modal');
        const modal = new Modal(modalEl, {
            keyboard: false
        });
        if (modal) {
            const modalTitle = modalEl.querySelector('.modal-title');
            const modalBody = modalEl.querySelector('.modal-body');
            modalTitle.textContent = errorTitle;
            const messageList = document.createElement('ul');
            messageList.setAttribute('id', `message-list`);

            errorMessages.forEach((m) => {
                const li = document.createElement('li');
                li.textContent = m;
                messageList.appendChild(li);
            });
            modalBody.appendChild(messageList);

            modal.show();

            setTimeout(() => {
                modal.hide();
            }, 10000);
        }
    }
}

function resetAddForm(e) {
    e.preventDefault();
    const targetForm = document.getElementById('add-box-form');
    targetForm.querySelector('#box-color').value = defaultValues.boxColor;
    targetForm.querySelector('#size-x').value = defaultValues.boxSize.x;
    targetForm.querySelector('#size-y').value = defaultValues.boxSize.y;
    targetForm.querySelector('#size-z').value = defaultValues.boxSize.z;
    targetForm.querySelector('#pos-x').value = defaultValues.boxPos.x;
    targetForm.querySelector('#pos-y').value = defaultValues.boxPos.y;
    targetForm.querySelector('#pos-z').value = defaultValues.boxPos.z;
}

// add cubes to the menu for editing / deleting
function addCurrentCubesToMenu() {
    removeEventListeners();
    document.querySelector('#current-cubes').innerHTML = ``;

    const sceneChildren = scene.children.filter(child => child.name.indexOf('cube') > -1);
    sceneChildren.forEach((cube) => {
        const camelName = stringToCamel(cube.name);
        const cubeSize = { x: cube.geometry.parameters.width, y: cube.geometry.parameters.height, z: cube.geometry.parameters.depth };
        const rgbColor = cube.material.color;
        const hexColor = rgbColor.getHexString();
        const color = colors.find(c => c.hex === `#${hexColor.toUpperCase()}`);
        const colorName = (color?.name) ? color.name : 'red';
        let cubeDom = document.createElement('div');
        cubeDom.setAttribute('id', `${cube.name}-container`);
        cubeDom.setAttribute('class', `row mb-3 cube-row custom-form`);

        cubeDom.innerHTML = `
        <div class="row mb-2">
            <div class="col-2">
                <span class="material-symbols-outlined remove-cube" id="remove-${cube.name}">delete</span>
            </div>
            <div class="col-10">
                <div class="row">
                    <div class="col-9 text-center">
                        <span class="cube-icon" style="background-color: #${hexColor}">&nbsp;</span>
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
        <div id="edit${camelName}" class="collapse collapse-row">
            <div class="col-12">
                <div class="row mb-3">
                    <label class="custom-label">Size (X/Y/Z):</label>
                    <div class="input-group mb-3">
                        <span class="input-group-text">X:</span>
                        <button id="${cube.name}-size-x-minus" class="btn btn-outline-primary cube-increment">-</button>
                        <input class="form-control cube-input" type="number" name="${cube.name}-size-x" id="${cube.name}-size-x" value="${cubeSize.x}" />
                        <button id="${cube.name}-size-x-add" class="btn btn-outline-primary cube-increment">+</button>
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Y:</span>
                        <button id="${cube.name}-size-y-minus" class="btn btn-outline-primary cube-increment">-</button>
                        <input class="form-control cube-input" type="number" name="${cube.name}-size-y" id="${cube.name}-size-y" value="${cubeSize.y}" />
                        <button id="${cube.name}-size-y-add" class="btn btn-outline-primary cube-increment">+</button>
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Z:</span>
                        <button id="${cube.name}-size-z-minus" class="btn btn-outline-primary cube-increment">-</button>
                        <input class="form-control cube-input" type="number" name="${cube.name}-size-z" id="${cube.name}-size-z" value="${cubeSize.z}" />
                        <button id="${cube.name}-size-z-add" class="btn btn-outline-primary cube-increment">+</button>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="input-group">
                        <label class="input-group-text" for="${cube.name}-color">Color:</label>
                        <select class="form-select cube-color-select" name="${cube.name}-color" id="${cube.name}-color" value="${colorName}"></select>
                    </div>
                </div>
                <div class="row">
                    <label class="custom-label">Position (X/Y/Z):</label>
                    <div class="input-group mb-3">
                        <span class="input-group-text">X:</span>
                        <button id="${cube.name}-pos-x-minus" class="btn btn-outline-primary cube-increment">-</button>
                        <input class="form-control cube-input" type="number" name="${cube.name}-pos-x" id="${cube.name}-pos-x" value="${cube.position.x}" />
                        <button id="${cube.name}-pos-x-add" class="btn btn-outline-primary cube-increment">+</button>
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Y:</span>
                        <button id="${cube.name}-pos-y-minus" class="btn btn-outline-primary cube-increment">-</button>
                        <input class="form-control cube-input" type="number" name="${cube.name}-pos-y" id="${cube.name}-pos-y" value="${cube.position.y}" />
                        <button id="${cube.name}-pos-y-add" class="btn btn-outline-primary cube-increment">+</button>
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Z:</span>
                        <button id="${cube.name}-pos-z-minus" class="btn btn-outline-primary cube-increment">-</button>
                        <input class="form-control cube-input" type="number" name="${cube.name}-pos-z" id="${cube.name}-pos-z" value="${cube.position.z}" />
                        <button id="${cube.name}-pos-z-add" class="btn btn-outline-primary cube-increment">+</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        document.querySelector('#current-cubes').appendChild(cubeDom);
        populateColorSelect(`${cube.name}-color`, colorName);
    });

    // Once DOM is populated, update our Event Listeners
    addEventListeners();
}

function stringToCamel(thisName) {
    return thisName.charAt(0).toUpperCase() + thisName.slice(1);
}

function updateCubeParamsButton(e) {
    const [cubeName, attrName, axis, direction] = e.target.id.split(/-/g);
    updateCubeParams(cubeName, attrName, axis, direction);
}

function updateCubeParams(cubeName, attrName, axis, direction = undefined, newValue = undefined) {
    const cube = scene.getObjectByName(cubeName);
    const targetInput = document.getElementById(`${cubeName}-${attrName}-${axis}`);
    const oldValue = Number(targetInput.value);
    const oldCubeSize = { x: cube.geometry.parameters.width, y: cube.geometry.parameters.height, z: cube.geometry.parameters.depth };
    if (!newValue) {
        newValue = (direction === 'add')
            ? oldValue + defaultValues.incrementStep
            : (attrName === 'size' && oldValue - defaultValues.incrementStep > 0 || attrName === 'pos')
                ? oldValue - defaultValues.incrementStep
                : oldValue;
    }
    targetInput.value = newValue;
    if (attrName === 'size') {
        switch (axis) {
            case 'x':
                cube.geometry = new THREE.BoxGeometry(newValue, oldCubeSize.y, oldCubeSize.z);
                break;
            case 'y':
                cube.geometry = new THREE.BoxGeometry(oldCubeSize.x, newValue, oldCubeSize.z);
                break;
            case 'z':
                cube.geometry = new THREE.BoxGeometry(oldCubeSize.x, oldCubeSize.y, newValue);
                break;
        }
    } else if (attrName === 'pos') {
        cube.position[axis] = newValue;
    } else {
        console.error(`Something went wrong editing the cube: attrName is ${attrName}, needs to be 'size' or 'pos'`);
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

function updateCubeParamsInput(e) {
    e.preventDefault();
    const [cubeName, attrName, axis] = e.target.id.split(/-/g);
    let newValue = e.target.value;
    if (attrName === 'size' && newValue <= 0) newValue = 0.1;
    updateCubeParams(cubeName, attrName, axis, undefined, newValue);
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

function incrementValue(e) {
    e.preventDefault();
    const [attrName, axis, direction] = e.target.id.split(/-/g);
    const targetInput = document.getElementById(`${attrName}-${axis}`);
    const oldValue = Number(targetInput.value);
    // Size can't be less than zero
    targetInput.value = (direction === 'add')
        ? oldValue + defaultValues.incrementStep
        : (attrName === 'size' && oldValue - defaultValues.incrementStep > 0 || attrName === 'pos')
            ? oldValue - defaultValues.incrementStep
            : oldValue;
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

function removeEventListeners() {
    // since we're using dynamically generated DOM, we need to clean up our
    // Event Listeners in order to prevent memory issues
    const colorSelectors = document.querySelectorAll('.cube-color-select');
    colorSelectors.forEach((b) => {
        b.removeEventListener('change', updateCubeColor);
    });

    const cubeInputs = document.querySelectorAll('.cube-input');
    cubeInputs.forEach((i) => {
        i.removeEventListener('keyup', updateCubeParamsInput);
    });

    const delCubeButtons = document.querySelectorAll('.remove-cube');
    delCubeButtons.forEach((b) => {
        b.removeEventListener('click', removeCube);
    });

    const incrementButtons = document.querySelectorAll('.cube-increment');
    incrementButtons.forEach((b) => {
        b.removeEventListener('click', updateCubeParamsButton);
    });
}

function addEventListeners() {
    const colorSelectors = document.querySelectorAll('.cube-color-select');
    colorSelectors.forEach((b) => {
        b.addEventListener('change', updateCubeColor);
    });

    const cubeInputs = document.querySelectorAll('.cube-input');
    cubeInputs.forEach((i) => {
        i.addEventListener('keyup', updateCubeParamsInput);
    });

    const delCubeButtons = document.querySelectorAll('.remove-cube');
    delCubeButtons.forEach((b) => {
        b.addEventListener('click', removeCube);
    });

    const incrementButtons = document.querySelectorAll('.cube-increment');
    incrementButtons.forEach((b) => {
        b.addEventListener('click', updateCubeParamsButton);
    });
}

document.querySelector('#app').innerHTML = `
    <div class="main-container">
        <div id="scene-container"></div>
        <div class="container" id="controls-container">
            <div id="add-box-container" class="container-fluid mb-3">
                <div class="row mb-1">
                    <button class="btn btn-secondary collapse-button collapsed col-12 ml-1" id="collapse-add-new" type="button"
                            data-bs-toggle="collapse" data-bs-target="#addNewContainer" aria-expanded="false" 
                            aria-controls="#addNewContainer">
                            <span>Add New Cube</span>
                            <span class="material-symbols-outlined expand-more">expand_more</span>
                            <span class="material-symbols-outlined expand-less">expand_less</span>
                    </button>
                </div>
                <div class="collapse collapse-row" id="addNewContainer">
                    <form id="add-box-form" action="" onsubmit="return false;" class="col custom-form">
                        <div class="input-group mb-3">
                            <label class="custom-label">Size (X/Y/Z):</label>
                            <div class="input-group mb-1">
                                <span class="input-group-text">X:</span>
                                <button id="size-x-minus" class="btn btn-outline-primary increment-button">-</button>
                                <input class="form-control" type="number" placeholder="X" name="size-x" id="size-x" value="${defaultValues.boxSize.x}" />
                                <button id="size-x-add" class="btn btn-outline-primary increment-button">+</button>
                            </div>
                            <div class="input-group mb-1">
                                <span class="input-group-text">Y:</span>
                                <button id="size-y-minus" class="btn btn-outline-primary increment-button">-</button>
                                <input class="form-control" type="number" placeholder="Y" name="size-y" id="size-y" value="${defaultValues.boxSize.y}" />
                                <button id="size-y-add" class="btn btn-outline-primary increment-button">+</button>
                            </div>
                            <div class="input-group mb-1">
                                <span class="input-group-text">Z:</span>
                                <button id="size-z-minus" class="btn btn-outline-primary increment-button">-</button>
                                <input class="form-control" type="number" placeholder="Z" name="size-z" id="size-z" value="${defaultValues.boxSize.z}" />
                                <button id="size-z-add" class="btn btn-outline-primary increment-button">+</button>
                            </div>
                        </div>
                        <div class="input-group mb-3">
                            <label class="input-group-text" for="box-color">Color:</label>
                            <select class="form-select" name="box-color" id="box-color"></select>
                        </div>
                        <div class="input-group mb-3">
                            <label class="custom-label">Position (X/Y/Z):</label>
                            <div class="input-group mb-1">
                                <span class="input-group-text">X:</span>
                                <button id="pos-x-minus" class="btn btn-outline-primary increment-button">-</button>
                                <input class="form-control" type="number" placeholder="X" name="pos-x" id="pos-x" value="${defaultValues.boxPos.x}" />
                                <button id="pos-x-add" class="btn btn-outline-primary increment-button">+</button>
                            </div>
                            <div class="input-group mb-1">
                                <span class="input-group-text">Y:</span>
                                <button id="pos-y-minus" class="btn btn-outline-primary increment-button">-</button>
                                <input class="form-control" type="number" placeholder="Y" name="pos-y" id="pos-y" value="${defaultValues.boxPos.y}" />
                                <button id="pos-y-add" class="btn btn-outline-primary increment-button">+</button>
                            </div>
                            <div class="input-group mb-1">
                                <span class="input-group-text">Z:</span>
                                <button id="pos-z-minus" class="btn btn-outline-primary increment-button">-</button>
                                <input class="form-control" type="number" placeholder="Z" name="pos-z" id="pos-z" value="${defaultValues.boxPos.z}" />
                                <button id="pos-z-add" class="btn btn-outline-primary increment-button">+</button>
                            </div>
                        </div>
                        <div class="row">
                            <button class="btn btn-secondary col" id="clear-form">Reset</button>
                            <button class="btn btn-primary col" id="add-cube">Add Cube</button>
                        </div>
                    </form>
                </div>
            </div>
            <div id="edit-container" class="container-fluid">
                <div class="row mb-1">
                    <p>Current Cubes:</p>
                </div>
                <div id="current-cubes"></div>
            </div>
        </div>
        <div class="modal" id="modal-popup" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

populateColorSelect('box-color', 'red');

// Set up events after DOM load
document.querySelector('#add-cube').addEventListener('click', prepCubeForScene);
document.querySelector('#clear-form').addEventListener('click', resetAddForm);

const incrementButtons = document.querySelectorAll('.increment-button');
incrementButtons.forEach((b) => {
    b.addEventListener('click', incrementValue);
});

init();
animate();
