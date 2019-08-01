import React = require("react");
import ReactDOM = require("react-dom");
import './index.css'
import { storage } from "../../background/storage";
import { ADHOCCAST } from '../../libex'

export interface OptionsProps {

}

export interface OptionsState {    
    roomid?:string
    codec?: string
    bandwidth?: number
    frameRate?: number
    ratioWidth?: number
    ratioHeight?: number
    minFrameRate?: number
    maxFrameRate?: number
    signaler?: string
    organization?: string
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
        this.loadStorage();
    }
    destroy() {
        this.signaler.disconnect();
        delete this.signaler;
        runtimePort.onMessage.removeListener(this.onMessage);
    }   

    componentDidMount() {

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
        let header =  <div id="header">Share Your Desktop</div>

        if (storage.loaded) {
            return <div>
                        {header}
                        <hr></hr>
                        <div className="item"><div className="itemLabel"><span>Organization: </span></div>
                            <input value={this.state.organization } onChange={this.onOrganizationValueChange} ></input>
                        </div>                          
                        <hr></hr>
                        <div className="item"><div className="itemLabel"><span>Connection ID: </span></div>
                            <input value={this.state.roomid } onChange={this.onRoomidValueChange} ></input>
                        </div>   
                        <hr></hr>    
                        <div className="item"><div className="itemLabel"><span>Codec: </span></div>
                            <select id="options-select-codec" defaultValue={this.state.codec || 'default'}  onChange = {this.onCodecValueChange} >
                                <option value="default">Default</option>
                                <option value="vp8" >VP8</option>
                                <option value="vp9">VP9</option>
                                <option value="h264">H264</option>
                            </select>                            
                        </div>   
                        {/* <hr></hr>    
                        <div className="item"><div className="itemLabel"><span>Bandwidth: </span></div>
                            <input value={this.state.bandwidth} onChange={this.onBandwidthValueChange} ></input>
                            <span>K</span>
                        </div>      */}
                        <hr></hr>    
                        <div className="item"><div className="itemLabel"><span>FrameRate: </span></div>
                            <input value={this.state.frameRate} onChange={this.onFrameRateValueChange} ></input>
                            <span>&#60;=128</span>
                        </div>   
                        <hr></hr>    
                        <div className="item"><div className="itemLabel"><span>AspectRatio: </span></div>
                            <input className="halfInput" value={this.state.ratioWidth} onChange={this.onRatioWidthValueChange} ></input>
                            <span>/</span>
                            <input  className="halfInput" value={this.state.ratioHeight} onChange={this.onRatioHeightValueChange} ></input>
                        </div>                                                                            
                        {/* <hr></hr>    
                        <div className="item"><div className="itemLabel"><span>minFrameRate: </span></div>
                            <input value={this.state.minFrameRate} onChange={this.onMinFrameRateValueChange} ></input>
                            <span></span>
                        </div>                                 
                        <hr></hr>    
                        <div className="item"><div className="itemLabel"><span>maxFrameRate: </span></div>
                            <input value={this.state.maxFrameRate} onChange={this.onMaxFrameRateValueChange} ></input>
                            <span></span>
                        </div>                                  */}
                        <hr></hr>
                        <div id="options-div-signaler"><span>Signaler URL: </span>
                            <input id="option-input-signaler" value={this.state.signaler} onChange={this.onSignalerValueChange} ></input>
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

    loadStorage() {
        // storage.load().then(items => {
        //     this.setState({
        //         roomid: storage.items.room.roomid || '',
        //         codec: storage.items.codec,
        //         bandwidth: storage.items.bandwidth,
        //         frameRate: storage.items.frameRate,
        //         ratioWidth: storage.items.ratioWidth || 0,
        //         ratioHeight: storage.items.ratioHeight || 0,
        //         minFrameRate: storage.items.minFrameRate,
        //         maxFrameRate: storage.items.maxFrameRate,
        //         signaler: storage.items.signaler,
        //         organization: storage.items.organization || ''
        //     });
        // })
    }

    
    onOrganizationValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            organization: event.target.value.trim()
        })            
    }    
    onRoomidValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            roomid: event.target.value.trim()
        })            
    }
    onCodecValueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({
            codec: event.target.value.trim()
        })            
    }

    onBandwidthValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            bandwidth: parseInt(event.target.value.trim())
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
            maxFrameRate: parseInt(event.target.value.trim())
        })            
    }        
    onSignalerValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {        
        this.setState({
            signaler: event.target.value
        })            
    }

    okSignaler = () => {
        let url = this.state.signaler;
        url = url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url;
        if (url) {
            this.setState({
                info: 'connecting...'
            })
            this.signaler.connect(url)
            .then(() => {
                this.signaler.disconnect();
                // storage.items.room.roomid = this.state.roomid;
                storage.items.codec = this.state.codec;
                storage.items.bandwidth = this.state.bandwidth;
                storage.items.frameRate = this.state.frameRate;
                storage.items.ratioWidth = this.state.ratioWidth;
                storage.items.ratioHeight = this.state.ratioHeight;
                storage.items.minFrameRate = this.state.minFrameRate;
                storage.items.maxFrameRate = this.state.maxFrameRate;
                storage.items.signaler = url;
                storage.items.organization = this.state.organization;
                storage.save().then(() => {window.close()})
            })
            .catch(err => {
                console.error(err)
                this.setState({
                    info: ' connect signaler failed!'
                })
                setTimeout(() => {
                    this.setState({
                        info: null
                    })
                }, 2000)
            })
        }
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