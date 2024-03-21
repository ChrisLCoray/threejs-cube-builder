import './styles/style.scss'
import * as THREE from 'three';
// Bootstrap imports look unused, but only because DOM is generated
import { Collapse } from 'bootstrap';
import { Modal } from 'bootstrap';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { cameraSettings, capitalizeFirst, colors, convertDegToRads, defaultValues as dv, getColorByName, instructions } from './utilities';

// Setup
let camera, container, controls, cubeNum = 0, renderer, scene;

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
    toggleTempWireframe();
    showModal(`Instructions`, instructions);
}

function addBoxToScene(hexColor, size, pos) {
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

function addCurrentCubesToMenu() {
    removeEventListeners();
    document.querySelector('#current-cubes').innerHTML = ``;

    const sceneChildren = scene.children.filter(child => child.name.indexOf('cube') > -1);
    sceneChildren.forEach((cube) => {
        const camelName = capitalizeFirst(cube.name);
        const cubeSize = { x: cube.geometry.parameters.width, y: cube.geometry.parameters.height, z: cube.geometry.parameters.depth };
        const rgbColor = cube.material.color;
        const hexColor = rgbColor.getHexString();
        const color = colors.find(c => c.hex === `#${hexColor.toUpperCase()}`);
        const colorName = (color?.name) ? color.name : 'red';
        let cubeDom = document.createElement('div');
        cubeDom.setAttribute('id', `${cube.name}-container`);
        cubeDom.setAttribute('class', `mb-3 cube-row custom-form container-fluid`);

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
        <div id="edit${camelName}" class="collapse collapse-row row">
            <div class="col-12">
                <div class="row mb-3">
                    <label class="custom-label">Size:</label>
                    <div class="row mb-1">
                        <label for="${cube.name}-size-x" class="col-sm-2 col-form-label" title="Width / X">W:</label>
                        <div class="col-sm-10">
                            <div class="input-group">
                                <button id="${cube.name}-size-x-minus" class="btn btn-outline-primary cube-increment">-</button>
                                <input class="form-control cube-input" type="number" 
                                    name="${cube.name}-size-x" id="${cube.name}-size-x" value="${cubeSize.x}" 
                                    min="${dv.sizeMin}" max="${dv.sizeMax}" step="${dv.inputStep}" />
                                <button id="${cube.name}-size-x-add" class="btn btn-outline-primary cube-increment">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-1">
                        <label for="${cube.name}-size-y" class="col-sm-2 col-form-label" title="Height / Y">H:</label>
                        <div class="col-sm-10">
                            <div class="input-group">
                                <button id="${cube.name}-size-y-minus" class="btn btn-outline-primary cube-increment">-</button>
                                <input class="form-control cube-input" type="number" 
                                    name="${cube.name}-size-y" id="${cube.name}-size-y" value="${cubeSize.y}" 
                                    min="${dv.sizeMin}" max="${dv.sizeMax}" step="${dv.inputStep}" />
                                <button id="${cube.name}-size-y-add" class="btn btn-outline-primary cube-increment">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-1">
                        <label for="${cube.name}-size-z" class="col-sm-2 col-form-label" title="Depth / Z">D:</label>
                        <div class="col-sm-10">
                            <div class="input-group">
                                <button id="${cube.name}-size-z-minus" class="btn btn-outline-primary cube-increment">-</button>
                                <input class="form-control cube-input" type="number" 
                                    name="${cube.name}-size-z" id="${cube.name}-size-z" value="${cubeSize.z}" 
                                    min="${dv.sizeMin}" max="${dv.sizeMax}" step="${dv.inputStep}" />
                                <button id="${cube.name}-size-z-add" class="btn btn-outline-primary cube-increment">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row mb-3">
                    <label for="${cube.name}-color" class="col-sm-4">Color:</label>
                    <div class="col-sm-8">
                        <select class="form-select cube-color-select" name="${cube.name}-color" id="${cube.name}-color" 
                            value="${colorName}"></select>
                    </div>
                </div>
                </div>
                <div class="row">
                    <label class="custom-label">Position:</label>
                    <div class="row mb-1">
                        <label for="${cube.name}-pos-x" class="col-sm-2 col-form-label">X:</label>
                        <div class="col-sm-10">
                            <div class="input-group">
                                <button id="${cube.name}-pos-x-minus" class="btn btn-outline-primary cube-increment">-</button>
                                <input class="form-control cube-input" type="number" 
                                    name="${cube.name}-pos-x" id="${cube.name}-pos-x" value="${cube.position.x}" 
                                    min="${dv.posMin}" max="${dv.posMax}" step="${dv.inputStep}" />
                                <button id="${cube.name}-pos-x-add" class="btn btn-outline-primary cube-increment">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-1">
                        <label for="${cube.name}-pos-y" class="col-sm-2 col-form-label">Y:</label>
                        <div class="col-sm-10">
                            <div class="input-group">
                                <button id="${cube.name}-pos-y-minus" class="btn btn-outline-primary cube-increment">-</button>
                                <input class="form-control cube-input" type="number" 
                                    name="${cube.name}-pos-y" id="${cube.name}-pos-y" value="${cube.position.y}" 
                                    min="${dv.posMin}" max="${dv.posMax}" step="${dv.inputStep}" />
                                <button id="${cube.name}-pos-y-add" class="btn btn-outline-primary cube-increment">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-1">
                        <label for="${cube.name}-pos-z" class="col-sm-2 col-form-label">Z:</label>
                        <div class="col-sm-10">
                            <div class="input-group">
                                <button id="${cube.name}-pos-z-minus" class="btn btn-outline-primary cube-increment">-</button>
                                <input class="form-control cube-input" type="number" 
                                    name="${cube.name}-pos-z" id="${cube.name}-pos-z" value="${cube.position.z}" 
                                    min="${dv.posMin}" max="${dv.posMax}" step="${dv.inputStep}" />
                                <button id="${cube.name}-pos-z-add" class="btn btn-outline-primary cube-increment">+</button>
                            </div>
                        </div>
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

function addEventListeners() {
    document.querySelectorAll('.cube-color-select').forEach((b) => {
        b.addEventListener('change', updateCubeColor);
    });

    document.querySelectorAll('.cube-input').forEach((i) => {
        i.addEventListener('keyup', updateCubeParamsInput);
    });

    document.querySelectorAll('.remove-cube').forEach((b) => {
        b.addEventListener('click', removeCube);
    });

    document.querySelectorAll('.cube-increment').forEach((b) => {
        b.addEventListener('click', updateCubeParamsButton);
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function getAttrsFromForm() {
    const addCubeForm = document.getElementById('add-box-form');
    const color = getColorByName(addCubeForm.querySelector('#box-color').value);
    const colorHex = color?.threeHex;
    const cubePos = {
        x: Number(addCubeForm.querySelector(`#${dv.cubeName}-pos-x`).value),
        y: Number(addCubeForm.querySelector(`#${dv.cubeName}-pos-y`).value),
        z: Number(addCubeForm.querySelector(`#${dv.cubeName}-pos-z`).value)
    };
    const cubeSize = {
        x: Number(addCubeForm.querySelector(`#${dv.cubeName}-size-x`).value),
        y: Number(addCubeForm.querySelector(`#${dv.cubeName}-size-y`).value),
        z: Number(addCubeForm.querySelector(`#${dv.cubeName}-size-z`).value)
    };
    return [colorHex, cubePos, cubeSize];
}

/**
 * Generic function for logging values to the console more quickly
 * @param {string} funcName // name of function so we know origin
 * @param  {...args} args // key-value object of items to log, where key is var name, value is value
 */
function logValues(funcName, args) {
    for (const arg in args) {
        const value = args[arg];
        const argType = typeof value;
        // considered making this a switch, but for brevity leaving as simple ternary
        (argType === 'string' || argType === 'number')
            ? console.log(`${funcName} ${arg} = ${value} `)
            : console.log(`${funcName} ${arg} = `, value);
    }
}

function parseCubeDataForScene(e) {
    e.preventDefault();
    let errorMessages = [];
    const [colorHex, cubePos, cubeSize] = getAttrsFromForm();

    for (const pos in cubePos) {
        const posVal = cubePos[pos];
        if (posVal === undefined || typeof (posVal) !== 'number') errorMessages.push(`Invalid Position for ${pos}: ${posVal}`);
    }

    for (const size in cubeSize) {
        const sizeVal = cubeSize[size];
        if (sizeVal === undefined || typeof (sizeVal) !== 'number' || sizeVal <= 0) errorMessages.push(`Invalid Size for ${size}: ${sizeVal}`);
    }

    if (!colorHex) {
        errorMessages.push(`Invalid Color`);
    }

    if (errorMessages.length === 0) {
        addBoxToScene(colorHex, cubeSize, cubePos);
    } else {
        showModal(`Error adding cube:`, errorMessages, true);
    }
}

function populateColorSelect(targetId, selectedColor) {
    colors.forEach((color, i) => {
        let newOpt = document.createElement("option");
        newOpt.value = color.name;
        newOpt.setAttribute('style', `background-color:${color.hex}; color: ${color.contrast};`);
        newOpt.textContent = capitalizeFirst(color.name);
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
    document.querySelectorAll('.cube-color-select').forEach((b) => {
        b.removeEventListener('change', updateCubeColor);
    });

    document.querySelectorAll('.cube-input').forEach((i) => {
        i.removeEventListener('keyup', updateCubeParamsInput);
    });

    document.querySelectorAll('.remove-cube').forEach((b) => {
        b.removeEventListener('click', removeCube);
    });

    document.querySelectorAll('.cube-increment').forEach((b) => {
        b.removeEventListener('click', updateCubeParamsButton);
    });
}

function resetAddForm(e) {
    e.preventDefault();
    const targetForm = document.getElementById('add-box-form');
    targetForm.querySelector('#box-color').value = dv.boxColor;
    targetForm.querySelector('#size-x').value = dv.boxSize.x;
    targetForm.querySelector('#size-y').value = dv.boxSize.y;
    targetForm.querySelector('#size-z').value = dv.boxSize.z;
    targetForm.querySelector('#pos-x').value = dv.boxPos.x;
    targetForm.querySelector('#pos-y').value = dv.boxPos.y;
    targetForm.querySelector('#pos-z').value = dv.boxPos.z;
}

function showInstructions(e) {
    showModal(`Instructions`, instructions);
}

function showModal(modalTitle, modalContent, autoClose = false) {
    if (modalContent.length > 0) {
        const modalEl = document.querySelector('.modal');
        let modal = new Modal(modalEl, {
            keyboard: false
        });
        if (modal) {
            const title = modalEl.querySelector('.modal-title');
            const modalBody = modalEl.querySelector('.modal-body');
            modalBody.textContent = ``; // resets body
            title.textContent = modalTitle;
            const messageList = document.createElement('ul');
            messageList.setAttribute('id', `message-list`);

            modalContent.forEach((m) => {
                const li = document.createElement('li');
                li.textContent = m;
                messageList.appendChild(li);
            });
            modalBody.appendChild(messageList);

            modal.show();
            if (autoClose) {
                setTimeout(() => {
                    modal.hide();
                    modal = null; // for garbage collection, null out the new Modal
                }, 10000);
            }
        }
    }
}

function toggleTempWireframe(e) {
    const tempCube = scene.getObjectByName(dv.cubeName);
    if (tempCube) {
        scene.remove(tempCube);
    } else {
        const color = getColorByName('black');
        const [, cubePos, cubeSize] = getAttrsFromForm();
        const geometry = new THREE.BoxGeometry(cubeSize.x, cubeSize.y, cubeSize.z);
        const wireframe = new THREE.WireframeGeometry(geometry);
        const cubeBox = new THREE.LineSegments(wireframe);
        cubeBox.material.color = color.threeHex;
        cubeBox.material.depthTest = false;
        cubeBox.material.opacity = 0.25;
        cubeBox.material.transparent = true;
        cubeBox.name = dv.cubeName;
        cubeBox.position.x = cubePos.x;
        cubeBox.position.y = cubePos.y;
        cubeBox.position.z = cubePos.z;

        scene.add(cubeBox);
    }
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

function updateCubeInScene(cube, attrName, axis, newValue) {
    const oldCubeSize = { x: cube.geometry.parameters.width, y: cube.geometry.parameters.height, z: cube.geometry.parameters.depth };

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
        // Theoretically should never happen, but to prevent the code from crashing, log the problem and return
        console.error(`Something went wrong editing the cube: attrName is ${attrName}, needs to be 'size' or 'pos'`);
        return;
    }

    animate();
}

function updateCubeParams(cubeName, attrName, axis, direction = undefined, newValue = undefined) {
    const cube = scene.getObjectByName(cubeName);
    const targetInput = document.getElementById(`${cubeName}-${attrName}-${axis}`);
    const oldValue = Number(targetInput.value);
    if (!newValue) {
        newValue = (direction === 'add')
            ? oldValue + dv.incrementStep
            : (attrName === 'size' && oldValue - dv.incrementStep > 0 || attrName === 'pos')
                ? oldValue - dv.incrementStep
                : oldValue;
    }
    targetInput.value = newValue;
    updateCubeInScene(cube, attrName, axis, newValue);
}

function updateCubeParamsButton(e) {
    const [cubeName, attrName, axis, direction] = e.target.id.split(/-/g);
    updateCubeParams(cubeName, attrName, axis, direction);
}

function updateCubeParamsInput(e) {
    e.preventDefault();
    const key = e.key;
    let newValue = Number(e.target.value);
    const keyNum = Number(key);

    if (Number.isNaN(keyNum) && key !== 'Backspace') {
        return;
    }
    const [cubeName, attrName, axis] = e.target.id.split(/-/g);

    // check constraints and adjust accordingly
    if (attrName === 'size') {
        if (newValue < dv.sizeMin) newValue = dv.sizeMin;
        if (newValue > dv.sizeMax) newValue = dv.sizeMax;
    }

    if (attrName === 'pos') {
        if (newValue < dv.posMin) newValue = dv.posMin;
        if (newValue > dv.posMax) newValue = dv.posMax;
    }
    updateCubeParams(cubeName, attrName, axis, undefined, newValue);
}

document.querySelector('#app').innerHTML = `
    <div class="main-container">
        <div id="scene-container"></div>
        <div class="container" id="controls-container">
            <div id="add-box-container" class="container-fluid mb-3">
                <div class="row mb-1">
                    <button class="btn btn-secondary collapse-button col-10 ml-1" id="collapse-add-new" type="button"
                            data-bs-toggle="collapse" data-bs-target="#addNewContainer" aria-expanded="true" 
                            aria-controls="#addNewContainer">
                            <span>Add New Cube</span>
                            <span class="material-symbols-outlined expand-more">expand_more</span>
                            <span class="material-symbols-outlined expand-less">expand_less</span>
                    </button>
                    <a href="#" class="col-2 ml-1" id="instructions">
                        <span class="material-symbols-outlined">help</span>
                    </a>
                </div>
                <div class="collapse collapse-row show" id="addNewContainer">
                    <form id="add-box-form" action="" onsubmit="return false;" class="col custom-form">
                        <div class="row mt-3 mb-3">
                            <label class="custom-label">Size:</label>
                            <div class="row mb-1">
                                <label for="${dv.cubeName}-size-x" class="col-sm-4 col-form-label" title="Width / X">Width:</label>
                                <div class="col-sm-8">
                                    <div class="input-group">
                                        <button id="${dv.cubeName}-size-x-minus" class="btn btn-outline-primary increment-button">-</button>
                                        <input class="form-control add-cube-input" type="number" placeholder="X" 
                                            name="${dv.cubeName}-size-x" id="${dv.cubeName}-size-x" 
                                            min="${dv.sizeMin}" max="${dv.sizeMax}" step="${dv.inputStep}" 
                                            value="${dv.boxSize.x}" />
                                        <button id="${dv.cubeName}-size-x-add" class="btn btn-outline-primary increment-button">+</button>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-1">
                                <label for="${dv.cubeName}-size-y" class="col-sm-4 col-form-label" title="Height / Y">Height:</label>
                                <div class="col-sm-8">
                                    <div class="input-group">
                                        <button id="${dv.cubeName}-size-y-minus" class="btn btn-outline-primary increment-button">-</button>
                                        <input class="form-control add-cube-input" type="number" placeholder="Y"
                                            name="${dv.cubeName}-size-y" id="${dv.cubeName}-size-y" 
                                            min="${dv.sizeMin}" max="${dv.sizeMax}" step="${dv.inputStep}" 
                                            value="${dv.boxSize.y}" />
                                        <button id="${dv.cubeName}-size-y-add" class="btn btn-outline-primary increment-button">+</button>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-1">
                                <label for="${dv.cubeName}-size-z" class="col-sm-4 col-form-label" title="Depth / Z">Depth:</label>
                                <div class="col-sm-8">
                                    <div class="input-group">
                                        <button id="${dv.cubeName}-size-z-minus" class="btn btn-outline-primary increment-button">-</button>
                                        <input class="form-control add-cube-input" type="number" placeholder="Z" 
                                            name="${dv.cubeName}-size-z" id="${dv.cubeName}-size-z" 
                                            min="${dv.sizeMin}" max="${dv.sizeMax}" step="${dv.inputStep}" 
                                            value="${dv.boxSize.z}" />
                                        <button id="${dv.cubeName}-size-z-add" class="btn btn-outline-primary increment-button">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="box-color" class="col-sm-4">Color:</label>
                            <div class="col-sm-8">
                                <select class="form-select" name="box-color" id="box-color"></select>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label class="custom-label">Position:</label>
                            <div class="row mb-1">
                                <label for="${dv.cubeName}-pos-x" class="col-sm-3 col-form-label">X:</label>
                                <div class="col-sm-9">
                                    <div class="input-group">
                                        <button id="${dv.cubeName}-pos-x-minus" class="btn btn-outline-primary increment-button">-</button>
                                        <input class="form-control add-cube-input" type="number" placeholder="X" 
                                            name="${dv.cubeName}-pos-x" id="${dv.cubeName}-pos-x" step="${dv.inputStep}" 
                                            min="${dv.posMin}" max="${dv.posMax}" value="${dv.boxPos.x}" />
                                        <button id="${dv.cubeName}-pos-x-add" class="btn btn-outline-primary increment-button">+</button>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-1">
                                <label for="${dv.cubeName}-pos-y" class="col-sm-3 col-form-label">Y:</label>
                                <div class="col-sm-9">
                                    <div class="input-group">
                                        <button id="${dv.cubeName}-pos-y-minus" class="btn btn-outline-primary increment-button">-</button>
                                        <input class="form-control add-cube-input" type="number" placeholder="Y" 
                                            name="${dv.cubeName}-pos-y" id="${dv.cubeName}-pos-y" step="${dv.inputStep}" 
                                            min="${dv.posMin}" max="${dv.posMax}" value="${dv.boxPos.y}" />
                                        <button id="${dv.cubeName}-pos-y-add" class="btn btn-outline-primary increment-button">+</button>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-1">
                                <label for="${dv.cubeName}-pos-z" class="col-sm-3 col-form-label">Z:</label>
                                <div class="col-sm-9">
                                    <div class="input-group">
                                        <button id="${dv.cubeName}-pos-z-minus" class="btn btn-outline-primary increment-button">-</button>
                                        <input class="form-control add-cube-input" type="number" placeholder="Z" 
                                            name="${dv.cubeName}-pos-z" id="${dv.cubeName}-pos-z" step="${dv.inputStep}" 
                                            min="${dv.posMin}" max="${dv.posMax}" value="${dv.boxPos.z}" />
                                        <button id="${dv.cubeName}-pos-z-add" class="btn btn-outline-primary increment-button">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="btn-group" role="group" aria-label="Form buttons">
                                <button class="btn btn-secondary" id="clear-form" aria-label="Reset form values">Reset</button>
                                <button class="btn btn-primary" id="add-cube" aria-label="Add cube to scene">Add Cube</button>
                            </div>
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
            <div class="modal-dialog modal-xl">
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

populateColorSelect('box-color', 'white');

// Set up events after DOM load
document.querySelector('#add-cube').addEventListener('click', parseCubeDataForScene);
document.querySelector('#clear-form').addEventListener('click', resetAddForm);
document.querySelector('#collapse-add-new').addEventListener('click', toggleTempWireframe);
document.querySelector('#instructions').addEventListener('click', showInstructions);

document.querySelectorAll('.increment-button').forEach((b) => {
    b.addEventListener('click', updateCubeParamsButton);
});

document.querySelectorAll('.add-cube-input').forEach((b) => {
    b.addEventListener('keyup', updateCubeParamsInput);
});

init();
animate();
