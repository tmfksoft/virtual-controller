// I am preload, here me rawr ;3
// *pukes*

import { ipcRenderer, contextBridge } from "electron";


contextBridge.exposeInMainWorld("API", {

	sendButtonState: (buttonName: string, state: boolean) => {
		ipcRenderer.send("button-state", {
			buttonName,
			state,
		})
	},
	sendAxisState: (axisName: string, state: number) => {
		ipcRenderer.send("axis-state", {
			axisName,
			state,
		});	
	}
});