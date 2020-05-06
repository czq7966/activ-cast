import { ADHOCCAST } from '../../libex/index'

export interface ITabIOInputFilter extends ADHOCCAST.Modules.Dispatchers.IBaseInputFilter {
    setTab(tab: chrome.tabs.Tab)
    getTab(): chrome.tabs.Tab
    getAttached(): boolean
}

export class TabIOInputFilter extends ADHOCCAST.Modules.Dispatchers.BaseInputFilter implements ITabIOInputFilter {
    static Webrtc_IO_Input_dataChannelInputEvent = ADHOCCAST.Services.Modules.Webrtc.IO.Input.dataChannelInputEvent;
    _tab: chrome.tabs.Tab;
    _attached: boolean;
    constructor(dispatcher: ADHOCCAST.Modules.Dispatchers.IDispatcher ) {
        super(dispatcher);
    }   
    destroy() {
        super.destroy();
    }
    setEnabled(enabled: boolean) {
        super.setEnabled(enabled);
        this.getEnabled() 
            ? this.setTab(this.getTab())
            : this.setTab(null);
    }

    setTab(tab: chrome.tabs.Tab) {
        this.getTab() && chrome.debugger.detach({tabId: this.getTab().id})
        this._tab = tab;
        this.attachTab();
        if (tab) {
            ADHOCCAST.Services.Modules.Webrtc.IO.Input.dataChannelInputEvent = this.onDataChannelInputEvent;
        } else {
            ADHOCCAST.Services.Modules.Webrtc.IO.Input.dataChannelInputEvent = TabIOInputFilter.Webrtc_IO_Input_dataChannelInputEvent;
        }
    }
    getTab(): chrome.tabs.Tab {
        return this._tab;
    }
    getAttached(): boolean {
        return this._attached;
    }
    attachTab() {
        let tab = this.getTab();
        tab &&
        chrome.debugger.attach({tabId: tab.id}, '1.0', () => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError)
            } else {
                this._attached = true;
                let onDetach = (source, reason) => {
                    if (source.tabId == tab.id) {
                        this._attached = false;
                        chrome.debugger.onDetach.removeListener(onDetach)
                        console.warn(reason);
                    }                                            
                }
                chrome.debugger.onDetach.addListener(onDetach)
            }
        })
    }


    onCommand(cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Cmds.ICommandDataProps>) {
        return super.onCommand(cmd);
    }
    sendCommand(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Cmds.ICommandDataProps>): any {
        let event: ADHOCCAST.Modules.Webrtc.IO.IInputEvent = cmd.extra;
        if (event) {
            this.onInputDispatchEvent(event);
        }
        return super.sendCommand(cmd);
    }
    onInputDispatchEvent(event: ADHOCCAST.Modules.Webrtc.IO.IInputEvent) {
        let tab = this.getTab();
        if (event && tab) {
            switch(event.type) {
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceMouseType.mousedown:
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceMouseType.mousemove:
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceMouseType.mouseup:
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceMouseType.wheel:
                    chrome.debugger.sendCommand({tabId: tab.id}, 'Input.dispatchMouseEvent', event)
                    break;
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceMouseType.mouseenter:
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceMouseType.mouseleave:                    
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceMouseType.mouseout:
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceMouseType.mouseover:     
                    break;
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceTouchType.touchcancel:
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceTouchType.touchend:
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceTouchType.touchmove:
                case ADHOCCAST.Modules.Webrtc.IO.EInputDeviceTouchType.touchstart:
                    chrome.debugger.sendCommand({tabId: tab.id}, 'Input.dispatchTouchEvent', event)
                    break;
                default: 
                    break;
            }  
        }
    }

    onDataChannelInputEvent = (input: ADHOCCAST.Modules.Webrtc.IO.IInput, evt: ADHOCCAST.Modules.Webrtc.IO.IInputEvent) => {
        let tab = this.getTab();
        if (tab) {
            chrome.tabs.get(tab.id, tab => {
                if (tab) {
                    evt.sourceX = tab.width;
                    evt.sourceY = tab.height;
                    input.inputEvent(evt);
                }
            })            
        }
    }
}