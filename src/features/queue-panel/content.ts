// Manages prompt queue lifecycle, automation, and injected floating panel.

console.log( "AI Prompt Queue content script loaded" );

let isRunning = false;
let isPaused = false;
let isWaitingForResponse = false;
let currentObserver: MutationObserver | null = null;
let nextPromptTimer: ReturnType<typeof setTimeout> | null = null;
let currentPrompt = "";
let panelInjected = false;
const PROMPT_DELAY_SECONDS = 3;

// Panel element lookups narrowed by tag; null when panel not injected
const byId = ( id: string ) => document.getElementById( id );
const buttonById = ( id: string ) => { const el = byId( id ); return el instanceof HTMLButtonElement ? el : null; };
const promptInput = () => { const el = byId( 'apq-input' ); return el instanceof HTMLTextAreaElement ? el : null; };
const readQueue = ( value: unknown ) => Array.isArray( value ) ? value.filter( ( item ) => typeof item === 'string' ) : [];

// Chat > Floating Panel > Injection: init on load
injectFloatingPanel();

function injectFloatingPanel ()
{
    if ( panelInjected ) return;
    panelInjected = true;

    const panelHTML = `
        <div id="apq-panel">
            <div id="apq-header">
                <span id="apq-title">AI Prompt Queue <span id="apq-badge">0</span></span>
                <span id="apq-toggle" title="Cycle size: Full, Compact, Minimized">⊟</span>
            </div>
            <div id="apq-content">
                <textarea id="apq-input" placeholder="Enter a prompt&#10;Click Add to Queue or press Cmd/Ctrl + Enter to send&#10;Repeat to add more prompts"></textarea>
                <div id="apq-controls">
                    <button id="apq-action-btn" class="apq-btn-add">Add to Queue</button>
                    <button id="apq-pause-btn" class="apq-btn-pause" hidden>Pause</button>
                </div>
                <div id="apq-queue-section">
                    <div id="apq-queue-header">
                        <span id="apq-queue-label">Queued</span>
                        <button id="apq-clear-btn">Clear All</button>
                    </div>
                    <ul id="apq-queue-list"></ul>
                    <div id="apq-empty">No prompts in queue</div>
                </div>
            </div>
        </div>
    `;
    const wrapper = document.createElement( 'div' );
    wrapper.innerHTML = panelHTML;
    const panel = wrapper.firstElementChild;
    if ( !( panel instanceof HTMLElement ) ) return;
    panel.style.visibility = 'hidden';
    document.body.appendChild( panel );

    // Wire up events
    const header = byId( 'apq-header' );
    const input = promptInput();
    if ( !header || !input ) return;

    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    let moved = false;

    header.addEventListener( 'mousedown', ( e ) =>
    {
        if ( e.button !== 0 ) return;

        isDragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;

        const rect = panel.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        e.preventDefault();
    } );

    document.addEventListener( 'mousemove', ( e ) =>
    {
        if ( !isDragging ) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if ( !moved && ( Math.abs( dx ) > 3 || Math.abs( dy ) > 3 ) )
        {
            moved = true;
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
        }

        if ( !moved ) return;

        const maxLeft = Math.max( 0, window.innerWidth - panel.offsetWidth );
        const maxTop = Math.max( 0, window.innerHeight - panel.offsetHeight );

        const newLeft = Math.min( Math.max( 0, initialLeft + dx ), maxLeft );
        const newTop = Math.min( Math.max( 0, initialTop + dy ), maxTop );

        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
    } );

    const finishDrag = () =>
    {
        if ( isDragging && moved )
        {
            const rect = panel.getBoundingClientRect();
            chrome.storage.local.set( {
                panelPosition: {
                    left: Math.round( rect.left ),
                    top: Math.round( rect.top )
                }
            } );
        }
        isDragging = false;
    };

    document.addEventListener( 'mouseup', finishDrag );
    window.addEventListener( 'blur', finishDrag );
    window.addEventListener( 'resize', clampPanelPosition );

    // Chat > Prompt Queue > Header: cycle size modes and persist
    header.onclick = () =>
    {
        if ( moved ) return;

        let nextSize = 'full';
        if ( !panel.classList.contains( 'compact' ) && !panel.classList.contains( 'collapsed' ) )
        {
            nextSize = 'compact';
        }
        else if ( panel.classList.contains( 'compact' ) )
        {
            nextSize = 'collapsed';
        }
        else
        {
            nextSize = 'full';
        }

        applyPanelSize( nextSize );
        chrome.storage.local.set( { panelSize: nextSize } );
    };

    const actionFn = () =>
    {
        const text = input.value.trim();
        if ( text )
        {
            chrome.storage.local.get( [ 'queue' ], ( res ) =>
            {
                const q = readQueue( res.queue );
                q.push( text );
                chrome.storage.local.set( { queue: q, pendingText: "" }, () =>
                {
                    input.value = '';
                    updatePanelUI();
                    startQueue();
                } );
            } );
        } else
        {
            startQueue();
        }
    };

    const actionBtn = buttonById( 'apq-action-btn' );
    const pauseBtn = buttonById( 'apq-pause-btn' );
    const clearBtn = buttonById( 'apq-clear-btn' );
    if ( actionBtn ) actionBtn.onclick = actionFn;
    if ( pauseBtn ) pauseBtn.onclick = () =>
    {
        if ( isPaused ) resumeQueue();
        else pauseQueue();
    };

    if ( clearBtn ) clearBtn.onclick = () =>
    {
        chrome.storage.local.set( { queue: [] } );
    };

    input.addEventListener( 'keydown', ( e ) =>
    {
        if ( ( e.metaKey || e.ctrlKey ) && e.key === 'Enter' )
        {
            e.preventDefault();
            actionFn();
        }
    } );

    // Initial render
    updatePanelUI();
    chrome.storage.local.get( [ 'pendingText', 'panelSize', 'panelPosition' ], ( res ) =>
    {
        if ( typeof res.pendingText === 'string' && res.pendingText )
        {
            input.value = res.pendingText;
            updatePanelUI();
        }
        if ( typeof res.panelSize === 'string' )
        {
            applyPanelSize( res.panelSize );
        }
        if ( res.panelPosition )
        {
            applyPanelPosition( res.panelPosition );
        }
        panel.style.visibility = 'visible';
    } );

    // Fallback: reveal panel if storage read delays
    setTimeout( () =>
    {
        if ( panel && panel.style.visibility === 'hidden' )
        {
            panel.style.visibility = 'visible';
        }
    }, 150 );

    input.addEventListener( 'input', () =>
    {
        chrome.storage.local.set( { pendingText: input.value } );
        updatePanelUI();
    } );

    // Listen to storage changes to keep UI in sync
    chrome.storage.onChanged.addListener( ( changes ) =>
    {
        if ( changes.pendingText !== undefined )
        {
            if ( document.activeElement !== input )
            {
                const pending = changes.pendingText.newValue;
                input.value = typeof pending === 'string' ? pending : "";
            }
        }
        if ( changes.panelSize !== undefined )
        {
            const size = changes.panelSize.newValue;
            applyPanelSize( typeof size === 'string' ? size : 'full' );
        }
        if ( changes.panelPosition !== undefined )
        {
            if ( !isDragging )
            {
                if ( changes.panelPosition.newValue )
                {
                    applyPanelPosition( changes.panelPosition.newValue );
                }
                else
                {
                    panel.style.left = '';
                    panel.style.top = '';
                    panel.style.bottom = '';
                    panel.style.right = '';
                }
            }
        }
        updatePanelUI();
    } );
}

// Chat > Prompt Queue > Panel: apply size mode and update toggle indicator
function applyPanelSize ( size: string )
{
    const panel = document.getElementById( 'apq-panel' );
    const toggle = document.getElementById( 'apq-toggle' );
    if ( !panel ) return;

    panel.classList.remove( 'compact', 'collapsed' );

    if ( size === 'compact' )
    {
        panel.classList.add( 'compact' );
        if ( toggle ) toggle.innerText = '⊡';
    }
    else if ( size === 'collapsed' )
    {
        panel.classList.add( 'collapsed' );
        if ( toggle ) toggle.innerText = '⊞';
    }
    else
    {
        if ( toggle ) toggle.innerText = '⊟';
    }

    clampPanelPosition();
}

// Chat > Prompt Queue > Panel: apply remembered position clamped within viewport
function applyPanelPosition ( pos: unknown )
{
    const panel = document.getElementById( 'apq-panel' );
    if ( !panel || typeof pos !== 'object' || !pos || !( 'left' in pos ) || !( 'top' in pos ) ) return;
    if ( typeof pos.left !== 'number' || typeof pos.top !== 'number' ) return;

    const width = panel.offsetWidth || 320;
    const height = panel.offsetHeight || 40;
    const maxLeft = Math.max( 0, window.innerWidth - width );
    const maxTop = Math.max( 0, window.innerHeight - height );

    const left = Math.min( Math.max( 0, pos.left ), maxLeft );
    const top = Math.min( Math.max( 0, pos.top ), maxTop );

    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
}

// Chat > Prompt Queue > Panel: ensure panel stays within viewport on resize
function clampPanelPosition ()
{
    const panel = document.getElementById( 'apq-panel' );
    if ( !panel || panel.style.left === '' || panel.style.top === '' ) return;

    const rect = panel.getBoundingClientRect();
    const maxLeft = Math.max( 0, window.innerWidth - rect.width );
    const maxTop = Math.max( 0, window.innerHeight - rect.height );

    const clampedLeft = Math.min( Math.max( 0, rect.left ), maxLeft );
    const clampedTop = Math.min( Math.max( 0, rect.top ), maxTop );

    if ( clampedLeft !== rect.left || clampedTop !== rect.top )
    {
        panel.style.left = clampedLeft + 'px';
        panel.style.top = clampedTop + 'px';
    }
}

function updatePanelUI ()
{
    chrome.storage.local.get( [ 'queue' ], ( res ) =>
    {
        const list = document.getElementById( 'apq-queue-list' );
        const badge = document.getElementById( 'apq-badge' );
        const queueHeader = document.getElementById( 'apq-queue-header' );
        const emptyState = document.getElementById( 'apq-empty' );
        const actionBtn = buttonById( 'apq-action-btn' );
        const pauseBtn = buttonById( 'apq-pause-btn' );

        if ( !list ) return;

        const queue = readQueue( res.queue );

        if ( actionBtn )
        {
            const hasInput = ( promptInput()?.value.trim().length ?? 0 ) > 0;
            actionBtn.disabled = isRunning || ( !hasInput && queue.length === 0 );
            actionBtn.innerText = isPaused ? 'Paused' : isRunning ? 'Running…' : hasInput ? 'Add to Queue' : queue.length > 0 ? 'Send to Queue' : 'Add to Queue';
            actionBtn.className = hasInput ? 'apq-btn-add' : 'apq-btn-start';
        }

        if ( pauseBtn )
        {
            pauseBtn.hidden = !isRunning;
            pauseBtn.innerText = isPaused ? 'Resume' : 'Pause';
            pauseBtn.className = isPaused ? 'apq-btn-resume' : 'apq-btn-pause';
        }

        // Update badge count
        if ( badge )
        {
            badge.innerText = String( queue.length );
            badge.style.display = queue.length > 0 ? 'inline-flex' : 'none';
        }

        // Show/hide queue header and empty state
        if ( queueHeader ) queueHeader.style.display = queue.length > 0 ? 'flex' : 'none';
        if ( emptyState ) emptyState.style.display = queue.length === 0 ? 'block' : 'none';



        list.innerHTML = '';
        queue.forEach( ( item, index ) =>
        {
            const li = document.createElement( 'li' );
            li.className = 'apq-item';

            const num = document.createElement( 'span' );
            num.className = 'apq-item-num';
            num.innerText = `${index + 1}.`;

            const span = document.createElement( 'span' );
            span.className = 'apq-item-text';
            span.innerText = item;

            const delBtn = document.createElement( 'button' );
            delBtn.className = 'apq-item-del';
            delBtn.innerText = '✕';
            delBtn.onclick = () =>
            {
                chrome.storage.local.get( [ 'queue' ], ( innerRes ) =>
                {
                    const q = readQueue( innerRes.queue );
                    q.splice( index, 1 );
                    chrome.storage.local.set( { queue: q } );
                } );
            };

            li.appendChild( num );
            li.appendChild( span );
            li.appendChild( delBtn );
            list.appendChild( li );
        } );
    } );
}

function startQueue ()
{
    if ( isRunning ) return;
    console.log( "Starting queue processing..." );
    isRunning = true;
    isPaused = false;
    isWaitingForResponse = false;
    updatePanelUI();
    processNextInQueue();
}

function pauseQueue ()
{
    if ( !isRunning || isPaused ) return;
    isPaused = true;

    if ( nextPromptTimer )
    {
        clearTimeout( nextPromptTimer );
        nextPromptTimer = null;
    }

    console.log( "Queue paused." );
    updatePanelUI();
}

function resumeQueue ()
{
    if ( !isRunning || !isPaused ) return;
    isPaused = false;
    console.log( "Queue resumed." );
    updatePanelUI();

    if ( !isWaitingForResponse ) processNextInQueue();
}

function processNextInQueue ()
{
    if ( !isRunning || isPaused || isWaitingForResponse ) return;

    chrome.storage.local.get( [ 'queue' ], ( result ) =>
    {
        if ( !isRunning || isPaused || isWaitingForResponse ) return;

        const queue = readQueue( result.queue );

        if ( queue.length === 0 )
        {
            console.log( "Queue is empty. Finished." );
            isRunning = false;
            isPaused = false;
            isWaitingForResponse = false;
            updatePanelUI();
            return;
        }

        isWaitingForResponse = true;
        currentPrompt = queue.shift() ?? "";
        chrome.storage.local.set( { queue: queue }, () =>
        {
            if ( isPaused )
            {
                const pausedPrompt = currentPrompt;
                chrome.storage.local.get( [ 'queue' ], ( pausedResult ) =>
                {
                    const pausedQueue = readQueue( pausedResult.queue );
                    pausedQueue.unshift( pausedPrompt );
                    chrome.storage.local.set( { queue: pausedQueue }, () =>
                    {
                        currentPrompt = "";
                        isWaitingForResponse = false;
                        updatePanelUI();
                        if ( isRunning && !isPaused ) processNextInQueue();
                    } );
                } );
                return;
            }

            sendMessageToAI( currentPrompt );
        } );
    } );
}

function sendMessageToAI ( message: string )
{
    if ( !isRunning ) return;
    isWaitingForResponse = true;

    const inputArea = window.AIAdapter.getInput();
    if ( !( inputArea instanceof HTMLElement ) )
    {
        console.error( "AI input not found. Retrying in 1s..." );
        setTimeout( () => sendMessageToAI( message ), 1000 );
        return;
    }

    inputArea.focus();
    const promptParagraph = document.createElement( 'p' );
    promptParagraph.textContent = message;
    inputArea.replaceChildren( promptParagraph );

    const inputEvent = new Event( 'input', { bubbles: true, cancelable: true } );
    inputArea.dispatchEvent( inputEvent );

    setTimeout( () =>
    {
        const submitBtn = window.AIAdapter.getSubmit();
        const disabled = submitBtn instanceof HTMLButtonElement && submitBtn.disabled;
        if ( submitBtn instanceof HTMLElement && !disabled )
        {
            submitBtn.click();
            waitForResponseComplete();
            promptInput()?.focus();
        } else
        {
            console.error( "Submit button not found or disabled." );
            isRunning = false;
            isPaused = false;
            isWaitingForResponse = false;
            chrome.storage.local.get( [ 'queue' ], ( res ) =>
            {
                const q = readQueue( res.queue );
                q.unshift( currentPrompt );
                chrome.storage.local.set( { queue: q } );
            } );
        }
    }, 500 );
}

function waitForResponseComplete ()
{
    if ( !isRunning ) return;

    const targetNode = document.body;
    const config = {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [ 'aria-label', 'class', 'disabled', 'hidden', 'style' ]
    };

    let sawGenerating = false;
    let settled = false;
    let poller: ReturnType<typeof setInterval> | null = null;
    let observer: MutationObserver | null = null;

    const cleanup = () =>
    {
        if ( observer ) observer.disconnect();
        if ( poller ) clearInterval( poller );
        currentObserver = null;
    };

    const finish = () =>
    {
        if ( settled ) return;
        settled = true;
        cleanup();
        isWaitingForResponse = false;

        if ( isPaused )
        {
            updatePanelUI();
            return;
        }

        nextPromptTimer = setTimeout( () =>
        {
            nextPromptTimer = null;
            processNextInQueue();
        }, PROMPT_DELAY_SECONDS * 1000 );
    };

    const checkCompletion = () =>
    {
        if ( !isRunning )
        {
            cleanup();
            isWaitingForResponse = false;
            return;
        }

        if ( window.AIAdapter.isGenerating() )
        {
            sawGenerating = true;
            return;
        }

        // Advance only after a visible stop control appeared and disappeared.
        // Send-button state is irrelevant while the chatbot input is empty.
        if ( !sawGenerating ) return;

        console.log( "Response complete." );
        finish();
    };

    observer = new MutationObserver( () =>
    {
        checkCompletion();
    } );

    currentObserver = observer;
    observer.observe( targetNode, config );
    poller = setInterval( checkCompletion, 250 );
    checkCompletion();
}
