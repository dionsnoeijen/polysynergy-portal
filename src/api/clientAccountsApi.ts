import { getIdToken } from './auth/authToken';

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
    )
}