export enum Roles {
    Admin = 'admin',
    Editor = 'editor',
    ChatUser = 'chat_user',
}

export enum AccessLevel {
    FullEditor = 'full_editor',
    LockedFlowViewer = 'locked_flow_viewer',
    ChatOnly = 'chat_only',
}

export enum Fundamental {
    Route = 'route',
    Schedule = 'schedule',
    Service = 'service',
    Blueprint = 'blueprint',
    Config = 'config',
    Secret = 'secret',
    Variable = 'variable',
    EnvVar = 'envVar',
    ChatWindow = 'chatWindow',
    Section = 'section',
    SectionField = 'sectionField',
}

export enum ChatWindowViewMode {
    ChatOnly = 'chat_only',
    ChatWithFlowView = 'chat_flow_view',
    ChatWithFlowAndOutput = 'chat_flow_output',
}
