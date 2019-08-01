export class NativeMessage {
    port: chrome.runtime.Port;
    constructor() {
        this.port = chrome.runtime.connectNative("com.nd.helloworld");
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        this.port && this.port.disconnect();
    }    

    initEvents() {
        let count = 0;
        let msgStr = {text: "Hello world!"};
        this.port.onMessage.addListener((msg) => {
            console.log("11111111111111", "onMessage", msg);
            count++;
            if (count <= 40) {
                msgStr = {text: "Hello world!" + count };
                setTimeout(() => {
                    console.log(msgStr)                    
                    this.port.postMessage(msgStr);
                }, 1000);
                
                // this.port.postMessage(msgStr);
            }
        })

        this.port.onDisconnect.addListener(() => {
            console.log("2222222222", "onDisconnect");
        })
        console.log(msgStr);
        this.port.postMessage(msgStr);
        // this.port.postMessage(JSON.stringify(msgStr));
        // this.port.postMessage(msgStr);
        // this.port.postMessage(msgStr);
        // this.port.postMessage(msgStr);
        // this.port.postMessage(msgStr);
        // this.port.postMessage(msgStr);
        // this.port.postMessage(msgStr);
        // this.port.postMessage(msgStr);
        // this.port.postMessage(msgStr);
        // this.port.postMessage(msgStr);
        // this.port.postMessage({text: "Hello world!"});
    }

    unInitEvents() {

    }
}