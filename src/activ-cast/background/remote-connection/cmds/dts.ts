export enum ECommandId {
    custom_stop_cast = "custom_stop_cast",
    custom_get_sender_info =  "custom_get_sender_info"
}    

export interface ISenderInfo {
    mac: string; // "mac地址",本次连接的唯一标识，不可为空
    type: number; // 1, //1.android 2.iOS 3.PC 4.macos 5.chromeos 其中PC表示windows
    ostype: string; //android"，//android、iOS、PC、macos、chromeos，不可为空
    mobileSubtype: string; //tablet", phone表示手机，tablet表示平板 此字段仅针对移动发送端，mac、windows、chrome发送端不传或传空
    deviceid: string; //设备id，可为空
    versioncode: number; //版本号
    versionname: string; //版本名称
    width: number;//屏幕宽
    height: number;//屏幕高
    clientName: string; //,发送端学生名称，不可为空
    touchbackState: number; //0.touchback关闭 1.touchback开启
}