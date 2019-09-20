import { ADHOCCAST } from "../../../../libex";
import * as Modules from '../../modules/index'
import * as Desktop from "../../../capture.desktop";
import { StreamSharing } from "../stream-sharing";
import { Main } from "../../../main";



export class ServiceNetwork  {
    static network(cmd: ADHOCCAST.Cmds.ICommandData<any>, portUser: Modules.IPortUser) {
        let cmdId = cmd.cmdId;
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.network_connect:
                this.on_network_connect(cmd, portUser);
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                    this.on_network_disconnect(cmd, portUser);
                    break;                
            default:
                break;
        }
    }
    static on_network_connect(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>, portUser: Modules.IPortUser) {
        portUser.users.main.connect();
    }

    static on_network_disconnect(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>, portUser: Modules.IPortUser) {
        let portUsers = Main.instance.portUsers;
        if (Desktop.captureDesktop.chooseDesktopMediaHandle ||
            StreamSharing.SharingStream ||
            portUsers.users.count() > 0 ) {
                //
        }
        else {
            chrome.runtime.reload();            
        }
    }
}