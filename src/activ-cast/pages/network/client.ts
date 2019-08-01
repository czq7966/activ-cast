import { EventEmitter } from 'events';
import { ADHOCCAST } from '../../libex';
export interface IClient extends ADHOCCAST.Network.ISignaler {
    port: chrome.runtime.Port;
}


export class Client implements IClient {
    static TAG = "activ-cast:pages:network:client";
    eventEmitter: EventEmitter;
    port: chrome.runtime.Port;
    _url: string;
    _connecting: boolean;

    constructor(url?: string) {
        this.eventEmitter = new EventEmitter();
        this._url = url;   
    }
    destroy() {
        this.eventEmitter.removeAllListeners();
        this.port && this.port.disconnect();
        this.unInitEvents(this.port);
        delete this.eventEmitter;
        delete this.port;
    }
    id(): string {
        return this.port && this.port.name;
    }
    getUrl(): string {
        return this._url;
    }
    setUrl(value: string) {
        this._url = value;
    }

    connected(): boolean {
        return !!this.port;
    }
    connecting(): boolean {
        return this._connecting;
    }

    connect(url?: string): Promise<any> {
        if (this.connected()) {
            return Promise.resolve()
        }
        this._connecting = true;
        let promise = new Promise((resolve, reject) => {
            delete this.port;
            url = url || this.getUrl() || "";
            url = url[url.length - 1] !== '/' ? url : url.substr(0, url.length - 1);            
            this.setUrl(url || this.getUrl());
            try {
                this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connecting);
                this.port = chrome.runtime.connect({name: this.getUrl()});                            
                this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connect);                
                this.initEvents(this.port);
                resolve();
            } catch (error) {
                delete this.port;
                this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connect_error, error);
                reject(error);                               
            }
        })  
        promise.then(() => {this._connecting = false}).catch(() => {this._connecting = false})
        return promise;    
    }
    disconnect() {
        this.port && this.port.disconnect();
    }

    initEvents(port: chrome.runtime.Port) {
        if (!!port) {
            port.onMessage.addListener(this.onMessage);
            port.onDisconnect.addListener(this.onDisconnect);
            port.onDisconnect.addListener(()=>{
                this.unInitEvents(port);
                delete this.port;
            })
        }
    }    
    unInitEvents(port: chrome.runtime.Port) {
        if (!!port) {
            port.onMessage.removeListener(this.onMessage);
            port.onDisconnect.removeListener(this.onDisconnect);
        }
    }   

    onMessage = (msg) => {
        this.eventEmitter.emit(ADHOCCAST.Cmds.CommandID, msg);
    }

    onDisconnect = (reason) => {
        this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect, reason);
    }


    sendCommand(cmd: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connect()
            .then(() => {
                this.port.postMessage(cmd);
                resolve();
            })
            .catch(error => {
                reject(error)
            }) 
        })
    }   
}

ADHOCCAST.Network.SignalerFactory.register(Client.TAG, Client);