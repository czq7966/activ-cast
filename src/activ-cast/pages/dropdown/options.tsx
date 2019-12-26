import React = require("react");
import ReactDOM = require("react-dom");
import { storage, IStorageItems } from "../../background/storage";
import { ADHOCCAST } from '../../libex'
import { EMessageKey } from "../../locales";
import './options.css'
export interface OptionsProps {

}

export interface OptionsState extends IStorageItems {    
    info?: string
}

var runtimePort: chrome.runtime.Port;

runtimePort = chrome.runtime.connect();

export class Options extends React.Component<OptionsProps, OptionsState> {
    signaler: ADHOCCAST.Network.ISignaler;

    constructor(props) {
        super(props);  
        this.signaler = ADHOCCAST.Network.SignalerFactory.create(null);
        this.state = {};
        this.initRuntimePort();
    }
    destroy() {
        this.signaler.disconnect();
        delete this.signaler;
        runtimePort.onMessage.removeListener(this.onMessage);
    }   

    async componentDidMount() {
        await this.loadStorage();

    }
    componentWillUnmount() {
        this.destroy();
    }
    initRuntimePort() {
        runtimePort.onMessage.addListener(this.onMessage)
    }


    onMessage = (message:{sourceId: string}) => {

    }


    render() {
        let header =  <div id="header"><h2>{chrome.i18n.getMessage(EMessageKey.manifest_name)}</h2></div>

        if (storage.loaded) {
            return <div className="container">
                        {header}
                        <hr></hr>
                        <div className="item"><div className="itemLabel"><span>Codec: </span></div>
                            <select id="options-select-codec" defaultValue={this.state.codec || 'vp8'}  onChange = {this.onCodecValueChange} >
                                <option value="vp8" >VP8</option>
                                <option value="vp9">VP9</option>
                                <option value="h264">H264</option>
                            </select>                            
                        </div>   
                        <hr></hr>    
                        <div className="item"><div className="itemLabel"><span>MaxFrameRate: </span></div>
                            <input value={this.state.maxFrameRate} onChange={this.onMaxFrameRateValueChange} ></input>
                            <span>/s</span>
                        </div>   
                        <hr></hr>
                        <div className="item"><div className="itemLabel"><span>MaxBandwidth: </span></div>
                            <input value={this.state.bandwidth} onChange={this.onBandwidthValueChange} ></input>
                            <span>Kbps</span>
                        </div>   
                        <hr></hr>
                        <div id="bestResolution" className="item resolution"><div className="itemLabel"><span>BestResolution: </span></div>
                            <input value={this.state.resolutions["best"].width as any} onChange={this.onBestResolutionWidthValueChange} ></input>
                            <span>x</span>
                            <input value={this.state.resolutions["best"].height as any} onChange={this.onBestResolutionHeightValueChange} ></input>
                        </div>                         
                        <hr></hr>           
                        <div id="goodResolution" className="item resolution"><div className="itemLabel"><span>GoodResolution: </span></div>
                            <input value={this.state.resolutions["good"].width as any} onChange={this.onGoodResolutionWidthValueChange} ></input>
                            <span>x</span>
                            <input value={this.state.resolutions["good"].height as any} onChange={this.onGoodResolutionHeightValueChange} ></input>
                        </div>          
                        <hr></hr>           
                        <div id="lowResolution" className="item resolution"><div className="itemLabel"><span>LowResolution: </span></div>
                            <input value={this.state.resolutions["low"].width as any} onChange={this.onLowResolutionWidthValueChange} ></input>
                            <span>x</span>
                            <input value={this.state.resolutions["low"].height as any} onChange={this.onLowResolutionHeightValueChange} ></input>
                        </div>                                                 
                        <hr></hr>                                         
                        <div id="options-div-operation">
                            <button onClick={this.okSignaler} >OK</button>
                            <button onClick={this.cancelSignaler}>Cancel</button>
                        </div>
                        {   
                            this.state.info 
                                ? <div id="info"><div id="infoCell"><p>{this.state.info}</p></div></div>
                                : null
                        }
                        
                    </div>
    
        } else {
            return <div>loading...</div>
        }

    }

    async loadStorage() {
        await storage.load().then(items => {
            this.setState(items);
        })
    }

    
    onOrganizationValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            organization: event.target.value.trim()
        })            
    }    

    onCodecValueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({
            codec: event.target.value.trim()
        })            
    }

    onBandwidthValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            bandwidth: parseInt(event.target.value.trim() || "0")
        })            
    }
    onFrameRateValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        let rate = parseInt(event.target.value.trim());
        rate  = (rate <= 128 ? rate : (rate > 128 ? 128 : '')) as any;
        this.setState({
            frameRate: rate
        })            
    }    
    onRatioWidthValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        let rate = parseInt(event.target.value.trim());
        rate  = rate ? rate : '' as any;
        this.setState({
            ratioWidth: rate
        })            
    }  
    onRatioHeightValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        let rate = parseInt(event.target.value.trim());
        rate  = rate ? rate : '' as any;
        this.setState({
            ratioHeight: rate
        })            
    }    
     
    onMinFrameRateValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            minFrameRate: parseInt(event.target.value.trim())
        })            
    }
    onMaxFrameRateValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            maxFrameRate: parseInt(event.target.value.trim() || "0")
        })            
    }        
    onSignalerValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {        
        this.setState({
            signaler: event.target.value
        })            
    }
    onBestResolutionWidthValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.state.resolutions["best"].width = parseInt(event.target.value.trim() || "0");
        this.setState({
            resolutions: this.state.resolutions
        })            
    }   
    onBestResolutionHeightValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.state.resolutions["best"].height = parseInt(event.target.value.trim() || "0");
        this.setState({
            resolutions: this.state.resolutions
        })            
    }     
    onGoodResolutionWidthValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.state.resolutions["good"].width = parseInt(event.target.value.trim() || "0");
        this.setState({})            
    }   
    onGoodResolutionHeightValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.state.resolutions["good"].height = parseInt(event.target.value.trim() || "0");
        this.setState({})            
    }     
    onLowResolutionWidthValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.state.resolutions["low"].width = parseInt(event.target.value.trim() || "0");
        this.setState({})            
    }   
    onLowResolutionHeightValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.state.resolutions["low"].height = parseInt(event.target.value.trim() || "0");
        this.setState({})            
    }       

    okSignaler = () => {
        storage.items.codec = this.state.codec;
        storage.items.bandwidth = this.state.bandwidth;
        // storage.items.frameRate = this.state.frameRate;
        // storage.items.ratioWidth = this.state.ratioWidth;
        // storage.items.ratioHeight = this.state.ratioHeight;
        // storage.items.minFrameRate = this.state.minFrameRate;
        storage.items.maxFrameRate = this.state.maxFrameRate;
        // storage.items.signaler = url;
        // storage.items.organization = this.state.organization;
        storage.items.resolutions = this.state.resolutions;
        storage.save().then(() => {window.close()})
    }
    cancelSignaler = () => {
        window.close();
    }

}

let rootEl = document.getElementById('root');

rootEl && 
ReactDOM.render(
    <Options/>
, rootEl);