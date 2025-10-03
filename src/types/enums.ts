export enum Roles {
    Admin = 'admin',
    Editor = 'editor',
    Viewer = 'viewer',
    ChatOnly = 'chat_only',
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
}
