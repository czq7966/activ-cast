
import * as Dts from '../../background/localServer/cmds/index'
import { ADHOCCAST } from '../../libex';
[
    Dts.ECommandId.custom_update_states,
    ADHOCCAST.Dts.ECommandId.network_connect,
    ADHOCCAST.Dts.ECommandId.network_connecting

].forEach(commanid => {
    ADHOCCAST.Cmds.Common.CommandTypes.RegistCommandType({
        cmdId: commanid,
        name: commanid,
        ReqClass: ADHOCCAST.Cmds.CommandCommon,
        RespClass: ADHOCCAST.Cmds.CommandCommon
    })
})