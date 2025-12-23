import React from 'react';
import {
    LayoutElement,
    LayoutDocument,
    ElementStyles,
    findElementById,
    GapSize,
    GAP_VALUES,
    ColumnsDistribution,
    StackDirection,
    StackAlignment,
} from './types';
import { Input } from '@/components/input';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type PropertiesPanelProps = {
    document: LayoutDocument;
    selectedElementId: string | null;
    onChange: (document: LayoutDocument) => void;
};

type PropertySectionProps = {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
};

const PropertySection: React.FC<PropertySectionProps> = ({ title, defaultOpen = true, children }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div className="border-b border-zinc-100 dark:border-zinc-700/50">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
                {title}
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            {isOpen && <div className="px-3 pb-3 space-y-3">{children}</div>}
        </div>
    );
};

type PropertyRowProps = {
    label: string;
    children: React.ReactNode;
};

const PropertyRow: React.FC<PropertyRowProps> = ({ label, children }) => (
    <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 dark:text-zinc-400 w-16 flex-shrink-0">{label}</label>
        <div className="flex-1">{children}</div>
    </div>
);

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    document,
    selectedElementId,
    onChange,
}) => {
    const selectedElement = selectedElementId
        ? findElementById(document.root, selectedElementId)
        : null;

    // Deep clone and update helper
    const updateElement = (elementId: string, updater: (element: LayoutElement) => void) => {
        const newDoc: LayoutDocument = JSON.parse(JSON.stringify(document));
        const element = findElementById(newDoc.root, elementId);
        if (element) {
            updater(element);
            onChange(newDoc);
        }
    };

    const updateStyles = (updates: Partial<ElementStyles>) => {
        if (!selectedElementId) return;
        updateElement(selectedElementId, (el) => {
            el.styles = { ...el.styles, ...updates };
        });
    };

    const updateContent = (updates: Record<string, unknown>) => {
        if (!selectedElementId || !selectedElement) return;
        updateElement(selectedElementId, (el) => {
            if ('data' in el.content) {
                (el.content as { type: string; data: Record<string, unknown> }).data = {
                    ...(el.content as { type: string; data: Record<string, unknown> }).data,
                    ...updates,
                };
            }
        });
    };

    if (!selectedElement) {
        return (
            <div className="h-full flex flex-col bg-white dark:bg-zinc-800">
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        Properties
                    </h3>
                </div>
                <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm p-4 text-center">
                    Select an element to edit its properties
                </div>
            </div>
        );
    }

    const styles = selectedElement.styles;
    const content = selectedElement.content;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-800">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Properties
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 capitalize">
                    {selectedElement.type}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Content properties based on type */}
                {content.type === 'heading' && (
                    <PropertySection title="Heading">
                        <PropertyRow label="Text">
                            <Input
                                value={content.data.text}
                                onChange={(e) => updateContent({ text: e.target.value })}
                                className="text-sm"
                            />
                        </PropertyRow>
                        <PropertyRow label="Level">
                            <select
                                value={content.data.level}
                                onChange={(e) => updateContent({ level: parseInt(e.target.value) })}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                {[1, 2, 3, 4, 5, 6].map((level) => (
                                    <option key={level} value={level}>H{level}</option>
                                ))}
                            </select>
                        </PropertyRow>
                    </PropertySection>
                )}

                {content.type === 'text' && (
                    <PropertySection title="Text">
                        <textarea
                            value={content.data.text}
                            onChange={(e) => updateContent({ text: e.target.value })}
                            className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1 min-h-[80px]"
                        />
                    </PropertySection>
                )}

                {content.type === 'image' && (
                    <PropertySection title="Image">
                        <PropertyRow label="Source">
                            <Input
                                value={content.data.src}
                                onChange={(e) => updateContent({ src: e.target.value })}
                                placeholder="Image URL"
                                className="text-sm"
                            />
                        </PropertyRow>
                        <PropertyRow label="Alt">
                            <Input
                                value={content.data.alt || ''}
                                onChange={(e) => updateContent({ alt: e.target.value })}
                                placeholder="Alt text"
                                className="text-sm"
                            />
                        </PropertyRow>
                    </PropertySection>
                )}

                {content.type === 'spacer' && (
                    <PropertySection title="Spacer">
                        <PropertyRow label="Size">
                            <Input
                                type="number"
                                value={content.data.size}
                                onChange={(e) => updateContent({ size: parseInt(e.target.value) || 0 })}
                                className="text-sm"
                            />
                        </PropertyRow>
                    </PropertySection>
                )}

                {/* Columns properties */}
                {selectedElement.type === 'columns' && selectedElement.content.type === 'columns' && (
                    <PropertySection title="Columns Layout">
                        <PropertyRow label="Columns">
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                {selectedElement.children.length} columns
                            </span>
                        </PropertyRow>
                        <PropertyRow label="Distribution">
                            <select
                                value={selectedElement.content.data.config.distribution}
                                onChange={(e) => {
                                    const distribution = e.target.value as ColumnsDistribution;
                                    updateElement(selectedElementId!, (el) => {
                                        if (el.content.type === 'columns') {
                                            el.content.data.config.distribution = distribution;
                                            // Update grid columns based on distribution
                                            if (el.styles.grid) {
                                                if (distribution === 'equal') {
                                                    el.styles.grid.columns = `repeat(${el.children.length}, 1fr)`;
                                                } else if (distribution === 'sidebar-left') {
                                                    el.styles.grid.columns = '1fr 2fr';
                                                } else if (distribution === 'sidebar-right') {
                                                    el.styles.grid.columns = '2fr 1fr';
                                                } else if (distribution === 'golden') {
                                                    el.styles.grid.columns = '1fr 1.618fr';
                                                }
                                            }
                                        }
                                    });
                                }}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="equal">Equal widths</option>
                                <option value="sidebar-left">Sidebar left (1:2)</option>
                                <option value="sidebar-right">Sidebar right (2:1)</option>
                                <option value="golden">Golden ratio</option>
                            </select>
                        </PropertyRow>
                        <PropertyRow label="Gap">
                            <select
                                value={selectedElement.content.data.config.gap}
                                onChange={(e) => {
                                    const gap = e.target.value as GapSize;
                                    updateElement(selectedElementId!, (el) => {
                                        if (el.content.type === 'columns') {
                                            el.content.data.config.gap = gap;
                                            if (el.styles.grid) {
                                                el.styles.grid.gap = GAP_VALUES[gap];
                                            }
                                        }
                                    });
                                }}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="none">None</option>
                                <option value="small">Small (8px)</option>
                                <option value="medium">Medium (16px)</option>
                                <option value="large">Large (32px)</option>
                            </select>
                        </PropertyRow>
                    </PropertySection>
                )}

                {/* Stack properties */}
                {selectedElement.type === 'stack' && selectedElement.content.type === 'stack' && (
                    <PropertySection title="Stack Layout">
                        <PropertyRow label="Direction">
                            <select
                                value={selectedElement.content.data.config.direction}
                                onChange={(e) => {
                                    const direction = e.target.value as StackDirection;
                                    updateElement(selectedElementId!, (el) => {
                                        if (el.content.type === 'stack') {
                                            el.content.data.config.direction = direction;
                                            if (el.styles.flex) {
                                                el.styles.flex.direction = direction === 'vertical' ? 'column' : 'row';
                                            }
                                        }
                                    });
                                }}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="vertical">Vertical</option>
                                <option value="horizontal">Horizontal</option>
                            </select>
                        </PropertyRow>
                        <PropertyRow label="Alignment">
                            <select
                                value={selectedElement.content.data.config.alignment}
                                onChange={(e) => {
                                    const alignment = e.target.value as StackAlignment;
                                    updateElement(selectedElementId!, (el) => {
                                        if (el.content.type === 'stack') {
                                            el.content.data.config.alignment = alignment;
                                            if (el.styles.flex) {
                                                const alignMap: Record<StackAlignment, 'flex-start' | 'center' | 'flex-end' | 'stretch'> = {
                                                    start: 'flex-start',
                                                    center: 'center',
                                                    end: 'flex-end',
                                                    stretch: 'stretch',
                                                };
                                                el.styles.flex.alignItems = alignMap[alignment];
                                            }
                                        }
                                    });
                                }}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="start">Start</option>
                                <option value="center">Center</option>
                                <option value="end">End</option>
                                <option value="stretch">Stretch</option>
                            </select>
                        </PropertyRow>
                        <PropertyRow label="Gap">
                            <select
                                value={selectedElement.content.data.config.gap}
                                onChange={(e) => {
                                    const gap = e.target.value as GapSize;
                                    updateElement(selectedElementId!, (el) => {
                                        if (el.content.type === 'stack') {
                                            el.content.data.config.gap = gap;
                                            if (el.styles.flex) {
                                                el.styles.flex.gap = GAP_VALUES[gap];
                                            }
                                        }
                                    });
                                }}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="none">None</option>
                                <option value="small">Small (8px)</option>
                                <option value="medium">Medium (16px)</option>
                                <option value="large">Large (32px)</option>
                            </select>
                        </PropertyRow>
                    </PropertySection>
                )}

                {/* Flex properties (legacy) */}
                {selectedElement.type === 'flex' && (
                    <PropertySection title="Flex Layout">
                        <PropertyRow label="Direction">
                            <select
                                value={styles.flex?.direction || 'row'}
                                onChange={(e) => updateStyles({
                                    flex: { ...styles.flex, direction: e.target.value as 'row' | 'column' }
                                })}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="row">Row</option>
                                <option value="column">Column</option>
                                <option value="row-reverse">Row Reverse</option>
                                <option value="column-reverse">Column Reverse</option>
                            </select>
                        </PropertyRow>
                        <PropertyRow label="Justify">
                            <select
                                value={styles.flex?.justifyContent || 'flex-start'}
                                onChange={(e) => updateStyles({
                                    flex: { ...styles.flex, justifyContent: e.target.value as 'flex-start' | 'center' | 'flex-end' | 'space-between' }
                                })}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="flex-start">Start</option>
                                <option value="center">Center</option>
                                <option value="flex-end">End</option>
                                <option value="space-between">Space Between</option>
                                <option value="space-around">Space Around</option>
                            </select>
                        </PropertyRow>
                        <PropertyRow label="Align">
                            <select
                                value={styles.flex?.alignItems || 'stretch'}
                                onChange={(e) => updateStyles({
                                    flex: { ...styles.flex, alignItems: e.target.value as 'flex-start' | 'center' | 'flex-end' | 'stretch' }
                                })}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="stretch">Stretch</option>
                                <option value="flex-start">Start</option>
                                <option value="center">Center</option>
                                <option value="flex-end">End</option>
                            </select>
                        </PropertyRow>
                        <PropertyRow label="Gap">
                            <Input
                                type="number"
                                value={styles.flex?.gap || 0}
                                onChange={(e) => updateStyles({
                                    flex: { ...styles.flex, gap: parseInt(e.target.value) || 0 }
                                })}
                                className="text-sm"
                            />
                        </PropertyRow>
                    </PropertySection>
                )}

                {/* Grid properties */}
                {selectedElement.type === 'grid' && (
                    <PropertySection title="Grid Layout">
                        <PropertyRow label="Columns">
                            <Input
                                type="number"
                                value={typeof styles.grid?.columns === 'number' ? styles.grid.columns : 3}
                                onChange={(e) => updateStyles({
                                    grid: { ...styles.grid, columns: parseInt(e.target.value) || 1 }
                                })}
                                className="text-sm"
                            />
                        </PropertyRow>
                        <PropertyRow label="Gap">
                            <Input
                                type="number"
                                value={styles.grid?.gap || 0}
                                onChange={(e) => updateStyles({
                                    grid: { ...styles.grid, gap: parseInt(e.target.value) || 0 }
                                })}
                                className="text-sm"
                            />
                        </PropertyRow>
                    </PropertySection>
                )}

                {/* Spacing */}
                <PropertySection title="Spacing" defaultOpen={false}>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Padding</div>
                    <div className="grid grid-cols-2 gap-2">
                        <PropertyRow label="Top">
                            <Input
                                type="number"
                                value={typeof styles.padding?.top === 'number' ? styles.padding.top : ''}
                                onChange={(e) => updateStyles({
                                    padding: { ...styles.padding, top: parseInt(e.target.value) || 0 }
                                })}
                                className="text-sm"
                            />
                        </PropertyRow>
                        <PropertyRow label="Right">
                            <Input
                                type="number"
                                value={typeof styles.padding?.right === 'number' ? styles.padding.right : ''}
                                onChange={(e) => updateStyles({
                                    padding: { ...styles.padding, right: parseInt(e.target.value) || 0 }
                                })}
                                className="text-sm"
                            />
                        </PropertyRow>
                        <PropertyRow label="Bottom">
                            <Input
                                type="number"
                                value={typeof styles.padding?.bottom === 'number' ? styles.padding.bottom : ''}
                                onChange={(e) => updateStyles({
                                    padding: { ...styles.padding, bottom: parseInt(e.target.value) || 0 }
                                })}
                                className="text-sm"
                            />
                        </PropertyRow>
                        <PropertyRow label="Left">
                            <Input
                                type="number"
                                value={typeof styles.padding?.left === 'number' ? styles.padding.left : ''}
                                onChange={(e) => updateStyles({
                                    padding: { ...styles.padding, left: parseInt(e.target.value) || 0 }
                                })}
                                className="text-sm"
                            />
                        </PropertyRow>
                    </div>
                </PropertySection>

                {/* Background */}
                <PropertySection title="Background" defaultOpen={false}>
                    <PropertyRow label="Color">
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={styles.background?.color || '#ffffff'}
                                onChange={(e) => updateStyles({
                                    background: { ...styles.background, color: e.target.value }
                                })}
                                className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                            />
                            <Input
                                value={styles.background?.color || ''}
                                onChange={(e) => updateStyles({
                                    background: { ...styles.background, color: e.target.value }
                                })}
                                placeholder="#ffffff"
                                className="text-sm flex-1"
                            />
                        </div>
                    </PropertyRow>
                </PropertySection>

                {/* Typography for text elements */}
                {(selectedElement.type === 'text' || selectedElement.type === 'heading') && (
                    <PropertySection title="Typography" defaultOpen={false}>
                        <PropertyRow label="Size">
                            <Input
                                type="number"
                                value={styles.typography?.fontSize || 16}
                                onChange={(e) => updateStyles({
                                    typography: { ...styles.typography, fontSize: parseInt(e.target.value) || 16 }
                                })}
                                className="text-sm"
                            />
                        </PropertyRow>
                        <PropertyRow label="Weight">
                            <select
                                value={styles.typography?.fontWeight || 400}
                                onChange={(e) => updateStyles({
                                    typography: { ...styles.typography, fontWeight: parseInt(e.target.value) as 400 | 500 | 600 | 700 }
                                })}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value={300}>Light</option>
                                <option value={400}>Regular</option>
                                <option value={500}>Medium</option>
                                <option value={600}>Semibold</option>
                                <option value={700}>Bold</option>
                            </select>
                        </PropertyRow>
                        <PropertyRow label="Align">
                            <select
                                value={styles.typography?.textAlign || 'left'}
                                onChange={(e) => updateStyles({
                                    typography: { ...styles.typography, textAlign: e.target.value as 'left' | 'center' | 'right' }
                                })}
                                className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-2 py-1"
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </PropertyRow>
                        <PropertyRow label="Color">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={styles.typography?.color || '#000000'}
                                    onChange={(e) => updateStyles({
                                        typography: { ...styles.typography, color: e.target.value }
                                    })}
                                    className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                                />
                                <Input
                                    value={styles.typography?.color || ''}
                                    onChange={(e) => updateStyles({
                                        typography: { ...styles.typography, color: e.target.value }
                                    })}
                                    placeholder="#000000"
                                    className="text-sm flex-1"
                                />
                            </div>
                        </PropertyRow>
                    </PropertySection>
                )}

                {/* Border */}
                <PropertySection title="Border" defaultOpen={false}>
                    <PropertyRow label="Width">
                        <Input
                            type="number"
                            value={styles.border?.all?.width || 0}
                            onChange={(e) => updateStyles({
                                border: {
                                    ...styles.border,
                                    all: { ...styles.border?.all, width: parseInt(e.target.value) || 0 }
                                }
                            })}
                            className="text-sm"
                        />
                    </PropertyRow>
                    <PropertyRow label="Color">
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={styles.border?.all?.color || '#e5e7eb'}
                                onChange={(e) => updateStyles({
                                    border: {
                                        ...styles.border,
                                        all: { ...styles.border?.all, color: e.target.value }
                                    }
                                })}
                                className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                            />
                        </div>
                    </PropertyRow>
                    <PropertyRow label="Radius">
                        <Input
                            type="number"
                            value={typeof styles.border?.radius === 'number' ? styles.border.radius : 0}
                            onChange={(e) => updateStyles({
                                border: { ...styles.border, radius: parseInt(e.target.value) || 0 }
                            })}
                            className="text-sm"
                        />
                    </PropertyRow>
                </PropertySection>
            </div>
        </div>
    );
};

export default PropertiesPanel;
