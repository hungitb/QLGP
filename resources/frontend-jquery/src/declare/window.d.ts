interface Window {
    router: {
        goTo: (link: string) => any;
    };
    $: JQueryStatic;
}