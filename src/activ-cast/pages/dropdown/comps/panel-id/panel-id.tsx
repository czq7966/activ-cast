import React = require('react');
import './index.css'
import { CompSingleID } from './single-id';

export interface IPanelIDState {
    id: string;
}
export interface IPanelIDProp {
    length: number;  
    value: string  
    onChange: Function;
    onNext?: Function
    onPrev?: Function
}


export class CompPanleID extends React.Component<IPanelIDProp, IPanelIDState> {
    oldValue: string;
    ids: {[name: string]: CompSingleID};
    constructor(props) {
        super(props);
        this.ids = {};

    }
    
    render() {    

        return (
                <div className="comps_panel_id_div" >
                    {this.createIds()}
                </div>            
        )
    } 

    createIds(): Array<CompSingleID> {
        let ids = [];
        for (let i = 0; i < this.props.length; i++) {
            let value = this.props.value[i];
            ids.push(
                <CompSingleID key={i} ref={ref => {this.ids[i] = ref} } index={i} value={value} onNext={this.onNext} onPrev={this.onPrev} onChange={this.onChange} />
            )                
        }
        return ids;
    }

    onNext = (curr: CompSingleID) => {
        let idx = curr.props.index;
        let next = this.ids[idx + 1];
        next ? next.inputElem && next.inputElem.focus() : this.props.onNext && this.props.onNext();
    }
    onPrev = (curr: CompSingleID) => {
        let idx = curr.props.index;
        let next = this.ids[idx - 1];
        next ? next.inputElem && next.inputElem.focus() : this.props.onPrev && this.props.onPrev();
    }


    onChange = (comp: CompSingleID, newValue, oldValue) => {
        let oldV = this.oldValue;
        let val = this.value;
        this.oldValue = oldV;
        this.props.onChange(this, val, oldV);
    }

    focus(idx?: number){
        idx = idx || 0;
        let elem = this.ids[0];
        elem && elem.inputElem && elem.inputElem.focus();
    }

    get value(): string  {
        let result: string = "";
        for (let i = 0; i < this.props.length; i++) {
            let comp = this.ids[i] ;
            let val = comp && comp.value || "";
            val = val.length > 0 ? val : " ";
            result = result + val;
        }        
        return result;
    }
}