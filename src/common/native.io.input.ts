import { NativeMessage } from "./native.message";

export class NativeIOInput extends NativeMessage {
    constructor() {
        super("com.nd.helloworld");
        this.initEvents();
    }    

    destroy() {
        this.unInitEvents();
        super.destroy();
    }

    initEvents() {

    }

    unInitEvents() {

    }    
}