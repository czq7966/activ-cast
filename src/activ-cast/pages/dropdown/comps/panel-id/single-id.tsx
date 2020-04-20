import React = require('react');

export interface ISingleIDState {

}
export interface ISingleIDProp {
    index: number;
    value?: string;    
    onChange?: Function
    onNext?: Function
    onPrev?: Function
}


export class CompSingleID extends React.Component<ISingleIDProp, ISingleIDState> {
    inputElem: HTMLInputElement;
    oldValue: string;
    value: string;
    constructor(props) {
        super(props);
        this.value = this.props.value;
        this.state = {};
    }
    render() {    
        return (
                <div className="comps_single_id_div" >
                    <input ref={ref => { this.inputElem = ref}}                         
                        value={this.value}  
                        onKeyDown={this.onKeyDown}
                        onKeyPress={this.onKeyPress}
                        onChange={this.onIdValueChange} />
                </div>            
        )
    } 

    onIdValueChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        let oldValue = this.value;
        let newValue = event.target.value.trim();
        if (oldValue && newValue) {
            newValue = newValue.replace(oldValue, '');
        }

        newValue = newValue.substr(newValue.length - 1, 1);
        this.value = newValue;
        this.setState({});
        this.props.onChange && this.props.onChange(this, this.value, this.oldValue);
        newValue && this.props.onNext && this.props.onNext(this);
    }

    onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        let elem = event.target as HTMLInputElement;
        let pos = elem.selectionEnd || 0;
        switch(event.keyCode) {
            case 8:  //Backspace 
                if ((pos == 0) && this.props.onPrev) {
                    setTimeout(() => {
                        this.props.onPrev(this);
                    }, 1);
                } 
                break;              
            case 33: //PageUp 
            case 36: //Home
            case 37: //ArrowLeft 
            case 38: //ArrowUp 
                this.props.onPrev && this.props.onPrev(this);
                break;
            case 13: //Enter                   
            case 34: //PageDown  
            case 35: //End 
            case 39: //ArrowRight  
            case 40: //ArrowDown   
                this.props.onNext && this.props.onNext(this);
                break;    

        }
    }    



    onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // this.oldValue = this.value;
        // let newValue = event.key;
        // if (newValue.length == 1) {
        //     this.value = newValue;
        //     this.setState({})   
        //     this.props.onNext && this.props.onNext(this);
        // } 
    }    
}