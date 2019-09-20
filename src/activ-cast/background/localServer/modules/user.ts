import { ADHOCCAST } from "../../../libex";
import * as Services from '../services/index'
import { IPortUsers } from "./users";
import { EMessageKey } from "../../../locales";



export interface IUserPort extends chrome.runtime.Port {
    user?: PortUser
}

export interface IPortUser extends ADHOCCAST.Cmds.Common.IBase {
    user: ADHOCCAST.Dts.IUser;
    users: IPortUsers;
    port: IUserPort;
    onCommand: (cmd: ADHOCCAST.Dts.ICommandData<any>, cb?: (result: boolean) => void) => void
    sendCommand: (cmd: ADHOCCAST.Dts.ICommandData<any>, isTure?: boolean) => void
    respStates()
}

export class PortUser  extends ADHOCCAST.Cmds.Common.Base implements IPortUser {
    user: ADHOCCAST.Dts.IUser;
    users: IPortUsers;
    port: IUserPort;

    constructor(port: IUserPort, users: IPortUsers) {
        super({instanceId: users.instanceId})
        this.port = port;
        this.user = {id: ADHOCCAST.Cmds.Common.Helper.uuid()};
        this.port.user = this;  
        this.users = users;
        this.initEvents();         
        this.onConnect();
    }

    destroy() {
        this.unInitEvents();
        delete this.user;
        delete this.port;
        delete this.users;
        super.destroy();
    }

    initEvents() {
        this.port.onMessage.addListener(this.onMessage);
        this.port.onDisconnect.addListener(this.onDisconnect);
    }
    unInitEvents() {
        this.port.onMessage.removeListener(this.onMessage);
        this.port.onDisconnect.removeListener(this.onDisconnect);        
    }

    onMessage = (msg) => {
        console.log('Local ServerEvent', "onMessage", msg);
        this.onCommand(msg);
    }

    onConnect = () => {
        console.log('Local ServerEvent', "onConnect", this.port.name);
        this.users.users.add(this.port.name, this);
        this.onCommand({cmdId: ADHOCCAST.Dts.ECommandId.network_connect});
    }    
    onDisconnect = (reason) => {
        console.log('Local ServerEvent', "onDisconnect", this.port.name);
        this.users.users.del(this.port.name);
        this.onCommand({cmdId: ADHOCCAST.Dts.ECommandId.network_disconnect});
    }

    // Command business
    onCommand(cmd: ADHOCCAST.Dts.ICommandData<any>, cb?: (result: boolean) => void) {     
        cb && cb(true)
        this.users.dispatcher.onCommand(cmd, this);
    }
    sendCommand = (cmd: ADHOCCAST.Dts.ICommandData<any>, isTure: boolean = true) => {        
        this.users.dispatcher.sendCommand(cmd, this, isTure);
        return;
    }

    respLogin() {
        let conn = this.users.main.conn;
        let isLogin = conn.isLogin();
        let user = isLogin && this.users.main.conn.rooms.getLoginRoom().me().item;
        let cmd: ADHOCCAST.Dts.ICommandData<ADHOCCAST.Cmds.ICommandRespDataProps> = {
            type: ADHOCCAST.Cmds.ECommandType.resp,
            cmdId: ADHOCCAST.Cmds.ECommandId.adhoc_login,
            props: {
                user: !!user ? user : null
            },
            respResult: !!user ? true : false
        }
        this.sendCommand(cmd, true);
    }

    respConnect() {
        let conn = this.users.main.conn;
        let isConnecting = conn.signaler.connecting();
        let isConnected = conn.signaler.connected();
        if (isConnecting) {
            let data: ADHOCCAST.Cmds.ICommandData<any> = {
                cmdId: ADHOCCAST.Cmds.ECommandId.network_connecting,
            }
            this.sendCommand(data, true);            
        } else {
            if (isConnected) {
                let data: ADHOCCAST.Cmds.ICommandData<any> = {
                    cmdId: ADHOCCAST.Cmds.ECommandId.network_connect,
                }
                this.sendCommand(data, true);                  
            } else {
                let data: ADHOCCAST.Cmds.ICommandData<any> = {
                    cmdId: ADHOCCAST.Cmds.ECommandId.network_connecting,
                    respResult: false,
                    respMsg: chrome.i18n.getMessage(EMessageKey.TransportError)
                }
                this.sendCommand(data, true);                
            }
        }
    }  
    respStates() {
        Services.Cmds.ServiceCustom.on_custom_update_states(null, this);
    }  
}