import { EventEmitter} from "events";

export class SubEventEmitter {
    emitter: EventEmitter;
    event: string
    constructor(event: string, emitter: EventEmitter) {
        this.event = event
        this.emitter = emitter;
    }
    destroy() {
        delete this.event;
        delete this.emitter;
    }
    add(fn: (...args: any[]) => any) {
        this.emitter.addListener(this.event, fn)
    }
    remove(fn: (...args: any[]) => any) {
        this.emitter.removeListener(this.event, fn)
    }    
  }
  

export class NativeMessage {
    eventEmitter: EventEmitter;
    onMessage: SubEventEmitter;
    onDisconnect: SubEventEmitter;
    name: string;
    port: chrome.runtime.Port;
    constructor(name: string) {
        this.name = name;
        this.port = chrome.runtime.connectNative(name);
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        this.isConnected() && this.port.disconnect();
        this.port = null;
    }    

    initEvents() {
        this.eventEmitter = new EventEmitter();
        this.onMessage = new SubEventEmitter("onMessage", this.eventEmitter);
        this.onDisconnect = new SubEventEmitter("onDisconnect", this.eventEmitter);

        this.isConnected() && this.port.onMessage.addListener(this._onMessage)
        this.isConnected() && this.port.onDisconnect.addListener(this._onDisconnect);
    }

    unInitEvents() {
        this.isConnected() && this.port.onMessage.removeListener(this._onMessage)
        this.isConnected() && this.port.onDisconnect.removeListener(this._onDisconnect);      
       
        this.onMessage.destroy();        
        this.onDisconnect.destroy();
        this.eventEmitter.removeAllListeners();
        this.onMessage = null;
        this.onDisconnect = null;
        this.eventEmitter = null;
    }

    _onMessage = (msg) => {
        this.eventEmitter.emit("onMessage", msg);
    }

    _onDisconnect = (reason) => {
        this.eventEmitter.emit("onDisconnect", reason);
        this.port = null;
    }

    sendMessage(msg) {
        this.isConnected() && this.port.postMessage(msg);
    }

    isConnected(): boolean {
        return !!this.port;
    }

}