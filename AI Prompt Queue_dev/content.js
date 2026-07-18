// content.js

console.log( "AI Prompt Queue content script loaded" );

let isRunning = false;
let isPaused = false;
let currentObserver = null;
let currentPrompt = "";
let panelInjected = false;

// Inject UI on load
injectFloatingPanel();

function injectFloatingPanel ()
{
    if ( panelInjected ) return;
    panelInjected = true;

    const panelHTML = `
        <div id="apq-panel">
            <div id="apq-header">
                <span id="apq-title">AI Prompt Queue <span id="apq-badge">0</span>
                    <span id="apq-help-wrapper">?
                        <span id="apq-help-tooltip">
                            Shortcuts:<br/>
                            • <b>Cmd (Mac) / Ctrl (Win) + Enter</b>: Send to Queue<br/>
                            • <b>Shift + Enter</b>: New line
                        </span>
                    </span>
                </span>
                <span id="apq-toggle">-</span>
            </div>
            <div id="apq-content">
                <textarea id="apq-input" placeholder="1. Summarize this email&#10;2. Also make it sound professional&#10;3. Draft a reply agreeing to the terms"></textarea>
                <div id="apq-controls">
                    <button id="apq-send-btn" class="apq-btn-start" style="width:100%;">Send to Queue</button>
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

    const sendFn = () =>
    {
        const input = document.getElementById( 'apq-input' );
        const text = input.value.trim();
        if ( text )
        {
            chrome.storage.local.get( [ 'queue', 'isRunning' ], ( res ) =>
            {
                const q = res.queue || [];
                q.push( text );
                chrome.storage.local.set( { queue: q, pendingText: "", isRunning: true, isPaused: false }, () =>
                {
                    input.value = '';
                    if ( !res.isRunning ) handleMessage( { action: "START_QUEUE" } );
                } );
            } );
        }
    };

    document.getElementById( 'apq-send-btn' ).onclick = sendFn;

    document.getElementById( 'apq-clear-btn' ).onclick = () =>
    {
        chrome.storage.local.set( { queue: [] } );
    };

    document.getElementById( 'apq-input' ).addEventListener( 'keydown', ( e ) =>
    {
        if ( ( e.metaKey || e.ctrlKey ) && e.key === 'Enter' )
        {
            e.preventDefault();
            sendFn();
        }
    } );

    // Initial render
    updatePanelUI();
    chrome.storage.local.get(['pendingText'], (res) => {
        if (res.pendingText) {
            document.getElementById('apq-input').value = res.pendingText;
        }
    });

    document.getElementById('apq-input').addEventListener('input', (e) => {
        chrome.storage.local.set({ pendingText: e.target.value });
    });

    // Listen to storage changes to keep UI in sync
    chrome.storage.onChanged.addListener( ( changes ) =>
    {
        updatePanelUI();
        if (changes.pendingText !== undefined) {
            const input = document.getElementById('apq-input');
            if (input && document.activeElement !== input) {
                input.value = changes.pendingText.newValue || "";
            }
        }
    } );
}

function updatePanelUI ()
{
    chrome.storage.local.get( [ 'queue', 'isRunning', 'isPaused' ], ( res ) =>
    {
        const list = document.getElementById( 'apq-queue-list' );
        const badge = document.getElementById( 'apq-badge' );
        const queueHeader = document.getElementById( 'apq-queue-header' );
        const emptyState = document.getElementById( 'apq-empty' );
        const sendBtn = document.getElementById( 'apq-send-btn' );

        if ( !list ) return;

        const queue = res.queue || [];

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


chrome.runtime.onMessage.addListener( ( request, sender, sendResponse ) =>
{
    handleMessage( request );
} );

function handleMessage ( request )
{
    if ( request.action === "START_QUEUE" )
    {
        console.log( "Starting queue processing..." );
        isRunning = true;
        isPaused = false;
        processNextInQueue();
    } else if ( request.action === "STOP_QUEUE" )
    {
        console.log( "Stopping queue processing..." );
        isRunning = false;
        isPaused = false;
        if ( currentObserver )
        {
            currentObserver.disconnect();
            currentObserver = null;
        }
    } else if ( request.action === "PAUSE_QUEUE" )
    {
        isPaused = true;
    } else if ( request.action === "RESUME_QUEUE" )
    {
        isPaused = false;
        processNextInQueue();
    }
}

function processNextInQueue ()
{
    // DEV MODE: Paused sending so you can take screenshots
    return;
    if ( !isRunning || isPaused ) return;

    chrome.storage.local.get( [ 'queue', 'delay' ], ( result ) =>
    {
        const queue = result.queue || [];
        const delay = result.delay !== undefined ? result.delay : 3;

        if ( queue.length === 0 )
        {
            console.log( "Queue is empty. Finished." );
            isRunning = false;
            chrome.storage.local.set( { isRunning: false } );
            return;
        }

        currentPrompt = queue.shift();
        chrome.storage.local.set( { queue: queue }, () =>
        {
            sendMessageToAI( currentPrompt, delay );
        } );
    } );
}

function sendMessageToAI ( message, delaySeconds )
{
    if ( !isRunning || isPaused ) return;

    const inputArea = window.AIAdapter.getInput();
    if ( !inputArea )
    {
        console.error( "AI input not found. Retrying in 1s..." );
        setTimeout( () => sendMessageToAI( message, delaySeconds ), 1000 );
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
            waitForResponseComplete( delaySeconds );
            const apqInput = document.getElementById( 'apq-input' );
            if ( apqInput ) apqInput.focus();
        } else
        {
            console.error( "Submit button not found or disabled." );
            isRunning = false;
            chrome.storage.local.set( { isRunning: false } );
        }
    }, 500 );
}

function waitForResponseComplete ( delaySeconds )
{
    if ( !isRunning ) return;

    const targetNode = document.body;
    const config = { childList: true, subtree: true, characterData: true };

    let isWaiting = false;

    currentObserver = new MutationObserver( ( mutationsList, observer ) =>
    {
        if ( !isRunning )
        {
            observer.disconnect();
            return;
        }

        if ( window.AIAdapter.hasRateLimitError() )
        {
            observer.disconnect();
            console.error( "Rate limit detected." );
            alert( "Rate limit detected! Queue paused." );
            isRunning = false;
            isPaused = true;
            // Put message back
            chrome.storage.local.get( [ 'queue' ], ( res ) =>
            {
                const q = res.queue || [];
                q.unshift( currentPrompt );
                chrome.storage.local.set( { queue: q, isRunning: false, isPaused: true } );
            } );
            return;
        }

        if ( isWaiting ) return;
        isWaiting = true;

        setTimeout( () =>
        {
            isWaiting = false;
            if ( window.AIAdapter.isResponseComplete() )
            {
                console.log( "Response complete." );
                observer.disconnect();
                currentObserver = null;

                // Save result
                const responseText = window.AIAdapter.getLastResponseText();
                chrome.storage.local.get( [ 'history' ], ( res ) =>
                {
                    const history = res.history || [];
                    history.push( { prompt: currentPrompt, response: responseText } );
                    chrome.storage.local.set( { history }, () =>
                    {
                        // Wait delay
                        setTimeout( () =>
                        {
                            processNextInQueue();
                        }, delaySeconds * 1000 );
                    } );
                } );
            }
        }, 1000 );
    } );

    currentObserver.observe( targetNode, config );
}
