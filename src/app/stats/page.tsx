import { Heading } from '@/components/heading'
import type { Metadata } from 'next'
import {ApplicationLayout} from "@/app/application-layout";

export const metadata: Metadata = {
  title: 'Stats',
}

export default async function Orders() {
  return (
    <ApplicationLayout>
      <Heading>Stats</Heading>
    </ApplicationLayout>
  )
}
