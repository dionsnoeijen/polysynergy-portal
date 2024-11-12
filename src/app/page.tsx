'use client'

import { Heading, Subheading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import {ApplicationLayout} from "@/app/application-layout";
import useProjectsStore from "@/stores/projectsStore";
import {useEffect} from "react";

export default function Home() {
  const { projects, fetchProjects } = useProjectsStore();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return (
      <ApplicationLayout>
        <Heading>Good afternoon, Octopus</Heading>
        <div className="mt-8 flex items-end justify-between">
          <Subheading>Overview</Subheading>
        </div>
        <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
          <TableHead>
            <TableRow>
              <TableHeader>Project name</TableHeader>
              <TableHeader>Last modified</TableHeader>
              <TableHeader className="text-right">Created</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
                <TableRow key={project.id} href={`/project/${project.id}`} title={`Project #${project.id}`}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell className="text-zinc-500">{project.updated_at}</TableCell>
                    <TableCell className="text-right">{project.created_at}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </ApplicationLayout>
  )
}
