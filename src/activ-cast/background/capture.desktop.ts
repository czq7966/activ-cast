import { storage } from "./storage";

export enum ECaptureScreenOptions {
    screen = 'screen',
    window = 'window',
    tab = 'tab',
    audio = 'audio'
}

function getAspectRatio(w, h) {
    function gcd(a, b) {
        return (b == 0) ? a : gcd(b, a % b);
    }
    var r = gcd(w, h);
    return (w / r) / (h / r);
}
class CaptureDesktop {
    chooseDesktopMediaHandle: number;
    getStream(screenOptions: Array<ECaptureScreenOptions>,  callback: (stream: MediaStream, tab?: chrome.tabs.Tab) => void) {
        this.cancelChooseDesktopMedia();
        let chooseDesktopMedia = chrome.desktopCapture.chooseDesktopMedia as any;
        this.chooseDesktopMediaHandle = chooseDesktopMedia(screenOptions, (streamId: string, opts, ...args) => {
            this.chooseDesktopMediaHandle = null;
            if (streamId) {
                let constraints = {
                    audio: !(opts && opts.canRequestAudioTrack === true) ? false : {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: streamId,
                            echoCancellation: true
                        },
                        optional: [{
                            googDisableLocalEcho: false 
                        }]                        
                    },
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: streamId,
                            // minFrameRate: storage.items.minFrameRate ,
                            // maxFrameRate: storage.items.maxFrameRate,
                            
                            // maxWidth: resolutions.maxWidth,
                            // maxHeight: resolutions.maxHeight,
                            // minWidth: resolutions.minWidth,
                            // minHeight: resolutions.minHeight,
                            // minAspectRatio: getAspectRatio(storage.items.ratioWidth ||  screen.width, storage.items.ratioHeight ||  screen.height),
                            // maxAspectRatio: getAspectRatio(storage.items.ratioWidth ||  screen.width, storage.items.ratioHeight ||  screen.height),
                        },
                        optional: []
                    }
                }
                navigator.getUserMedia(constraints as any, (stream: MediaStream) => {
                    chrome.tabs.getSelected(tab => {
                        callback(stream, tab)                                                
                    })                    
                }, (ev) => {
                    console.log(ev);
                    callback(null)
                })

            } else {
                callback(null)
            }
        })    
    }
    getTabStream(callback: (stream: MediaStream, tab: chrome.tabs.Tab) => void) {
        var constraints: any = {}

        constraints.video = true,
        constraints.videoConstraints = {
            mandatory: {
                chromeMediaSource: 'tab',
            }
        }


        // constraints.audio = true;
        // constraints.audioConstraints = {
        //     mandatory: {
        //         echoCancellation: true
        //     },
        //     optional: {
        //         googDisableLocalEcho: false 
        //     }
        // };
        
        
        
        chrome.tabCapture.capture(constraints, stream => {
            chrome.tabCapture.getCapturedTabs((infos: chrome.tabCapture.CaptureInfo[]) => {
                infos.forEach(info => {
                    if (info.status == 'active') {
                        chrome.tabs.get(info.tabId, tab => {
                            callback(stream, tab)
                        })                        
                    }
                })
            })            
        })  
    }

    cancelChooseDesktopMedia() {
        if (this.chooseDesktopMediaHandle) {
            chrome.desktopCapture.cancelChooseDesktopMedia(this.chooseDesktopMediaHandle);
            this.chooseDesktopMediaHandle = null;
        }
    }
}
var captureDesktop = new CaptureDesktop();
export { captureDesktop }