// Layout Editor Types - User-friendly visual builder

// ============================================
// Element Types
// ============================================

export type ElementType =
    // Layout (simplified, user-friendly)
    | 'block'     // Simple container, stacks content vertically
    | 'columns'   // Side-by-side columns (2-6)
    | 'stack'     // Horizontal or vertical stack with spacing
    // Legacy (kept for backwards compatibility)
    | 'container'
    | 'section'
    | 'flex'
    | 'grid'
    // Content
    | 'text'
    | 'heading'
    | 'image'
    | 'divider'
    | 'spacer'
    // Dynamic
    | 'component'  // For data-driven components like tables, charts
    | 'code';      // For Jinja2 template blocks

// ============================================
// User-friendly Layout Configs
// ============================================

export type GapSize = 'none' | 'small' | 'medium' | 'large';

export const GAP_VALUES: Record<GapSize, number> = {
    none: 0,
    small: 8,
    medium: 16,
    large: 32,
};

export type ColumnsDistribution = 'equal' | 'sidebar-left' | 'sidebar-right' | 'golden' | 'custom';

export const COLUMNS_PRESETS: Record<ColumnsDistribution, (count: number) => string> = {
    equal: (count) => `repeat(${count}, 1fr)`,
    'sidebar-left': () => '1fr 2fr',
    'sidebar-right': () => '2fr 1fr',
    golden: () => '1fr 1.618fr',
    custom: () => 'repeat(2, 1fr)', // Default, will be overridden
};

export type ColumnsConfig = {
    count: number;  // 2-6 columns
    distribution: ColumnsDistribution;
    customWidths?: string[];  // e.g., ['1fr', '2fr', '1fr'] for custom
    gap: GapSize;
};

export type StackDirection = 'vertical' | 'horizontal';
export type StackAlignment = 'start' | 'center' | 'end' | 'stretch';

export type StackConfig = {
    direction: StackDirection;
    alignment: StackAlignment;
    gap: GapSize;
    wrap: boolean;
};

// ============================================
// Style Properties
// ============================================

export type SpacingValue = number | 'auto';

export type Spacing = {
    top?: SpacingValue;
    right?: SpacingValue;
    bottom?: SpacingValue;
    left?: SpacingValue;
};

export type SizeValue = number | 'auto' | '100%' | 'fit-content';

export type Sizing = {
    width?: SizeValue;
    height?: SizeValue;
    minWidth?: SizeValue;
    maxWidth?: SizeValue;
    minHeight?: SizeValue;
    maxHeight?: SizeValue;
};

export type BorderSide = {
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted' | 'none';
    color?: string;
};

export type Border = {
    all?: BorderSide;
    top?: BorderSide;
    right?: BorderSide;
    bottom?: BorderSide;
    left?: BorderSide;
    radius?: number | {
        topLeft?: number;
        topRight?: number;
        bottomRight?: number;
        bottomLeft?: number;
    };
};

export type Background = {
    color?: string;
    image?: string;
    size?: 'cover' | 'contain' | 'auto';
    position?: string;
    repeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y';
};

export type Typography = {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    lineHeight?: number | string;
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    textDecoration?: 'none' | 'underline' | 'line-through';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
};

export type FlexContainerProps = {
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';
    gap?: number;
    rowGap?: number;
    columnGap?: number;
};

export type FlexChildProps = {
    grow?: number;
    shrink?: number;
    basis?: SizeValue;
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    order?: number;
};

export type GridContainerProps = {
    columns?: number | string;  // e.g., 3 or "1fr 2fr 1fr"
    rows?: string;              // e.g., "auto 1fr auto"
    gap?: number;
    rowGap?: number;
    columnGap?: number;
    justifyItems?: 'start' | 'end' | 'center' | 'stretch';
    alignItems?: 'start' | 'end' | 'center' | 'stretch';
};

export type GridChildProps = {
    columnSpan?: number;
    rowSpan?: number;
    columnStart?: number;
    columnEnd?: number;
    rowStart?: number;
    rowEnd?: number;
    justifySelf?: 'start' | 'end' | 'center' | 'stretch';
    alignSelf?: 'start' | 'end' | 'center' | 'stretch';
};

// ============================================
// Element Styles (combined)
// ============================================

export type ElementStyles = {
    // Layout
    display?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-block' | 'none';
    position?: 'static' | 'relative' | 'absolute' | 'fixed';
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';

    // Spacing
    margin?: Spacing;
    padding?: Spacing;

    // Sizing
    sizing?: Sizing;

    // Visual
    background?: Background;
    border?: Border;
    boxShadow?: string;
    opacity?: number;

    // Typography (for text elements)
    typography?: Typography;

    // Flex container
    flex?: FlexContainerProps;

    // Grid container
    grid?: GridContainerProps;

    // Flex/Grid child
    flexChild?: FlexChildProps;
    gridChild?: GridChildProps;
};

// ============================================
// Element Content (type-specific)
// ============================================

export type TextContent = {
    text: string;
    // Could support rich text in future
};

export type HeadingContent = {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
};

export type ImageContent = {
    src: string;
    alt?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
};

export type DividerContent = {
    orientation?: 'horizontal' | 'vertical';
    thickness?: number;
    color?: string;
};

export type SpacerContent = {
    size: number;
};

export type ComponentContent = {
    componentKey: string;  // References a connected component node
};

export type CodeContent = {
    code: string;  // Jinja2 template
};

// New layout content types
// Block is just a simple container, no special data needed
export type BlockContent = Record<string, never>;

export type ColumnsContent = {
    config: ColumnsConfig;
};

export type StackContent = {
    config: StackConfig;
};

export type ElementContent =
    // New layout types
    | { type: 'block'; data?: BlockContent }
    | { type: 'columns'; data: ColumnsContent }
    | { type: 'stack'; data: StackContent }
    // Legacy layout types (for backwards compatibility)
    | { type: 'container' }
    | { type: 'section' }
    | { type: 'flex' }
    | { type: 'grid' }
    // Content types
    | { type: 'text'; data: TextContent }
    | { type: 'heading'; data: HeadingContent }
    | { type: 'image'; data: ImageContent }
    | { type: 'divider'; data: DividerContent }
    | { type: 'spacer'; data: SpacerContent }
    | { type: 'component'; data: ComponentContent }
    | { type: 'code'; data: CodeContent };

// ============================================
// Layout Element (the main building block)
// ============================================

export type LayoutElement = {
    id: string;
    type: ElementType;
    name?: string;  // User-defined name for the element
    content: ElementContent;
    styles: ElementStyles;
    children: LayoutElement[];  // Nested elements (for containers)
};

// ============================================
// Layout Document (root)
// ============================================

export type LayoutDocument = {
    version: number;
    root: LayoutElement;
    // Global settings
    settings?: {
        maxWidth?: number;
        backgroundColor?: string;
    };
};

// ============================================
// Editor State Types
// ============================================

export type SelectedElement = {
    id: string;
    path: string[];  // Path of IDs from root to element
};

export type DragState = {
    isDragging: boolean;
    draggedType?: ElementType;
    draggedElement?: LayoutElement;
    dropTarget?: {
        elementId: string;
        position: 'before' | 'after' | 'inside';
    };
};

// ============================================
// Element Library Categories
// ============================================

export type LibraryCategory = {
    id: string;
    name: string;
    elements: LibraryElement[];
};

export type LibraryElement = {
    type: ElementType;
    name: string;
    icon: string;
    description?: string;
    defaultStyles?: Partial<ElementStyles>;
    defaultContent?: Partial<ElementContent>;
};

// ============================================
// Available Components (from node connections)
// ============================================

export type AvailableComponent = {
    key: string;
    label: string;
    nodeId?: string;
    type: 'component';
};

// ============================================
// Helper Functions
// ============================================

export const createDefaultElement = (type: ElementType): LayoutElement => {
    const id = crypto.randomUUID();

    const baseElement: LayoutElement = {
        id,
        type,
        content: { type } as ElementContent,
        styles: {},
        children: [],
    };

    switch (type) {
        // New user-friendly layout types
        case 'block':
            return {
                ...baseElement,
                content: { type: 'block' },
                styles: {},
            };
        case 'columns': {
            // Create a columns element with 2 child columns by default
            const column1 = createColumnChild();
            const column2 = createColumnChild();
            return {
                ...baseElement,
                content: {
                    type: 'columns',
                    data: {
                        config: {
                            count: 2,
                            distribution: 'equal',
                            gap: 'medium',
                        },
                    },
                },
                styles: {
                    display: 'grid',
                    grid: { columns: 'repeat(2, 1fr)', gap: GAP_VALUES.medium },
                },
                children: [column1, column2],
            };
        }
        case 'stack':
            return {
                ...baseElement,
                content: {
                    type: 'stack',
                    data: {
                        config: {
                            direction: 'vertical',
                            alignment: 'stretch',
                            gap: 'medium',
                            wrap: false,
                        },
                    },
                },
                styles: {
                    display: 'flex',
                    flex: { direction: 'column', gap: GAP_VALUES.medium, alignItems: 'stretch' },
                },
            };
        // Legacy layout types (for backwards compatibility)
        case 'container':
            return {
                ...baseElement,
                content: { type: 'container' },
                styles: {
                    padding: { top: 16, right: 16, bottom: 16, left: 16 },
                },
            };
        case 'section':
            return {
                ...baseElement,
                content: { type: 'section' },
                styles: {
                    sizing: { width: '100%' },
                    padding: { top: 32, right: 16, bottom: 32, left: 16 },
                },
            };
        case 'flex':
            return {
                ...baseElement,
                content: { type: 'flex' },
                styles: {
                    display: 'flex',
                    flex: { direction: 'row', gap: 16 },
                },
            };
        case 'grid':
            return {
                ...baseElement,
                content: { type: 'grid' },
                styles: {
                    display: 'grid',
                    grid: { columns: 3, gap: 16 },
                },
            };
        // Content types
        case 'text':
            return {
                ...baseElement,
                content: { type: 'text', data: { text: 'Enter your text here...' } },
                styles: {
                    typography: { fontSize: 16 },
                },
            };
        case 'heading':
            return {
                ...baseElement,
                content: { type: 'heading', data: { text: '## Heading', level: 2 } },
                styles: {
                    typography: { fontSize: 24, fontWeight: 600 },
                },
            };
        case 'image':
            return {
                ...baseElement,
                content: { type: 'image', data: { src: '', alt: '' } },
                styles: {
                    sizing: { width: '100%', height: 'auto' },
                },
            };
        case 'divider':
            return {
                ...baseElement,
                content: { type: 'divider', data: { orientation: 'horizontal', thickness: 1, color: '#e5e7eb' } },
            };
        case 'spacer':
            return {
                ...baseElement,
                content: { type: 'spacer', data: { size: 24 } },
            };
        case 'component':
            return {
                ...baseElement,
                content: { type: 'component', data: { componentKey: '' } },
            };
        case 'code':
            return {
                ...baseElement,
                content: { type: 'code', data: { code: '' } },
            };
        default:
            return baseElement;
    }
};

// Helper to create a column child (used internally by columns element)
const createColumnChild = (): LayoutElement => ({
    id: crypto.randomUUID(),
    type: 'block',
    name: 'Column',
    content: { type: 'block' },
    styles: {},
    children: [],
});

export const createDefaultDocument = (): LayoutDocument => ({
    version: 2,  // Bumped version for new element types
    root: {
        id: crypto.randomUUID(),
        type: 'block',
        name: 'Root',
        content: { type: 'block' },
        styles: {},
        children: [],
    },
});

// Find element by ID in the tree
export const findElementById = (root: LayoutElement, id: string): LayoutElement | null => {
    if (root.id === id) return root;
    for (const child of root.children) {
        const found = findElementById(child, id);
        if (found) return found;
    }
    return null;
};

// Find parent of element
export const findParentElement = (root: LayoutElement, id: string): LayoutElement | null => {
    for (const child of root.children) {
        if (child.id === id) return root;
        const found = findParentElement(child, id);
        if (found) return found;
    }
    return null;
};

// Check if element can have children
export const canHaveChildren = (type: ElementType): boolean => {
    return ['block', 'columns', 'stack', 'container', 'section', 'flex', 'grid'].includes(type);
};

// Nesting colors for visual hierarchy
export const NESTING_COLORS = [
    { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', label: 'bg-blue-500' },
    { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-950/30', label: 'bg-green-500' },
    { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', label: 'bg-purple-500' },
    { border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', label: 'bg-orange-500' },
    { border: 'border-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30', label: 'bg-pink-500' },
];

// Get nesting color for a given depth
export const getNestingColor = (depth: number) => {
    return NESTING_COLORS[depth % NESTING_COLORS.length];
};

// Get element path from root to element
export const getElementPath = (root: LayoutElement, targetId: string, path: LayoutElement[] = []): LayoutElement[] | null => {
    if (root.id === targetId) {
        return [...path, root];
    }
    for (const child of root.children) {
        const found = getElementPath(child, targetId, [...path, root]);
        if (found) return found;
    }
    return null;
};

// Migrate legacy document to new format
export const migrateDocument = (doc: LayoutDocument): LayoutDocument => {
    if (doc.version >= 2) return doc;

    const migrateElement = (element: LayoutElement): LayoutElement => {
        let newType = element.type;
        let newContent = element.content;

        // Migrate legacy types to new types
        if (element.type === 'container' || element.type === 'section') {
            newType = 'block';
            newContent = { type: 'block' };
        } else if (element.type === 'grid') {
            newType = 'columns';
            newContent = {
                type: 'columns',
                data: {
                    config: {
                        count: 2,
                        distribution: 'equal' as ColumnsDistribution,
                        gap: 'medium' as GapSize,
                    },
                },
            };
        } else if (element.type === 'flex') {
            newType = 'stack';
            newContent = {
                type: 'stack',
                data: {
                    config: {
                        direction: 'vertical' as StackDirection,
                        alignment: 'stretch' as StackAlignment,
                        gap: 'medium' as GapSize,
                        wrap: false,
                    },
                },
            };
        }

        return {
            ...element,
            type: newType,
            content: newContent,
            children: element.children.map(migrateElement),
        };
    };

    return {
        ...doc,
        version: 2,
        root: migrateElement(doc.root),
    };
};
