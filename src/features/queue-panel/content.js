// Manages prompt queue lifecycle, automation, and injected floating panel.

console.log( "AI Prompt Queue content script loaded" );

let isRunning = false;
let isPaused = false;
let isWaitingForResponse = false;
let currentObserver = null;
let nextPromptTimer = null;
let currentPrompt = "";
let panelInjected = false;
const PROMPT_DELAY_SECONDS = 3;

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
    panel.style.visibility = 'hidden';
    document.body.appendChild( panel );

    // Wire up events
    const header = document.getElementById( 'apq-header' );

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
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
        const input = document.getElementById( 'apq-input' );
        const text = input.value.trim();
        if ( text )
        {
            chrome.storage.local.get( [ 'queue' ], ( res ) =>
            {
                const q = res.queue || [];
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

    document.getElementById( 'apq-action-btn' ).onclick = actionFn;
    document.getElementById( 'apq-pause-btn' ).onclick = () =>
    {
        if ( isPaused ) resumeQueue();
        else pauseQueue();
    };

    document.getElementById( 'apq-clear-btn' ).onclick = () =>
    {
        chrome.storage.local.set( { queue: [] } );
    };

    document.getElementById( 'apq-input' ).addEventListener( 'keydown', ( e ) =>
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
        if ( res.pendingText )
        {
            document.getElementById( 'apq-input' ).value = res.pendingText;
            updatePanelUI();
        }
        if ( res.panelSize )
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

    document.getElementById( 'apq-input' ).addEventListener( 'input', ( e ) =>
    {
        chrome.storage.local.set( { pendingText: e.target.value } );
        updatePanelUI();
    } );

    // Listen to storage changes to keep UI in sync
    chrome.storage.onChanged.addListener( ( changes ) =>
    {
        if ( changes.pendingText !== undefined )
        {
            const input = document.getElementById( 'apq-input' );
            if ( input && document.activeElement !== input )
            {
                input.value = changes.pendingText.newValue || "";
            }
        }
        if ( changes.panelSize !== undefined )
        {
            applyPanelSize( changes.panelSize.newValue || 'full' );
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
function applyPanelSize ( size )
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
function applyPanelPosition ( pos )
{
    const panel = document.getElementById( 'apq-panel' );
    if ( !panel || !pos || typeof pos.left !== 'number' || typeof pos.top !== 'number' ) return;

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
        const actionBtn = document.getElementById( 'apq-action-btn' );
        const pauseBtn = document.getElementById( 'apq-pause-btn' );

        if ( !list ) return;

        const queue = res.queue || [];

        if ( actionBtn )
        {
            const hasInput = document.getElementById( 'apq-input' )?.value.trim().length > 0;
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
            badge.innerText = queue.length;
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
                    const q = innerRes.queue || [];
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

        const queue = result.queue || [];

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
        currentPrompt = queue.shift();
        chrome.storage.local.set( { queue: queue }, () =>
        {
            if ( isPaused )
            {
                const pausedPrompt = currentPrompt;
                chrome.storage.local.get( [ 'queue' ], ( pausedResult ) =>
                {
                    const pausedQueue = pausedResult.queue || [];
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

function sendMessageToAI ( message )
{
    if ( !isRunning ) return;
    isWaitingForResponse = true;

    const inputArea = window.AIAdapter.getInput();
    if ( !inputArea )
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
        if ( submitBtn && !submitBtn.disabled )
        {
            submitBtn.click();
            waitForResponseComplete();
            const apqInput = document.getElementById( 'apq-input' );
            if ( apqInput ) apqInput.focus();
        } else
        {
            console.error( "Submit button not found or disabled." );
            isRunning = false;
            isPaused = false;
            isWaitingForResponse = false;
            chrome.storage.local.get( [ 'queue' ], ( res ) =>
            {
                const q = res.queue || [];
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
    let poller = null;
    let observer = null;

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
