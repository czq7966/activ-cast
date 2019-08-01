import { ADHOCCAST } from "../../../../libex";
import { storage } from '../../../storage';
import * as LocalServer from '../../../localServer/index'
import * as Modules from '../../modules/index'
import * as Cmds from '../../cmds/index'

export class ServiceCustom  {
    static custom(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let data = cmd.data;
        let cmdId = data.cmdId;
        let customCmdId = cmd.data.extra;
        switch(customCmdId) {
            case Cmds.ECommandId.custom_stop_cast:
                this.on_custom_stop_cast(cmd);
                break;
            case Cmds.ECommandId.custom_get_sender_info:
                if (data.type = ADHOCCAST.Cmds.ECommandType.req)
                    this.on_custom_get_sender_info_req(cmd);
                break;                        
            default:
                break;    
        }
    }

    static on_custom_stop_cast(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        LocalServer.Services.StreamSharing.stopSharing();
    }

    static on_custom_get_sender_info_req(cmdReq: ADHOCCAST.Cmds.Common.ICommand) {
        let data = cmdReq.data;
        let instanceId = cmdReq.instanceId;
        let info: Cmds.ISenderInfo = {
            mac: storage.items.user.id,
            type: 5,
            ostype: "chromeos",
            mobileSubtype: null,
            deviceid: storage.items.user.id,
            versioncode: null,
            versionname: null,
            width: null,
            height: null,
            clientName: storage.items.user.nick,
            touchbackState: 0
        }
        let conn = ADHOCCAST.Connection.getInstance<ADHOCCAST.Connection>({instanceId: instanceId});
        let me = conn.rooms.getLoginRoom().me();
        let streamRoom = me.getStreamRoom();
        if (streamRoom && streamRoom.me().hasSendStream()) {
            streamRoom.me().peer.streams.resolutions.get
            let sends = streamRoom.me().peer.streams.sends;
            let stream = sends.get(sends.keys()[0]);
            let resolution = ADHOCCAST.Services.Modules.Webrtc.Streams.getStreamResolution(stream);
            if (resolution) {
                info.width = resolution.width;
                info.height =resolution.height;
            }
        }


        let cmd = new ADHOCCAST.Cmds.CommandResp({instanceId: instanceId});
        let respData = Object.assign({}, data, {
            type: ADHOCCAST.Cmds.ECommandType.resp,
            to: data.from,
            props: {
                user: me.item,
                extra: info,
            },
            respResult: true
        })
        cmd.data = respData;
        let promise = cmd.sendCommand();        
        cmd.destroy();
        cmd = null;
        return promise;
    }    
}