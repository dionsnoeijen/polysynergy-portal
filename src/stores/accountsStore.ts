import {create} from 'zustand';
import {Account, LoggedInAccount} from "@/types/types";
import {fetchClientAccounts} from "@/api/clientAccountsApi";

type AccountState = {
    accounts: Account[];
    loggedInAccount: LoggedInAccount | null;
    setLoggedInAccount: (account: LoggedInAccount) => void;
    fetchAccounts: () => Promise<void>;
};

const useAccountsStore = create<AccountState>((set) => ({
    accounts: [],
    loggedInAccount: null,
    setLoggedInAccount: (account) => set({loggedInAccount: account}),
    fetchAccounts: async () => {

        try {
            const data: Account[] = await fetchClientAccounts();
            set({ accounts: data });
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    },
}));

export default useAccountsStore;