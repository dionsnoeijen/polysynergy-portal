import { Heading, Subheading } from '@/components/heading'
import { Select } from '@/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import {getProjects} from '@/data'
import {ApplicationLayout} from "@/app/application-layout";

export default async function Home() {
  const projects = await getProjects()

  return (
      <ApplicationLayout>
        <Heading>Good afternoon, Octopus</Heading>
        <div className="mt-8 flex items-end justify-between">
          <Subheading>Overview</Subheading>
          <div>
            <Select name="period">
              <option value="last_week">Last week</option>
              <option value="last_two">Last two weeks</option>
              <option value="last_month">Last month</option>
              <option value="last_quarter">Last quarter</option>
            </Select>
          </div>
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
                <TableRow key={project.uuid} href={`/project/${project.uuid}`} title={`Project #${project.uuid}`}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell className="text-zinc-500">{project.lastModified}</TableCell>
                    <TableCell className="text-right">{project.created}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </ApplicationLayout>
  )
}
