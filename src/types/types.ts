declare global {
    interface Window {
        debugMode: boolean;
        toggleDebug: () => void;
    }
}

export type Connection = {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    sourceNodeId: string;
    sourceHandle: string;
    targetNodeId?: string;
    targetHandle?: string;
    collapsed?: boolean;
    hidden?: boolean;
    disabled?: boolean;
    targetGroupId?: string;
    sourceGroupId?: string;
    isInGroup?: string;
};

export enum NodeEnabledConnector {
    Node = 'node'
}

export enum NodeCollapsedConnector {
    Collapsed = 'collapsed',
}

export enum FormType {
    AddRoute = 'addRoute',
    EditRoute = 'editRoute',
    AddSchedule = 'addSchedule',
    EditSchedule = 'editSchedule',
    AddService = 'addService',
    EditService = 'editService',
    AddBlueprint = 'addBlueprint',
    EditBlueprint = 'editBlueprint',
    EditDict = 'editDict',
    EditList = 'editList',
    EditCode = 'editCode',
    EditNode = 'editNode',
    AddNode = 'addNewNode',
    EditJson = 'editJson',
    PlaceService = 'placeService',
    PlaceBlueprint = 'placeBlueprint',
    AddProjectVariable = 'addProjectVariable',
    EditProjectVariable = 'editProjectVariable',
    AddProjectSecret = 'addProjectSecret',
    EditProjectSecret = 'editProjectSecret',
    ProjectPublish = 'projectPublish',
}

export enum InOut {
    In = 'in',
    Out = 'out',
}

export type ListItemWithId = {
    id?: string;
};

export type Position = {
    x: number;
    y: number;
};

export enum NodeVariableType {
    String = 'string',
    Bytes = 'bytes',
    Number = 'number',
    Dict = 'dict',
    Boolean = 'boolean',
    List = 'list',
    DateTime = 'datetime',
    TruePath = 'true_path',
    FalsePath = 'false_path',
    Unknown = 'unknown',
    SecretString = 'secretstring',
    TextArea = 'textarea',
    RichTextArea = 'richtextarea',
    Code = 'code',
    Json = 'json',
}

export enum NodeType {
    Rows = 'rows',
    Comparison = 'comparison',
    Math = 'math',
    Group = 'group',
    Mock = 'mock',
    Note = 'note',
    Jump = 'jump',
}

export enum NodeComparisonType {
    LargerThan = 'larger_than',
    SmallerThan = 'smaller_than',
    Equal = 'equal',
    NotEqual = 'not_equal',
}

export enum NodeMathType {
    Add = 'add',
    Subtract = 'subtract',
    Multiply = 'multiply',
    Divide = 'divide',
}

export enum NodeJumpType {
    From = 'from',
    To = 'to',
}

export type Dock = {
    has_dock?: boolean;
    enabled?: boolean;
    secret?: boolean;
    text_area?: boolean;
    rich_text_area?: boolean;
    code_editor?: boolean;
    json_editor?: boolean;
    select_values?: Record<string, string>;
    switch?: boolean;
    info?: string;
    in_switch?: boolean;
    out_switch?: boolean;
    key_label?: string;
    type_label?: string;
    value_label?: string;
};

export type NodeVariable = {
    name?: string;
    handle: string;
    value: null | string | number | boolean | string[] | NodeVariable[];
    published: boolean;
    published_title?: string;
    published_description?: string;
    type: string | NodeVariableType;
    has_dock?: boolean;
    has_in?: boolean;
    has_out?: boolean;
    out_type_override?: string;
    dock?: Dock;
};

export type NodeVariableWithId = NodeVariable & ListItemWithId;

export type NodeView = {
    x: number;
    y: number;
    width: number;
    height: number;
    collapsed: boolean;
    disabled?: boolean;
    adding?: boolean;
    isOpenMap?: { [key: string]: boolean };
    isDeletable?: boolean;
};

export type Package = {
    id?: string,
    type?: "service" | "blueprint";
    nodes: Node[];
    connections?: Connection[];
};

export type NodeService = {
    id: string;
    name: string;
    description: string;
    category: string;
};

export type Group = {
    isOpen?: boolean;
    isHidden?: boolean;
    nodes?: string[];
};

export enum FlowState {
    FlowIn = 'flowIn',
    FlowStop = 'flowStop',
    Enabled = 'enabled',
    Disabled = 'disabled',
}

export type Node = {
    id: string;
    service?: NodeService;
    icon?: string;
    documentation?: string;
    handle: string;
    name: string;
    category: string;
    type: NodeType|NodeMathType|NodeComparisonType|NodeJumpType;
    view: NodeView;
    variables: NodeVariable[];
    flowState: FlowState;
    driven?: boolean;
    group?: Group;
    has_play_button?: boolean;
    has_enabled_switch?: boolean;
    package?: Package;
    path: string;
    code: string;
};

export interface NodeProps {
    node: Node;
    preview?: boolean;
};

export interface GroupProps extends NodeProps {
    isMirror?: boolean;
}

export type Schedule = {
    id?: string;
    name: string;
    cron_expression: string;
    start_time: Date;
    end_time?: Date | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    project_id?: string;
    node_setup?: NodeSetup;
    versions?: { id: string, version_number: number, published: boolean, draft: boolean }[];
};

export type Metadata = {
    category: string;
    description?: string;
    icon?: string;
};

export type Blueprint = {
    id?: string;
    name: string;
    metadata: Metadata;
    node_setup?: NodeSetup;
    project_ids?: string[];
};

export type Service = {
    id?: string;
    name: string;
    metadata: Metadata;
    node_setup: NodeSetup;
};

export enum HttpMethod {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Patch = 'PATCH',
    Delete = 'DELETE'
}

export interface NodeSetup {
    id: string;
    name?: string | null;
    deleted_at?: string | null;
    published_version?: NodeSetupVersion | null;
    versions: NodeSetupVersion[];
}

export interface NodeSetupVersion {
    id: string;
    version_number: number;
    created_at: string;
    content: {
        nodes: Node[],
        connections: Connection[],
    };
    published: boolean;
    draft: boolean;
    created_by?: string | null;
}

export enum RouteSegmentType {
    Static = 'static',
    Variable = 'variable',
}

export type RouteSegment = {
    id: string;
    segment_order: number;
    type: RouteSegmentType;
    name: string;
    default_value: null | string;
    variable_type: null | string;
};

export type Route = ListItemWithId & {
    id?: string | null;
    description: string;
    created_at?: string;
    updated_at?: string;
    segments: RouteSegment[];
    method: HttpMethod;
    node_setup?: NodeSetup;
    versions?: { id: string, version_number: number, published: boolean, draft: boolean }[];
};

export enum Roles {
    Admin = 'admin',
    Editor = 'editor',
    Viewer = 'viewer',
}

export type Tenant = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export type Role = {
    id: string;
    name: string;
}

export type Membership = {
    id: string;
    role: Role;
}

export type Account = {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_admin: boolean;
    single_user: boolean;
    created_at: string;
    updated_at: string;
    active: boolean;
    memberships: Membership[];
    tenants: Tenant[];
}

export type LoggedInAccount = Account;

export type Project = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export interface State {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}
export type StoreName = 'nodes' | 'connections';

export type VariableTypeProps = {
    nodeId: string;
    variable: NodeVariable;
    publishedButton: boolean;
    onChange?: (value: null | string | number | boolean | string[] | NodeVariable[]) => void;
    currentValue?: string;
};

export type Secret = {
    id: string;
    key: string;
    value?: string;
    projectId: string;
    description?: string;
    createdDate?: string;
};