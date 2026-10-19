// components/claude-adapter.js

const isVisible = ( element ) =>
{
    if ( !element || element.hidden || element.getAttribute( 'aria-hidden' ) === 'true' ) return false;
    const style = getComputedStyle( element );
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
};

const getVisibleStopButton = () =>
{
    const selectors = [
        'button[data-testid*="stop" i]',
        'button[data-test-id*="stop" i]',
        'button[aria-label*="stop generating" i]',
        'button[aria-label*="stop response" i]',
        'button[aria-label="stop" i]'
    ];
    const directMatch = Array.from( document.querySelectorAll( selectors.join( ',' ) ) ).find( isVisible );
    if ( directMatch ) return directMatch;

    return Array.from( document.querySelectorAll( 'button' ) ).filter( isVisible ).find( ( button ) =>
    {
        const label = ( button.getAttribute( 'aria-label' ) || '' ).toLowerCase();
        const testId = ( button.getAttribute( 'data-testid' ) || button.getAttribute( 'data-test-id' ) || '' ).toLowerCase();
        return label.includes( 'stop' ) || testId.includes( 'stop' );
    } ) || null;
};

const ClaudeAdapter = {
    hostPattern: 'claude.ai',
    
    getInput: () => {
        return document.querySelector('div[contenteditable="true"]');
    },
    
    getSubmit: () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => {
            const label = b.getAttribute('aria-label') || '';
            return isVisible( b ) && label.toLowerCase().includes('send message');
        }) || null;
    },
    
    isGenerating: () => !!getVisibleStopButton(),
    isResponseComplete: () => !getVisibleStopButton()
};

window.AIAdapter = ClaudeAdapter;
