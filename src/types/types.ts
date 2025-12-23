import VariableTypeString from "@/components/editor/sidebars/dock/variable-type-string";
import VariableTypeBytes from "@/components/editor/sidebars/dock/variable-type-bytes";
import VariableTypeNumber from "@/components/editor/sidebars/dock/variable-type-number";
import VariableTypeDict from "@/components/editor/sidebars/dock/variable-type-dict";
import VariableTypeBoolean from "@/components/editor/sidebars/dock/variable-type-boolean";
import VariableTypeList from "@/components/editor/sidebars/dock/variable-type-list";
import VariableTypeSecretString from "@/components/editor/sidebars/dock/variable-type-secret-string";
import VariableTypeTextArea from "@/components/editor/sidebars/dock/variable-type-text-area";
import VariableTypeRichTextArea from "@/components/editor/sidebars/dock/variable-type-rich-text-area";
import VariableTypeCode from "@/components/editor/sidebars/dock/variable-type-code";
import VariableTypeJson from "@/components/editor/sidebars/dock/variable-type-json";
import VariableTypeFiles from "@/components/editor/sidebars/dock/variable-type-files";
import VariableTypeTemplate from "@/components/editor/sidebars/dock/variable-type-template";
import VariableTypeAvatar from "@/components/editor/sidebars/dock/variable-type-avatar";
import VariableTypeImage from "@/components/editor/sidebars/dock/variable-type-image";
import VariableTypeOAuth from "@/components/editor/sidebars/dock/variable-type-oauth";
import VariableTypeAny from "@/components/editor/sidebars/dock/variable-type-any";
import VariableTypeLayout from "@/components/editor/sidebars/dock/variable-type-layout";
import VariableTypeTable from "@/components/editor/sidebars/dock/variable-type-table";
import VariableTypeSPA from "@/components/editor/sidebars/dock/variable-type-spa";
import VariableTypeIframe from "@/components/editor/sidebars/dock/variable-type-iframe";
import {AccessLevel} from "@/types/enums";

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
    isDeletable?: boolean;
    // Temporary added for service editing
    temp?: boolean;
    // Frontend metadata: which warp gate node is used for rendering (if any)
    warpGateNodeId?: string;
    // Visual handle on the warp gate (out_0, out_1, etc.) for rendering
    warpGateHandle?: string;
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
    AddChatWindow = 'addChatWindow',
    EditChatWindow = 'editChatWindow',
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
    AddProjectVariable = 'addProjectVariable',
    EditProjectVariable = 'editProjectVariable',
    AddProjectSecret = 'addProjectSecret',
    EditProjectSecret = 'editProjectSecret',
    ProjectPublish = 'projectPublish',
    PublishedVariableForm = 'publishedVariableForm',
    PublishedVariableSettings = 'publishedVariableSettings',
    EditTemplate = 'editTemplate',
    AddProjectEnvVar = 'addProjectEnvVar',
    EditProjectEnvVar = 'editProjectEnvVar',
    ExportSharing = 'exportSharing',
    ImportPackage = 'importPackage',
    PlayButtonsForm = 'playButtonsForm',
    AddSectionField = 'addSectionField',
    EditSectionField = 'editSectionField',
    AddSection = 'addSection',
    EditSection = 'editSection',
    EditLayout = 'editLayout',
    EditTable = 'editTable',
    EditSPA = 'editSPA',
}

export enum InOut {
    In = 'in',
    Out = 'out',
}

export type ListItemWithId = {
    id?: string;
    key?: string;
};

export type Position = {
    x: number;
    y: number;
};


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
    Avatar = 'avatar',
    Image = 'image',
    OAuth = 'oauth',
    Any = 'any',
    Layout = 'layout',
    Table = 'table',
    SPA = 'spa',
    Iframe = 'iframe',
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
    WarpGate = 'warp_gate',
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
    layout_editor?: boolean;
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
    table_editor?: boolean;
    spa_editor?: boolean;
    iframe_viewer?: boolean;
    image?: boolean;
    metadata?: Record<string, unknown>;
    placeholder?: string;
};

export type NodeVariable = {
    name?: string;
    handle: string;
    parentHandle?: string;
    value: null | undefined | string | number | boolean | string[] | NodeVariable[] | Record<string, unknown>;
    published: boolean;
    published_title?: string;
    published_description?: string;
    exposed_to_group?: boolean;
    group_name_override?: string;
    group_connector_color_override?: string;
    type: string | NodeVariableType;
    has_dock?: boolean;
    has_in?: boolean;
    has_out?: boolean;
    out_type_override?: string;
    in_type_override?: string;
    dock?: Dock;
    node?: boolean;
    metadata?: object;
    info?: string;
};

export type PromptNodeInfo = {
  id: string;
  name: string;
  handle: string;
  node: Node;
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
    has_documentation?: boolean;
    handle: string;
    name: string;
    category: string;
    type: NodeType|NodeMathType|NodeComparisonType|NodeJumpType;
    view: NodeView;
    variables: NodeVariable[];
    flowState: FlowState;
    default_flow_state: string; // Potentially used as the default value for flowState
    driven?: boolean;
    group?: Group;
    has_play_button?: boolean;
    has_enabled_switch?: boolean;
    package?: Package;
    path: string;
    code: string;
    // Temporary added for service editing
    temp?: boolean;
    version?: number;
    // Group name override for node-level connections (targetHandle === 'node')
    group_name_override?: string;
    // User notes for documenting/explaining the node
    notes?: string;
    // Node metadata for deployment and other configuration
    metadata?: {
        deployment?: string;
        [key: string]: unknown;
    };
    // Warp gate data: links this gate to its source connector
    warpGate?: {
        sourceNodeId: string;     // Node that this gate represents
        sourceHandle: string;      // Specific output connector handle
        variableType: string;      // Type of the connector (for styling)
    };
    // Layout editor component slots - keys defined by user, values are connected component node IDs
    components?: Record<string, string>;
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
    meta: Metadata;
    node_setup?: NodeSetup;
    project_ids?: string[];
};

export type Service = {
    id?: string;
    name: string;
    meta: Metadata;
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
        },
        drawings?: {
            paths: Array<{
                id: string;
                points: number[];
                color: string;
                strokeWidth: number;
                versionId: string;
            }>,
            shapes: Array<{
                id: string;
                type: 'rectangle' | 'circle' | 'triangle' | 'line';
                x: number;
                y: number;
                width: number;
                height: number;
                rotation?: number;
                color: string;
                strokeWidth: number;
                strokeStyle?: 'solid' | 'dashed' | 'dotted';
                fillColor?: string;
                fillOpacity?: number;
                cornerRadius?: number;
                text?: string;
                textColor?: string;
                fontSize?: number;
                fontFamily?: string;
                textAlign?: 'left' | 'center' | 'right';
                textVerticalAlign?: 'top' | 'middle' | 'bottom';
                textPadding?: number;
                versionId: string;
            }>,
            images: Array<{
                id: string;
                x: number;
                y: number;
                width: number;
                height: number;
                rotation: number;
                src: string;
                originalWidth: number;
                originalHeight: number;
                versionId: string;
            }>,
            notes: Array<{
                id: string;
                x: number;
                y: number;
                width: number;
                height: number;
                rotation: number;
                text: string;
                color: string;
                fontSize: number;
                versionId: string;
            }>
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

export type AccountSimple = {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
};

export type ChatWindowAccess = {
    id: string;
    account_id: string;
    chat_window_id: string;
    can_view_flow: boolean;
    can_view_output: boolean;
    show_response_transparency: boolean;
    account: AccountSimple;
    created_at: string;
    updated_at: string;
};

export type ChatWindow = ListItemWithId & {
    id?: string | null;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    project_id?: string;
    node_setup?: NodeSetup;
    versions?: { id: string, version_number: number, published: boolean, draft: boolean }[];
    accesses?: ChatWindowAccess[];
};

export type MyChatWindowPermissions = {
    can_view_flow: boolean;
    can_view_output: boolean;
    show_response_transparency: boolean;
};

export interface JSONSchemaProperty {
    type: 'string' | 'integer' | 'number' | 'boolean';
    title?: string;
    description?: string;
    format?: string;
    minimum?: number;
    maximum?: number;
    default?: unknown;
    enum?: string[];
}

export interface JSONSchema {
    type: 'object';
    properties?: Record<string, JSONSchemaProperty>;
}

export type FieldType = {
    handle: string;
    label: string;
    postgres_type: string;
    ui_component: string;
    category: string;
    icon?: string;
    settings_schema?: JSONSchema;
    version?: string;
};

export type SectionField = {
    id: string;
    handle: string;
    label: string;
    field_type_handle: string;
    field_settings?: object;
    is_required?: boolean;
    is_unique?: boolean;
    related_section_id?: string;
};

export type DatabaseConnection = {
    id: string;
    handle: string;
    label: string;
    description?: string;
    database_type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    file_path?: string;
    database_name: string;
    use_ssl?: boolean;
};

export type DatabaseConnectionTestResult = {
    success: boolean;
    message: string;
};

export type GridCell = {
    id: string;  // Unique cell identifier
    type: 'field' | 'info_text' | 'divider' | 'heading' | 'empty';
    col_start: number;  // 1-12 (inclusive)
    col_end: number;    // 2-13 (exclusive, so max is 13 for full width)
    row_start: number;  // 0-based row index (inclusive)
    row_end: number;    // 0-based row index (exclusive)

    // For field type
    fieldAssignmentId?: string;

    // For info_text type
    content?: string;  // Markdown content
    style?: 'info' | 'warning' | 'success' | 'default';
};

export type GridRow = {
    id: string;
    cells: GridCell[];
    height?: number;  // Row height in pixels (optional, defaults to auto)
};

export type TabLayout = {
    rows: GridRow[];
};

export type SectionLayoutConfig = {
    tabs?: Record<string, TabLayout>;
    table_columns?: {
        order: string[];
        hidden: string[];
        widths?: Record<string, number>;
    };
};

export type VectorizationConfig = {
    enabled: boolean;
    provider: 'openai' | 'mistral';
    api_key_secret_id: string;  // UUID of secret
    model: string;
    dimensions: number;
    source_fields: string[];     // Field handles to embed
    metadata_fields: string[];   // Field handles for metadata
    search_type: 'vector' | 'keyword' | 'hybrid';
    distance: 'cosine' | 'l2' | 'max_inner_product';
};

export type VectorizationStats = {
    enabled: boolean;
    provider?: string;
    model?: string;
    total_records: number;
    vectorized_records?: number;
    vectorization_percentage?: number;
};

export type Section = {
    id: string;
    handle: string;
    label: string;
    description?: string;
    database_connection_id?: string;
    layout_config: SectionLayoutConfig;
    field_assignments?: FieldAssignment[];
    icon?: string;
    migration_status?: string;
    vectorization_config?: VectorizationConfig | null;
    vectorization_stats?: VectorizationStats;
};

export type FieldAssignment = {
    id: string;
    field_id: string;
    section_id: string;
    tab_name: string;
    sort_order: number;
    is_visible: boolean;
    is_required_override: boolean;
    field?: SectionField;
    // Flat field data from API
    field_handle?: string;
    field_label?: string;
    field_type_handle?: string;
    field_settings?: object;
    is_required?: boolean;
    is_unique?: boolean;
    help_text?: string | null;
    placeholder?: string | null;
};

export type MyChatWindow = {
    chat_window: {
        id: string;
        name: string;
        description?: string;
    };
    project: {
        id: string;
        name: string;
    };
    tenant: {
        id: string;
        name: string;
    };
    permissions: MyChatWindowPermissions;
};

export {Roles, AccessLevel, Fundamental, ChatWindowViewMode} from './enums';

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
    role: string; // 'admin', 'editor', 'chat_user'
    is_admin: boolean;
    single_user: boolean;
    created_at: string;
    updated_at: string;
    active: boolean;
    memberships: Membership[];
    tenants: Tenant[];
    // Visual-only fields for UI demo (not persisted to backend)
    access_level?: AccessLevel;
    allowed_flows?: string[];
    chat_only_mode?: boolean;
    permissions?: string[];
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
    inDock: boolean;
    categoryBorder?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
};

export type Secret = {
    id: string;
    key: string;
    value?: string;
    projectId: string;
    description?: string;
    createdDate?: string;
    stages?: string[];
};

export enum EditorMode {
    Select = 'select',
    BoxSelect = 'box-select',
    Draw = 'draw',
    Pan = 'pan'
}

export type Stage = {
    id: string;
    name: string;
    is_production: boolean;
};

export interface PublishMatrixVersion {
    id: string;
    number: number;
    status: "draft" | "published" | "history";
    publishedStages: string[];
}

export interface PublishMatrixRoute {
    id: string;
    name: string;
    segments: RouteSegment[];
    published_stages: string[];
    stages_can_update: string[];
    versions: PublishMatrixVersion[];
}

export interface PublishMatrixSchedule {
    id: string;
    name: string;
    cron_expression: string;
    published_stages: string[];
    stages_can_update: string[];
    versions: PublishMatrixVersion[];
}

export interface PublishMatrixChatWindow {
    id: string;
    name: string;
    description?: string;
    published_stages: string[];
    stages_can_update?: string[];
}

export interface PublishMatrixResponse {
    stages: Stage[];
    schedules: PublishMatrixSchedule[];
    routes: PublishMatrixRoute[];
    chat_windows: PublishMatrixChatWindow[];
}

export type EnvVar = {
    key: string;
    projectId: string;
    values: {
        [stage: string]: {
            id: string,
            value: string
        };
    };
};

export type ApiKey = {
    key_id: string;
    label: string;
    key: string;
};

// File Manager Types
export enum FileViewMode {
    Grid = 'grid',
    List = 'list',
}

export enum FileSortBy {
    Name = 'name',
    Size = 'size',
    Modified = 'modified',
}

export enum FileSortOrder {
    Asc = 'asc',
    Desc = 'desc',
}


export type FileManagerState = {
    currentPath: string;
    selectedFiles: string[];
    selectedDirectories: string[];
    viewMode: FileViewMode;
    sortBy: FileSortBy;
    sortOrder: FileSortOrder;
    isUploading: boolean;
    uploadProgress: Record<string, number>;
    contextMenuVisible: boolean;
    contextMenuPosition: { x: number; y: number };
    contextMenuItems: ContextMenuItem[];
    dragOver: boolean;
    isPublicMode: boolean;
};

export type ContextMenuItem = {
    label?: string;
    icon?: React.ReactNode;
    action?: () => void;
    disabled?: boolean;
    divider?: boolean;
};

export type UploadProgress = {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
};

export const VariableTypeComponents = {
    [NodeVariableType.String]: VariableTypeString,
    [NodeVariableType.Bytes]: VariableTypeBytes,
    [NodeVariableType.Number]: VariableTypeNumber,
    [NodeVariableType.Int]: VariableTypeNumber,
    [NodeVariableType.Float]: VariableTypeNumber,
    [NodeVariableType.Dict]: VariableTypeDict,
    [NodeVariableType.Boolean]: VariableTypeBoolean,
    [NodeVariableType.List]: VariableTypeList,
    [NodeVariableType.DateTime]: VariableTypeString,
    [NodeVariableType.TruePath]: null,
    [NodeVariableType.FalsePath]: null,
    [NodeVariableType.Unknown]: null,
    [NodeVariableType.Dependency]: null,
    [NodeVariableType.SecretString]: VariableTypeSecretString,
    [NodeVariableType.TextArea]: VariableTypeTextArea,
    [NodeVariableType.RichTextArea]: VariableTypeRichTextArea,
    [NodeVariableType.Code]: VariableTypeCode,
    [NodeVariableType.Json]: VariableTypeJson,
    [NodeVariableType.Files]: VariableTypeFiles,
    [NodeVariableType.Template]: VariableTypeTemplate,
    [NodeVariableType.Avatar]: VariableTypeAvatar,
    [NodeVariableType.Image]: VariableTypeImage,
    [NodeVariableType.OAuth]: VariableTypeOAuth,
    [NodeVariableType.Any]: VariableTypeAny,
    [NodeVariableType.Layout]: VariableTypeLayout,
    [NodeVariableType.Table]: VariableTypeTable,
    [NodeVariableType.SPA]: VariableTypeSPA,
    [NodeVariableType.Iframe]: VariableTypeIframe,
    [NodeVariableType.Node]: null,
};