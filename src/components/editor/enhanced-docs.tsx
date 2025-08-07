import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useEditorStore from "@/stores/editorStore";
import useDocumentationStore, { DocumentationType } from "@/stores/documentationStore";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import { fetchAllDocumentationAPI } from "@/api/documentationApi";
import { Button } from "@/components/button";
import { Input, InputGroup } from "@/components/input";
import { 
    XMarkIcon, 
    MagnifyingGlassIcon, 
    BookOpenIcon,
    CubeIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { Divider } from "@/components/divider";
import { Heading } from "@/components/heading";
import Editor from "@monaco-editor/react";

const EnhancedDocs: React.FC = () => {
    const docsMarkdown = useEditorStore((state) => state.docsMarkdown);
    const closeDocs = useEditorStore((state) => state.closeDocs);
    const [editorTheme, setEditorTheme] = useState<"vs-dark" | "vs-light">("vs-dark");
    
    // Available nodes for node documentation
    const { availableNodes, hasInitialFetched, fetchAvailableNodes } = useAvailableNodeStore();
    const [selectedNodeDoc, setSelectedNodeDoc] = useState<string | null>(null);
    const [selectedNodeCategory, setSelectedNodeCategory] = useState<string | null>(null);

    // Documentation store
    const {
        categories,
        guides,
        currentDocument,
        searchResults,
        searchQuery,
        selectedCategory,
        documentationType,
        isLoading,
        error,
        setDocumentationType,
        setSearchQuery,
        setSelectedCategory,
        fetchCategories,
        fetchDocument,
        clearSearch,
        clearCurrentDocument,
        clearError,
        updateGuides
    } = useDocumentationStore();

    const loadAllDocumentCounts = useCallback(async () => {
        try {
            const response = await fetchAllDocumentationAPI();
            console.log('Loaded all documentation for counts:', response);
            // The response should have guides with documents, update the store
            const updatedGuides = response.guides || {};
            updateGuides(updatedGuides);
        } catch (error) {
            console.error('Failed to load document counts:', error);
        }
    }, [updateGuides]);

    useEffect(() => {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setEditorTheme(isDark ? "vs-dark" : "vs-light");
    }, []);

    useEffect(() => {
        if (documentationType === 'general') {
            fetchCategories();
            // Load document counts for all categories
            loadAllDocumentCounts();
        } else if (documentationType === 'node' && !hasInitialFetched) {
            fetchAvailableNodes();
        }
    }, [documentationType, fetchCategories, fetchAvailableNodes, hasInitialFetched, loadAllDocumentCounts]);

    // Auto-select node when docsMarkdown is set and we're on node tab
    useEffect(() => {
        if (documentationType === 'node' && docsMarkdown && docsMarkdown.trim() && availableNodes.length > 0 && selectedNodeDoc === null) {
            console.log('Auto-selecting node for docsMarkdown:', docsMarkdown.substring(0, 100) + '...');
            // Find the node that matches the current docsMarkdown
            const matchingNode = availableNodes.find(node => 
                node.documentation && node.documentation.trim() === docsMarkdown.trim()
            );
            if (matchingNode) {
                console.log('Found matching node:', matchingNode.name, matchingNode.id);
                setSelectedNodeDoc(matchingNode.id);
            } else {
                console.log('No matching node found for docsMarkdown');
            }
        }
    }, [documentationType, docsMarkdown, availableNodes, selectedNodeDoc]);

    const handleTabChange = (type: DocumentationType) => {
        setDocumentationType(type);
        clearSearch();
        clearCurrentDocument();
        clearError();
        // Clear node doc selections when switching tabs
        setSelectedNodeDoc(null);
        setSelectedNodeCategory(null);
    };

    const handleCategorySelect = (categoryName: string) => {
        setSelectedCategory(categoryName);
    };

    const handleDocumentSelect = (category: string, docId: string) => {
        fetchDocument(category, docId);
    };

    const stripFrontmatter = (content: string): string => {
        if (content.startsWith('---\n')) {
            const endMatch = content.indexOf('\n---\n', 4);
            if (endMatch !== -1) {
                return content.substring(endMatch + 5); // +5 for "\n---\n"
            }
        }
        return content;
    };

    const renderNodeDocs = () => {
        console.log('Total availableNodes:', availableNodes.length);
        console.log('Nodes with docs:', availableNodes.filter(node => node.documentation && node.documentation.trim()).length);
        console.log('Sample nodes:', availableNodes.slice(0, 3).map(n => ({ name: n.name, hasDocs: !!n.documentation })));
        
        const selectedNode = availableNodes.find(node => node.id === selectedNodeDoc);
        
        if (selectedNode && selectedNode.documentation) {
            return (
                <div>
                    {/* Back button */}
                    <div className="mb-4">
                        <Button 
                            color="zinc"
                            onClick={() => {
                                // Clear the docsMarkdown to prevent auto-reselection
                                useEditorStore.getState().openDocs('');
                                setSelectedNodeDoc(null);
                            }}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back to Nodes
                        </Button>
                    </div>
                    
                    {/* Node title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">{selectedNode.name}</h2>
                        {selectedNode.category && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Category: {selectedNode.category}
                            </p>
                        )}
                    </div>
                    
                    {/* Node documentation */}
                    {renderMarkdownContent(stripFrontmatter(selectedNode.documentation))}
                </div>
            );
        }

        // Show nodes list organized by categories
        const nodesWithDocs = availableNodes.filter(node => node.documentation && node.documentation.trim());
        const allNodes = availableNodes; // DEBUG: Show all nodes temporarily
        
        console.log('Nodes breakdown:', {
            total: allNodes.length,
            withDocs: nodesWithDocs.length,
            withoutDocs: allNodes.length - nodesWithDocs.length
        });
        
        // Use allNodes for now to see everything, switch back to nodesWithDocs later
        const nodesByCategory = allNodes.reduce((acc, node) => {
            const category = node.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(node);
            return acc;
        }, {} as Record<string, typeof nodesWithDocs>);

        const categoryNames = Object.keys(nodesByCategory).sort();

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Categories */}
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold mb-4">Node Categories</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => setSelectedNodeCategory(null)}
                            className={`w-full text-left p-3 rounded-md border transition-colors ${
                                selectedNodeCategory === null
                                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-400'
                                    : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <div className="font-medium">All Nodes</div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {allNodes.length} nodes ({nodesWithDocs.length} with docs)
                            </div>
                        </button>
                        
                        {categoryNames.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedNodeCategory(category)}
                                className={`w-full text-left p-3 rounded-md border transition-colors ${
                                    selectedNodeCategory === category
                                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-400'
                                        : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <div className="font-medium">{category}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {nodesByCategory[category].length} nodes
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Nodes List */}
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">
                        {selectedNodeCategory ? `${selectedNodeCategory} Nodes` : 'All Nodes'}
                    </h3>
                    <div className="space-y-3">
                        {(selectedNodeCategory ? nodesByCategory[selectedNodeCategory] : allNodes)
                            ?.map((node) => {
                                const hasDocs = node.documentation && node.documentation.trim();
                                return (
                                    <button
                                        key={node.id}
                                        onClick={() => hasDocs ? setSelectedNodeDoc(node.id) : null}
                                        disabled={!hasDocs}
                                        className={`w-full text-left p-4 border rounded-md transition-colors ${
                                            hasDocs
                                                ? 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer'
                                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">{node.name}</h4>
                                                    {hasDocs ? (
                                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="Has documentation" />
                                                    ) : (
                                                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" title="No documentation" />
                                                    )}
                                                </div>
                                                {node.handle && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                                                        {node.handle}
                                                    </p>
                                                )}
                                                {node.category && (
                                                    <span className="inline-block px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded mt-2">
                                                        {node.category}
                                                    </span>
                                                )}
                                            </div>
                                            {hasDocs && <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />}
                                        </div>
                                    </button>
                                );
                            }) || (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No nodes with documentation available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const handleInternalLink = (href: string) => {
        console.log('Internal link clicked:', href);
        
        // Handle internal documentation links
        if (href.startsWith('/documentation/') || href.startsWith('./') || href.startsWith('../')) {
            // Parse different link formats
            let targetCategory = '';
            let targetDocument = '';
            
            if (href.startsWith('/documentation/')) {
                // Format: /documentation/guides/getting-started
                const parts = href.replace('/documentation/', '').split('/');
                targetCategory = parts[0];
                targetDocument = parts[1];
            } else if (href.includes('/')) {
                // Format: ./other-doc.md or ../category/doc.md
                const cleanHref = href.replace('./', '').replace('../', '').replace('.md', '');
                const parts = cleanHref.split('/');
                if (parts.length === 2) {
                    targetCategory = parts[0];
                    targetDocument = parts[1];
                } else {
                    // Same category, different document
                    targetCategory = selectedCategory || categories[0]?.id || '';
                    targetDocument = parts[0];
                }
            }
            
            if (targetCategory && targetDocument) {
                console.log(`Navigating to: ${targetCategory}/${targetDocument}`);
                // Clear current document first
                clearCurrentDocument();
                // Set the category
                setSelectedCategory(targetCategory);
                // Fetch the specific document
                fetchDocument(targetCategory, targetDocument);
            }
            
            return true; // Handled
        }
        
        return false; // Not handled, let it open normally
    };

    const renderMarkdownContent = (content: string) => (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ className, children }) {
                    const isBlock = className?.includes("language-");
                    const language = className ? className.replace("language-", "") : "plaintext";
                    const codeText = String(children).trim();
                    const lineCount = codeText.split("\n").length;
                    const dynamicHeight = Math.max(150, lineCount * 20) + "px";

                    return isBlock ? (
                        <div className="my-4 rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-700">
                            <Editor
                                height={dynamicHeight}
                                defaultLanguage={language}
                                value={codeText}
                                theme={editorTheme}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    lineNumbers: "off",
                                    fontSize: 14,
                                    padding: { top: 10, bottom: 10 },
                                    overviewRulerLanes: 0,
                                    wordWrap: "on",
                                }}
                            />
                        </div>
                    ) : (
                        <code className="bg-zinc-200 dark:bg-zinc-800 text-sky-700 dark:text-sky-400 px-1 py-0.5 rounded-md font-mono text-sm border border-zinc-400 dark:border-zinc-500/50 leading-tight">
                            {children}
                        </code>
                    );
                },
                a: ({ href, children, ...props }) => {
                    const handleClick = (e: React.MouseEvent) => {
                        if (href && handleInternalLink(href)) {
                            e.preventDefault();
                        }
                    };
                    
                    return (
                        <a 
                            href={href}
                            className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer" 
                            onClick={handleClick}
                            {...props}
                        >
                            {children}
                        </a>
                    );
                },
                h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-0 mb-2 leading-snug" {...props} />,
                h2: ({ ...props }) => <h2 className="text-2xl font-semibold mt-5 mb-2 leading-snug" {...props} />,
                h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 leading-snug" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2 leading-relaxed" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2 leading-relaxed" {...props} />,
                blockquote: ({ ...props }) => <blockquote className="border-l-4 border-zinc-400 dark:border-zinc-500 pl-4 italic leading-relaxed" {...props} />,
                table: ({ ...props }) => (
                    <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-600">
                        {props.children}
                    </table>
                ),
                th: ({ ...props }) => (
                    <th className="text-left p-3 border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 font-semibold">
                        {props.children}
                    </th>
                ),
                td: ({ ...props }) => (
                    <td className="p-3 border border-zinc-300 dark:border-zinc-600">
                        {props.children}
                    </td>
                ),
                hr: ({ ...props }) => (
                    <hr className="border-t border-sky-300 dark:border-zinc-600 my-6" {...props} />
                )
            }}
        >
            {content}
        </ReactMarkdown>
    );

    const renderGeneralDocs = () => {
        if (error) {
            return (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
                        <Button onClick={() => { clearError(); fetchCategories(); }} color="sky">
                            Retry
                        </Button>
                    </div>
                </div>
            );
        }

        if (currentDocument) {
            return (
                <div>
                    {/* Back button */}
                    <div className="mb-4">
                        <Button 
                            color="zinc"
                            onClick={() => { clearCurrentDocument(); }}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back to {categories.find(c => c.id === selectedCategory)?.title || 'Categories'}
                        </Button>
                    </div>
                    {renderMarkdownContent(currentDocument.body)}
                </div>
            );
        }

        if (searchQuery && searchResults.length > 0) {
            return (
                <div className="space-y-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Search Results</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Found {searchResults.length} results for &quot;{searchQuery}&quot;
                        </p>
                    </div>
                    {searchResults.map((result) => (
                        <div 
                            key={result.id}
                            className="border border-zinc-300 dark:border-zinc-700 rounded-md p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                            onClick={() => handleDocumentSelect(result.category, result.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sky-700 dark:text-sky-400">{result.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.category}</p>
                                    {result.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{result.description}</p>
                                    )}
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{result.snippet}</p>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Show categories and guides
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Navigation */}
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold mb-4">Categories</h3>
                    <div className="space-y-2">
                        {Array.isArray(categories) && categories.length > 0 ? (
                            categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category.id)}
                                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                                        selectedCategory === category.id
                                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-400'
                                            : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <div className="font-medium">{category.title}</div>
                                    {category.description && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {category.description}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        {guides[category.id]?.length || 0} documents
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                No categories available
                            </div>
                        )}
                    </div>
                </div>

                {/* Guides List */}
                <div className="lg:col-span-2">
                    {selectedCategory ? (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{categories.find(c => c.id === selectedCategory)?.title || selectedCategory} Documents</h3>
                            <div className="space-y-3">
                                {guides[selectedCategory]?.map((document) => (
                                    <button
                                        key={document.id}
                                        onClick={() => handleDocumentSelect(document.category, document.id)}
                                        className="w-full text-left p-4 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium">{document.title}</h4>
                                                {document.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {document.description}
                                                    </p>
                                                )}
                                                {document.tags && document.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {document.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                                        </div>
                                    </button>
                                )) || (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No documents available in this category.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            Select a category to view documents
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="relative prose prose-invert dark:prose-dark !overflow-scroll bg-white dark:bg-zinc-800 max-w-none p-10 leading-relaxed">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>Documentation</Heading>
                <Button type="button" onClick={() => { closeDocs() }} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                <button
                    onClick={() => handleTabChange('node')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        documentationType === 'node'
                            ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                    <CubeIcon className="h-4 w-4" />
                    Node Docs
                </button>
                <button
                    onClick={() => handleTabChange('general')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        documentationType === 'general'
                            ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                    <BookOpenIcon className="h-4 w-4" />
                    General Docs
                </button>
            </div>

            {/* Search (only for general docs) */}
            {documentationType === 'general' && (
                <div className="mb-6">
                    <InputGroup>
                        <MagnifyingGlassIcon data-slot="icon" className="h-5 w-5 text-zinc-500" />
                        <Input
                            type="search"
                            placeholder="Search documentation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                        {searchQuery && (
                            <Button
                                color="zinc"
                                onClick={() => { setSearchQuery(''); clearSearch(); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </Button>
                        )}
                    </InputGroup>
                </div>
            )}

            <Divider className="my-4" soft bleed />

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading documentation...</p>
                    </div>
                </div>
            ) : documentationType === 'node' ? (
                renderNodeDocs()
            ) : (
                renderGeneralDocs()
            )}
        </div>
    );
};

export default EnhancedDocs;