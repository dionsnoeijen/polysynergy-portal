'use client';

import {ApplicationLayout} from "@/app/application-layout";
import {Heading, Subheading} from "@/components/heading";
import {CheckIcon, PlusIcon, TrashIcon} from "@heroicons/react/16/solid";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {useEffect, useState} from "react";
import useAccountsStore from "@/stores/accountsStore";
import { format } from "date-fns";

export default function AccountsPage() {

    const {loggedInAccount, accounts, fetchAccounts} = useAccountsStore();
    const [deleteAccountId, setDeleteAccountId] = useState<string|null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    if (!loggedInAccount) {
        return null;
    }

    const handleInviteAccount = () => {

    }

    const confirmDeleteAccount = () => {

    }

    return (
        <ApplicationLayout>
            <Heading>Accounts</Heading>
            <div className="mt-8 flex items-end justify-between">
                <Subheading>Overview</Subheading>
            </div>
            <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
                <TableHead>
                    <TableRow>
                        <TableHeader>Email (username)</TableHeader>
                        <TableHeader>First Name</TableHeader>
                        <TableHeader>Last Name</TableHeader>
                        <TableHeader>Created</TableHeader>
                        <TableHeader>Activated</TableHeader>
                        <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {accounts.map((account) => (
                        <TableRow className={loggedInAccount.id === account.id ? 'bg-gray-800/40' : ''} key={account.id} title={`Account #${account.id}`}>
                            <TableCell>{account.email}</TableCell>
                            <TableCell className="text-zinc-500">{account.first_name}</TableCell>
                            <TableCell>{account.last_name}</TableCell>
                            <TableCell>
                                {format(new Date(account.created_at), "dd-MM-yyyy HH:mm:ss")}
                            </TableCell>
                            <TableCell><CheckIcon className={'h-4 w-4'} /></TableCell>
                            <TableCell className={'text-right'}><Button><TrashIcon /></Button></TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={5}>
                            <Input
                                name="email"
                                placeholder="Account email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInviteAccount()}
                                className={error ? 'border-red-500' : ''}
                            />
                            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button onClick={handleInviteAccount} disabled={isLoading}>
                                <PlusIcon />
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this account?</AlertTitle>
                    <AlertDescription>This action cannot be undone, and denies the account access to the system.</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setShowDeleteAlert(false)} plain>
                            Cancel
                        </Button>
                        <Button color="red" onClick={confirmDeleteAccount}>
                            Yes, delete
                        </Button>
                    </AlertActions>
                </Alert>
            )}
        </ApplicationLayout>
    );
}