import { ADHOCCAST } from '../libex/index'
import * as NativeCommon from '../../common';


export class NativeIOInputFilter extends ADHOCCAST.Modules.Dispatchers.DispatcherFilter {
    nativeIOInput: NativeCommon.NativeIOInput;
    _enabled: boolean;
    constructor(dispatcher: ADHOCCAST.Modules.Dispatchers.IDispatcher ) {
        super(dispatcher);
        this.initEvents();
    }   
    destroy() {
        this.setEnabled(false);
        this.unInitEvents();
        super.destroy();
    }

    initEvents() {
        this.recvRooter.setParent(this.dispatcher.recvFilter);        
        this.recvRooter.onAfterRoot.add(this.onAfterRoot_recvRoot)
    }
    unInitEvents() {
        this.recvRooter.onAfterRoot.remove(this.onAfterRoot_recvRoot)
        this.recvRooter.setParent();        
    }   
    setEnabled(enabled: boolean) {        
        if (!!this.getEnabled() !== !!enabled) {
            if (enabled) {
                this.nativeIOInput = new NativeCommon.NativeIOInput();
            } else {
                this.nativeIOInput && this.nativeIOInput.destroy();
                this.nativeIOInput = null;                
            }
            this._enabled = !!enabled;
        }
    } 
    getEnabled() {
        return !!this._enabled;
    }
    onAfterRoot_recvRoot  = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Cmds.ICommandDataProps>): any => {
        if (cmd) {
            let cmdId = cmd.cmdId;
            switch(cmdId) {                
                case ADHOCCAST.Cmds.ECommandId.stream_webrtc_io_input:                        
                    let _cmd = Object.assign({}, cmd);
                    _cmd.cmdId = ADHOCCAST.Cmds.ECommandId.extension_capture_on_io_input;
                    this.sendCommand(_cmd);
                    return ADHOCCAST.Cmds.Common.EEventEmitterEmit2Result.preventRoot; 
                    break;
                default:
         
                    break;            
            }
        }      
    }
    onCommand(cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Cmds.ICommandDataProps>) {
        return;
    }
    sendCommand(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Cmds.ICommandDataProps>): Promise<any> {
        this.getEnabled() && this.nativeIOInput.sendMessage(cmd);
        return Promise.resolve();
    }
}