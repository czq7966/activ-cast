import { Base } from "./base";
import { ADHOCCAST } from '../libex/index'


export enum EStates {
    none =                      0b0,
    logining =                  0b1,    
    logined =                   0b10,
}

export enum ERoomState {
    nothing = 'nothing',        //
    loading = 'loading',        //加载配置
    streaming = 'streaming',     //获取屏幕流
    connecting = 'connecting',  //正在连接服务器
    connected = 'connected',    //已连接服务器
    creating = 'creating',      //正在创建会议室
    waiting = 'waiting',        //等待会员加入
    presharing = 'presharing',  //等待投屏
    sharing = 'sharing'         //投屏中
}


export interface IRoomItem {
    roomid?: string,
    password?: string,
    max?: number 
    state?: ERoomState
    states?: EStates
}

export interface IStorageItems {
    user?: ADHOCCAST.Cmds.IUser;
    target?: ADHOCCAST.Cmds.IUser;
    roomPrefix?: string;

    signaler?: string
    organization?: string    
    codec?: string    
    bandwidth?: number
    frameRate?: number
    ratioWidth?: number
    ratioHeight?: number
    minFrameRate?: number
    maxFrameRate?: number
    minRatioWidth?: number
    minRatioHeight?: number
    maxRatioWidth?: number
    maxRatioHeight?: number
    screenOptionScreen?: boolean
    screenOptionWindow?: boolean
    screenOptionTab?: boolean
    screenOptionAudio?: boolean
    additionalGesture?: boolean    
    resolutions?: {[name: string]: MediaTrackConstraintSet}
}

var defaultItems: IStorageItems = {
    signaler: "https://servicediscovery.mypromethean.com",
    // signaler: "http://127.0.0.1:2770",
    organization: 'promethean',
    roomPrefix: "promethean_",
    codec: 'vp8',
    frameRate: 0,
    bandwidth: 100000,
    ratioWidth: 0,
    ratioHeight: 0,
    minFrameRate: 1,
    maxFrameRate: 20,
    minRatioWidth: 1920,
    maxRatioWidth: 1920,
    minRatioHeight: 1080,
    maxRatioHeight: 1080,
    screenOptionScreen: true,
    screenOptionWindow: false,
    screenOptionTab: false,
    screenOptionAudio: true,
    additionalGesture: false,

    user: { id: null},
    target: { id: null},
    resolutions: {
        best: {
            width: 1920,
            height: 1080  
        },
        good: {
            width: 1280,
            height: 720
        },
        low: {
            width: 960,
            height: 540
        }          
    }
}




class Storage extends Base {
    items: IStorageItems
    loaded: boolean
    constructor() {
        super();
        this.items = {}
        this.load();
    }
    destroy() {
        super.destroy();
    }
    initItems(items: IStorageItems) {
        this.items = JSON.parse(JSON.stringify(defaultItems));
        let sid = items.target && items.target.sid || "";
        let id = items.user && items.user.id || ADHOCCAST.Cmds.Common.Helper.uuid();
        // let id = ADHOCCAST.Cmds.Common.Helper.uuid();
        let nick = items.user && items.user.nick || "";
        this.items.target.sid = sid;
        this.items.user.nick = nick;
        this.items.user.id = id;
        if (global.IsDevMode) {
            this.items.codec = items.codec || this.items.codec;
            this.items.maxFrameRate = items.maxFrameRate || this.items.maxFrameRate || defaultItems.maxFrameRate;
            this.items.bandwidth = items.bandwidth || this.items.bandwidth;
            this.items.resolutions = Object.assign(this.items.resolutions, items.resolutions);
        }
    }

    load(): Promise<IStorageItems> {
        return new Promise((resolve, reject) => {            
            chrome.storage.sync.get(items => {
                this.items = items as any || {};
                this.initItems(this.items);
                this.loaded = true;
                resolve(this.items);
            })
        })
    }
    reset(): Promise<any> {
        this.initItems({});
        return this.save();
    }
    save(): Promise<any> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(this.items, () => {
                resolve();
            })
        })
        
    }
}

var storage = new Storage();
export { storage }