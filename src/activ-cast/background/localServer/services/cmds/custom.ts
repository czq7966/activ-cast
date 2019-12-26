import { ADHOCCAST } from "../../../../libex";
import * as Modules from '../../modules/index'
import * as Dts from '../../cmds/index'
import * as Desktop from "../../../capture.desktop";
import { EStates } from "../../../../pages/dropdown";
import { storage } from "../../../storage";
import { Main } from "../../../main";
import { StreamSharing } from "../stream-sharing";
import { ServiceNetwork } from "./network";



export class ServiceCustom  {
    // static SharingStream: MediaStream;
    // static UserSids: ADHOCCAST.Cmds.Common.Helper.KeyValue<string> = new ADHOCCAST.Cmds.Common.Helper.KeyValue<string>();

    static custom(cmd: ADHOCCAST.Cmds.ICommandData<any>, portUser: Modules.IPortUser) {
        let cmdId = cmd.cmdId;
        switch(cmdId) {
            case Dts.ECommandId.custom_start_cast:
                this.on_custom_start_cast(cmd, portUser);
                break;
                case Dts.ECommandId.custom_stop_cast:
                this.on_custom_stop_cast(cmd, portUser);
                break;                
            case Dts.ECommandId.custom_get_webrtc_state:
                this.on_custom_get_webrtc_state(cmd, portUser);
                break;     
            case Dts.ECommandId.custom_update_states:
                this.on_custom_update_states(cmd, portUser);
            case Dts.ECommandId.custom_get_webrtc_statistics:
                this.on_custom_get_webrtc_statistics(cmd, portUser);
                break;                                
            default:
                break;
        }
    }
    static on_custom_start_cast(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>, portUser: Modules.IPortUser) {
        storage.items.target.sid = cmd.props.user.sid;
        storage.items.user.nick = cmd.props.extra;
        StreamSharing.start()
        .then(v => portUser.respStates())
        .catch(e => {
            portUser.respStates();
            ServiceNetwork.on_network_disconnect(null, portUser);
        })
    }
    static on_custom_stop_cast(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>, portUser: Modules.IPortUser) {
        StreamSharing.stopSharing();
    }    

    static on_custom_get_webrtc_state(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>, portUser: Modules.IPortUser) {
        let instanceId = portUser.users.main.conn.instanceId;
        let user = cmd.props.user;
        user.id = portUser.users.castUsers.sids.get(user.sid);
        let states;

        let mCurrUser = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(instanceId).me();
        let mStreamRoom = ADHOCCAST.Services.Modules.User.getStreamRoom(mCurrUser);
        if (mStreamRoom) {
            let mUser = mStreamRoom.getUser(user.id)
            if (mUser && mUser.peer && mUser.peer.rtc) {
                let rtc = mUser.peer.rtc;
                states = {
                    signalingState: rtc.signalingState,
                    connectionState: rtc.connectionState,
                    iceConnectionState: rtc.iceConnectionState
                }
            }
        }

        let respCmd = Object.assign({}, cmd) as  ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>;
        respCmd.extra = states;
        portUser.sendCommand(respCmd);
    }
    static on_custom_update_states(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>, portUser: Modules.IPortUser) {
        let states: ADHOCCAST.Cmds.Common.Helper.StateMachine<EStates>;
        let conn = Main.instance.conn;
        let _states = 0;
        let _targetUser: ADHOCCAST.Cmds.IUser;

        _states = _states + (conn.signaler.connecting() ? EStates.connecting: 0);
        _states = _states + (conn.signaler.connected() ? EStates.connected: 0);
        _states = _states + (conn.isLogin() ? EStates.logined: 0);
        if (conn.isLogin()) {
            let mLoginRoom = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(conn.instanceId); 
            let mCurrUser = mLoginRoom.me();
            let sid = mCurrUser.item.room.id.split("_")[1];            
            _states = _states + (mCurrUser.states.isset(ADHOCCAST.Dts.EUserState.stream_room_opened) ? EStates.stream_room_opened : 0);
            _states = _states + (mCurrUser.states.isset(ADHOCCAST.Dts.EUserState.stream_room_sending) ? EStates.stream_room_sending : 0);
            let mTargetUser = mLoginRoom.getUserBySid(sid);
            if (!!mTargetUser) _targetUser = mTargetUser.item;
            let mStreamRoom = ADHOCCAST.Services.Modules.User.getStreamRoom(mCurrUser);
            if (mCurrUser.states.isset(ADHOCCAST.Dts.EUserState.stream_room_sending) && mStreamRoom) {                
                let mStreamUser = mStreamRoom.getUserBySid(sid + "*", true);
                if (mStreamUser) {
                    _states = _states + (mStreamUser.states.isset(ADHOCCAST.Dts.EUserState.stream_room_sending) ? EStates.stream_room_casting : 0);                    
                }
            }   
        }

        cmd = cmd || {cmdId: Dts.ECommandId.custom_update_states, props: {}}
        let respCmd = Object.assign({}, cmd) as  ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>;
        respCmd.type = ADHOCCAST.Dts.ECommandType.resp;
        respCmd.props.user = _targetUser;
        respCmd.extra = _states;
        portUser && portUser.notDestroyed ? portUser.sendCommand(respCmd) : Main.instance.portUsers.sendCommand(respCmd, null, true);
        this.on_custom_get_webrtc_statistics(cmd, portUser);        
    }
    static on_custom_get_webrtc_statistics(cmd: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandDataProps>, portUser: Modules.IPortUser) {
        let conn = Main.instance.conn;
        if (conn.isLogin()) {
            let mLoginRoom = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(conn.instanceId); 
            let mCurrUser = mLoginRoom.me();
            let mStreamRoom = ADHOCCAST.Services.Modules.User.getStreamRoom(mCurrUser);
            mStreamRoom.users.keys().forEach(key => {
                if (key != mCurrUser.item.id) {
                    let mUser = mStreamRoom.getUser(key);
                    let peer = mUser && mUser.peer;                    
                    let rtc = peer && peer.rtc;
                    rtc.getStats().then(v => {
                        v.forEach((value, key, parent) => {
                            // console.log("1111111111", key, value, parent);
                        })
                    })
                    rtc.getSenders
                }
            })
        }
    }       
}