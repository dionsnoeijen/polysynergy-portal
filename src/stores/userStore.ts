import {create} from 'zustand';
import {LoggedInUser} from "@/types/types";

type UserState = {
    loggedInUser: LoggedInUser | null;
    setLoggedInUser: (user: LoggedInUser) => void;
};

const useUserStore = create<UserState>((set) => ({
    loggedInUser: null,
    setLoggedInUser: (user) => set({loggedInUser: user}),
}));

export default useUserStore;