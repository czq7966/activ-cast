import { ADHOCCAST } from "../../../../libex";
import * as Modules from '../../modules/index'



export class ServiceUserGet  {
    static req(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandReqDataProps>, portUser: Modules.IPortUser) {
        let user = cmd.props.user;
        let instanceId = portUser.users.main.conn.instanceId;
        let isLogin = portUser.users.main.conn.isLogin();
        //获取自已
        if (!user.id && !user.sid ) {
            let _user = null;
            if (isLogin) {
                let mCurrUser = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(instanceId).me();               
                _user = mCurrUser.item;
            }
            let data = Object.assign({}, cmd);
            data.type = ADHOCCAST.Cmds.ECommandType.resp;
            data.props.user = _user;
            data.respResult = true;
            portUser.sendCommand(data);
            return;
        }
        
        //获取用户
        ADHOCCAST.Services.Cmds.UserGet.get(instanceId, user)
        .then((data: ADHOCCAST.Dts.ICommandData<any>) => {            
            data.sessionId = cmd.sessionId;
            user = data.props.user;
            if (portUser.users.castUsers.sids.exist(user.sid)) {
                let mCurrUser = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(instanceId).me();               
                let mStreamRoom = ADHOCCAST.Services.Modules.User.getStreamRoom(mCurrUser);
                if (mStreamRoom) {
                    let mUser = mStreamRoom.getUser(user.id);
                    if (mUser) {
                        user.states = mUser.states.states;
                    }
                }                
            } 
            portUser.sendCommand(data);
        })
        .catch(e => {
            if (e && e.cmdId) {
                let data = e as ADHOCCAST.Dts.ICommandData<any>;
                data.sessionId = cmd.sessionId;
                data.type = ADHOCCAST.Cmds.ECommandType.resp;
                portUser.sendCommand(data)
            }
        })
    }
}