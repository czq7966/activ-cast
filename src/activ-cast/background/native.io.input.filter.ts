import { ADHOCCAST } from '../libex/index'
import * as NativeCommon from '../../common';


export class NativeIOInputFilter extends ADHOCCAST.Modules.Dispatchers.DispatcherFilter {
    nativeIOInput: NativeCommon.NativeIOInput;
    constructor(dispatcher: ADHOCCAST.Modules.Dispatchers.IDispatcher ) {
        super(dispatcher);
        this.nativeIOInput = new NativeCommon.NativeIOInput();
        this.initEvents();
    }   
    destroy() {
        this.nativeIOInput.destroy();
        this.nativeIOInput = null;
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
        if (cmd.to.type === 'user' && cmd.to.id === this.instanceId) {
            let cmdId = cmd.cmdId;            
            switch(cmdId) {
                case ADHOCCAST.Cmds.ECommandId.extension_capture_are_you_ready:
                case ADHOCCAST.Cmds.ECommandId.extension_capture_get_custom_sourceId:   
                        super.onCommand(cmd)     
                    break;
                default:
                    break;            
            }        
        }
    }
    sendCommand(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Cmds.ICommandDataProps>): Promise<any> {
        cmd.type = cmd.type || ADHOCCAST.Cmds.ECommandType.req;        
        cmd.from = cmd.from || {type: 'user', id: this.instanceId}
        cmd.to = cmd.to || {type: 'server', id: ADHOCCAST.Cmds.ECommandServerId.extension_capture}
        cmd.to.id = cmd.to.id || ADHOCCAST.Cmds.ECommandServerId.extension_capture
        cmd.props = cmd.props || {}

        return Promise.resolve();
    }
}