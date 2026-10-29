// features/chat-adapters/gemini-adapter.js

const INPUT = 'div[contenteditable="true"].ql-editor';
const INPUT_ALT = 'rich-textarea div[contenteditable]';
const SUBMIT = 'button[aria-label="Send message"]';

const isVisible = ( element ) =>
{
    if ( !element || element.hidden || element.getAttribute( 'aria-hidden' ) === 'true' ) return false;
    const style = getComputedStyle( element );
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
};

const getVisibleStopButton = () =>
{
    const buttons = Array.from( document.querySelectorAll( 'button' ) ).filter( isVisible );
    return buttons.find( ( button ) =>
    {
        const label = ( button.getAttribute( 'aria-label' ) || '' ).toLowerCase();
        const testId = ( button.getAttribute( 'data-testid' ) || button.getAttribute( 'data-test-id' ) || '' ).toLowerCase();
        const icon = ( button.querySelector( 'mat-icon, .google-symbols' )?.textContent || '' ).trim().toLowerCase();
        return label.includes( 'stop' ) || testId.includes( 'stop' ) || icon === 'stop';
    } ) || null;
};

const GeminiAdapter = {
    hostPattern: 'gemini.google.com',
    
    getInput: () => {
        return document.querySelector(INPUT) || document.querySelector(INPUT_ALT);
    },
    
    getSubmit: () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const sendBtn = buttons.find(b => {
            const label = ( b.getAttribute('aria-label') || '' ).trim().toLowerCase();
            return isVisible( b ) && ( label === 'send message' || label === 'send' );
        });
        const fallback = document.querySelector(SUBMIT);
        return sendBtn || ( isVisible( fallback ) ? fallback : null );
    },
    
    isGenerating: () => !!getVisibleStopButton(),
    isResponseComplete: () => !getVisibleStopButton()
};

window.AIAdapter = GeminiAdapter;
