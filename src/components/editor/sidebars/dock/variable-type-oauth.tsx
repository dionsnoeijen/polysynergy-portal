import React from "react";
import {NodeVariable} from "@/types/types";
import {Field, Fieldset, Label} from "@/components/fieldset";
import {LockClosedIcon} from "@heroicons/react/24/outline";
import config from '@/config';
// import { getIdToken } from '@/api/auth/authToken';
import useEditorStore from '@/stores/editorStore';

type Props = {
    nodeId: string;
    variable: NodeVariable;
    inDock?: boolean;
    categoryBorder?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
};

const VariableTypeOAuth: React.FC<Props> = ({
    nodeId,
    variable,
    inDock = true,
    // eslint-disable-next-line
    categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    // eslint-disable-next-line
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    // eslint-disable-next-line
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    // eslint-disable-next-line
    categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    // eslint-disable-next-line
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900',
}) => {

    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const [isAuthorizing, setIsAuthorizing] = React.useState(false);

    const onAuthorize = async (nodeId: string) => {
        if (isAuthorizing) return;

        try {
            setIsAuthorizing(true);
            console.log('🔑 [OAuth] Starting authorization for node:', nodeId);

            if (!activeVersionId) {
                throw new Error('No active version selected');
            }

            // Open popup directly to OAuth authorize endpoint
            // Backend will handle the OAuth provider redirect
            const authorizeUrl = `${config.LOCAL_API_URL}/oauth/authorize/${activeVersionId}/${nodeId}`;

            console.log('🔑 [OAuth] Opening OAuth authorization URL:', authorizeUrl);

            // Open popup window directly to OAuth provider via our backend endpoint
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(
                authorizeUrl,
                'oauth-authorization',
                `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            if (!popup) {
                throw new Error('Failed to open authorization window. Please check your popup blocker settings.');
            }

            // Monitor popup for completion
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    console.log('🔑 [OAuth] Popup window was closed');
                    setIsAuthorizing(false);
                    clearInterval(checkClosed);

                    // Here you could refresh the variable value or check authorization status
                    // The backend should have stored the tokens by now
                }
            }, 1000);

        } catch (e) {
            console.error('❌ [OAuth] Authorization failed for node:', nodeId, e);
            setIsAuthorizing(false);
            // Could add user notification here
        }
    };

    const hasValue = Boolean(variable.value && variable.value !== '');
    const isAuthorized = hasValue && !isAuthorizing;

    return (
        <div className={'relative'}>
            {variable?.dock?.enabled === false || (variable.published && inDock) && (
                <div className="absolute inset-0 bg-sky-50/60 dark:bg-black/40 rounded-md z-10 pointer-events-none"/>
            )}
            <Fieldset>
                <Label>{variable.handle}</Label>
                <Field>
                    <button
                        className={`w-full pb-1 ring-1 rounded-md text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 ${(isAuthorizing || isAuthorized) && "opacity-60"} ${isAuthorizing && "cursor-wait"}`}
                        onClick={() => onAuthorize(nodeId)}
                        disabled={isAuthorizing || isAuthorized}
                    >
                        {isAuthorizing ? "Authorizing..." :
                         isAuthorized ? "Authorized" :
                         "Authorize OAuth"}
                        <LockClosedIcon className={`w-4 h-4 inline ml-1 ${isAuthorized ? 'text-green-600 dark:text-green-400' : 'text-blue-700/80 dark:text-white/50'}`}/>
                    </button>
                </Field>
            </Fieldset>
        </div>
    );
};

export default VariableTypeOAuth;