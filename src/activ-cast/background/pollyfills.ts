import { StreamSharing } from "./localServer/services";

export class Pollyfills {
    static apply() {
        this.apply_ChromeOS_v83();
    }

    static apply_ChromeOS_v83() {
        chrome.runtime.getPlatformInfo((platformInfo) => {
            switch(platformInfo.os) {
                case 'cros':
                    let chromeVersion = (/Chrome\/([0-9]+)/.exec(navigator.userAgent)||[,0])[1];
                    switch (chromeVersion) {
                        case '83':
                            ChromeOS_v83.apply();
                            break;
                    }
                    break;
            }
        });
    }
}

export class ChromeOS_v83 {
    static tabId: number
    static _onStartSharing: Function;
    static _microphoneStream: MediaStream;
    static apply() {
        this.check_microphone_permission();
        this.attach_stream_sharing_event();
    }

    static check_microphone_permission() {
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
        .then(stream => {
            stream.getTracks().forEach(track => {
                track.stop()
            })
        })        
        .catch(e => {
            chrome.browserAction.getPopup({}, (defPopup) => {
                chrome.browserAction.setPopup({popup: ''});
                chrome.browserAction.onClicked.addListener(() => {
                    this.on_browser_action_click(defPopup);
                })
            })
        }); 
    }

    static attach_stream_sharing_event() {
        this._onStartSharing = StreamSharing.onStartSharing;
        StreamSharing.onStartSharing = this.onStartSharing.bind(this);
    }    

    static on_browser_action_click(popup: string) {
        let createPollyfillTab = () => {
            chrome.tabs.create({url: "pages/dropdown/pollyfills/chromeos-v83.html"}, (tab) => {
                this.tabId = tab.id;
            });
        }

        navigator.mediaDevices.getUserMedia({audio: true, video: false})
        .then(stream => {
            stream.getTracks().forEach(track => {
                track.stop()
            })
            chrome.browserAction.setPopup({popup: popup});
        })     
        .catch(e => {
            if (this.tabId) {
                chrome.tabs.remove(this.tabId, () => {
                    createPollyfillTab();
                })
            } else {
                createPollyfillTab();
            }
        })
    }

    static onStartSharing() {
        this._onStartSharing.apply(StreamSharing);
        let stream = StreamSharing.SharingStream;
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
        .then(stream => {
            this._microphoneStream = stream;
        })
        .catch(e => {
            console.error(e);
        });

        let onSharingStreamInactive = () => {
            stream.removeEventListener('inactive', onSharingStreamInactive);
            this._microphoneStream = null;
            delete this._microphoneStream;
        }
        stream.addEventListener('inactive', onSharingStreamInactive);
    }
}