import React = require("react");
import ReactDOM = require("react-dom");
import { EMessageKey } from "../../../locales";
import "./chromeos-v83.css"

export interface PollyfillsProps {

}

export interface PollyfillsState {    

}


export class Pollyfills extends React.Component<PollyfillsProps, PollyfillsState> {

    constructor(props) {
        super(props);          
    }
    destroy() {

    }   

    async componentDidMount() {        
        document.title =  chrome.i18n.getMessage(EMessageKey.manifest_name);
        this.getMicPermission();
    }
    componentWillUnmount() {
        this.destroy();
    }




    render() {
        return(<div>
            <span>您已禁止使用"麦克风"，请点击地址栏右侧"带红点摄像头"图标，选择"始终允许使用麦克风"并"完成"，谢谢！地址栏右侧，地址栏右侧！↗↗↗</span>
        </div>)
    }

    getMicPermission() {
        navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: false
        })
        .then((stream) => {
            chrome.runtime.reload();
        })
        .catch(e => {
            setTimeout(() => {
                this.getMicPermission();                
            }, 1000);
        });         
    }

}

let rootEl = document.getElementById('root');

rootEl && 
ReactDOM.render(
    <Pollyfills/>
, rootEl);