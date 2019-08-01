import { ADHOCCAST } from "../../../libex";
import * as Modules from '../modules/index';


export interface IDispatcherConstructorParams extends ADHOCCAST.Cmds.Common.IBaseConstructorParams {

}

export class Dispatcher extends ADHOCCAST.Cmds.Common.CommandRooter implements ADHOCCAST.Cmds.Common.IDispatcher {
    constructor(params: IDispatcherConstructorParams) {
        super(params);
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        super.destroy();
    }

    initEvents() {

    }
    unInitEvents = () => {

    }

    onCommand = (cmd: ADHOCCAST.Dts.ICommandData<any>, portUser: Modules.PortUser) => {
        cmd.type = cmd.type || ADHOCCAST.Dts.ECommandType.req;
        cmd.from = cmd.from || {};
        cmd.from.type = cmd.from.type || portUser.user ? 'user' : 'socket';        
        cmd.from.id = cmd.from.id || portUser.user ? portUser.user.id : portUser.port.name;
        cmd.to = cmd.to || {};        
        cmd.to.type = cmd.to.type || 'server';
        cmd.to.id = cmd.to.id || '';
        cmd.props = cmd.props || {};
        console.log("Local", ADHOCCAST.Dts.CommandID + 'Event', cmd.cmdId, cmd.from, cmd.to);
        this.eventRooter.root(cmd, portUser);
    }

    sendCommand(cmd: ADHOCCAST.Dts.ICommandData<any>, portUser: Modules.PortUser, isTure: boolean): Promise<any> {
        return portUser.users.sendCommand(cmd, portUser, isTure);
    }    
}
