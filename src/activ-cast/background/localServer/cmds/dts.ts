export enum ECommandId {
    custom_start_cast = "custom_start_cast",
    custom_stop_cast = "custom_stop_cast",
    custom_pause_cast = "custom_pause_cast",
    custom_resume_cast = "custom_resume_cast",
    custom_get_webrtc_state = "custom_get_webrtc_state",
    custom_update_states = "custom_update_states",
    custom_get_webrtc_statistics = "custom_get_webrtc_statistics",
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
    stream_room_paused =        0b100000000,
    stream_room_casting_min =   0b1000000000,
}