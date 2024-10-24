declare module '@daleighan/vanilla-js-router' {
    type RouterComponent = HTMLElement | string | (() => HTMLElement)

    export default class VanillaJSRouter {
        constructor(anchorId: string, routes: { [url: string]: RouterComponent }, options?: {
            debug?: boolean;
            errorHTML?: RouterComponent;
            header?: RouterComponent;
            footer?: RouterComponent
        });
        add(path: string, callback: () => void): void;
        listen(): void;
    }
}