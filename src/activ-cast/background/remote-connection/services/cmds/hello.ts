import { ADHOCCAST } from "../../../../libex";
import * as RemoteConn from '../../../remote-connection'
import { Main } from "../../../main";

var Tag = 'Service-Cmds-Hello';
export class Hello {
    static hello(instanceId: string, fromUser: ADHOCCAST.Cmds.IUser, toUser?: ADHOCCAST.Cmds.IUser): Promise<any> {
        let cmd = new ADHOCCAST.Cmds.CommandHelloReq({instanceId: instanceId});
        if (!!toUser) {
            let promise = ADHOCCAST.Services.Cmds.RoomHello.hello(instanceId, fromUser, toUser, cmd)
            cmd.destroy();
            cmd = null;
            return promise;
        } else {
            return new Promise((resolve, reject) => {
                let conn = ADHOCCAST.Connection.getInstance<ADHOCCAST.Connection>({instanceId: instanceId}, false);
                let main = conn.params.parent as Main;    
                let castUsers = main.portUsers.castUsers;
                castUsers.syncIds(instanceId)
                .then(() => {
                    castUsers.hello(instanceId, fromUser)
                    .then(v => {
                        resolve(v)
                    })
                    .catch(e => {
                        reject(e)
                    })
                })
            })
        }
    }
    static respHello(reqCmd: ADHOCCAST.Cmds.CommandHelloReq, user: ADHOCCAST.Cmds.IUser): Promise<any> {
        let instanceId = reqCmd.instanceId;
        if (reqCmd.data.from.type == "room") {
            let conn = ADHOCCAST.Connection.getInstance<ADHOCCAST.Connection>({instanceId: instanceId}, false);
            let main = conn.params.parent as Main;    
            let castUsers = main.portUsers.castUsers;            
            return castUsers.respHello(reqCmd, user);
        }

        let cmd = new ADHOCCAST.Cmds.CommandHelloResp({instanceId: instanceId});
        let promise = ADHOCCAST.Services.Cmds.RoomHello.respHello(reqCmd, user, cmd)
        cmd.destroy();
        cmd = null;
        return promise;
    } 

    static Room = {
        onBeforeRoot: {
            req(room: ADHOCCAST.Modules.IRoom, cmd: ADHOCCAST.Cmds.CommandHelloReq) {
                adhoc_cast_connection_console.log(Tag, 'Room',  room.item.id ,'onBeforeRoot', 'Req', cmd.data); 
                let data = cmd.data;
                let conn = ADHOCCAST.Connection.getInstance<ADHOCCAST.Connection>({instanceId: room.instanceId}, false);
                let main = conn.params.parent as Main;
                let sid = data.props.user.sid.split('/')[0];
                
                if (room.item.id === data.props.user.room.id && main.portUsers.castUsers.sids.exist(sid) ) {
                    let respCmd = new ADHOCCAST.Cmds.CommandHelloResp({instanceId: room.instanceId});  
                    ADHOCCAST.Services.Cmds.RoomHello.Room.onBeforeRoot.req(room, cmd, respCmd);
                }                
            },
            resp(room: ADHOCCAST.Modules.IRoom, cmd: ADHOCCAST.Cmds.CommandHelloResp) {
                adhoc_cast_connection_console.log(Tag, 'Room',  room.item.id ,'onBeforeRoot', 'Resp', cmd.data);                
                let data = cmd.data;
                let conn = ADHOCCAST.Connection.getInstance<ADHOCCAST.Connection>({instanceId: room.instanceId}, false);
                let main = conn.params.parent as Main;  
                let sid = data.props.user.sid.split('/')[0];              
                if (room.item.id === data.props.user.room.id && main.portUsers.castUsers.sids.exist(sid)) {
                    ADHOCCAST.Services.Cmds.RoomHello.Room.onBeforeRoot.resp(room, cmd);
                }            
            }  
        }
    } 
}


// ADHOCCAST.Services.Cmds.Hello.hello = Hello.hello;
// ADHOCCAST.Services.Cmds.Hello.respHello = Hello.respHello;
// ADHOCCAST.Services.Cmds.Hello.Room.onBeforeRoot.req = Hello.Room.onBeforeRoot.req;
// ADHOCCAST.Services.Cmds.Hello.Room.onBeforeRoot.resp = Hello.Room.onBeforeRoot.resp;
