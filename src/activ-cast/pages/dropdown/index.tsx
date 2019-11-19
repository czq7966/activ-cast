import "url-search-params-polyfill";
import React = require("react");
import ReactDOM = require("react-dom");
import './index.css'
import { ERoomState, storage } from "../../background/storage";
import { IRuntimePortMessage, ERuntimePortMessageType } from "../../background/runtime.port";
import { ECaptureScreenOptions } from "../../background/capture.desktop";
import * as Modules from "../modules/index";
import { ADHOCCAST } from "../../libex";
import * as Dts from '../cmds/index'
import { EMessageKey } from "../../locales";
import { CompPanleID } from "./comps/panel-id/panel-id";

ADHOCCAST.Cmds.Common.Helper.Debug.enabled = process.env.NODE_MODE == "development";

switch(chrome.i18n.getUILanguage()) {
    case "ar":
        require('./index.rtl.css');
}



export enum EStates {
    none =                      0b0,
    connecting =                0b1,
    connected =                 0b10,
    logined =                   0b100,
    stream_room_opened =        0b1000,
    stream_room_sending =       0b10000,
    stream_room_casting =       0b100000,
    show_message =              0b1000000,
    show_ui_interactive =       0b10000000,
}

enum StateCase {
    none = 0,
    show_message = 1,
    not_connect = 2,
    not_login = 3,
    open_cast = 4,
    casting = 5,
    ui_interactive = 6
}

export interface DropdownProps {

}

export interface DropdownState {
    connected?: boolean
    user?: ADHOCCAST.Cmds.IUser;
    target?: ADHOCCAST.Cmds.IUser;
    loginLabel?: string;
    roomid?: string
    sourceId?: string
    stream?: any;
    targetSid?: string;
    userNick?: string;
    case?: StateCase;
    msg?: string;
    panelIdError?: boolean;
    nameIsTooLong?: boolean;
    nameIsEmpty?: boolean;
}





export class Dropdown extends React.Component<DropdownProps, DropdownState> {
    sourceId: string;
    adhocConn: ADHOCCAST.Connection;
    conn: Modules.Connection;
    states: ADHOCCAST.Cmds.Common.Helper.StateMachine<EStates>;
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;
    stateCase: StateCase;
    targetSidMaxLength: number = 6;
    nameMaxLenght: number = 40;
    compPanelID: CompPanleID;
    inputPanelName: HTMLInputElement;

    constructor(props) {
        super(props);  
        this.states = new ADHOCCAST.Cmds.Common.Helper.StateMachine<EStates>();
        this.stateCase = StateCase.none;
        this.state = {};
        this.eventRooter = new ADHOCCAST.Cmds.Common.EventRooter();
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: ADHOCCAST.Cmds.Common.Helper.uuid(),
            signalerBase: "adhoc://activcast.pages",
            namespace: "dropdown",
            notInitDispatcherFilters: true
        }
        this.conn = new Modules.Connection(connParams);

        this.initEvents();
        this.loadStorage().then(() => {
            this.relogin();
        })
        
        this.conn.login();        
    }
    destroy() {
        this.unInitEvents();
        this.states.destroy();
        this.eventRooter.destroy();
        this.conn.destroy();
        this.adhocConn && this.adhocConn.destroy();
        this.conn = null;
        this.eventRooter = null;
        delete this.states;
        delete this.conn;
        delete this.eventRooter;
    }   
    initEvents() {
        window.addEventListener('unhandledrejection', this.unhandledRejection);
        this.eventRooter.setParent(this.conn.dispatcher.eventRooter);
        this.eventRooter.onBeforeRoot.add(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.add(this.onAfterRoot)     
    }
    unInitEvents() {
        this.eventRooter.onBeforeRoot.remove(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.eventRooter.setParent(); 
        window.removeEventListener('unhandledrejection', this.unhandledRejection);
    }
    unhandledRejection = (event) => {
        console.error("unhandled rejection:", event.reason);
        this.relogin();
    }

    componentDidMount() {


    }
    componentWillUnmount() {
        this.destroy();
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
        switch(cmd.data.cmdId) {
            case ADHOCCAST.Cmds.ECommandId.network_connecting:
                this.onAfterRoot_network_connecting(cmd)
                break;
            case ADHOCCAST.Cmds.ECommandId.network_connect:
                this.onAfterRoot_network_connect(cmd)
                break;                
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
                this.onAfterRoot_adhoc_login(cmd)
                break;            
            case ADHOCCAST.Cmds.ECommandId.user_get:    
                // this.onAfterRoot_user_get(cmd);            
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_hello:
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:    
            case ADHOCCAST.Cmds.ECommandId.room_leave:    
            case ADHOCCAST.Cmds.ECommandId.room_close:                
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onconnectionstatechange:  
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onsendstreaminactive:  
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstreaminactive:
            case ADHOCCAST.Cmds.ECommandId.user_state_onchange:
            case Dts.ECommandId.custom_start_cast:
                this.refresh();
                break;
            case Dts.ECommandId.custom_update_states:
                this.onAfterRoot_custom_update_states(cmd)
                break;
            default:
                break;
        }     
        console.log("onAfterRoot", cmd.data.cmdId, cmd.data);
    }  

    setState(state: DropdownState) {
        this.stateCase = state.case || StateCase.none;
        this.checkLogin();
        super.setState(state);
    }
    checkLogin() {
        if (this.adhocConn) {
            if (this.adhocConn.signaler.connected() && this.adhocConn.isLogin()) {
                this.states.set(EStates.logined);
            } else {
                this.states.reset(EStates.logined);
                this.relogin();
            }
        }
    }

    calCase() {
        let _case = this.stateCase || StateCase.none;
        if (_case == StateCase.none) {
            if (!this.state.user && !this.state.connected) 
                this.stateCase = StateCase.not_connect;
            else if (!this.state.user) 
                this.stateCase = StateCase.not_login;
            else if (ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(this.state.user.states, ADHOCCAST.Dts.EUserState.stream_room_sending )) {
                if (this.state.target && 
                    ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(this.state.target.states, ADHOCCAST.Dts.EUserState.stream_room_sending )) 
                    this.stateCase = StateCase.casting;
                else {                     
                    this.stateCase = StateCase.open_cast;
                };
            }
            else this.stateCase = StateCase.ui_interactive; 
        } 
    }

    render() {
        let title_msg = chrome.i18n.getMessage(EMessageKey.App_Name) + (process.env.NODE_MODE=="development" ? "(DEV)" : "");
        let header_msg = this.state.target ? (this.state.target.nick ? this.state.target.nick : chrome.i18n.getMessage(EMessageKey.ActivPanel)) : chrome.i18n.getMessage(EMessageKey.App_Name);
        let msg_label_msg = this.state.msg;
        let msg_casting_name = this.state.target ? (this.state.target.nick ? this.state.target.nick : chrome.i18n.getMessage(EMessageKey.ActivPanel)) : "";
        if(header_msg == chrome.i18n.getMessage(EMessageKey.ActivPanel)) {
            header_msg = header_msg+"-"+this.state.target.sid;
            msg_casting_name = header_msg;
        }

        let title = () =>   <div className="title fontStyle" >
                                <div className="title_name" >
                                    <img src="../../images/icons/16.png"></img>
                                    <span>{title_msg}</span>
                                </div>                                    
                                <div className="title_mark">
                                    <img src="../../images/mark.png" ></img>
                                </div>                                  
                            </div>
        let header = () =>  <div className="header fontStyle" >{header_msg}</div>
        let id_label = () => <div className="id_label fontStyle" >{chrome.i18n.getMessage(EMessageKey.ENTER_PANEL_ID)}</div>
        let id_label_error = () => <div className="id_label_error fontStyle" >{this.state.panelIdError ? chrome.i18n.getMessage(EMessageKey.Panel_ID_Error) : ""}</div>
        // let id_text_field = () => <div className="id_text_field fontStyle" ><input value={this.state.targetSid} onChange={this.onIdValueChange} /></div>
        let id_text_field = () =>   <div className="id_text_field2 fontStyle" >
                                        <CompPanleID ref={ref => this.onRef_id_text_field(ref)} length={6} 
                                            value={this.state.targetSid}
                                            onNext={this.onNext_compPanelID}
                                            onChange={this.onChange_compPanelID} />
                                    </div>
        let name_label = () => <div className="name_label fontStyle">{chrome.i18n.getMessage(EMessageKey.ENTER_YOUR_NAME)}</div>
        let name_label_error = () => <div className="name_label_error fontStyle">
                                        {
                                            this.state.nameIsEmpty ? chrome.i18n.getMessage(EMessageKey.Please_enter_your_name) :
                                            this.state.nameIsTooLong ? chrome.i18n.getMessage(EMessageKey.Name_is_too_long) : ""
                                        }
                                    </div>
        let name_text_field = () => <div className="name_text_field fontStyle">
                                        <input id="id_input_name_text_field"  value={this.state.userNick} 
                                            ref = {ref => {ref && this.onRef_name_text_field(ref)}}
                                            onChange={this.onNameValueChange} />
                                    </div>

        let cast_btn = () => <div className="cast_btn fontStyle"><button className="fontStyle_button"  onClick={this.onCastBtnClick}>{chrome.i18n.getMessage(EMessageKey.ENTER_WAITING_ROOM)}</button></div>
        let cancel_btn = () => <div className="cast_btn fontStyle"><button className="fontStyle_button"  onClick={this.onCancelBtnClick}>{chrome.i18n.getMessage(EMessageKey.CANCEL)}</button></div>
        let stop_btn = () => <div className="cast_btn fontStyle"><button className="fontStyle_button"  onClick={this.onStopBtnClick}>{chrome.i18n.getMessage(EMessageKey.STOP_SHARING_SCREEN)}</button></div>

        let msg_label = () => <div className="msg_label fontStyle"><span>{msg_label_msg}</span></div>
        let msg_normal_label = () => <div className="msg_normal_label fontStyle"><span>{msg_label_msg}</span></div>
        let msg_casting_label = () => <div className="msg_casting_label fontStyle"><span>{msg_label_msg}</span><div className="msg_casting_name" >{msg_casting_name}</div></div>

        let footer = () =>  <div className="footer">
                                {/* {cancel_btn()} */}
                                {cast_btn()}
                            </div>
        let footer_cancel = () =>   <div className="footer">
                                        {cancel_btn()}
                                    </div>
        let footer_stop = () =>   <div className="footer">
                                        {stop_btn()}
                                    </div>
        // Casting
        if (this.states.isset(EStates.stream_room_sending) && this.states.isset(EStates.stream_room_casting)) {
            header_msg = chrome.i18n.getMessage(EMessageKey.Screen_Share),
            msg_label_msg = chrome.i18n.getMessage(EMessageKey.Sharing_screen_to);
            return  <div className="container" >
                        {title()}
                        {header()}
                        {msg_casting_label()}
                        {footer_stop()}
                    </div>   
        }        

        // Waiting
        if (this.states.isset(EStates.stream_room_sending)) {
            header_msg = chrome.i18n.getMessage(EMessageKey.Waiting_Room);
            msg_label_msg = chrome.i18n.getMessage(EMessageKey.Please_wait_for_permission);

            return  <div className="container" >
                        {title()}
                        {header()}
                        {msg_normal_label()}
                        {footer_cancel()}
                    </div>   
        }      


        if (this.states.isset(EStates.connecting)) {
            msg_label_msg = this.state.msg || chrome.i18n.getMessage(EMessageKey.Connecting___);
            return  <div className="container" >
                        {title()}
                        {header()}
                        {msg_label()}
                        {footer_cancel()}
                    </div>   
        }

        if (!this.states.isset(EStates.connected)) {
            msg_label_msg = this.state.msg || chrome.i18n.getMessage(EMessageKey.Connecting___);
            return  <div className="container" >
                        {title()}
                        {header()}
                        {msg_label()}
                        {footer_cancel()}
                    </div>   
        }      
        if (!this.states.isset(EStates.logined)) {
            msg_label_msg = this.state.msg || chrome.i18n.getMessage(EMessageKey.Connecting___) + ".";
            return  <div className="container" >
                        {title()}
                        {header()}
                        {msg_label()}
                        {footer_cancel()}
                    </div>   
        }         
        
        return  <div className="container" >
                    {title()}
                    {header()}
                    {id_label()}
                    {id_text_field()}
                    {id_label_error()}                    
                    {name_label()}
                    {name_text_field()}
                    {name_label_error()}
                    {footer()}                    
                </div>           
    }

    loadStorage(): Promise<any> {
        return storage.load().then(items => {
            this.setState({
                targetSid: items.target.sid,
                userNick: items.user.nick
            });
        })
    }


    //************************* */

    //network interface
    refresh() {
        let cmd = new ADHOCCAST.Cmds.CommandReq({instanceId: this.conn.instanceId});
        cmd.data = {
            cmdId: Dts.ECommandId.custom_update_states            
        }  
        cmd.sendCommand();
    }

    getTargetUser(sid: string): Promise<any> {
        if (!!sid) {
            let target:  ADHOCCAST.Cmds.IUser = {
                id: null,
                sid: sid
            }
            return ADHOCCAST.Services.Cmds.UserGet.get(this.getAdhocConn().instanceId, target)
        } else {
            Promise.reject("invalid sid");
        }
    }



    _syncGetTargetUserPromise: Promise<any>;
    _syncLastTargetUserSid: string;
    syncGetTargetUser(sid: string): Promise<any> {
        if (!!sid) {
            this._syncLastTargetUserSid = sid;
            if (!!this._syncGetTargetUserPromise)
                return this._syncGetTargetUserPromise;

            this._syncGetTargetUserPromise = new Promise((resolve, reject) => {
                let __getUser = (_sid: string) => {
                    this.getTargetUser(_sid)
                    .then((data: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandRespDataProps>) => {
                        if (data.props.user.sid == this._syncLastTargetUserSid) {                            
                            let target = Object.assign({}, data.props.user);
                            this.setState({
                                target: target,
                                panelIdError: false
                            })
                            delete this._syncGetTargetUserPromise;   
                            resolve(data);                                                     
                        } else {
                            this.setState({
                                target: null,
                                panelIdError: false
                            })                                
                            __getUser(this._syncLastTargetUserSid);
                        }
                        
                    })
                    .catch((e: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandRespDataProps>) => {                        
                        if (e == undefined || e && e.respMsg == "time out!") {       
                            delete this._syncGetTargetUserPromise;
                            reject(e);
                            this.relogin();
                        } else {
                            if (_sid != this._syncLastTargetUserSid) {
                                __getUser(this._syncLastTargetUserSid);
                            } else {
                                delete this._syncGetTargetUserPromise;
                                reject(e);
                                this.setState({
                                    target: null,
                                    panelIdError: _sid.length == this.targetSidMaxLength ? true : false
                                })
                            }
                        }
                        
                    })  
                }
                setTimeout(() => {
                    __getUser(sid);                        
                }, 1);                    
            })

            return this._syncGetTargetUserPromise;
        } else {
            return Promise.reject();
        }
    }
    getCurrentUser(): Promise<any> {
        let promise = ADHOCCAST.Services.Cmds.UserGet.get(this.conn.instanceId, {id: null});

        promise
        .then((data: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandRespDataProps>) => {
            let user = Object.assign({}, data.props.user);
            this.setState({
                user: user
            })
        })
        .catch(e => {
            this.setState({
                user: null
            })
        })
        return promise;        
    }
    startCast() {
        let nick = this.state.userNick || "";
        let sid = this.state.targetSid;
        if (sid.length == 0) {
            this.setState({
                panelIdError: sid.length == 0
            })
            this.compPanelID && this.compPanelID.focus();
            return;
        }        
        if (nick.length == 0) {
            this.setState({
                nameIsEmpty: nick.length == 0
            })
            this.inputPanelName && this.inputPanelName.focus();
            return;
        }

        this.syncGetTargetUser(this.state.targetSid).then(v => {
            let data: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandReqDataProps> = {
                cmdId: Dts.ECommandId.custom_start_cast,
                props: {
                    user: {id: null, sid: this.state.targetSid},
                    extra: this.state.userNick
                }
            }
            let cmd = new ADHOCCAST.Cmds.CommandReq({instanceId: this.conn.instanceId});
            cmd.data = data;        
            let promise =  cmd.sendCommand();
            promise.then(() => {
                this.saveStorage();
            });
            return promise;            
        })
        .catch(e => {
            this.compPanelID && this.compPanelID.focus();
        });

    }
    stopCast() {
        let data: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Dts.ICommandReqDataProps> = {
            cmdId: Dts.ECommandId.custom_stop_cast,
            props: {}
        }
        let cmd = new ADHOCCAST.Cmds.CommandReq({instanceId: this.conn.instanceId});
        cmd.data = data;        
        let promise =  cmd.sendCommand();
        return promise;        
    }

    saveStorage() {
        storage.items.user.nick = this.state.userNick;
        storage.items.target.sid = this.state.targetSid;
        storage.save()
    }
    getAdhocConn(): ADHOCCAST.Connection {
        if (!this.adhocConn) {
            let adhocConnParams: ADHOCCAST.IConnectionConstructorParams = {
                instanceId: ADHOCCAST.Cmds.Common.Helper.uuid(),
                signalerBase: storage.items.signaler,
                namespace: storage.items.organization,
                notInitDispatcherFilters: true,
                parent: this
            }

            this.adhocConn = ADHOCCAST.Connection.getInstance(adhocConnParams);
        }
        return this.adhocConn;

    }
    login(newConn?: boolean): Promise<any> {
        let _login = () => {
            if (this.getAdhocConn().isLogin()) 
                return Promise.resolve()
            else {
                let user: ADHOCCAST.Cmds.IUser = {
                    id: null,
                    sid: null,
                    room: {
                        id: ADHOCCAST.Cmds.Common.Helper.uuid()
                    }
                }
                this.getAdhocConn().disconnect();
                return this.getAdhocConn().login(user);
            }   
        }

        if(!!newConn) this.adhocConn = null;

        let promise = new Promise((resolve, reject) => {
            let __login = () => {
                _login()
                .then(v => {
                    resolve(v)
                })
                .catch(e => {
                    console.error("login failed, retrying: ", e);
                    __login();
                })
            }
            __login();
        } )

        return promise;
    }
    _reloginPromise: Promise<any>
    relogin(): Promise<any> {
        if (!!this._reloginPromise) {
            return this._reloginPromise;
        }
        
        this._reloginPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.getAdhocConn().isLogin()) {
                    this.getAdhocConn().logout().catch(e=>{});
                }
                this.getAdhocConn().disconnect();
    
                this.login(true).then(v => {
                    this.setState({});                
                    this.syncGetTargetUser(this.state.targetSid).catch(e=>{});  
                    delete this._reloginPromise;
                    resolve(v);                
                })
                .catch(e => {
                    delete this._reloginPromise;
                    reject(e);
                })
                this.setState({
                    target: null,
                    panelIdError: false
                });                
            }, 1);
        })
        return this._reloginPromise;
    }



    //UI Events
    _onIdValueChange (id: string) {
        let sid = id;
        sid = sid.substr(0, this.targetSidMaxLength);
        
        this.setState({
            targetSid: sid,
            panelIdError: false
        })    
        this.syncGetTargetUser(sid).then(v => {
            storage.items.target.sid = sid;
            storage.save()
        })
        .catch(e => {

        });        
    }
    onIdValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this._onIdValueChange(event.target.value.trim())
    }    

    onChange_compPanelID = (compPanleID: CompPanleID, newValue: string, oldValue: string) => {    
        this._onIdValueChange(newValue.trim());
    }    

    onNameValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        let nick = event.target.value;
        this.setState({
            userNick: nick,
            nameIsTooLong: nick.length > this.nameMaxLenght,
            nameIsEmpty: nick.length == 0 ? true: false
        })    
        storage.items.user.nick = nick;
        storage.save()
    }    

    onCancelBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (this.states.isset(EStates.stream_room_sending))
            this.onStopBtnClick(event);
        else 
            window.close();
    }

    onStopBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        this.stopCast();        
    }
        
    onCastBtnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        this.startCast();
    }    
    
    //Commands
    onAfterRoot_adhoc_login(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let cmdId = cmd.data.cmdId;
        let data = cmd.data;
        let type = cmd.data.type;
        if (type == ADHOCCAST.Cmds.ECommandType.resp) {
            if (!data.respResult) {
                this.states.reset(EStates.logined);

                this.setState({
                    user: null,
                    loginLabel:  data.respMsg || "LOGINING......"
                }) 
            }
            else {
                this.states.set(EStates.logined);

                this.setState({
                    user: Object.assign({}, data.props.user),
                    loginLabel:  ""
                })                                
            }
        }
       
    }
    onAfterRoot_adhoc_logout(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let cmdId = cmd.data.cmdId;
        let data = cmd.data;
        let type = cmd.data.type;
        if (type == ADHOCCAST.Cmds.ECommandType.resp) {
            this.states.reset(EStates.logined);
        }
       
    }    
    onAfterRoot_user_get(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let cmdId = cmd.data.cmdId;
        let data = cmd.data;
        let type = cmd.data.type;
        if (type == ADHOCCAST.Cmds.ECommandType.resp ) {
            if (!!data.respResult) {
                let user = Object.assign({}, data.props.user);
                this.setState({
                    target: user
                });
                storage.items.target.sid = user.sid;
                storage.save();
            } else {
                this.setState({
                    target: null
                });
            }
        }
    }    
    onAfterRoot_network_connecting(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let data = cmd.data;
        if (data.respResult == false) {
            this.states.reset(EStates.connected);
            this.states.reset(EStates.connecting);

            this.setState({
                msg:  data.respMsg || "Connecting Error, Retrying"
            });

        } else {
            this.states.set(EStates.connecting);
            this.setState({
                msg: chrome.i18n.getMessage(EMessageKey.Connecting___)
            })             
        }
    }    
    onAfterRoot_network_connect(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        this.states.reset(EStates.connecting);
        this.states.set(EStates.connected);
        this.relogin();
    }    
    onAfterRoot_network_disconnect(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        this.states.reset(EStates.connecting);
        this.states.reset(EStates.connected);
        this.states.reset(EStates.logined);
        this.states.reset(EStates.stream_room_opened);
        this.states.reset(EStates.stream_room_sending);
        this.states.reset(EStates.stream_room_casting);
        this.setState({})     
    }     
    onAfterRoot_custom_update_states(cmd: ADHOCCAST.Cmds.Common.ICommand) {                
        this.states.states = cmd.data.extra;
        if (cmd.data.props && cmd.data.props.user) {
            this.setState({target: cmd.data.props.user});
        } else 
            this.setState({});
    }

    onRef_id_text_field = (ref: CompPanleID) => {
        this.compPanelID = ref;
    }
    onRef_name_text_field = (ref: HTMLInputElement) => {
        this.inputPanelName = ref;
    }
    onNext_compPanelID = () => {
        let elem = document.getElementById("id_input_name_text_field");
        elem && elem.focus();
    }
}

let rootEl = document.getElementById('root');

rootEl && 
ReactDOM.render(
    <Dropdown/>
, rootEl);