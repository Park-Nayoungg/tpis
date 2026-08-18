/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CONTACT_SCRIPT_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
