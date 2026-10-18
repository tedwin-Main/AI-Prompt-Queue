// content.js

console.log( "AI Prompt Queue content script loaded" );

let isRunning = false;
let isPaused = false;
let isWaitingForResponse = false;
let currentObserver = null;
let nextPromptTimer = null;
let currentPrompt = "";
let panelInjected = false;
const PROMPT_DELAY_SECONDS = 3;

// Inject UI on load
injectFloatingPanel();

function injectFloatingPanel ()
{
    if ( panelInjected ) return;
    panelInjected = true;

    const panelHTML = `
        <div id="apq-panel">
            <div id="apq-header">
                <span id="apq-title">AI Prompt Queue <span id="apq-badge">0</span></span>
                <span id="apq-toggle">-</span>
            </div>
            <div id="apq-content">
                <textarea id="apq-input" placeholder="Enter a prompt&#10;Click Add to Queue or press Cmd/Ctrl + Enter to send&#10;Repeat to add more prompts"></textarea>
                <div id="apq-controls">
                    <button id="apq-action-btn" class="apq-btn-add">Add to Queue</button>
                    <button id="apq-pause-btn" class="apq-btn-pause" hidden>Pause</button>
                </div>
                <div id="apq-queue-header">
                    <span id="apq-queue-label">Queued</span>
                    <button id="apq-clear-btn">Clear All</button>
                </div>
                <ul id="apq-queue-list"></ul>
                <div id="apq-empty">No prompts in queue</div>
            </div>
        </div>
    `;
    const wrapper = document.createElement( 'div' );
    wrapper.innerHTML = panelHTML;
    document.body.appendChild( wrapper.firstElementChild );

    // Wire up events
    const panel = document.getElementById( 'apq-panel' );
    const header = document.getElementById( 'apq-header' );

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let moved = false;

    header.addEventListener( 'mousedown', ( e ) =>
    {
        isDragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;

        const rect = panel.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        panel.style.left = initialLeft + 'px';
        panel.style.top = initialTop + 'px';

        e.preventDefault();
    } );

    document.addEventListener( 'mousemove', ( e ) =>
    {
        if ( !isDragging ) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if ( Math.abs( dx ) > 3 || Math.abs( dy ) > 3 ) moved = true;

        panel.style.left = ( initialLeft + dx ) + 'px';
        panel.style.top = ( initialTop + dy ) + 'px';
    } );

    document.addEventListener( 'mouseup', () =>
    {
        isDragging = false;
    } );

    header.onclick = () =>
    {
        if ( moved ) return;
        panel.classList.toggle( 'collapsed' );
        document.getElementById( 'apq-toggle' ).innerText = panel.classList.contains( 'collapsed' ) ? '+' : '-';
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
    chrome.storage.local.get(['pendingText'], (res) => {
        if (res.pendingText) {
            document.getElementById('apq-input').value = res.pendingText;
            updatePanelUI();
        }
    });

    document.getElementById('apq-input').addEventListener('input', (e) => {
        chrome.storage.local.set({ pendingText: e.target.value });
        updatePanelUI();
    });

    // Listen to storage changes to keep UI in sync
    chrome.storage.onChanged.addListener( ( changes ) =>
    {
        if (changes.pendingText !== undefined) {
            const input = document.getElementById('apq-input');
            if (input && document.activeElement !== input) {
                input.value = changes.pendingText.newValue || "";
            }
        }
        updatePanelUI();
    } );
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
