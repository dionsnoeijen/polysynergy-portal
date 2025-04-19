'use client';

import {Heading, Subheading} from '@/components/heading';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/table';
import {ApplicationLayout} from "@/app/application-layout";
import React, {useState, useEffect} from "react";
import {PencilIcon, PlusIcon, TrashIcon, CheckIcon, ArrowUturnLeftIcon} from "@heroicons/react/24/outline";
import {Button} from "@/components/button";
import {Input} from "@/components/input";
import {createProject, restoreProject, updateProject, deleteProject} from "@/api/projectsApi";
import {Alert, AlertActions, AlertDescription, AlertTitle} from '@/components/alert';
import {Project} from "@/types/types";
import useProjectsStore from "@/stores/projectsStore";

export default function Home() {
    const {projects, fetchProjects} = useProjectsStore();
    const [newProjectName, setNewProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [editProjectId, setEditProjectId] = useState<string|null>(null);
    const [editProjectName, setEditProjectName] = useState('');
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [deleteProjectId, setDeleteProjectId] = useState<string|null>(null);
    const [showTrashed, setShowTrashed] = useState(false);

    // @todo: Apparently, the double fetch is because of React.StrictMode in dev mode.
    //   check this in production.
    useEffect(() => {
        fetchProjects(showTrashed);
    }, [fetchProjects, showTrashed]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            setError('Project name is required!');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            await createProject(newProjectName);
            setNewProjectName('');
            await fetchProjects(showTrashed);
        } catch (error) {
            console.error('Error creating project:', error);
            setError('Failed to create project. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProject = (project: Project) => {
        setEditProjectId(project.id);
        setEditProjectName(project.name);
    };

    const handleSaveEditProject = async () => {
        await updateProject(editProjectId as string, {
            name: editProjectName,
        });
        await fetchProjects(showTrashed);
        setEditProjectId(null);
        setEditProjectName('');
    };

    const handleDeleteProject = (projectId: string) => {
        setDeleteProjectId(projectId);
        setShowDeleteAlert(true);
    };

    const confirmDeleteProject = async () => {
        await deleteProject(deleteProjectId as string);
        await fetchProjects(showTrashed);
        setShowDeleteAlert(false);
        setDeleteProjectId(null);
    };

    const handleRestoreProject = async (projectId: string) => {
        try {
            await restoreProject(projectId);
            await fetchProjects(showTrashed);
        } catch (error) {
            console.error('Error restoring project:', error);
        }
    };

    return (
        <ApplicationLayout>
            <Heading>Projects</Heading>
            <div className="mt-8 flex items-end justify-between">
                <Subheading>Overview</Subheading>
                <div className="inline-flex rounded-md shadow-sm">
                    <button
                        type="button"
                        onClick={() => setShowTrashed(false)}
                        className={`px-2 py-1 text-sm font-medium ${
                            !showTrashed ?
                                'bg-zinc-600 text-white' :
                                'bg-zinc-700 text-zinc-400'
                        } border border-zinc-500 rounded-l-md hover:bg-zinc-800`}
                    >
                        Available
                    </button>
                    <button
                        type="button"
                        title={"Show trashed projects"}
                        onClick={() => setShowTrashed(true)}
                        className={`px-2 py-1 text-sm font-medium ${
                            showTrashed ?
                                'bg-zinc-600 text-white' :
                                'bg-zinc-800 text-zinc-400'
                        } border-t border-b border-r border-zinc-500 rounded-r-md hover:bg-zinc-800`}
                    >
                        <TrashIcon
                            className={`w-4 h-4 ${
                                showTrashed ?
                                    'text-white' :
                                    'text-zinc-500'
                            }`}
                        />
                    </button>
                </div>
            </div>
            <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
                <TableHead>
                    <TableRow>
                        <TableHeader>Project name</TableHeader>
                        <TableHeader>Last modified</TableHeader>
                        <TableHeader>Created</TableHeader>
                        <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {projects.map((project) => (
                        <TableRow key={project.id} title={`Project #${project.id}`} href={`/project/${project.id}`}>
                            <TableCell>
                                {editProjectId === project.id ? (
                                    <Input
                                        value={editProjectName}
                                        onChange={(e) => setEditProjectName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEditProject()}
                                    />
                                ) : (
                                    project.name
                                )}
                            </TableCell>
                            <TableCell className="text-zinc-500">{project.updated_at}</TableCell>
                            <TableCell>{project.created_at}</TableCell>
                            <TableCell className="text-right">
                                {showTrashed ? (
                                    <Button onClick={() => handleRestoreProject(project.id)}>
                                        <ArrowUturnLeftIcon />
                                    </Button>
                                ) : (
                                    <>
                                        {editProjectId === project.id ? (
                                            <Button className={'mr-1'} onClick={handleSaveEditProject}><CheckIcon /></Button>
                                        ) : (
                                            <Button className={'mr-1'} onClick={() => handleEditProject(project)}><PencilIcon /></Button>
                                        )}
                                        <Button onClick={() => handleDeleteProject(project.id)}><TrashIcon /></Button>
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={3}>
                            <Input
                                name="name"
                                placeholder="Project name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                                className={error ? 'border-red-500' : ''}
                            />
                            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button onClick={handleCreateProject} disabled={isLoading}>
                                <PlusIcon />
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this project?</AlertTitle>
                    <AlertDescription>This action cannot be undone.</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setShowDeleteAlert(false)} plain>
                            Cancel
                        </Button>
                        <Button color="red" onClick={confirmDeleteProject}>
                            Yes, delete
                        </Button>
                    </AlertActions>
                </Alert>
            )}
        </ApplicationLayout>
    );
}