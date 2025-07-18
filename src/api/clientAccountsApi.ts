import { getIdToken } from './auth/authToken';
import { Account } from "@/types/types";
import config from "@/config";

export const fetchClientAccount = async (
    cognitoId: string
): Promise<Response> => {
    const idToken = getIdToken();
    return await fetch(`${config.LOCAL_API_URL}/accounts/${cognitoId}/`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });
}

export const fetchClientAccounts = async (): Promise<Account[]> => {
    const idToken = getIdToken();
    const response = await fetch(`${config.LOCAL_API_URL}/accounts/tenant/`,
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
    return await fetch(`${config.API_URL}/accounts/`,
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
    return await fetch(`${config.API_URL}/accounts/invite/`,
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
    return await fetch(`${config.API_URL}/accounts/${accountId}/resend-invitation/`,
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
    return await fetch(`${config.API_URL}/accounts/${accountId}/delete/`,
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
    return await fetch(`${config.API_URL}/accounts/${cognitoId}/activate/`,
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