import {SidebarHeader, SidebarItem, SidebarLabel} from "@/components/sidebar";
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu
} from "@/components/dropdown";
import {Avatar} from "@/components/avatar";
import {ChevronUpIcon, Cog8ToothIcon, UserIcon} from "@heroicons/react/24/outline";
import useProjectsStore from "@/stores/projectsStore";
import useEditorStore from "@/stores/editorStore";
import {useEffect, useState} from "react";
import { Project } from "@/types/types";

export default function SidebarTenantHeader()
{
    const fetchProject = useProjectsStore((state) => state.fetchProject);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const [project, setProject] = useState<Partial<Project>>({ name: 'No Project' });

    useEffect(() => {
        fetchProject(activeProjectId).then(project => {
            if (project) {
                setProject(project);
                document.title = `${project.name} - PolySynergy`;
            }
        });
    }, [fetchProject, activeProjectId]);

    return (
        <SidebarHeader className={'border-none p-0'}>
            <Dropdown>
                <DropdownButton as={SidebarItem}>
                    {/*<Avatar square={true} src="/ps-logo-simple-color.svg" />*/}
                    <SidebarLabel>{project.name}</SidebarLabel>
                    <ChevronUpIcon />
                </DropdownButton>
                <DropdownMenu className="min-w-80 lg:min-w-64" anchor="top start">
                    <DropdownItem href="/">
                        <Avatar slot="icon" src="/teams/catalyst.svg" />
                        <DropdownLabel>Projects</DropdownLabel>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem href="/account">
                        <UserIcon />
                        <DropdownLabel>Account</DropdownLabel>
                    </DropdownItem>
                    <DropdownItem href="/settings">
                        <Cog8ToothIcon />
                        <DropdownLabel>Settings</DropdownLabel>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </SidebarHeader>
    );
}
