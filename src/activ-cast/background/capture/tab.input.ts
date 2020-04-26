import { Capture, ECaptureScreenOptions } from "./capture";



export class TabInput {
    getDesktopStream(screenOptions: Array<ECaptureScreenOptions>,  callback: (stream: MediaStream, tab?: chrome.tabs.Tab) => void) {
        Capture.getDesktopStream(screenOptions, callback);
    }

    getTabStream(callback: (stream: MediaStream, tab: chrome.tabs.Tab) => void) {
        Capture.getTabStream(callback)
    }

}
