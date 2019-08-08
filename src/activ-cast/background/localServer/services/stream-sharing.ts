import { ADHOCCAST } from "../../../libex";
import * as Modules from '../modules/index'
import * as Dts from '../cmds/index'
import * as Desktop from "../../capture.desktop";
import { EStates } from "../../../pages/dropdown";
import { storage } from "../../storage";
import { Main } from "../../main";



export class StreamSharing  {
    static SharingStream: MediaStream;    
    static stopSharing() {
        let conn = Main.instance.conn;
        let stream = StreamSharing.SharingStream;
        if (stream && stream.active) {
            stream.getTracks().forEach(track => {
                track.stop();
            })
        }        
        StreamSharing.SharingStream = null;
        conn.signaler.disconnect();           
        chrome.runtime.reload();
    }    

    static onInactive() {
        let stream = StreamSharing.SharingStream;
        let conn = Main.instance.conn;
        let instanceId = conn.instanceId;
        stream && stream.removeEventListener('inactive', StreamSharing.onInactive)        
        if (conn.isLogin()) {
            let mCurrUser = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(instanceId).me();
            let mStreamRoom = ADHOCCAST.Services.Modules.User.getStreamRoom(mCurrUser);
            let mUser = mStreamRoom && mStreamRoom.me();        
            mUser && mUser.notDestroyed && 
            ADHOCCAST.Services.Cmds.StreamWebrtcStreams.sendingStream(mUser.getPeer().streams, null);   
        }

        StreamSharing.stopSharing();
    }     
    static onStartSharing() {
        let stream = StreamSharing.SharingStream;
        let conn = Main.instance.conn;
        let instanceId = conn.instanceId;
        if (conn.isLogin()) {
            let mCurrUser = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(instanceId).me();
            let mStreamRoom = ADHOCCAST.Services.Modules.User.getStreamRoom(mCurrUser);
            let mUser = mStreamRoom.me();
            ADHOCCAST.Services.Cmds.StreamWebrtcStreams.sendingStream(mUser.getPeer().streams, stream);
            let data = {}
            data[stream.id] = {width: screen.width, height:screen.height}
            ADHOCCAST.Services.Cmds.User.dispatchCommand(mUser.instanceId, mUser.item, null, data, ADHOCCAST.Cmds.ECommandId.stream_webrtc_resolution)            
        }
        stream.removeEventListener('inactive', StreamSharing.onInactive)
        stream.addEventListener('inactive', StreamSharing.onInactive);
    }

    static getStream(): Promise<any> {
        return new Promise((resolve, reject) => {
            let _stream = StreamSharing.SharingStream
            if (_stream && _stream.active) {
                resolve(_stream);
            } else {
                let screenOptions = [Desktop.ECaptureScreenOptions.screen, Desktop.ECaptureScreenOptions.audio];
                Desktop.captureDesktop.getStream(screenOptions,(stream, tab) => {                        
                    if (stream) {
                        resolve(stream);
                    } else {
                        reject()                        
                    }
                })    
            }
        })
    }    

    static login(): Promise<any> {
        let conn = Main.instance.conn;
        let target = storage.items.target;
        let nick = storage.items.user.nick;
        storage.items.user.id = storage.items.user.id || ADHOCCAST.Cmds.Common.Helper.uuid();
        let user: ADHOCCAST.Cmds.IUser = {
            id: storage.items.user.id ,
            room: {
                id: storage.items.roomPrefix + target.sid
            },
            nick: nick
        }
        return conn.login(user)
    }    

    static startCast(): Promise<any> {
        return new Promise((resolve, reject) => {
            let conn = Main.instance.conn;
            let instanceId = conn.instanceId;
            StreamSharing.getStream()
            .then(stream => {
                StreamSharing.SharingStream = stream;
                StreamSharing.login()
                .then(() => {                    
                    let mCurrUser = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(instanceId).me();
                    ADHOCCAST.Services.Cmds.StreamRoomOpen.open(instanceId, mCurrUser.item)
                    .then((result) => {                    
                        StreamSharing.onStartSharing();     
                        resolve();
                    })
                    .catch((e) => {
                        StreamSharing.stopSharing();
                        reject(e);
                    })                    
                })
                .catch(e => {
                    StreamSharing.stopSharing();
                    reject(e);
                })
            })
            .catch(e => {
                reject(e);
            })  
        })
    }    
    static start(): Promise<any> {
        return new Promise((resolve, reject) => {
            let conn = Main.instance.conn;
            let _startCast = () => {
                StreamSharing.startCast()
                .then(v => {
                    resolve(v);
                })
                .catch(e => {
                    reject(e);
                })
            }    


            if (conn.isLogin()) {
                conn.logout()
                .then(() => {
                    _startCast();                    
                })
                .catch(e => {
                    reject(e)
                })
            }
            else {
                _startCast();
            }        
        })
    }

}
