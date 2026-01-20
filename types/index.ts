export type Server = {
    id: string;
    name: string;
    icon: string;
    color: string;
};

export type Channel = {
    id: string;
    name: string;
    type: "voice" | "text" | "video" | "meeting";
};

export type FileTransfer = {
    name: string;
    url: string;
    sender: string;
};
