import { ADHOCCAST } from '../../libex';
import { Client } from '../network/client';

export interface IConnectionConstructorParams extends ADHOCCAST.Cmds.Common.IBaseConstructorParams {
    signalerBase: string
    namespace: string
    factorySignaler?: string;
    notInitDispatcherFilters?: boolean;
}
export class Connection extends ADHOCCAST.Cmds.Common.Base {    
    params: IConnectionConstructorParams;
    signalerBase: string
    namespace: string
    signaler: ADHOCCAST.Network.ISignaler;

    dispatcher: ADHOCCAST.Modules.Dispatchers.IDispatcher
    constructor(params: IConnectionConstructorParams) {
        super(params);
        this.params = Object.assign({}, params);
        this.instanceId = this.instanceId || ADHOCCAST.Cmds.Common.Helper.uuid();
        this.namespace = params.namespace + this.instanceId;
        this.signalerBase = params.signalerBase;

        this.signaler = ADHOCCAST.Network.SignalerFactory.create(Client.TAG);
        let pms: ADHOCCAST.Modules.Dispatchers.IDispatcherConstructorParams = {
            isServer: false,
            instanceId: this.instanceId,
            signaler: this.signaler,
        }
        this.dispatcher = ADHOCCAST.Modules.Dispatchers.Dispatcher.getInstance(pms) 
        
        this.initEvents();        
    }    
    destroy() {
        this.unInitEvents();
        this.dispatcher.destroy()
        this.signaler.destroy();
 
        delete this.dispatcher;
        delete this.signaler;
        delete this.params;
        super.destroy();
    }
    initEvents() {

    }
    unInitEvents() {

    }

    login(user?: ADHOCCAST.Cmds.IUser, namespace?: string, signalerBase?: string): Promise<any> {
        this.namespace = namespace || this.namespace;
        this.signalerBase = signalerBase || this.signalerBase;
        user = user || {id: null};
        let instanceId = this.instanceId;
        this.signaler.setUrl(this.getSignalerUrl());
        return this.signaler.connect();
    }       
    isLogin(): boolean {
        return this.signaler.connected();
    }
    logout(): Promise<any> {        
        if (this.isLogin()) {
            this.signaler.disconnect();
            return Promise.resolve();
        } else {
            return Promise.resolve();
        }
    }

    disconnect(){
        this.signaler.disconnect();
    }
    getSignalerUrl(): string {
        let base = this.signalerBase;
        base = base[base.length - 1] === '/' ? base.substr(0, base.length - 1) : base;
        let nsp = this.namespace;
        return base + '/' + nsp
    }
}