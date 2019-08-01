import { ADHOCCAST } from "../../../libex";
import * as LocalServer from '../../localServer'

export interface ICastUsers extends ADHOCCAST.Cmds.Common.ICommandRooter {
    sids: ADHOCCAST.Cmds.Common.Helper.KeyValue<string>;
    portUsers: LocalServer.Modules.IPortUsers    
    assign(sids: {[name: string]: string})
    syncIds(instanceId?: string): Promise<any>;
    hello(instanceId?: string, fromUser?: ADHOCCAST.Cmds.IUser): Promise<any>
    respHello(reqCmd: ADHOCCAST.Cmds.CommandHelloReq, user: ADHOCCAST.Cmds.IUser): Promise<any> 
}

export class CastUsers extends ADHOCCAST.Cmds.Common.CommandRooter {
    sids: ADHOCCAST.Cmds.Common.Helper.KeyValue<string>;
    portUsers: LocalServer.Modules.IPortUsers
    constructor(portUsers: LocalServer.Modules.IPortUsers) {
        super({instanceId: portUsers.instanceId});
        this.portUsers = portUsers;
        this.sids = new ADHOCCAST.Cmds.Common.Helper.KeyValue<string>();
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        this.sids.destroy();
        delete this.portUsers;
        delete this.sids;
        super.destroy();
    }

    initEvents() {
        this.eventRooter.setParent(this.portUsers.main.conn.dispatcher.eventRooter);
        this.eventRooter.onBeforeRoot.add(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.add(this.onAfterRoot)  
    }

    unInitEvents() {
        this.eventRooter.onBeforeRoot.remove(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.remove(this.onAfterRoot)    
        this.eventRooter.setParent();   
    }

    onBeforeRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        let data = cmd.data;
        let cmdId = data.cmdId;
        let type = data.type;
        let props = data.props as ADHOCCAST.Dts.ICommandDataProps;        
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.user_get:
                if (type == ADHOCCAST.Cmds.ECommandType.resp && data.respResult && this.sids.exist(props.user.sid)) {
                    this.sids[props.user.sid] = props.user.id;
                }
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_hello:
                if (this.sids.exist(props.user.sid)) this.sids[props.user.sid] = props.user.id;
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
                if (this.sids.exist(props.user.sid)) this.sids[props.user.sid] = null;
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                this.sids.keys().forEach(key => this.sids[key] = null);
                break;                
            default:
                break;
        }  
    }
    onAfterRoot = (cmd: ADHOCCAST.Cmds.ICommandData<any>): any => {
  
    }      
    assign(sids: {[name: string]: string}) {     
        this.sids.clear();   
        if (!!sids) {
            this.sids.items = Object.assign({}, sids);
        }
    }

    syncIds(instanceId?: string): Promise<any> {
        instanceId = instanceId || this.portUsers.main.conn.instanceId;
        let promises = [];
        this.sids.keys().forEach(sid => {
            let id = this.sids[sid];
            if (!id) {
                promises.push(new Promise((resolve, reject) => {
                    ADHOCCAST.Services.Cmds.UserGet.get(instanceId, {id: null, sid: sid})
                    .then(v => resolve())
                    .catch(e => resolve())
                }));
            }
        })
        return Promise.all(promises);
    }
    hello(instanceId?: string, fromUser?: ADHOCCAST.Cmds.IUser): Promise<any> {
        instanceId = instanceId || this.portUsers.main.conn.instanceId;
        fromUser = fromUser || this.portUsers.main.conn.rooms.getLoginRoom().me().item;
        let cmd = new ADHOCCAST.Cmds.CommandHelloReq({instanceId: instanceId});
        let promises = [];
        this.sids.keys().forEach(sid => {
            let id = this.sids[sid];
            if (!!id) {
                let toUser = {id: id, sid: sid}
                let promise = ADHOCCAST.Services.Cmds.RoomHello.hello(instanceId, fromUser, toUser, cmd);
                promises.push(promise);
            }
        })
        let promise = Promise.all(promises);        
        cmd.destroy();       
        return promise;
    }
    respHello(reqCmd: ADHOCCAST.Cmds.CommandHelloReq, user: ADHOCCAST.Cmds.IUser): Promise<any> {
        let instanceId = reqCmd.instanceId;
        let cmd = new ADHOCCAST.Cmds.CommandHelloResp({instanceId: instanceId});
        let promises = [];
        this.sids.keys().forEach(sid => {
            let id = this.sids[sid];
            if (!!id) {
                reqCmd.data.from = {type: 'user', id: id};
                let promise = ADHOCCAST.Services.Cmds.RoomHello.respHello(reqCmd, user, cmd);                
                promises.push(promise);
            }
        })

        let conn = ADHOCCAST.Connection.getInstance<ADHOCCAST.Connection>(instanceId, false);
        let room = conn.rooms.getRoom(user.room.id);        
        if (room) {
            let me = room.me();
            room.users.values().forEach(v => {
                let sid = v.item.sid;
                if (v.item.id != me.item.id && !this.sids.exist(sid) ) {
                    reqCmd.data.from = {type: 'user', id: v.item.id};
                    let promise = ADHOCCAST.Services.Cmds.RoomHello.respHello(reqCmd, user, cmd);                
                    promises.push(promise);                    
                }
            })
        }        

        let promise = Promise.all(promises);        
        cmd.destroy();       
        return promise;
    }
}