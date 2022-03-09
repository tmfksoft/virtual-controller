import { app, BrowserWindow, ipcMain } from 'electron';
import X360 from 'virtual-xpad360';
import path from 'path';

// Maps PS2 to xbox 360
const ButtonMap: {[key: string]: number} = {
	L1: X360.UInputEvents.BUTTON.LEFT_BUMPER,
	R1: X360.UInputEvents.BUTTON.RIGHT_BUMPER,
	// L2 and R2 are special cases as they're an AXIS
	SQUARE: X360.UInputEvents.BUTTON.BTN_X,
	CIRCLE: X360.UInputEvents.BUTTON.BTN_B,
	CROSS: X360.UInputEvents.BUTTON.BTN_A,
	TRIANGLE: X360.UInputEvents.BUTTON.BTN_Y,

	// DPAD is an AXIS too

	L3: X360.UInputEvents.BUTTON.BTN_THUMBL,
	R3: X360.UInputEvents.BUTTON.BTN_THUMBR,

	START: X360.UInputEvents.BUTTON.BTN_START,
	SELECT: X360.UInputEvents.BUTTON.BTN_SELECT,
}
const AxisMap : { [key: string]: { axis: number, max: number, min: number } } = {
	LEFT: { axis: X360.UInputEvents.AXIS.DPAD_X, max: -1, min: 0 },
	RIGHT: { axis: X360.UInputEvents.AXIS.DPAD_X, max: 1, min: 0 },
	UP: { axis: X360.UInputEvents.AXIS.DPAD_Y, max: -1, min: 0 },
	DOWN: { axis: X360.UInputEvents.AXIS.DPAD_Y, max: 1, min: 0, },

	L2: { axis: X360.UInputEvents.AXIS.LEFT_TRIGGER, max: 1, min: -1 },
	R2: { axis: X360.UInputEvents.AXIS.RIGHT_TRIGGER, max: 1, min: -1 },

	LEFT_STICK_X: { axis: X360.UInputEvents.AXIS.LEFT_STICK_X, max: 1, min: -1 },
	LEFT_STICK_Y: { axis: X360.UInputEvents.AXIS.LEFT_STICK_Y, max: 1, min: -1 },

	RIGHT_STICK_X: { axis: X360.UInputEvents.AXIS.RIGHT_STICK_X, max: 1, min: -1 },
	RIGHT_STICK_Y: { axis: X360.UInputEvents.AXIS.RIGHT_STICK_Y, max: 1, min: -1 },
}

const controller = new X360();
app.whenReady().then(async () =>{
	// It's a promise now!

	await controller.setup();

	const window = new BrowserWindow({
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
		}
	});
	window.loadURL( "file://" + path.join(__dirname, "..", "ui", "index.html") );

	ipcMain.on('button-state', (ev, args) => {
		const { buttonName, state } = args as { buttonName: string, state: boolean };
		console.log(`[MAIN] ${buttonName} = ${state}`);

		// Hacky way to check if the button is known.
		if (typeof ButtonMap[buttonName] !== "undefined") {
			console.log(`Changing state of ${buttonName} to ${state}`)
			if (state) {
				controller.buttonDown(ButtonMap[buttonName]);
			} else {
				controller.buttonUp(ButtonMap[buttonName])
			}
		} else if (typeof AxisMap[buttonName] !== "undefined") {
			if (state) {
				controller.setAxis(AxisMap[buttonName].axis, AxisMap[buttonName].max);
			} else {
				controller.setAxis(AxisMap[buttonName].axis, AxisMap[buttonName].min);
			}
		}
	});
	ipcMain.on('axis-state', (ev, args) => {
		const { axisName, state } = args as { axisName: string, state: number };
		if (typeof AxisMap[axisName] !== "undefined") {
			controller.setAxis(AxisMap[axisName].axis, state);
		}
	})
});
app.on('window-all-closed', async () => {
	console.log("Killing controller");
	await controller.destroy();
	console.log("Done.");
	process.exit();
})