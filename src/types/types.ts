
declare global {
    interface Window {
        debugMode: boolean;
        toggleDebug: () => void;
    }
}

export type Connection = {
    id: string;
    sourceNodeId: string;
    sourceHandle: string;
    targetNodeId?: string;
    targetHandle?: string;
    collapsed?: boolean;
    hidden?: boolean;
    disabled?: boolean;
    touched?: boolean;
    targetGroupId?: string;
    sourceGroupId?: string;
    isInGroup?: string | null;
    // Temporary added for service editing
    temp?: boolean;
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
    EditFiles = 'editFiles',
    PlaceService = 'placeService',
    PlaceBlueprint = 'placeBlueprint',
    AddProjectVariable = 'addProjectVariable',
    EditProjectVariable = 'editProjectVariable',
    AddProjectSecret = 'addProjectSecret',
    EditProjectSecret = 'editProjectSecret',
    ProjectPublish = 'projectPublish',
    EditConfig = 'editConfig',
    AddConfig = 'addConfig',
    PlaceConfig = 'placeConfig',
    PublishedVariableForm = 'publishedVariableForm',
    EditTemplate = 'editTemplate'
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

export enum Fundamental {
    Route = 'route',
    Schedule = 'schedule',
    Service = 'service',
    Blueprint = 'blueprint',
    Config = 'config',
    Secret = 'secret',
    Variable = 'variable',
}

export enum NodeVariableType {
    String = 'str',
    Bytes = 'bytes',
    Number = 'number',
    Dict = 'dict',
    Boolean = 'boolean',
    List = 'list',
    DateTime = 'datetime',
    TruePath = 'true_path',
    FalsePath = 'false_path',
    Unknown = 'unknown',
    Dependency = 'dependency',
    SecretString = 'secretstring',
    TextArea = 'textarea',
    RichTextArea = 'richtextarea',
    Code = 'code',
    Json = 'json',
    Template = 'template',
    Files = 'files',
    Node = 'node',
    Int = 'int',
    Float = 'float',
}

export enum NodeType {
    Rows = 'rows',
    Comparison = 'comparison',
    Math = 'math',
    Group = 'group',
    Mock = 'mock',
    Note = 'note',
    Jump = 'jump',
    Flow = 'flow',
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
    files_editor?: boolean;
    select_values?: Record<string, string>;
    switch?: boolean;
    info?: string;
    in_switch?: boolean;
    out_switch?: boolean;
    key_label?: string;
    type_label?: string;
    value_label?: string;
    type_field?: boolean;
    type_field_default?: string;
    in_switch_default?: boolean;
    in_switch_enabled?: boolean;
    in_type_override?: string;
    out_switch_default?: boolean;
    out_switch_enabled?: boolean;
    out_type_override?: string;
    key_field?: boolean;
    value_field?: boolean;
    template_editor?: boolean;
};

export type NodeVariable = {
    name?: string;
    handle: string;
    parentHandle?: string;
    value: null | string | number | boolean | string[] | NodeVariable[];
    published: boolean;
    published_title?: string;
    published_description?: string;
    type: string | NodeVariableType;
    has_dock?: boolean;
    has_in?: boolean;
    has_out?: boolean;
    out_type_override?: string;
    in_type_override?: string;
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
    handle: string;
    variant: number;
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
    // Temporary added for service editing
    temp?: boolean;
};

export interface NodeProps {
    node: Node;
    preview?: boolean;
};

export interface GroupProps extends NodeProps {
    isMirror?: boolean;
}

export type Schedule = ListItemWithId &  {
    id?: string | null;
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

export type Config = {
    id?: string;
    name: string;
    metadata: Metadata;
    node_setup?: NodeSetup;
    project_ids?: string[];
}

export type Service = {
    id?: string;
    name: string;
    metadata: Metadata;
    node_setup: NodeSetup;
    project_ids?: string[];
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
        groups: {
            groupStack: string[],
            openedGroup: string|null,
        }
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
export type StoreName = 'nodes' | 'connections' | 'groups';

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

export enum EditorMode {
    Select = 'select',
    BoxSelect = 'box-select',
    Draw = 'draw',
    Pan = 'pan'
}