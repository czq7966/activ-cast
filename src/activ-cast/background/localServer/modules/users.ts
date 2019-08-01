import { ADHOCCAST } from "../../../libex";
import { IPortUser, IUserPort, PortUser } from "./user";
import { Main } from "../../main";
import * as Services from '../services/index'
import * as RemoteConn from '../../remote-connection'
import * as Cmds from '../cmds'


export interface IPortUsersConstructorParams extends ADHOCCAST.Cmds.Common.IBaseConstructorParams {
    main: Main;
}

export interface IPortUsers extends ADHOCCAST.Cmds.Common.IBase {
    main: Main;
    castUsers: RemoteConn.Modules.ICastUsers;
    users: ADHOCCAST.Cmds.Common.Helper.KeyValue<IPortUser>;
    // ports: ADHOCCAST.Cmds.Common.Helper.KeyValue<IUserPort>;
    dispatcher: Services.Dispatcher;
    sendCommand(cmd: ADHOCCAST.Dts.ICommandData<any>, portUser: IPortUser, isTurn: boolean): Promise<any>;
}

export class PortUsers extends ADHOCCAST.Cmds.Common.CommandRooter implements IPortUsers {
    main: Main;
    castUsers: RemoteConn.Modules.ICastUsers;
    users: ADHOCCAST.Cmds.Common.Helper.KeyValue<IPortUser>;
    // ports: ADHOCCAST.Cmds.Common.Helper.KeyValue<IUserPort>;
    dispatcher: Services.Dispatcher;

    constructor(params: IPortUsersConstructorParams) {
        super(params);
        this.main = params.main;
        this.users = new ADHOCCAST.Cmds.Common.Helper.KeyValue();
        // this.ports = new ADHOCCAST.Cmds.Common.Helper.KeyValue();   
        this.dispatcher = new Services.Dispatcher({
            instanceId: this.instanceId,
            instanceSingle: true
        })
        ADHOCCAST.Cmds.Common.EDCoder.dispatcher.getInstance({instanceId: this.instanceId}, false);
        ADHOCCAST.Cmds.Common.EDCoder.dispatcher.instances[this.dispatcher.instanceId] = this.dispatcher;        

        this.castUsers = new RemoteConn.Modules.CastUsers(this);        
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        this.users.destroy();
        // this.ports.destroy();
        delete ADHOCCAST.Cmds.Common.EDCoder.dispatcher.instances[this.dispatcher.instanceId];        
        this.dispatcher.destroy();                
        delete this.main;
        delete this.users;
        // delete this.ports;
        delete this.dispatcher;
        super.destroy();
    }

    initEvents() {
        chrome.runtime.onConnect.addListener(this.onConnect);

        this.eventRooter.setParent(this.dispatcher.eventRooter);
        this.eventRooter.onBeforeRoot.add(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.add(this.onAfterRoot)           
    }
    unInitEvents() {
        this.eventRooter.onBeforeRoot.remove(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.remove(this.onAfterRoot)    
        this.eventRooter.setParent();        

        chrome.runtime.onConnect.removeListener(this.onConnect);
        // this.ports.clear();
        this.users.clear();
    }
    onBeforeRoot = (cmd: ADHOCCAST.Cmds.ICommandData<any>, portUser: IPortUser): any => {

    }
    onAfterRoot = (cmd: ADHOCCAST.Cmds.ICommandData<any>, portUser: IPortUser): any => {
        let cmdId = cmd.cmdId;
        let type = cmd.type;
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.user_get:
                let props = cmd.props as ADHOCCAST.Dts.ICommandReqDataProps;
                if (type == ADHOCCAST.Cmds.ECommandType.req) Services.Cmds.ServiceUserGet.req(cmd, portUser);
                break;
            case Cmds.ECommandId.custom_start_cast:
            case Cmds.ECommandId.custom_stop_cast:
            case Cmds.ECommandId.custom_get_webrtc_state:
            case Cmds.ECommandId.custom_update_states:
                Services.Cmds.ServiceCustom.custom(cmd, portUser);            
                break;
            default:
                break;
        }     
    }  

    onConnect = (port: chrome.runtime.Port) => {
        let name = port.name;
        console.log('Local ServerEvent', 'connect', name);

        let portUser = new PortUser(port, this);
        this.users.add(name, portUser);

        let onDisconnect = () => {
            console.log('Local ServerEvent', 'disconnect', name);            
            port.onDisconnect.removeListener(onDisconnect);
            let user = this.users.del(name);
            user && user.destroy();
        }

        port.onDisconnect.addListener(onDisconnect)
        portUser.respStates();

    }    
    
    sendCommand(cmd: ADHOCCAST.Dts.ICommandData<any>, portUser: IPortUser, isTurn: boolean = true): Promise<any> {
        if (isTurn) {
            if (!!portUser) {
                portUser.port.postMessage(cmd);
            }
            else {
                this.users.keys().forEach(key => {
                    let pUser = this.users.get(key);
                    pUser && pUser.port && pUser.port.postMessage(cmd);
                })
            }
        } else {
            cmd.from = cmd.from || {};
            cmd.from.type = cmd.from.type || 'server';
            cmd.from.id = cmd.from.id || '';
            cmd.to =  cmd.to || {};
            cmd.to.type = cmd.to.type || 'room';
            cmd.to.id = cmd.to.id || '';
            if (cmd.props === undefined) cmd.props = {};
    
            switch(cmd.to.type) {
                case 'room':
                    this.users.keys().forEach(key => {
                        let pUser = this.users.get(key);
                        pUser && pUser.port && pUser.port.postMessage(cmd);
                    })                
                    break;
                case 'socket':
                    cmd.to.id = cmd.to.id || portUser.port.name;
                    let pUser = this.users.get(cmd.to.id);
                    pUser && pUser.port && pUser.port.postMessage(cmd);
                    break
                case 'user':
                    cmd.to.id = cmd.to.id || portUser.user.id;
                    let user = this.users.get(cmd.to.id);
                    if (!!user) {
                        user.port.postMessage(cmd);
                    }
                    break;
                case 'server':
                    break;                
                default:
                    portUser.port.postMessage(cmd);                
                    break;
            }
        }

        console.log("Local", 'SendCommand', cmd)
        return Promise.resolve();        
    }      
}