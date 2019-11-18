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
}

var defaultItems: IStorageItems = {
    signaler: "https://servicediscovery.mypromethean.com",
    organization: 'promethean',
    roomPrefix: "promethean_",
    codec: 'h264',
    frameRate: 0,
    bandwidth: 0,
    ratioWidth: 0,
    ratioHeight: 0,
    minFrameRate: 10,
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
    target: { id: null}
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
        let sid = items.target && items.target.sid || "";
        let id = items.user && items.user.id || ADHOCCAST.Cmds.Common.Helper.uuid();
        let nick = items.user && items.user.nick || "";
        this.items = Object.assign({}, defaultItems);
        this.items.target.sid = sid;
        this.items.user.nick = nick;
        this.items.user.id = id;

        // items.signaler = items.signaler || defaultItems.signaler;
        // items.organization = items.organization || defaultItems.organization;
        // items.bandwidth = items.bandwidth || defaultItems.bandwidth;
        // items.frameRate = items.frameRate || defaultItems.frameRate;
        // items.ratioWidth = items.ratioWidth && items.ratioHeight ? items.ratioWidth : defaultItems.ratioWidth || 0;
        // items.ratioHeight = items.ratioWidth && items.ratioHeight ? items.ratioHeight : defaultItems.ratioHeight || 0;

        // items.minFrameRate = items.minFrameRate || Math.ceil(defaultItems.frameRate / 2);
        // items.maxFrameRate = items.maxFrameRate || defaultItems.frameRate;
        // items.codec = items.codec || defaultItems.codec;

        // items.screenOptionScreen = items.screenOptionScreen;
        // items.screenOptionWindow = items.screenOptionWindow;
        // items.screenOptionTab = items.screenOptionTab;
        // items.screenOptionAudio = items.screenOptionAudio;
        // if (!(items.screenOptionScreen || items.screenOptionWindow || items.screenOptionTab || items.screenOptionAudio)) {
        //     items.screenOptionScreen = defaultItems.screenOptionScreen;
        //     items.screenOptionWindow = defaultItems.screenOptionWindow;
        //     items.screenOptionTab = defaultItems.screenOptionTab;
        //     items.screenOptionAudio = defaultItems.screenOptionAudio;
        // }

        // items.additionalGesture = items.additionalGesture || defaultItems.additionalGesture;

        // items.user = items.user || Object.assign({}, defaultItems.user);
        // items.target = items.target || Object.assign({}, defaultItems.target);
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