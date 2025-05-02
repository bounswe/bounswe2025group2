import { Plugin } from 'vite';

declare function cartographer(): Plugin;

interface ElementMetadata {
    elementPath: string;
    elementName: string;
    tag: string;
    textContent: string;
    screenshotBlob?: Blob;
}
type Message = {
    type: 'TOGGLE_REPLIT_VISUAL_EDITOR';
    timestamp: number;
    enabled: boolean;
} | {
    type: 'REPLIT_VISUAL_EDITOR_ENABLED';
    timestamp: number;
} | {
    type: 'REPLIT_VISUAL_EDITOR_DISABLED';
    timestamp: number;
} | {
    type: 'ELEMENT_SELECTED';
    payload: ElementMetadata;
    timestamp: number;
} | {
    type: 'ELEMENT_UNSELECTED';
    timestamp: number;
} | {
    type: 'SELECTOR_SCRIPT_LOADED';
    timestamp: number;
    version: string;
} | {
    type: 'CLEAR_SELECTION';
    timestamp: number;
};

var version = "0.0.11";

export { type ElementMetadata, type Message, cartographer, version };
