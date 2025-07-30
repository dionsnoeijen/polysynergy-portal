'use client';

import {Button} from '@/components/button';
import {Checkbox, CheckboxField} from '@/components/checkbox';
import {Divider} from '@/components/divider';
import {Label} from '@/components/fieldset';
import {Heading, Subheading} from '@/components/heading';
import {Input, InputGroup} from '@/components/input';
import {Text} from '@/components/text';
import {Textarea} from '@/components/textarea';
import {ApplicationLayout} from "@/app/application-layout";
import {useAuth} from "react-oidc-context";

export default function Page() {
    const auth = useAuth();

    return (
        <ApplicationLayout>
            <form method="post" className="mx-auto max-w-4xl">
                <Heading>Account, {auth.user?.profile.email}</Heading>

                <Divider className="my-10 mt-6"/>

                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Subheading>Name</Subheading>
                    </div>
                    <div>
                        <InputGroup className={'relative flex gap-4'}>
                            <Input aria-label="First Name" name="name"/>
                            <Input aria-label="Infix" name="name"/>
                            <Input aria-label="Last Name" name="name"/>
                        </InputGroup>
                    </div>
                </section>

                <Divider className="my-10" soft/>

                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Subheading>Organization Bio</Subheading>
                        <Text>This will be displayed on your public profile. Maximum 240 characters.</Text>
                    </div>
                    <div>
                        <Textarea aria-label="Organization Bio" name="bio"/>
                    </div>
                </section>

                <Divider className="my-10" soft/>

                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Subheading>Email</Subheading>
                        <Text>This is how customers can contact you for support.</Text>
                    </div>
                    <div className="space-y-4">
                        <Input
                            type="email"
                            aria-label="Organization Email"
                            name="email"
                            defaultValue="info@example.com"
                        />
                        <CheckboxField>
                            <Checkbox name="email_is_public" defaultChecked/>
                            <Label>Show email on public profile</Label>
                        </CheckboxField>
                    </div>
                </section>

                <Divider className="my-10" soft/>

                <div className="flex justify-end gap-4">
                    <Button type="reset" plain>
                        Reset
                    </Button>
                    <Button type="submit">Save changes</Button>
                </div>
            </form>
        </ApplicationLayout>
    )
}
