import { getIdToken } from './auth/authToken';
import { Account } from "@/types/types";

export const fetchClientAccount = async (
    cognitoId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/accounts/${cognitoId}/`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });
}

export const fetchClientAccounts = async (): Promise<Account[]> => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/accounts/tenant/`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });
    return response.json();
}

export const createClientAccount = async (
    clientAccountData: {
        cognito_id: string,
        tenant_name: string,
        first_name: string,
        last_name: string,
        email: string,
        role: string,
    }
): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/accounts/`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(clientAccountData)
        }
    );
}

export const inviteClientAccount = async (email: string, role: string): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/accounts/invite/`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ email, role })
        }
    );
}

export const resendClientAccountInvite = async (accountId: string): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/accounts/${accountId}/resend-invitation/`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    )
}

export const deleteClientAccount = async (accountId: string): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/accounts/${accountId}/delete/`,
        {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );
}

export const activateClientAccount = async (
    firstName: string,
    lastName: string,
    cognitoId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/accounts/${cognitoId}/activate/`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName
            })
        }
    )
}