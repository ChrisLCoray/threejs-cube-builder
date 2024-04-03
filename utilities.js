/**
 * Utilities.js
 */

export const cameraSettings = {
    fov: 75,
    width: 600,
    height: 600,
    near: 0.1,
    far: 1000,
    position: {
        x: 0,
        y: 2,
        z: 5,
    },
    rotation: {
        x: 0,
        y: 42,
        z: 0
    }
};

export function capitalizeFirst(thisName) {
    return thisName.charAt(0).toUpperCase() + thisName.slice(1);
}

export const colors = [
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

// Radians = Degrees × (π/180)
export function convertDegToRads(deg) {
    const pi = 22 / 7;
    return (deg * (pi / 180));
}

export const defaultValues = {
    boxPos: { x: 0, y: 0, z: 0 },
    boxSize: { x: 1, y: 1, z: 1 },
    boxColor: 'red',
    cubeName: 'temp',
    incrementStep: 0.5,
    inputStep: 0.1,
    posMin: -50,
    posMax: 50,
    sizeMin: 0.1,
    sizeMax: 100
}

export const getColorByName = (colorString) => {
    return colors.find(c => c.name === colorString);
}

export const instructions = [
    `We start with a wireframe cube that represents the cube to be created.`,
    `The scene can be navigated using your mouse, or fingers on supported mobile devices. Click/tap and drag to move the camera, scroll wheel or double-finger pinch/expand to zoom.`,
    `The "Size" controls change the width (x), height (y), and depth (z). Each has a minimum of 0.1. The +/- buttons step in increments of ${defaultValues.incrementStep}, or you can manually set the value by clicking into the input box and changing it with your keyboard.`,
    `The "Position" controls change the cube's position in the scene using x (left or right), y (up or down), and z (front or back). These can edited the same as "Size", but negative values are allowed as the center of the scene is "0, 0, 0". For example, a positive "x" value moves the cube to the right, while a negative value moves it to the left.`,
    `The "Color" control doesn't change the color of the wireframe, but it does determine the color of the placed cube.`,
    `Once the wireframe cube is in the size and position you desire, hit "Add Cube" to place the cube in the scene.`,
    `The new cube is created using the same values of the wireframe cube. The values of the form remain the same by default, so that new cubes can be created by only adjusting the values you want to adjust. If you would like to reset the form, click the "Reset" button instead and the wireframe cube should update to the new values.`,
    `If you decide to adjust a cube after placing it, the "Add New Cube" form can be collapsed by clicking on the title, and the cube you would like to adjust can be found in the list below the menu. The colored box next to the cube name shows the color of the cube, to make it easier to locate. Click the cube name to expand the controls for that cube, which operate the same as the "Add New Cube" form. You will see your changes being updated in the scene automatically.`
]

export const points = ['x', 'y', 'z'];
