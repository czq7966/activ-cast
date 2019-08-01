import { EventEmitter } from "events";

export interface IBase {
    eventEmitter: EventEmitter,
    destroy()
}
export class Base {
    eventEmitter: EventEmitter
    constructor() {
        this.eventEmitter = new EventEmitter();
    }
    destroy() {
        this.eventEmitter.removeAllListeners();
        delete this.eventEmitter;
    }
}