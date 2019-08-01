import { Base } from "./base";

export enum ERuntimePortEvents {
    connect = "connect",
    disconnect = 'disconnect',
    message = 'message'
}

export enum ERuntimePortMessageType {
    changePassword = 'changePassword',
    startSharing = 'startSharing',
    stopSharing = 'stopSharing'
}

export interface IRuntimePortMessage {
    type: ERuntimePortMessageType,
    data?: any
}

export class RuntimePort extends Base { 
    port:  chrome.runtime.Port;
    constructor(port: chrome.runtime.Port) {
        super();
        this.port = port;
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        delete this.port;
        super.destroy();
    }
    initEvents() {
        this.port.onDisconnect.addListener(this.onDisconnect);
        this.port.onMessage.addListener(this.onMessage)
    }
    unInitEvents() {
        this.port.onDisconnect.removeListener(this.onDisconnect);
        this.port.onMessage.removeListener(this.onMessage)        
    }
    onDisconnect = (port: chrome.runtime.Port) => {
        this.eventEmitter.emit(ERuntimePortEvents.disconnect, port);        
    }
    onMessage = (message: IRuntimePortMessage) => {
        this.eventEmitter.emit(ERuntimePortEvents.message, message);        
    }
}

export enum ERuntimePortName {
    default = 'default'
}

export class RuntimePorts extends Base {
    ports: {[name: string]: RuntimePort}
    constructor() {
        super();
        this.ports = {};
        chrome.runtime.onConnect.addListener(this.onConnect);

    }
    destroy() {        
        chrome.runtime.onConnect.removeListener(this.onConnect);
        delete this.ports;
        super.destroy();
    }
    onConnect = (port: chrome.runtime.Port) => {
        let name = port.name || ERuntimePortName.default;        
        let runtimePort = new RuntimePort(port);
        this.ports[name] = runtimePort;
        this.eventEmitter.emit(ERuntimePortEvents.connect, runtimePort);
        runtimePort.eventEmitter.addListener(ERuntimePortEvents.disconnect, () => { 
            this.eventEmitter.emit(ERuntimePortEvents.disconnect, runtimePort);
            runtimePort.destroy();
            delete this.ports[name];
        })        
    }    
}
