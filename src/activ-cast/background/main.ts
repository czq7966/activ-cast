import { storage } from './storage';
import * as LocalServer from './localServer/index'
import * as RemoteConn from './remote-connection/index'
import { ADHOCCAST } from '../libex/index'
import { EMessageKey } from '../locales';
ADHOCCAST.Modules.Webrtc.Config.platform = ADHOCCAST.Modules.Webrtc.EPlatform.browser;
ADHOCCAST.Cmds.Common.Helper.Debug.enabled = false;

export class Main extends ADHOCCAST.Cmds.Common.CommandRooter {
    static instance: Main;
    instanceId: string;
    conn: ADHOCCAST.Connection;
    stream: MediaStream;
    tab: chrome.tabs.Tab;
    portUsers: LocalServer.Modules.IPortUsers;

    constructor() {
        super();
        Main.instance = this;
        this.instanceId = ADHOCCAST.Cmds.Common.Helper.uuid();

        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            signalerBase: storage.items.signaler,
            namespace: storage.items.organization,
            notInitDispatcherFilters: true,
            parent: this
        }
        this.conn = ADHOCCAST.Connection.getInstance(connParams);
        let inputClientFilter = this.conn.dispatcherFitlers.get(ADHOCCAST.Modules.Dispatchers.InputClientFilter.name);
        inputClientFilter && (inputClientFilter as ADHOCCAST.Modules.Dispatchers.InputClientFilter).setEnabled(true);

        let portUsersParams : LocalServer.Modules.IPortUsersConstructorParams = {
            instanceId: ADHOCCAST.Cmds.Common.Helper.uuid(),
            instanceSingle: false,
            main: this
        }
        this.portUsers = LocalServer.Modules.PortUsers.getInstance(portUsersParams);

        this.initEvents();
        this.connect();
        chrome.browserAction.setIcon({
            path: 'images/icon128.png'
        })
    }
    destroy() {
        this.unInitEvents();
        this.conn.destroy();
        this.portUsers.destroy();
        delete this.conn;
        delete this.portUsers;
        super.destroy();
    }
    initEvents() {
        this.eventRooter.setParent(this.conn.dispatcher.eventRooter);
        this.eventRooter.onBeforeRoot.add(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.add(this.onAfterRoot)        
    }
    unInitEvents() {
        this.eventRooter.onBeforeRoot.remove(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.eventRooter.setParent(); 
    }

    onBeforeRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        let cmdId = cmd.data.cmdId;
        let type = cmd.data.type;
        switch(cmdId) {
            default:
                break;
        }
    }
    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        let cmdId = cmd.data.cmdId;
        let type = cmd.data.type;
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.custom:                
                RemoteConn.Services.Cmds.ServiceCustom.custom(cmd);
                break;  
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:     
                this.on_network_disconnect();
                break;
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_ongetconfig:
                this.onWebrtcGetConfig(cmd)
                break;
            default:
                break;
        } 
        let _data = Object.assign({}, cmd.data);
        _data.to = {};
        _data.sessionId = null;
        this.portUsers.sendCommand(_data, null, true);
    }    

    onWebrtcGetConfig = (cmd: ADHOCCAST.Cmds.Common.ICommand) => {
        let user = cmd.data.props.user as ADHOCCAST.Cmds.IUser;
        let mRoom = ADHOCCAST.Services.Modules.Rooms.getRoom(cmd.instanceId, user.room.id);
        let mUser = mRoom.getUser(user.id);
        let config = mUser.peer.config;
        config.codec = storage.items.codec;
        config.bandwidth = storage.items.bandwidth;  
    }
    tryLogin(): Promise<any> {
        if (this.conn.isLogin()) {
            return Promise.resolve();
        }

        let data: ADHOCCAST.Cmds.ICommandData<any> = {
            type: ADHOCCAST.Cmds.ECommandType.resp,
            cmdId: ADHOCCAST.Cmds.ECommandId.adhoc_login,
            respResult: false,
            respMsg: "LOGINING......"
        }
        this.portUsers.sendCommand(data, null, true);


        let user: ADHOCCAST.Dts.IUser = {
            id: storage.items.user.id,
            nick: storage.items.user.nick,
            room: {
                id: storage.items.user.room.id
            }
        }

        let promise = this.conn.login(user, storage.items.organization, storage.items.signaler);
        promise.catch((e) => {            
            if (e && e.cmdId) {
                data = e as any;                             
            } else {
                data.respMsg = chrome.i18n.getMessage(EMessageKey.TransportError)
            }
            this.portUsers.sendCommand(data, null, true);
        })


        return promise;

    }

    login(): Promise<any> {
        let resolve, reject;
        let promise = new Promise((_resolve, _reject)=>{
            resolve = _resolve;
            reject = _reject;
        });

        let _login = () => {
            this.tryLogin()
            .then(v => {
                resolve();
            })
            .catch(e => {
                console.log("login failed, retry login after 5 seconds!", e);
                setTimeout(() => {
                    _login();
                }, 5 * 1000)    
            })


        }

        _login();

        return promise;
       
    }

    tryConnect(): Promise<any> {
        let data: ADHOCCAST.Cmds.ICommandData<any> = {
            cmdId: ADHOCCAST.Cmds.ECommandId.network_connecting,
        }
        this.portUsers.sendCommand(data, null, true);


        this.conn.signaler.disconnect();    
        let promise = this.conn.connect();
        promise
        .then(() => {
            let data: ADHOCCAST.Cmds.ICommandData<any> = {
                cmdId: ADHOCCAST.Cmds.ECommandId.network_connect,
            }
            this.portUsers.sendCommand(data, null, true);  
        })
        .catch(e => {
            let data: ADHOCCAST.Cmds.ICommandData<any> = {
                cmdId: ADHOCCAST.Cmds.ECommandId.network_connecting,
                respResult: false,
                respMsg: chrome.i18n.getMessage(EMessageKey.TransportError)
            }
            LocalServer.Services.Cmds.ServiceCustom.on_custom_update_states(null, null);
            this.portUsers.sendCommand(data, null, true);
        })                
        return promise;


    }
    connect(): Promise<any> {
        let resolve, reject;
        let promise = new Promise((_resolve, _reject)=>{
            resolve = _resolve;
            reject = _reject;
        });

        let _connect = () => {
            this.tryConnect()
            .then(v => {
                resolve();
            })
            .catch(e => {
                console.log("connect failed, retry connect after 5 seconds!", e);
                setTimeout(() => {
                    _connect();
                }, 5 * 1000)    
            })
        }
        _connect();
        return promise;
    }


    on_network_disconnect() {
        this.connect()
        .then(v => {
            let stream = LocalServer.Services.StreamSharing.SharingStream;
            if (stream && stream.active) {
                LocalServer.Services.StreamSharing.start()
                .catch(e => {});
            }
        })
    }
}

