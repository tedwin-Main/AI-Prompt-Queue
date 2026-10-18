// utils/chatgpt-adapter.js

const isVisible = ( element ) =>
{
    if ( !element || element.hidden || element.getAttribute( 'aria-hidden' ) === 'true' ) return false;
    const style = getComputedStyle( element );
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
};

const getVisibleStopButton = () =>
{
    const selectors = [
        'button[data-testid="stop-button"]',
        'button[aria-label*="stop generating" i]',
        'button[aria-label*="stop response" i]'
    ];
    const directMatch = Array.from( document.querySelectorAll( selectors.join( ',' ) ) ).find( isVisible );
    if ( directMatch ) return directMatch;

    return Array.from( document.querySelectorAll( 'button' ) ).filter( isVisible ).find( ( button ) =>
    {
        const label = ( button.getAttribute( 'aria-label' ) || '' ).toLowerCase();
        const testId = ( button.getAttribute( 'data-testid' ) || '' ).toLowerCase();
        return label.includes( 'stop' ) || testId.includes( 'stop' );
    } ) || null;
};

const ChatGPTAdapter = {
    hostPattern: 'chatgpt.com',
    
    getInput: () => {
        return document.querySelector('#prompt-textarea');
    },
    
    getSubmit: () => {
        const selectors = [
            'button[data-testid="send-button"]',
            'button[aria-label="Send prompt"]',
            'button[aria-label="Send message"]'
        ];
        return Array.from( document.querySelectorAll( selectors.join( ',' ) ) ).find( isVisible ) || null;
    },
    
    isGenerating: () => !!getVisibleStopButton(),
    isResponseComplete: () => !getVisibleStopButton()
};

window.AIAdapter = ChatGPTAdapter;
