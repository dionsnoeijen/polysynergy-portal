'use client';

import {ApplicationLayout} from "@/app/application-layout";
import {Heading, Subheading} from "@/components/heading";
import {ArrowPathIcon, CheckIcon, PlusIcon, TrashIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {Select} from "@/components/select";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {useEffect, useState} from "react";
import {format} from "date-fns";
import {deleteClientAccount, inviteClientAccount, resendClientAccountInvite} from "@/api/clientAccountsApi";
import useAccountsStore from "@/stores/accountsStore";
import {Roles} from "@/types/enums";
import {isValidEmail} from "@/utils/validators";

export default function AccountsPage() {

    const {loggedInAccount, accounts, fetchAccounts} = useAccountsStore();
    const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Roles>(Roles.ChatUser);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    useEffect(() => {
        fetchAccounts().catch((error) => {
            console.error('Error fetching accounts:', error);
        });
    }, [fetchAccounts]);

    if (!loggedInAccount) {
        return null;
    }

    const handleInviteAccount = async () => {
        if (!isValidEmail(inviteEmail)) {
            setError('Please enter a valid email address.');
            return;
        }
        setIsLoading(true);
        try {
            await inviteClientAccount(inviteEmail, inviteRole);
            setInviteEmail('');
            setInviteRole(Roles.ChatUser);
            await fetchAccounts();
        } catch (error) {
            console.error('Error inviting account:', error);
            setError('Failed to invite account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = (accountId: string) => {
        setDeleteAccountId(accountId);
        setShowDeleteAlert(true);
    }

    const handleResendInvitation = (accountId: string) => {
        resendClientAccountInvite(accountId)
            .then(() => {
                return fetchAccounts();
            })
            .catch((error) => {
                console.error('Error resending account invite:', error);
            });
    }

    const confirmDeleteAccount = () => {
        deleteClientAccount(deleteAccountId as string)
            .then(() => {
                setShowDeleteAlert(false);
                setDeleteAccountId(null);
                return fetchAccounts();
            })
            .catch((error) => {
                console.error('Error deleting account:', error);
            });
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
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Role</TableHeader>
                        <TableHeader>Created</TableHeader>
                        <TableHeader>Activated</TableHeader>
                        <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {accounts.map((account) => (
                        <TableRow
                            title={loggedInAccount.id === account.id ? "This is the logged-in user" : ("Account: " + account.email)}
                            className={loggedInAccount.id === account.id ? 'bg-sky-50 dark:bg-gray-800/40' : ''} key={account.id}>
                            <TableCell>{account.email}</TableCell>
                            <TableCell className={!account.active ? 'text-zinc-500' : ''}>
                                {account.active
                                    ? `${account.first_name} ${account.last_name}`
                                    : 'Available after this account is activated'}
                            </TableCell>
                            <TableCell>
                                <span className="capitalize">
                                    {account.role ? account.role.replace('_', ' ') : 'chat user'}
                                </span>
                            </TableCell>
                            <TableCell>{format(new Date(account.created_at), "MMM d, yyyy 'at' HH:mm")}</TableCell>
                            <TableCell>
                                {account.active ?
                                    <CheckIcon className={'h-4 w-4'}/>
                                    : <XMarkIcon className={'h-4 w-4'}/>
                                }
                            </TableCell>
                            <TableCell className={'text-right'}>
                                {loggedInAccount.id !== account.id && (
                                    <>
                                        {!account.active && (
                                            <Button className={'mr-1'}
                                                    onClick={() => handleResendInvitation(account.id)}><ArrowPathIcon
                                                className="h-4 w-4"/></Button>
                                        )}
                                        <Button onClick={() => handleDeleteAccount(account.id)}><TrashIcon
                                            className="h-4 w-4"/></Button>
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={2}>
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
                        <TableCell>
                            <Select
                                name={'role'}
                                className={'w-full'}
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as Roles)}
                            >
                                <option value={Roles.Admin}>Admin</option>
                                <option value={Roles.Editor}>Editor</option>
                                <option value={Roles.ChatUser}>Chat User</option>
                            </Select>
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell className="text-right">
                            <Button onClick={handleInviteAccount} disabled={isLoading}>
                                <PlusIcon/>
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert}
                       onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this account?</AlertTitle>
                    <AlertDescription>This action cannot be undone, and denies the account access to the
                        system.</AlertDescription>
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